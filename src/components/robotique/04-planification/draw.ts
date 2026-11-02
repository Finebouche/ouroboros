// Cours Robotique : dessins SVG partagés par EspaceC et RrtConnect (carré de C, espace de travail, bras 2R).
// Couleurs : variables de global.css uniquement. Classes de texte (ax, lb) stylées par chaque widget.
import { fk, L1, L2, DISQUES, collides, type Q } from './plan';

const PI = Math.PI;
export const fr = (v: number, d = 2) => v.toFixed(d).replace('.', ',').replace('-', '−');

// ---- carré [−π, π]² : q1 en abscisse, q2 en ordonnée
export const CS = { S: 240, ox: 30, oy: 8, N: 120 };
export const CVIEW = `0 0 ${CS.ox + CS.S + 10} ${CS.oy + CS.S + 30}`;
export const cX = (q1: number) => CS.ox + ((q1 + PI) / (2 * PI)) * CS.S;
export const cY = (q2: number) => CS.oy + ((PI - q2) / (2 * PI)) * CS.S;
export const cInv = (x: number, y: number): Q => [
  Math.max(-PI, Math.min(PI, ((x - CS.ox) / CS.S) * 2 * PI - PI)),
  Math.max(-PI, Math.min(PI, PI - ((y - CS.oy) / CS.S) * 2 * PI)),
];
// fond, C-obstacles (chemin de cobsPath, une case = une unité), graduations
export function cFrame(cobs: string) {
  const { S, ox, oy, N } = CS;
  let o = `<rect x="${ox}" y="${oy}" width="${S}" height="${S}" fill="var(--surface)" stroke="var(--border)"/>`;
  o += `<path d="${cobs}" transform="translate(${ox} ${oy}) scale(${S / N})" fill="var(--c-neutral)" fill-opacity="0.55"/>`;
  [[-PI, '−π'], [0, '0'], [PI, 'π']].forEach(([v, t]) => {
    o += `<text x="${cX(v as number)}" y="${oy + S + 13}" text-anchor="middle" class="ax">${t}</text>`;
    o += `<text x="${ox - 5}" y="${cY(v as number) + 4}" text-anchor="end" class="ax">${t}</text>`;
  });
  o += `<line x1="${cX(0)}" y1="${oy}" x2="${cX(0)}" y2="${oy + S}" stroke="var(--border)" stroke-dasharray="2 4"/>`;
  o += `<line x1="${ox}" y1="${cY(0)}" x2="${ox + S}" y2="${cY(0)}" stroke="var(--border)" stroke-dasharray="2 4"/>`;
  o += `<text x="${ox + S / 2}" y="${oy + S + 26}" text-anchor="middle" class="ax">q₁ (rad)</text>`;
  o += `<text x="10" y="${oy + S / 2}" transform="rotate(-90 10 ${oy + S / 2})" text-anchor="middle" class="ax">q₂ (rad)</text>`;
  return o;
}
// départ (gris) et but (ambre) dans le carré
export function cEnds(qd: Q, qb: Q, labels = true) {
  let o = `<circle cx="${cX(qd[0])}" cy="${cY(qd[1])}" r="4.5" fill="var(--surface)" stroke="var(--text)" stroke-width="1.6"/>`;
  o += `<circle cx="${cX(qb[0])}" cy="${cY(qb[1])}" r="4.5" fill="var(--hl-stroke)" stroke="var(--surface)" stroke-width="1.2"/>`;
  if (labels) {
    o += `<text x="${cX(qd[0]) - 8}" y="${cY(qd[1]) + 4}" text-anchor="end" class="lb">départ</text>`;
    o += `<text x="${cX(qb[0]) + 8}" y="${cY(qb[1]) + 4}" class="lb">but</text>`;
  }
  return o;
}

// ---- espace de travail : [−2, 2]², socle au centre
export const WS = { s: 58, c: 122 };
export const WVIEW = `0 0 ${2 * WS.c} ${2 * WS.c}`;
const wx = (x: number) => WS.c + x * WS.s, wy = (y: number) => WS.c - y * WS.s;
export function wsScene() {
  let o = `<circle cx="${wx(0)}" cy="${wy(0)}" r="${(L1 + L2) * WS.s}" fill="none" stroke="var(--border)" stroke-dasharray="3 4"/>`;
  DISQUES.forEach((d) => (o += `<circle cx="${wx(d.x)}" cy="${wy(d.y)}" r="${d.r * WS.s}" fill="var(--c-neutral)" fill-opacity="0.55"/>`));
  o += `<rect x="${wx(0) - 9}" y="${wy(0) + 4}" width="18" height="6" rx="1.5" fill="var(--text-2)"/>`;
  return o;
}
// bras : segments gris (rouges en collision), articulations en --rb-q
export function armSvg(q: Q) {
  const { ex, ey, px, py } = fk(q), hit = collides(q), body = hit ? 'var(--h-py)' : 'var(--text-2)';
  let o = `<polyline points="${wx(0)},${wy(0)} ${wx(ex)},${wy(ey)} ${wx(px)},${wy(py)}" fill="none" stroke="${body}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" stroke-opacity="${hit ? 0.85 : 0.6}"/>`;
  o += `<circle cx="${wx(0)}" cy="${wy(0)}" r="5" fill="var(--rb-q)" stroke="var(--surface)" stroke-width="1.5"/>`;
  o += `<circle cx="${wx(ex)}" cy="${wy(ey)}" r="5" fill="var(--rb-q)" stroke="var(--surface)" stroke-width="1.5"/>`;
  o += `<circle cx="${wx(px)}" cy="${wy(py)}" r="3" fill="${body}"/>`;
  return o;
}
// trajectoire de la main le long d'un chemin de C
export function handTrace(path: Q[], col: string) {
  const pts: string[] = [];
  for (let k = 1; k < path.length; k++) for (let s = 0; s < 6; s++) {
    const t = s / 6, a = path[k - 1], b = path[k], { px, py } = fk([a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]);
    pts.push(`${wx(px).toFixed(1)},${wy(py).toFixed(1)}`);
  }
  const { px, py } = fk(path[path.length - 1]);
  pts.push(`${wx(px).toFixed(1)},${wy(py).toFixed(1)}`);
  return `<polyline points="${pts.join(' ')}" fill="none" stroke="${col}" stroke-width="1.8" stroke-opacity="0.8" stroke-linejoin="round"/>`;
}
// position de la main pour une posture (cible ambre dans l'espace de travail)
export function handAt(q: Q) { const { px, py } = fk(q); return [wx(px), wy(py)]; }
