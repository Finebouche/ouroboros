// Chapitre 4 (Preprocessing) : petits dessins SVG partagés par les figures d'intuition (RtfFigure, MasqueCovWidget, SceneFigure).
// Convention des phaseurs et des cartes de covariance : celle du chapitre 3 (CovBruitFigure) : flèche = module (longueur) et phase (direction,
// sens trigonométrique, 0° vers la droite).
import type { Vec, Mat } from './sim';

export const n1 = (v: number) => v.toFixed(1);
export const fr = (v: number, d = 1) => v.toFixed(d).replace('.', ',').replace('-', '−');

// flèche : trait + pointe pleine
export function fleche(x1: number, y1: number, x2: number, y2: number, col: string, w: number, head = 5, extra = ''): string {
  const dx = x2 - x1, dy = y2 - y1, l = Math.hypot(dx, dy);
  if (l < 0.5) return '';
  const ux = dx / l, uy = dy / l, h = Math.min(head, l * 0.6), bx = x2 - ux * h, by = y2 - uy * h, k = h * 0.45;
  return `<line x1="${n1(x1)}" y1="${n1(y1)}" x2="${n1(bx)}" y2="${n1(by)}" stroke="${col}" stroke-width="${w}" stroke-linecap="round"${extra}/>` +
    `<polygon points="${n1(x2)},${n1(y2)} ${n1(bx - uy * k)},${n1(by + ux * k)} ${n1(bx + uy * k)},${n1(by - ux * k)}" fill="${col}"/>`;
}

// Un phaseur : cercle de rayon R (module 1) et flèche du centre vers re + i·im (module borné à `borne`).
// tirets : flèche en pointillé (vérité terrain).
export function phaseur(cx: number, cy: number, R: number, re: number, im: number, col: string, opts: { cercle?: boolean; tirets?: boolean; w?: number; borne?: number } = {}): string {
  const { cercle = true, tirets = false, w = 1.6, borne = 1.9 } = opts;
  let s = cercle ? `<circle cx="${n1(cx)}" cy="${n1(cy)}" r="${R}" fill="none" stroke="var(--border)" stroke-width="1"/>` : '';
  const m = Math.hypot(re, im), mm = Math.min(m, borne), ux = m > 0 ? re / m : 0, uy = m > 0 ? -im / m : 0;
  if (tirets) {
    const x2 = cx + ux * mm * R, y2 = cy + uy * mm * R;
    s += `<line x1="${n1(cx)}" y1="${n1(cy)}" x2="${n1(x2)}" y2="${n1(y2)}" stroke="${col}" stroke-width="${w}" stroke-dasharray="2.5 2" stroke-linecap="round"/>`;
    s += `<circle cx="${n1(x2)}" cy="${n1(y2)}" r="1.8" fill="none" stroke="${col}" stroke-width="1"/>`;
  } else s += fleche(cx, cy, cx + ux * mm * R, cy + uy * mm * R, col, w, 4.5);
  return s;
}

// Carte d'une matrice hermitienne C×C (convention du chapitre 3) : flèche de la case (i, i′) = module rapporté au plus grand de la carte, et phase ;
// fond d'autant plus foncé que la partie réelle est grande.
export function carteCov(R: Mat, C: number, x0: number, y0: number, U: number, col: string): string {
  let mx = 0;
  for (let k = 0; k < C * C; k++) mx = Math.max(mx, Math.hypot(R[2 * k], R[2 * k + 1]));
  let s = '';
  for (let i = 0; i < C; i++) for (let j = 0; j < C; j++) {
    const re = R[2 * (i * C + j)], im = R[2 * (i * C + j) + 1], m = Math.hypot(re, im) / mx;
    const x = x0 + j * U, y = y0 + i * U, cx = x + U / 2, cy = y + U / 2;
    s += `<rect x="${n1(x + 1)}" y="${n1(y + 1)}" width="${U - 2}" height="${U - 2}" rx="2.5" fill="var(--text-2)" fill-opacity="${(0.06 + 0.3 * Math.max(0, re / mx)).toFixed(2)}"/>`;
    if (m < 0.02) continue;
    const l = m * (U / 2 - 2), ux = re / (m * mx), uy = -im / (m * mx);
    s += fleche(cx - ux * l, cy - uy * l, cx + ux * l, cy + uy * l, col, 1.3, 3.6);
  }
  return s;
}

export const composante = (v: Vec, i: number): [number, number] => [v[2 * i], v[2 * i + 1]];
