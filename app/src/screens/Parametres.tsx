import { useState } from 'react';
import { useStore, actions } from '../store';
import { WINES, REGIONS } from '../data';
import { ScreenHeading } from '../components/ui';
import type { Wine } from '../types';

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
  const { userWines, demoOn, notes } = useStore((s) => ({
    userWines: s.userWines,
    demoOn: s.demoOn,
    notes: s.notes,
  }));
  const [done, setDone] = useState<string | null>(null);

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
