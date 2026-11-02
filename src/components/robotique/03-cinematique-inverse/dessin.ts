// Cours Robotique : dessin SVG du bras plan (chaînes de caractères, pour le frontmatter comme pour le navigateur).
// Corps en gris, articulations en --rb-q, cible en ambre --hl-stroke, trace de la main (itérations) en --rb-search.
import { fk, type V2 } from './bras';

export type Map2 = { X: (x: number) => number; Y: (y: number) => number; s: number };
// repère monde (m) → pixels, y vers le haut ; view = [xmin, xmax, ymin, ymax], s = pixels par mètre
export function view(v: [number, number, number, number], s: number) {
  const [x0, x1, y0, y1] = v;
  const m: Map2 = { X: (x) => (x - x0) * s, Y: (y) => (y1 - y) * s, s };
  return { m, W: (x1 - x0) * s, H: (y1 - y0) * s };
}
const n1 = (v: number) => v.toFixed(1);

// socle fixe sous la première articulation
export const socle = (m: Map2) => {
  const x = m.X(0), y = m.Y(0);
  return `<path d="M${n1(x - 9)},${n1(y + 9)} L${n1(x + 9)},${n1(y + 9)} L${n1(x)},${n1(y)} Z" fill="var(--text-2)" fill-opacity="0.35"/>` +
    `<line x1="${n1(x - 13)}" y1="${n1(y + 9.5)}" x2="${n1(x + 13)}" y2="${n1(y + 9.5)}" stroke="var(--text-2)" stroke-width="1.4"/>`;
};

// bras : style « plein » (pose courante), « fantome » (pose passée, opacité op) ou « ref » (posture de référence, pointillés)
export function bras(q: number[], m: Map2, style: 'plein' | 'fantome' | 'ref' = 'plein', op = 0.2, l?: number[]) {
  const p = fk(q, l), d = p.map(([x, y]) => `${n1(m.X(x))},${n1(m.Y(y))}`).join(' ');
  if (style === 'ref') return `<polyline points="${d}" fill="none" stroke="var(--text-2)" stroke-width="2" stroke-dasharray="5 4" stroke-linecap="round" stroke-linejoin="round" opacity="0.8"/>`;
  if (style === 'fantome') return `<polyline points="${d}" fill="none" stroke="var(--text-2)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" opacity="${op.toFixed(2)}"/>`;
  let o = `<polyline points="${d}" fill="none" stroke="var(--text-2)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" opacity="0.75"/>`;
  p.slice(0, -1).forEach(([x, y]) => (o += `<circle cx="${n1(m.X(x))}" cy="${n1(m.Y(y))}" r="4.6" fill="var(--surface)" stroke="var(--rb-q)" stroke-width="2.4"/>`));
  const [tx, ty] = p[p.length - 1];
  return o + `<circle cx="${n1(m.X(tx))}" cy="${n1(m.Y(ty))}" r="3" fill="var(--text-2)"/>`;
}

// cible : cercle et croix ambre
export const cible = (t: V2, m: Map2) => {
  const x = m.X(t[0]), y = m.Y(t[1]);
  return `<circle cx="${n1(x)}" cy="${n1(y)}" r="7.5" fill="var(--hl-stroke)" fill-opacity="0.14" stroke="var(--hl-stroke)" stroke-width="2"/>` +
    `<path d="M${n1(x - 4)},${n1(y)} H${n1(x + 4)} M${n1(x)},${n1(y - 4)} V${n1(y + 4)}" stroke="var(--hl-stroke)" stroke-width="1.6"/>`;
};

// trace de la main au fil des itérations
export const trace = (pts: V2[], m: Map2) => {
  if (!pts.length) return '';
  const d = pts.map(([x, y]) => `${n1(m.X(x))},${n1(m.Y(y))}`).join(' ');
  return `<polyline points="${d}" fill="none" stroke="var(--rb-search)" stroke-width="1.3" stroke-opacity="0.75" stroke-linejoin="round"/>` +
    pts.map(([x, y]) => `<circle cx="${n1(m.X(x))}" cy="${n1(m.Y(y))}" r="2.6" fill="var(--rb-search)"/>`).join('');
};

// nombres à la française : virgule décimale, vrai signe moins
export const fr = (v: number, d = 3) => {
  const s = v.toFixed(d);
  return (/^-0[.,]?0*$/.test(s) ? s.slice(1) : s).replace('.', ',').replace('-', '−');
};
export const vec = (v: number[], d = 3) => `(${v.map((x) => fr(x, d)).join(' ; ')})`;
