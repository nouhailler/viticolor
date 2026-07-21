import { FRANCE_VIEWBOX, FRANCE_PATHS, REGION_POINTS } from '../data/france-map';
import { FRANCE_RIVERS } from '../data/france-rivers';
import { REGIONS } from '../data';

const [, , VB_W, VB_H] = FRANCE_VIEWBOX.split(' ').map(Number);

/** Rivières emblématiques de chaque région : elles sont tracées en évidence et
 *  citées en légende. Les régions littorales (Languedoc, Provence, Corse) n'en
 *  ont pas dans notre jeu : c'est le trait de côte qui les situe. */
export const REGION_RIVERS: Record<string, string[]> = {
  alsace: ['rhin'],
  beaujolais: ['saone'],
  bordeaux: ['garonne', 'dordogne'],
  bourgogne: ['saone'],
  champagne: ['marne'],
  corse: [],
  jura: ['doubs'],
  languedoc: [],
  loire: ['loire'],
  lorraine: ['moselle'],
  provence: ['rhone'],
  rhone: ['rhone'],
  savoie: ['isere'],
  sudouest: ['garonne', 'lot', 'dordogne'],
};

/** Régions dont le repère se lit avant tout par la mer plutôt qu'un fleuve. */
const SEA_LABEL: Record<string, string> = {
  languedoc: 'Mer Méditerranée',
  provence: 'Mer Méditerranée',
  corse: 'Mer Méditerranée',
};

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

// Fenêtre de recadrage (unités du viewBox) : un même zoom pour toutes les
// régions, assez large pour montrer côte et rivières voisines.
const WIN_W = 440;
const WIN_H = 290;

export function SituationMap({ regionId }: { regionId: string }) {
  const p = REGION_POINTS[regionId];
  if (!p) return null;

  const region = REGIONS.find((r) => r.id === regionId);
  const homeIds = REGION_RIVERS[regionId] ?? [];
  const homeRivers = FRANCE_RIVERS.filter((r) => homeIds.includes(r.id));
  const otherRivers = FRANCE_RIVERS.filter((r) => !homeIds.includes(r.id));

  const x0 = clamp(p.x - WIN_W / 2, 0, VB_W - WIN_W);
  const y0 = clamp(p.y - WIN_H / 2, 0, VB_H - WIN_H);
  const crop = `${x0} ${y0} ${WIN_W} ${WIN_H}`;

  // Voisins visibles dans la fenêtre (hors région courante).
  const neighbours = REGIONS.filter((r) => {
    if (r.id === regionId) return false;
    const q = REGION_POINTS[r.id];
    return q && q.x >= x0 && q.x <= x0 + WIN_W && q.y >= y0 && q.y <= y0 + WIN_H;
  });

  const waters = [...homeRivers.map((r) => r.name), SEA_LABEL[regionId]].filter(Boolean);

  return (
    <div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 700 }}>
        Situation
      </div>
      <div
        style={{
          marginTop: 8,
          position: 'relative',
          borderRadius: 'var(--r-card)',
          overflow: 'hidden',
          border: '1px solid var(--gold-border)',
          boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.25)',
        }}
      >
        <svg
          viewBox={crop}
          width="100%"
          style={{ display: 'block', aspectRatio: `${WIN_W} / ${WIN_H}` }}
          role="img"
          aria-label={`Situation de ${region?.name ?? 'la région'} sur la carte de France`}
        >
          {/* Mer */}
          <rect x={x0} y={y0} width={WIN_W} height={WIN_H} fill="#c4d8de" />

          {/* Terres */}
          {FRANCE_PATHS.map((d, i) => (
            <path key={i} d={d} fill="#e9e0cd" stroke="#b7a681" strokeWidth={1.4} strokeLinejoin="round" />
          ))}

          {/* Rivières secondaires (contexte) */}
          {otherRivers.map((r) => (
            <path key={r.id} d={r.d} fill="none" stroke="#9fc0d0" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" />
          ))}
          {/* Rivière(s) de la région, en évidence */}
          {homeRivers.map((r) => (
            <path key={r.id} d={r.d} fill="none" stroke="#4f8bad" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
          ))}

          {/* Régions voisines */}
          {neighbours.map((r) => {
            const q = REGION_POINTS[r.id]!;
            return (
              <g key={r.id}>
                <circle cx={q.x} cy={q.y} r={3.4} fill="#8a5a2b" opacity={0.75} />
                <text x={q.x} y={q.y - 6} textAnchor="middle" fontSize={10.5} fill="#6b5330" style={{ fontWeight: 600 }}>
                  {r.name}
                </text>
              </g>
            );
          })}

          {/* Repère de la région */}
          <circle cx={p.x} cy={p.y} r={12} fill="none" stroke="#b8860b" strokeWidth={2} opacity={0.5} />
          <circle cx={p.x} cy={p.y} r={5.5} fill="#c9a227" stroke="#fff" strokeWidth={2} />
          <text x={p.x} y={p.y + 18} textAnchor="middle" fontSize={13} fill="#3a2b16" style={{ fontWeight: 700 }}>
            {region?.name}
          </text>

          {/* Rose des vents */}
          <g transform={`translate(${x0 + WIN_W - 26}, ${y0 + 24})`} opacity={0.85}>
            <circle r={11} fill="rgba(255,255,255,0.7)" stroke="#b7a681" strokeWidth={1} />
            <path d="M0 -8L2.4 0L0 8L-2.4 0Z" fill="#8a5a2b" />
            <text x={0} y={-13} textAnchor="middle" fontSize={9} fill="#6b5330" style={{ fontWeight: 700 }}>N</text>
          </g>
        </svg>
      </div>

      <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: '4px 14px', fontSize: 12, color: 'var(--text-3)' }}>
        <span>📍 {p.ref}</span>
        {waters.length > 0 && <span>🌊 {waters.join(' · ')}</span>}
      </div>
    </div>
  );
}
