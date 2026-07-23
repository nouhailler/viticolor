import { getState, setState, freezePersistence, actions } from '../store';
import type { State } from '../store';
import type { DemoScenario, DemoStep, DemoTarget } from './types';

// ─── API publique ───

export type DemoStatus = 'idle' | 'running' | 'paused' | 'finished' | 'aborted';

/** Vitesses proposées par la barre de contrôle. */
export type DemoSpeed = 0.5 | 1 | 2;
const SPEEDS: DemoSpeed[] = [0.5, 1, 2];

export interface DemoEngineOptions {
  speed?: DemoSpeed;
  /** Défaut : matchMedia('(prefers-reduced-motion: reduce)'). */
  reducedMotion?: boolean;
  /** L'UI externe peut s'abonner ici (la barre de contrôle intégrée l'est déjà). */
  onEvent?: (e: DemoEvent) => void;
}

export type DemoEvent =
  | { type: 'status'; status: DemoStatus }
  | { type: 'step'; index: number; total: number; step: DemoStep }
  | { type: 'error'; index: number; message: string };

export interface DemoEngine {
  readonly scenario: DemoScenario;
  readonly status: DemoStatus;
  readonly stepIndex: number;
  play(): void;
  pause(): void;
  /** Exécute l'étape courante en entier puis se met en pause. */
  next(): void;
  setSpeed(s: DemoSpeed): void;
  /** Sortie propre : overlay retiré, état pré-démo restauré, persistance
   *  dégelée. Idempotent — branché sur Échap et sur le bouton Quitter. */
  stop(): void;
}

let current: Engine | null = null;

/** Lance un scénario (arrête la démo en cours s'il y en a une). */
export function startDemo(scenario: DemoScenario, options: DemoEngineOptions = {}): DemoEngine {
  current?.stop();
  const engine = new Engine(scenario, options);
  current = engine;
  engine.begin();
  return engine;
}

/** Activation par URL : `?demo=<id>`. Le paramètre est consommé (retiré de
 *  l'URL) pour ne pas relancer la démo à chaque rechargement. */
export function initDemoFromUrl(scenarios: DemoScenario[]): void {
  const id = new URLSearchParams(window.location.search).get('demo');
  if (!id) return;
  const url = new URL(window.location.href);
  url.searchParams.delete('demo');
  window.history.replaceState(null, '', url);
  const scenario = scenarios.find((s) => s.id === id);
  if (scenario) startDemo(scenario);
}

// ─── Implémentation ───

/** Signal interne de sortie : interrompt les attentes sans passer pour un bug. */
const STOPPED = Symbol('demo-stopped');

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** Durée de lecture d'une narration : ~55 ms/caractère, bornée. */
const narrateMs = (text: string) => clamp(text.length * 55, 1600, 6500);

class Engine implements DemoEngine {
  readonly scenario: DemoScenario;
  status: DemoStatus = 'idle';
  stepIndex = 0;

  private speed: DemoSpeed;
  private readonly reduced: boolean;
  private readonly onEvent?: (e: DemoEvent) => void;

  /** Snapshot complet de l'état pré-démo, restauré à la sortie. */
  private before!: State;
  private disposed = false;
  /** Exécution d'une étape unique demandée via next() pendant la pause. */
  private stepping = false;
  private wake: (() => void) | null = null;

  // Overlay
  private root!: HTMLDivElement;
  private cursor!: HTMLDivElement;
  private halo!: HTMLDivElement;
  private bubble!: HTMLDivElement;
  private bar!: HTMLDivElement;
  private barPlay!: HTMLButtonElement;
  private barStep!: HTMLSpanElement;
  private barSpeed!: HTMLButtonElement;
  private readonly onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') this.stop();
  };

  constructor(scenario: DemoScenario, options: DemoEngineOptions) {
    this.scenario = scenario;
    this.speed = options.speed ?? 1;
    this.reduced =
      options.reducedMotion ?? window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.onEvent = options.onEvent;
  }

  /** Démarrage : snapshot + gel de la persistance + seed + overlay + lecture. */
  begin(): void {
    this.before = getState();
    freezePersistence(true);
    // Base saine : accueil, menu fermé, onboarding considéré comme fait
    // (état seulement — rien n'est persisté pendant la démo).
    setState({
      screen: 'home',
      menuOpen: false,
      obDone: true,
      history: [],
      ...this.scenario.seed,
    });
    this.buildOverlay();
    window.addEventListener('keydown', this.onKey);
    this.play();
    void this.run();
  }

  play(): void {
    if (this.disposed || this.status === 'finished') return;
    this.setStatus('running');
    this.wake?.();
  }

  pause(): void {
    if (this.status === 'running') this.setStatus('paused');
  }

  next(): void {
    if (this.disposed || this.status === 'running' || this.status === 'finished') return;
    this.stepping = true;
    this.setStatus('paused');
    this.wake?.();
  }

  setSpeed(s: DemoSpeed): void {
    this.speed = s;
    this.barSpeed.textContent = `×${s}`;
  }

  stop(): void {
    if (this.disposed) return;
    this.disposed = true;
    if (this.status !== 'finished') this.setStatus('aborted');
    window.removeEventListener('keydown', this.onKey);
    this.root.remove();
    // Restauration intégrale de l'état pré-démo, puis dégel de la persistance
    // (la restauration elle-même ne déclenche aucune écriture).
    setState(() => this.before);
    freezePersistence(false);
    this.wake?.();
    if (current === this) current = null;
  }

  // ─── Boucle d'exécution ───

  private async run(): Promise<void> {
    const steps = this.scenario.steps;
    try {
      for (; this.stepIndex < steps.length; this.stepIndex++) {
        await this.gate();
        const step = steps[this.stepIndex];
        this.emit({ type: 'step', index: this.stepIndex, total: steps.length, step });
        this.refreshBar();
        await this.exec(step);
        if (this.stepping) this.stepping = false; // étape unique terminée → on reste en pause
        await this.sleep(160); // respiration entre deux étapes
      }
      this.setStatus('finished');
      await this.rawSleep(700);
      this.stop();
    } catch (err) {
      if (err === STOPPED || this.disposed) return;
      const message = err instanceof Error ? err.message : String(err);
      this.emit({ type: 'error', index: this.stepIndex, message });
      console.error(`[démo ${this.scenario.id}] étape ${this.stepIndex + 1} : ${message}`);
      this.stop();
    }
  }

  private async exec(step: DemoStep): Promise<void> {
    switch (step.kind) {
      case 'navigate': {
        actions.go(step.screen, step.extra);
        await this.sleep(350); // laisse l'écran se rendre
        return;
      }
      case 'click': {
        const el = await this.aim(step.target);
        await this.press(el);
        await this.sleep(300);
        this.hideHalo();
        return;
      }
      case 'type': {
        const el = await this.aim(step.target);
        if (!(el instanceof HTMLInputElement) && !(el instanceof HTMLTextAreaElement))
          throw new Error(`cible « ${step.target} » : type attend un input ou un textarea`);
        el.focus();
        await this.typeInto(el, step.text, step.charDelayMs ?? 70);
        await this.sleep(350);
        this.hideHalo();
        return;
      }
      case 'wait': {
        await this.sleep(step.ms);
        return;
      }
      case 'highlight': {
        await this.aim(step.target, { cursor: false });
        await this.sleep(step.durationMs ?? 1600);
        this.hideHalo();
        return;
      }
      case 'narrate': {
        const anchor = step.target ? await this.aim(step.target, { cursor: false }) : null;
        this.showBubble(step.text, anchor);
        await this.sleep(step.durationMs ?? narrateMs(step.text));
        this.hideBubble();
        this.hideHalo();
        return;
      }
    }
  }

  // ─── Attentes contrôlées (pause / vitesse / sortie) ───

  /** Bloque tant que la démo est en pause (sauf étape unique demandée). */
  private async gate(): Promise<void> {
    while (!this.disposed && this.status === 'paused' && !this.stepping) {
      await new Promise<void>((resolve) => (this.wake = resolve));
      this.wake = null;
    }
    if (this.disposed) throw STOPPED;
  }

  /** Sommeil divisé par la vitesse, interruptible, suspendu pendant la pause. */
  private async sleep(ms: number): Promise<void> {
    let remaining = ms / this.speed;
    while (remaining > 0) {
      await this.gate();
      const slice = Math.min(50, remaining);
      await this.rawSleep(slice);
      remaining -= slice;
    }
  }

  private rawSleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ─── Ciblage ───

  /** Attend l'apparition d'un [data-demo-id] visible (l'élément peut arriver
   *  après un re-render React). Introuvable au-delà de 2,5 s → erreur. */
  private async findTarget(target: DemoTarget): Promise<HTMLElement> {
    const deadline = performance.now() + 2500;
    for (;;) {
      const el = document.querySelector<HTMLElement>(`[data-demo-id="${target}"]`);
      if (el && el.getClientRects().length > 0) return el;
      if (performance.now() > deadline)
        throw new Error(`cible data-demo-id="${target}" introuvable ou invisible`);
      await this.sleep(100);
    }
  }

  /** Trouve la cible, la fait défiler au centre, la surligne et (par défaut)
   *  y amène le curseur virtuel. */
  private async aim(target: DemoTarget, opts: { cursor?: boolean } = {}): Promise<HTMLElement> {
    const el = await this.findTarget(target);
    el.scrollIntoView({ behavior: this.reduced ? 'auto' : 'smooth', block: 'center' });
    await this.sleep(this.reduced ? 60 : 320);
    const rect = el.getBoundingClientRect();
    this.showHalo(rect);
    if (opts.cursor !== false) await this.moveCursor(rect);
    return el;
  }

  // ─── Gestes ───

  private async moveCursor(rect: DOMRect): Promise<void> {
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const c = this.cursor;
    if (this.reduced) {
      c.style.transitionDuration = '0ms';
      c.style.transform = `translate(${x}px, ${y}px)`;
      c.style.opacity = '1';
      return;
    }
    // Durée proportionnelle à la distance, bornée, divisée par la vitesse.
    const prev = c.style.transform.match(/translate\(([\d.]+)px, ([\d.]+)px\)/);
    const [px, py] = prev ? [Number(prev[1]), Number(prev[2])] : [window.innerWidth / 2, window.innerHeight - 90];
    const dist = Math.hypot(x - px, y - py);
    const dur = clamp(dist * 0.9, 260, 700) / this.speed;
    c.style.transitionDuration = '0ms';
    c.style.transform = `translate(${px}px, ${py}px)`;
    c.style.opacity = '1';
    void c.offsetWidth; // flush avant d'animer
    c.style.transitionDuration = `${dur}ms`;
    c.style.transform = `translate(${x}px, ${y}px)`;
    await this.sleep(dur * this.speed); // sleep re-divise par la vitesse
  }

  /** Impulsion visuelle du curseur puis clic réel sur l'élément. */
  private async press(el: HTMLElement): Promise<void> {
    if (!this.reduced) {
      this.cursor.style.scale = '0.72';
      await this.sleep(110);
      this.cursor.style.scale = '1';
    }
    el.click();
  }

  /** Frappe via le setter natif + événement input : React contrôlé voit tout. */
  private async typeInto(
    el: HTMLInputElement | HTMLTextAreaElement,
    text: string,
    charDelayMs: number,
  ): Promise<void> {
    const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const setValue = Object.getOwnPropertyDescriptor(proto, 'value')!.set!;
    const put = (value: string) => {
      setValue.call(el, value);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    };
    if (this.reduced) {
      put(text); // pas de frappe animée en reduced-motion
      return;
    }
    for (let i = 1; i <= text.length; i++) {
      put(text.slice(0, i));
      await this.sleep(charDelayMs);
    }
  }

  // ─── Overlay (curseur, halo, bulle, barre de contrôle) ───

  private buildOverlay(): void {
    const root = document.createElement('div');
    root.setAttribute('data-demo-overlay', '');
    Object.assign(root.style, {
      position: 'fixed',
      inset: '0',
      zIndex: '9000',
      pointerEvents: 'none',
      fontFamily: 'var(--font-body, sans-serif)',
    } satisfies Partial<CSSStyleDeclaration>);

    // Halo de surbrillance autour de la cible
    const halo = document.createElement('div');
    Object.assign(halo.style, {
      position: 'fixed',
      border: '2px solid var(--gold, #c9a44d)',
      borderRadius: '12px',
      boxShadow: '0 0 0 4px rgba(201, 164, 77, .25), 0 0 18px rgba(201, 164, 77, .35)',
      opacity: '0',
      transition: this.reduced ? 'none' : 'all .25s ease',
    } satisfies Partial<CSSStyleDeclaration>);

    // Curseur virtuel
    const cursor = document.createElement('div');
    Object.assign(cursor.style, {
      position: 'fixed',
      left: '-11px',
      top: '-11px',
      width: '22px',
      height: '22px',
      borderRadius: '50%',
      border: '2px solid var(--gold, #c9a44d)',
      background: 'rgba(201, 164, 77, .35)',
      opacity: '0',
      transitionProperty: 'transform',
      transitionTimingFunction: 'cubic-bezier(.3, .7, .3, 1)',
      willChange: 'transform',
    } satisfies Partial<CSSStyleDeclaration>);

    // Bulle de narration
    const bubble = document.createElement('div');
    Object.assign(bubble.style, {
      position: 'fixed',
      maxWidth: 'min(340px, calc(100vw - 32px))',
      background: 'var(--surface, #22160f)',
      color: 'var(--text, #f2e7d5)',
      border: '1px solid var(--gold, #c9a44d)',
      borderRadius: '12px',
      padding: '12px 15px',
      fontSize: '14px',
      lineHeight: '1.55',
      boxShadow: '0 6px 24px rgba(0, 0, 0, .45)',
      display: 'none',
    } satisfies Partial<CSSStyleDeclaration>);

    // Barre de contrôle
    const bar = document.createElement('div');
    Object.assign(bar.style, {
      position: 'fixed',
      left: '50%',
      bottom: 'calc(14px + env(safe-area-inset-bottom))',
      transform: 'translateX(-50%)',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '8px 14px',
      background: 'var(--surface, #22160f)',
      border: '1px solid var(--gold, #c9a44d)',
      borderRadius: '999px',
      boxShadow: '0 6px 24px rgba(0, 0, 0, .5)',
      pointerEvents: 'auto',
      fontSize: '13px',
      color: 'var(--text, #f2e7d5)',
      whiteSpace: 'nowrap',
    } satisfies Partial<CSSStyleDeclaration>);

    const btn = (label: string, title: string, onClick: () => void): HTMLButtonElement => {
      const b = document.createElement('button');
      b.textContent = label;
      b.title = title;
      b.setAttribute('aria-label', title);
      Object.assign(b.style, {
        background: 'none',
        border: 'none',
        color: 'var(--gold, #c9a44d)',
        fontSize: '15px',
        fontWeight: '700',
        cursor: 'pointer',
        padding: '2px 4px',
      } satisfies Partial<CSSStyleDeclaration>);
      b.addEventListener('click', onClick);
      return b;
    };

    const title = document.createElement('span');
    title.textContent = this.scenario.title;
    Object.assign(title.style, {
      fontWeight: '700',
      maxWidth: '150px',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    } satisfies Partial<CSSStyleDeclaration>);

    const stepCount = document.createElement('span');
    stepCount.style.color = 'var(--text-muted, #9a8a72)';

    this.barPlay = btn('⏸', 'Pause', () => {
      if (this.status === 'running') this.pause();
      else this.play();
      this.refreshBar();
    });
    const nextBtn = btn('⏭', 'Étape suivante', () => this.next());
    this.barSpeed = btn(`×${this.speed}`, 'Vitesse', () => {
      const i = SPEEDS.indexOf(this.speed);
      this.setSpeed(SPEEDS[(i + 1) % SPEEDS.length]);
    });
    const quit = btn('✕', 'Quitter la démo (Échap)', () => this.stop());

    bar.append(title, stepCount, this.barPlay, nextBtn, this.barSpeed, quit);
    root.append(halo, cursor, bubble, bar);
    document.body.appendChild(root);

    this.root = root;
    this.halo = halo;
    this.cursor = cursor;
    this.bubble = bubble;
    this.bar = bar;
    this.barStep = stepCount;
    this.refreshBar();
  }

  private refreshBar(): void {
    if (!this.bar) return;
    this.barStep.textContent = `${Math.min(this.stepIndex + 1, this.scenario.steps.length)}/${this.scenario.steps.length}`;
    const running = this.status === 'running';
    this.barPlay.textContent = running ? '⏸' : '▶';
    const label = running ? 'Pause' : 'Lecture';
    this.barPlay.title = label;
    this.barPlay.setAttribute('aria-label', label);
  }

  private showHalo(rect: DOMRect): void {
    Object.assign(this.halo.style, {
      left: `${rect.left - 5}px`,
      top: `${rect.top - 5}px`,
      width: `${rect.width + 10}px`,
      height: `${rect.height + 10}px`,
      opacity: '1',
    });
  }

  private hideHalo(): void {
    this.halo.style.opacity = '0';
  }

  private showBubble(text: string, anchor: HTMLElement | null): void {
    const b = this.bubble;
    b.textContent = text;
    b.style.display = 'block';
    // Mesure après affichage pour positionner correctement.
    const bh = b.offsetHeight;
    const bw = b.offsetWidth;
    if (anchor) {
      const r = anchor.getBoundingClientRect();
      const left = clamp(r.left + r.width / 2 - bw / 2, 16, window.innerWidth - bw - 16);
      // Au-dessus de la cible si la place le permet, sinon en dessous.
      const top = r.top - bh - 12 > 12 ? r.top - bh - 12 : r.bottom + 12;
      b.style.left = `${left}px`;
      b.style.top = `${top}px`;
    } else {
      b.style.left = `${(window.innerWidth - bw) / 2}px`;
      b.style.top = '';
      b.style.bottom = 'calc(72px + env(safe-area-inset-bottom))';
    }
  }

  private hideBubble(): void {
    this.bubble.style.display = 'none';
    this.bubble.style.bottom = '';
  }

  // ─── Divers ───

  private setStatus(status: DemoStatus): void {
    if (this.status === status) return;
    this.status = status;
    this.emit({ type: 'status', status });
    this.refreshBar();
  }

  private emit(e: DemoEvent): void {
    this.onEvent?.(e);
  }
}
