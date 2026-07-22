import { useStore, setState } from '../store';
import { ScreenHeading } from '../components/ui';
import type { VendangeRegion } from '../types';

const MOIS = ['jan', 'fév', 'mars', 'avr', 'mai', 'juin', 'juil', 'août', 'sept', 'oct', 'nov', 'déc'];
// Campagne de l'année en cours : le curseur suit la vraie date (jours écoulés
// depuis le 1er août — négatif avant l'ouverture, la campagne est « à venir »).
const NOW = new Date();
const CAMPAGNE = NOW.getFullYear();
const TODAY = Math.floor((NOW.getTime() - new Date(CAMPAGNE, 7, 1).getTime()) / 86400000);
const SPAN = 92; // 1 août → 31 octobre

function fmt(j: number): string {
  const dt = new Date(CAMPAGNE, 7, 1 + j);
  return `${dt.getDate()} ${MOIS[dt.getMonth()]}.`;
}

function compute(list: VendangeRegion[]) {
  return list.map((r) => {
    const encours = TODAY >= r.d && TODAY <= r.f;
    const fini = TODAY > r.f;
    const statut = fini ? 'Terminées' : encours ? 'En cours' : 'À venir';
    return {
      nom: r.nom,
      statut,
      statutColor: encours ? 'var(--gold)' : fini ? 'var(--text-muted)' : 'var(--text-3)',
      left: `${Math.round((100 * r.d) / SPAN)}%`,
      width: `${Math.round((100 * (r.f - r.d)) / SPAN)}%`,
      barBg: encours ? 'var(--gold)' : fini ? 'var(--gold-border)' : 'var(--hero-c)',
      dates: `${fmt(r.d)} → ${fmt(r.f)}`,
      ic: r.ic,
      mc: r.mc,
      txt: r.txt,
    };
  });
}

export function Vendanges() {
  const { vendSel, vendanges } = useStore((s) => ({ vendSel: s.vendSel, vendanges: s.vendanges }));
  // Prévisions rédigées pour une campagne donnée (embarquées ou importées via
  // Paramètres) : tant qu'elles ne couvrent pas l'année en cours, on l'affiche.
  const AJOUR = vendanges.campagne === CAMPAGNE;
  const regions = compute(vendanges.regions);
  const detail = regions[Math.min(vendSel, regions.length - 1)];
  const aVenir = regions.filter((v) => v.statut === 'À venir').length;

  return (
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>
      <ScreenHeading
        title={`Vendanges ${CAMPAGNE}`}
        subtitle={
          AJOUR
            ? `Prévisions de campagne · ${aVenir} régions à venir · touchez une région`
            : `Fenêtres habituelles de récolte · touchez une région`
        }
      />
      {!AJOUR && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--gold-border)', borderLeft: '3px solid var(--gold)', borderRadius: 'var(--r-card)', padding: '10px 14px', fontSize: 12, color: 'var(--text-2)', lineHeight: 1.55 }}>
          Les prévisions détaillées (météo, commentaires) datent de la campagne {vendanges.campagne} — celles
          de {CAMPAGNE} seront actualisées à l'approche des vendanges. Les fenêtres affichées sont les
          périodes habituelles de chaque région.
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 2px', fontSize: 10.5, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
        <div>Août</div>
        <div>Septembre</div>
        <div>Octobre</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {regions.map((v, i) => (
          <button
            key={v.nom}
            onClick={() => setState({ vendSel: i })}
            style={{
              background: 'var(--surface)',
              border: `1px solid ${i === vendSel ? 'var(--gold-border)' : 'var(--surface-border)'}`,
              borderRadius: 'var(--r-card)',
              padding: '13px 16px',
              textAlign: 'left',
              display: 'block',
              width: '100%',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, color: 'var(--gold-light)' }}>
                {v.nom}
              </div>
              <div style={{ fontSize: 11, color: v.statutColor, fontWeight: 700, whiteSpace: 'nowrap', letterSpacing: '1px', textTransform: 'uppercase' }}>
                {v.statut}
              </div>
            </div>
            <div style={{ marginTop: 9, height: 8, background: 'var(--surface-hollow)', borderRadius: 'var(--r-pill)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, bottom: 0, left: v.left, width: v.width, background: v.barBg, borderRadius: 'var(--r-pill)' }} />
            </div>
            <div style={{ marginTop: 7, display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: 'var(--text-muted)' }}>
              <div>{v.dates}</div>
              <div>{v.ic} {v.mc}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Détail */}
      <div style={{ background: 'var(--surface-hollow)', border: '1px solid var(--gold-border)', borderRadius: 'var(--r-card)', padding: '16px 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, color: 'var(--gold)' }}>{detail.nom}</div>
          <div style={{ fontSize: 12, color: 'var(--gold-light)' }}>{detail.dates}</div>
        </div>
        <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--r-card)', padding: '10px 12px' }}>
            <div style={{ fontSize: 10.5, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Météo campagne</div>
            <div style={{ marginTop: 3, fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>{detail.ic} {detail.mc}</div>
          </div>
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--r-card)', padding: '10px 12px' }}>
            <div style={{ fontSize: 10.5, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Statut</div>
            <div style={{ marginTop: 3, fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>{detail.statut}</div>
          </div>
        </div>
        <div style={{ marginTop: 10, fontSize: 13, lineHeight: 1.6, color: 'var(--text-2)', fontStyle: 'italic' }}>{detail.txt}</div>
      </div>
    </div>
  );
}
