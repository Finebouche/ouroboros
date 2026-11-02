// Cours Robotique : petits tracés SVG communs aux widgets (en coordonnées d'écran, y vers le bas).
// Les couleurs sont des variables CSS (var(--…)), passées par l'appelant.
type Style = { c: string; w?: number; dash?: string; head?: number; op?: number };
const f1 = (v: number) => v.toFixed(1);

// flèche droite (trait + pointe pleine) de (x1, y1) à (x2, y2)
export function arrow(x1: number, y1: number, x2: number, y2: number, o: Style) {
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy);
  if (L < 0.5) return '';
  const hd = Math.min(o.head ?? 8, L * 0.6), ux = dx / L, uy = dy / L, bx = x2 - ux * hd, by = y2 - uy * hd;
  const px = -uy * hd * 0.42, py = ux * hd * 0.42, op = o.op ?? 1;
  return `<line x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(bx)}" y2="${f1(by)}" stroke="${o.c}" stroke-width="${o.w ?? 2}" stroke-linecap="round"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''} opacity="${op}"/>` +
    `<polygon points="${f1(x2)},${f1(y2)} ${f1(bx + px)},${f1(by + py)} ${f1(bx - px)},${f1(by - py)}" fill="${o.c}" opacity="${op}"/>`;
}

// arc de cercle centré en (cx, cy), de l'angle a0 à a1 (radians, sens trigonométrique du monde : y vers le haut),
// avec une pointe au bout si head > 0
export function arc(cx: number, cy: number, r: number, a0: number, a1: number, o: Style) {
  const P = (a: number) => [cx + r * Math.cos(a), cy - r * Math.sin(a)];
  const d = a1 - a0;
  if (Math.abs(d) < 1e-3) return '';
  const hd = o.head ?? 0, op = o.op ?? 1;
  // la pointe occupe la fin de l'arc : le trait s'arrête avant
  const cut = hd > 0 ? Math.min(Math.abs(d) * 0.6, (hd * 0.8) / r) * Math.sign(d) : 0;
  const [x0, y0] = P(a0), [x1, y1] = P(a1 - cut);
  const large = Math.abs(d - cut) > Math.PI ? 1 : 0, sweep = d > 0 ? 0 : 1;
  let s = `<path d="M${f1(x0)},${f1(y0)} A${f1(r)},${f1(r)} 0 ${large} ${sweep} ${f1(x1)},${f1(y1)}" fill="none" stroke="${o.c}" stroke-width="${o.w ?? 2}" stroke-linecap="round"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''} opacity="${op}"/>`;
  if (hd > 0) {
    const [ex, ey] = P(a1), sg = Math.sign(d);
    // tangente au bout, dans le sens du parcours (coordonnées d'écran)
    const tx = -Math.sin(a1) * sg, ty = -Math.cos(a1) * sg, bx = ex - tx * hd, by = ey - ty * hd, px = -ty * hd * 0.42, py = tx * hd * 0.42;
    s += `<polygon points="${f1(ex)},${f1(ey)} ${f1(bx + px)},${f1(by + py)} ${f1(bx - px)},${f1(by - py)}" fill="${o.c}" opacity="${op}"/>`;
  }
  return s;
}

// segment du robot (tige grise épaisse) et articulation (point bleu cerclé)
export const link = (x1: number, y1: number, x2: number, y2: number, w = 9, op = 1) =>
  `<line x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2)}" y2="${f1(y2)}" stroke="var(--c-neutral)" stroke-width="${w}" stroke-linecap="round" opacity="${op}"/>`;
export const joint = (x: number, y: number, r = 5.5) =>
  `<circle cx="${f1(x)}" cy="${f1(y)}" r="${r}" fill="var(--surface)" stroke="var(--rb-q)" stroke-width="2.4"/><circle cx="${f1(x)}" cy="${f1(y)}" r="${(r * 0.38).toFixed(1)}" fill="var(--rb-q)"/>`;
// socle fixe : un trait et des hachures sous l'épaule
export const ground = (x: number, y: number) => {
  let s = `<line x1="${f1(x - 16)}" y1="${f1(y + 9)}" x2="${f1(x + 16)}" y2="${f1(y + 9)}" stroke="var(--text-2)" stroke-width="1.4"/>`;
  for (let i = -2; i <= 2; i++) s += `<line x1="${f1(x + i * 6.5)}" y1="${f1(y + 9)}" x2="${f1(x + i * 6.5 - 5)}" y2="${f1(y + 15)}" stroke="var(--text-2)" stroke-width="1"/>`;
  return s + `<path d="M${f1(x - 7)},${f1(y + 9)} L${f1(x)},${f1(y)} L${f1(x + 7)},${f1(y + 9)}" fill="none" stroke="var(--text-2)" stroke-width="1.4"/>`;
};
