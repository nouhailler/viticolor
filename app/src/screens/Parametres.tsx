import { useState } from 'react';
import { useStore, actions } from '../store';
import { WINES, REGIONS, VENDANGES } from '../data';
import { ScreenHeading } from '../components/ui';
import { startDemo } from '../demo/engine';
import { DEMO_SCENARIOS } from '../demo/scenarios';
import type { Wine, VendangeRegion, VendangesData } from '../types';

// ─── Actualisation des vendanges par fichier JSON ───
// Le gabarit reprend les régions embarquées, campagne calée sur l'année en
// cours : à faire remplir (météo, commentaires, fenêtres) puis à déposer ici.
const GABARIT_VENDANGES = JSON.stringify(
  {
    campagne: new Date().getFullYear(),
    regions: VENDANGES.regions.map(({ nom, d, f, ic, mc, txt }) => ({ nom, d, f, ic, mc, txt })),
  },
  null,
  2,
);

type VendangesParse = { ok: true; data: VendangesData } | { ok: false; err: string };

function parseVendanges(raw: unknown): VendangesParse {
  if (typeof raw !== 'object' || raw == null || Array.isArray(raw))
    return { ok: false, err: 'Le fichier doit contenir un objet JSON ({ campagne, regions }).' };
  const o = raw as Record<string, unknown>;
  const campagne = Number(o.campagne);
  if (!Number.isInteger(campagne) || campagne < 2020 || campagne > 2100)
    return { ok: false, err: '« campagne » doit être une année (ex. 2027).' };
  if (!Array.isArray(o.regions) || o.regions.length === 0 || o.regions.length > 24)
    return { ok: false, err: '« regions » doit être un tableau de régions (une entrée par région).' };
  const regions: VendangeRegion[] = [];
  for (let i = 0; i < o.regions.length; i++) {
    const r = o.regions[i] as Record<string, unknown>;
    const where = `région n°${i + 1}`;
    if (typeof r !== 'object' || r == null || typeof r.nom !== 'string' || !r.nom.trim())
      return { ok: false, err: `${where} : « nom » manquant.` };
    const d = Number(r.d);
    const f = Number(r.f);
    if (!Number.isFinite(d) || !Number.isFinite(f) || d < -31 || f > 122 || f <= d)
      return { ok: false, err: `${where} (${r.nom}) : « d » et « f » sont des jours comptés depuis le 1ᵉʳ août, avec d < f.` };
    for (const k of ['ic', 'mc', 'txt'] as const) {
      if (typeof r[k] !== 'string' || !(r[k] as string).trim())
        return { ok: false, err: `${where} (${r.nom}) : champ « ${k} » manquant.` };
    }
    regions.push({
      nom: r.nom.trim(),
      d,
      f,
      ic: (r.ic as string).trim(),
      mc: (r.mc as string).trim(),
      txt: (r.txt as string).trim(),
    });
  }
  return { ok: true, data: { campagne, regions } };
}

// nom de région lisible pour l'export (l'import accepte nom ou id).
const REGION_NAME = new Map(REGIONS.map((r) => [r.id, r.name]));

// Un vin au format du gabarit d'import : l'export est ré-importable tel quel.
function toGabarit(w: Wine) {
  return {
    domaine: w.domaine,
    cuvee: w.cuvee,
    appellation: w.appellation,
    region: REGION_NAME.get(w.regionId) ?? w.regionId,
    couleur: w.couleur,
    millesime: w.millesime,
    cepages: w.cepages,
    degre: w.degre,
    prixMoyen: w.prixMoyen,
    temperature: w.temperature,
    garde: w.garde,
    notes: w.notes,
    accords: w.accords,
  };
}

function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Briques d'interface ───
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 11,
          letterSpacing: '2px',
          textTransform: 'uppercase',
          color: 'var(--gold)',
          fontWeight: 700,
          marginBottom: 8,
        }}
      >
        {title}
      </div>
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--surface-border)',
          borderRadius: 'var(--r-card)',
          overflow: 'hidden',
        }}
      >
        {children}
      </div>
    </div>
  );
}

interface RowProps {
  label: string;
  hint?: string;
  action: React.ReactNode;
  first?: boolean;
}
function Row({ label, hint, action, first }: RowProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 14px',
        borderTop: first ? 'none' : '1px solid var(--surface-border)',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, color: 'var(--text)' }}>{label}</div>
        {hint && <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>{hint}</div>}
      </div>
      {action}
    </div>
  );
}

const btnGold: React.CSSProperties = {
  fontSize: 12.5,
  color: 'var(--gold)',
  border: '1px solid var(--gold)',
  borderRadius: 'var(--r-pill)',
  padding: '6px 14px',
  flexShrink: 0,
  whiteSpace: 'nowrap',
};

const btnDanger: React.CSSProperties = {
  ...btnGold,
  color: '#e08a8a',
  border: '1px solid #7a3a3a',
};

export function Parametres() {
  const { userWines, demoOn, notes, vendanges } = useStore((s) => ({
    userWines: s.userWines,
    demoOn: s.demoOn,
    notes: s.notes,
    vendanges: s.vendanges,
  }));
  const [done, setDone] = useState<string | null>(null);
  const [showGabarit, setShowGabarit] = useState(false);
  const [gabaritCopied, setGabaritCopied] = useState(false);
  const [vendErr, setVendErr] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // Les données de vendanges viennent-elles d'un import (vs embarquées) ?
  const vendImported = vendanges !== VENDANGES;

  const total = WINES.length + userWines.length;
  const today = new Date().toISOString().slice(0, 10);

  const flash = (msg: string) => {
    setDone(msg);
    setTimeout(() => setDone(null), 2500);
  };

  const exportCatalogue = () => {
    downloadJson([...userWines, ...WINES].map(toGabarit), `viticolor-vins-${today}.json`);
    flash(`Catalogue exporté (${total} vins).`);
  };

  const exportNotes = () => {
    downloadJson(notes, `viticolor-notes-${today}.json`);
    flash(`Carnet exporté (${notes.length} note${notes.length > 1 ? 's' : ''}).`);
  };

  const copyGabarit = () => {
    navigator.clipboard?.writeText(GABARIT_VENDANGES).then(
      () => {
        setGabaritCopied(true);
        setTimeout(() => setGabaritCopied(false), 1500);
      },
      () => setGabaritCopied(false),
    );
  };

  const importVendangesFile = (file: File) => {
    setVendErr(null);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const res = parseVendanges(JSON.parse(String(reader.result)));
        if (!res.ok) {
          setVendErr(res.err);
          return;
        }
        actions.importVendanges(res.data);
        flash(`Prévisions de la campagne ${res.data.campagne} importées (${res.data.regions.length} régions).`);
      } catch (e) {
        setVendErr(`JSON invalide : ${(e as Error).message}`);
      }
    };
    reader.onerror = () => setVendErr('Lecture du fichier impossible.');
    reader.readAsText(file);
  };

  const clearImported = () => {
    if (!window.confirm(`Retirer les ${userWines.length} vins importés sur cet appareil ?`)) return;
    actions.clearUserWines();
    flash('Vins importés retirés.');
  };

  return (
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>
      <ScreenHeading title="Paramètres" subtitle="Import, export et préférences de l'application" />

      <Section title="Catalogue">
        <Row
          first
          label="Importer des vins"
          hint="Gabarit JSON — les doublons sont ignorés automatiquement"
          action={
            <button onClick={() => actions.go('import')} style={btnGold}>
              Ouvrir →
            </button>
          }
        />
        <Row
          label="Exporter le catalogue"
          hint={`${total} vins (catalogue + imports) au format du gabarit, ré-importable`}
          action={
            <button onClick={exportCatalogue} style={btnGold}>
              Exporter JSON
            </button>
          }
        />
        <Row
          label="Retirer les vins importés"
          hint={
            userWines.length
              ? `${userWines.length} vin${userWines.length > 1 ? 's' : ''} ajouté${userWines.length > 1 ? 's' : ''} sur cet appareil`
              : 'Aucun vin importé sur cet appareil'
          }
          action={
            <button onClick={clearImported} disabled={userWines.length === 0} style={userWines.length ? btnDanger : { ...btnDanger, opacity: 0.4 }}>
              Tout retirer
            </button>
          }
        />
      </Section>

      <Section title="Carnet de dégustation">
        <Row
          first
          label="Exporter mes notes"
          hint={`${notes.length} note${notes.length > 1 ? 's' : ''} de dégustation`}
          action={
            <button onClick={exportNotes} style={btnGold}>
              Exporter JSON
            </button>
          }
        />
      </Section>

      <Section title="Vendanges">
        <Row
          first
          label="Prévisions actuelles"
          hint={vendImported ? 'fichier importé sur cet appareil' : "données embarquées dans l'application"}
          action={
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--gold)' }}>{vendanges.campagne}</span>
              {vendImported && (
                <button
                  onClick={() => { actions.resetVendanges(); flash('Prévisions embarquées restaurées.'); }}
                  style={{ fontSize: 11.5, color: 'var(--text-muted)', textDecoration: 'underline' }}
                >
                  restaurer
                </button>
              )}
            </div>
          }
        />
        <Row
          label="Gabarit du fichier de campagne"
          hint="À faire remplir (par votre projet Claude, par exemple) puis à déposer ci-dessous"
          action={
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <button onClick={() => setShowGabarit((v) => !v)} style={btnGold}>
                {showGabarit ? 'Masquer' : 'Voir'}
              </button>
              <button onClick={copyGabarit} style={btnGold}>
                {gabaritCopied ? '✓ Copié' : 'Copier'}
              </button>
            </div>
          }
        />
        {showGabarit && (
          <div style={{ borderTop: '1px solid var(--surface-border)' }}>
            <div style={{ padding: '10px 14px 0', fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              <strong>campagne</strong> : année des prévisions. Par région : <strong>d</strong> et{' '}
              <strong>f</strong> = début et fin de récolte en jours depuis le 1ᵉʳ août (0 = 1ᵉʳ août, 31 = 1ᵉʳ
              septembre) ; <strong>ic</strong> = émoji météo ; <strong>mc</strong> = météo en 2-3 mots ;{' '}
              <strong>txt</strong> = commentaire de campagne (1-2 phrases).
            </div>
            <pre className="vc-scroll" style={{ margin: 0, padding: '10px 14px 14px', overflowX: 'auto', fontSize: 11, lineHeight: 1.5, color: 'var(--text-2)', fontFamily: 'ui-monospace, Menlo, Consolas, monospace', maxHeight: 260, overflowY: 'auto' }}>
              {GABARIT_VENDANGES}
            </pre>
          </div>
        )}
        {/* Zone de dépôt */}
        <div style={{ borderTop: '1px solid var(--surface-border)', padding: '12px 14px' }}>
          <label
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const f = e.dataTransfer.files?.[0];
              if (f) importVendangesFile(f);
            }}
            style={{
              display: 'block',
              textAlign: 'center',
              padding: '18px 14px',
              border: `1.5px dashed ${dragOver ? 'var(--gold)' : 'var(--gold-border)'}`,
              borderRadius: 'var(--r-card)',
              background: dragOver ? 'var(--surface-hollow)' : 'transparent',
              color: 'var(--text-3)',
              fontSize: 12.5,
              lineHeight: 1.6,
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: 18 }}>📄</span>
            <br />
            Déposez le fichier JSON de campagne ici,
            <br />
            ou <span style={{ color: 'var(--gold)', textDecoration: 'underline' }}>touchez pour le choisir</span>
            <input
              type="file"
              accept=".json,application/json"
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) importVendangesFile(f);
                e.target.value = '';
              }}
            />
          </label>
          {vendErr && (
            <div style={{ marginTop: 8, fontSize: 12, color: '#e08a8a', lineHeight: 1.5 }}>{vendErr}</div>
          )}
        </div>
      </Section>

      <Section title="Visite guidée">
        {DEMO_SCENARIOS.map((sc, i) => (
          <Row
            key={sc.id}
            first={i === 0}
            label={sc.title}
            hint={sc.description}
            action={
              <button onClick={() => startDemo(sc)} style={btnGold}>
                Lancer ▶
              </button>
            }
          />
        ))}
      </Section>

      <Section title="Affichage">
        <Row
          first
          label="Mode démo"
          hint="Affiche une astuce contextuelle en haut de chaque écran"
          action={
            <button
              onClick={actions.toggleDemo}
              role="switch"
              aria-checked={demoOn}
              aria-label="Mode démo"
              style={{
                width: 44,
                height: 24,
                borderRadius: 12,
                background: demoOn ? 'var(--gold)' : 'var(--surface-border)',
                position: 'relative',
                flexShrink: 0,
                transition: 'background .15s ease',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  top: 3,
                  left: demoOn ? 23 : 3,
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background: demoOn ? 'var(--on-gold)' : 'var(--text-muted)',
                  transition: 'left .15s ease',
                }}
              />
            </button>
          }
        />
      </Section>

      {done && (
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--gold-border)',
            borderLeft: '3px solid var(--gold)',
            borderRadius: 'var(--r-card)',
            padding: '11px 14px',
            fontSize: 13,
            color: 'var(--text)',
          }}
        >
          ✓ {done}
        </div>
      )}

      <div style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.6 }}>
        Les exports sont téléchargés sur cet appareil. Le fichier catalogue reprend le format du gabarit
        d'import : vous pouvez le recharger tel quel via « Importer des vins ».
      </div>
    </div>
  );
}
