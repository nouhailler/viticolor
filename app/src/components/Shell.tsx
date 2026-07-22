import { useStore, actions, isRootScreen, type State } from '../store';
import { DEMO_TIPS, GLOSSAIRE, WINES, REGIONS, ACCORDS } from '../data';
import type { ScreenId } from '../types';

// ─── Header fixe ───
export function Header() {
  const screen = useStore((s) => s.screen);
  const back = !isRootScreen(screen);
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 20px 8px',
        borderBottom: '1px solid var(--surface-border)',
        background: 'var(--app-bg)',
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
        <button
          aria-label="Menu"
          onClick={actions.toggleMenu}
          style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '8px 2px', flexShrink: 0 }}
        >
          {[0, 1, 2].map((i) => (
            <span key={i} style={{ width: 20, height: 2, background: 'var(--gold)' }} />
          ))}
        </button>
        {back ? (
          <button
            onClick={actions.goBack}
            aria-label="Revenir à l'écran précédent"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              color: 'var(--gold)',
              whiteSpace: 'nowrap',
              padding: '4px 2px',
            }}
          >
            <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 5l-7 7 7 7" />
            </svg>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 19 }}>Retour</span>
          </button>
        ) : (
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: 1,
              color: 'var(--gold)',
            }}
          >
            Viticolor
          </div>
        )}
      </div>
      <button
        aria-label="Rechercher"
        onClick={() => actions.go('search')}
        style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--gold)' }}
      >
        <span style={{ width: 12, height: 12, border: '2px solid var(--gold)', borderRadius: '50%' }} />
        <span
          style={{
            width: 7,
            height: 2,
            background: 'var(--gold)',
            transform: 'rotate(45deg) translate(1px,-3px)',
          }}
        />
      </button>
    </header>
  );
}

// ─── Bandeau mode démo (astuce contextuelle par écran) ───
export function DemoBanner() {
  const { screen, demoOn, demoDismissed, obDone } = useStore((s) => ({
    screen: s.screen,
    demoOn: s.demoOn,
    demoDismissed: s.demoDismissed,
    obDone: s.obDone,
  }));
  const tip = DEMO_TIPS[screen];
  const show = demoOn && !!tip && !demoDismissed[screen] && obDone;
  if (!show) return null;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        background: 'var(--gold)',
        color: 'var(--on-gold)',
        padding: '10px 16px',
        flexShrink: 0,
      }}
    >
      <div style={{ fontSize: 15, lineHeight: 1.4 }}>💡</div>
      <div style={{ flex: 1, fontSize: 12.5, lineHeight: 1.5, fontWeight: 600 }}>{tip}</div>
      <button
        aria-label="Fermer l'astuce"
        onClick={() => actions.dismissDemo(screen)}
        style={{ fontSize: 16, fontWeight: 700, padding: '0 2px', color: 'var(--on-gold)' }}
      >
        ×
      </button>
    </div>
  );
}

// ─── Menu hamburger (entrées classées par thème + toggle démo) ───
interface MenuDef {
  key: string;
  id: ScreenId;
  label: string;
  hint: (s: State) => string;
  extra?: Partial<State>;
}

interface MenuSection {
  /** Titre de section (absent pour le groupe d'accès rapide en tête). */
  title?: string;
  items: MenuDef[];
}

// Entrées regroupées par intention d'usage plutôt qu'en liste plate, pour
// s'y retrouver : ce qui est à moi, l'exploration du vignoble, la recherche
// d'un vin concret, puis la culture générale.
const MENU_SECTIONS: MenuSection[] = [
  {
    items: [
      { key: 'home', id: 'home', label: 'Accueil', hint: () => '' },
      { key: 'search', id: 'search', label: 'Recherche', hint: () => '' },
    ],
  },
  {
    title: 'Ma cave',
    items: [
      { key: 'cave', id: 'cave', label: 'Ma cave', hint: () => '' },
      { key: 'degustation', id: 'degustation', label: 'Carnet de dégustation', hint: (s) => `${s.notes.length} notes` },
      { key: 'collection', id: 'collection', label: 'Collection', hint: () => 'objectifs' },
      { key: 'cotes', id: 'cotes', label: 'Cote des vins', hint: () => 'estimations' },
    ],
  },
  {
    title: 'Explorer le vignoble',
    items: [
      {
        key: 'regions',
        id: 'regions',
        label: 'Régions & carte',
        hint: () => `${REGIONS.length} régions`,
        extra: { regionsView: 'carte', carteRegion: null, carteInfo: null },
      },
      { key: 'regions:cepages', id: 'regions', label: 'Cépages', hint: () => '13 fiches', extra: { regionsView: 'cepages' } },
      { key: 'millesimes', id: 'millesimes', label: 'Historique des millésimes', hint: () => '2015–2023' },
      { key: 'vendanges', id: 'vendanges', label: 'Vendanges', hint: () => 'suivi 2026' },
      { key: 'routes', id: 'routes', label: 'Route des vins', hint: () => '4 itinéraires' },
    ],
  },
  {
    title: 'Trouver un vin',
    items: [
      { key: 'scanner', id: 'scanner', label: 'Scanner une étiquette', hint: () => '', extra: { scanned: false } },
      { key: 'bouteilles', id: 'bouteilles', label: 'Bouteilles', hint: (s) => `${WINES.length + s.userWines.length} vins`, extra: { wineSel: null } },
      { key: 'import', id: 'import', label: 'Importer un vin', hint: (s) => (s.userWines.length ? `${s.userWines.length} importés` : 'JSON') },
      { key: 'accords', id: 'accords', label: 'Accords mets & vins', hint: () => `${ACCORDS.length} accords` },
    ],
  },
  {
    title: 'Culture & savoir',
    items: [
      { key: 'histoire', id: 'histoire', label: 'Histoire & culture', hint: () => '7 articles' },
      { key: 'glossaire', id: 'glossaire', label: 'Glossaire', hint: () => `${GLOSSAIRE.length} termes` },
      { key: 'aromes', id: 'aromes', label: 'Lexique des arômes', hint: () => '9 familles' },
      { key: 'savoir', id: 'savoir', label: 'Savoir & quiz', hint: () => '' },
      { key: 'actus', id: 'actus', label: 'Actualités', hint: () => 'fil du vignoble' },
    ],
  },
];

function isMenuActive(def: MenuDef, s: State): boolean {
  if (def.key === 'regions:cepages') return s.screen === 'regions' && s.regionsView === 'cepages';
  if (def.key === 'regions') return s.screen === 'regions' && s.regionsView !== 'cepages';
  return s.screen === def.id;
}

export function MenuDrawer() {
  const state = useStore((s) => s);
  if (!state.menuOpen) return null;
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 40, display: 'flex' }}>
      <nav
        className="vc-scroll"
        style={{
          width: '78%',
          maxWidth: 320,
          background: 'var(--app-bg)',
          borderRight: '1px solid var(--gold-border)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'auto',
          animation: 'vcFade .18s ease',
        }}
      >
        <div style={{ padding: '22px 22px 16px', borderBottom: '1px solid var(--surface-border)' }}>
          <div
            style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'var(--gold)' }}
          >
            Viticolor
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Sommelier de poche</div>
        </div>
        <div style={{ padding: '6px 0', display: 'flex', flexDirection: 'column' }}>
          {MENU_SECTIONS.map((section, si) => (
            <div key={section.title ?? `s${si}`}>
              {section.title && (
                <div
                  style={{
                    padding: si === 0 ? '10px 22px 6px' : '16px 22px 6px',
                    marginTop: si > 0 ? 4 : 0,
                    borderTop: si > 1 ? '1px solid var(--surface-border)' : 'none',
                    fontFamily: 'var(--font-display)',
                    fontSize: 11,
                    letterSpacing: '2px',
                    textTransform: 'uppercase',
                    color: 'var(--gold)',
                    fontWeight: 700,
                  }}
                >
                  {section.title}
                </div>
              )}
              {section.items.map((def) => {
                const active = isMenuActive(def, state);
                return (
                  <button
                    key={def.key}
                    onClick={() => actions.go(def.id, def.extra ?? {})}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '11px 22px',
                      minHeight: 44,
                      width: '100%',
                      background: active ? 'var(--surface)' : 'transparent',
                      textAlign: 'left',
                    }}
                  >
                    <span
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: '50%',
                        background: active ? 'var(--gold)' : 'transparent',
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        flex: 1,
                        fontSize: 15,
                        color: active ? 'var(--gold-light)' : 'var(--text-3)',
                        fontWeight: active ? 700 : 400,
                      }}
                    >
                      {def.label}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{def.hint(state)}</span>
                  </button>
                );
              })}
            </div>
          ))}
          <button
            onClick={actions.toggleDemo}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '13px 22px',
              minHeight: 48,
              borderTop: '1px solid var(--surface-border)',
              marginTop: 8,
              textAlign: 'left',
            }}
          >
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: state.demoOn ? 'var(--gold)' : 'var(--surface-border)',
                flexShrink: 0,
              }}
            />
            <span style={{ flex: 1, fontSize: 14, color: 'var(--text-3)' }}>
              Mode démo · {state.demoOn ? 'activé' : 'désactivé'}
            </span>
          </button>
        </div>
      </nav>
      <div onClick={actions.toggleMenu} style={{ flex: 1, background: 'var(--overlay)' }} />
    </div>
  );
}

// ─── Bottom nav 5 onglets ───
const NAV: { id: ScreenId; label: string }[] = [
  { id: 'home', label: 'Accueil' },
  { id: 'regions', label: 'Régions' },
  { id: 'scanner', label: 'Scanner' },
  { id: 'cave', label: 'Cave' },
  { id: 'savoir', label: 'Savoir' },
];

export function BottomNav() {
  const screen = useStore((s) => s.screen);
  return (
    <nav
      style={{
        display: 'flex',
        alignItems: 'stretch',
        borderTop: '1px solid var(--surface-border)',
        background: 'var(--surface)',
        padding: '6px 4px 4px',
        paddingBottom: 'calc(4px + env(safe-area-inset-bottom))',
        flexShrink: 0,
      }}
    >
      {NAV.map((t) => {
        const active = screen === t.id;
        return (
          <button
            key={t.id}
            onClick={() => actions.go(t.id, t.id === 'scanner' ? { scanned: false } : {})}
            style={{
              flex: 1,
              minHeight: 48,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
            }}
          >
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: active ? 'var(--gold)' : 'transparent',
              }}
            />
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 14,
                letterSpacing: '1px',
                fontWeight: active ? 700 : 500,
                color: active ? 'var(--gold-light)' : '#9c7a72',
              }}
            >
              {t.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
