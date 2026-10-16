// La grille 4 × 4 du cours RL (déterministe, γ = 0,9) : règles, valeurs optimales, dessin des cases.
export const R = 4, C = 4, g = 0.9;
export const GOAL = [0, 3], PIT = [1, 3], WALL = [1, 1];
export const DIRS: [string, number, number, string][] = [['haut', -1, 0, '↑'], ['droite', 0, 1, '→'], ['bas', 1, 0, '↓'], ['gauche', 0, -1, '←']];
export const is = (p: number[], r: number, c: number) => p[0] === r && p[1] === c;
export const terminal = (r: number, c: number) => is(GOAL, r, c) || is(PIT, r, c);
export const step = (r: number, c: number, a: number): [number, number, number] => {
  let nr = r + DIRS[a][1], nc = c + DIRS[a][2];
  if (nr < 0 || nr >= R || nc < 0 || nc >= C || is(WALL, nr, nc)) { nr = r; nc = c; }
  return [nr, nc, is(GOAL, nr, nc) ? 1 : is(PIT, nr, nc) ? -1 : 0];
};
// valeurs optimales (50 itérations de valeur)
export const Vstar = (() => {
  let V = Array.from({ length: R }, () => new Array(C).fill(0));
  for (let k = 0; k < 50; k++) V = V.map((row, r) => row.map((_, c) => (terminal(r, c) || is(WALL, r, c) ? 0 : Math.max(...DIRS.map((_, a) => { const [nr, nc, rw] = step(r, c, a); return rw + g * (terminal(nr, nc) ? 0 : V[nr][nc]); })))));
  return V;
})();
export const qStar = (r: number, c: number) => DIRS.map((_, a) => { const [nr, nc, rw] = step(r, c, a); return rw + g * (terminal(nr, nc) ? 0 : Vstar[nr][nc]); });
// expert : première des meilleures actions dans l'ordre haut, droite, bas, gauche
export const expert = (r: number, c: number) => { const q = qStar(r, c), m = Math.max(...q); return q.findIndex((x) => x > m - 1e-9); };
export const rollout = (start: number[], pol: (r: number, c: number) => number, max = 10) => {
  const path = [start.slice()]; let [r, c] = start;
  for (let t = 0; t < max && !terminal(r, c); t++) { const [nr, nc] = step(r, c, pol(r, c)); r = nr; c = nc; path.push([r, c]); }
  return path;
};
const f1 = (v: number) => v.toFixed(1);
export const center = (x0: number, y0: number, cs: number, r: number, c: number): [number, number] => [x0 + c * cs + (cs - 2) / 2, y0 + r * cs + (cs - 2) / 2];
// fond de grille : cases, but, piège, mur ; fill(r, c) donne éventuellement une couleur d'accent pour une case libre
export const drawGrid = (x0: number, y0: number, cs: number, fill?: (r: number, c: number) => string | null) => {
  let s = '';
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
    const x = x0 + c * cs, y = y0 + r * cs;
    if (is(WALL, r, c)) s += `<rect x="${x}" y="${y}" width="${cs - 2}" height="${cs - 2}" rx="4" fill="var(--text-2)" fill-opacity="0.35"/>`;
    else if (is(GOAL, r, c)) s += `<rect x="${x}" y="${y}" width="${cs - 2}" height="${cs - 2}" rx="4" fill="var(--hl-stroke)" fill-opacity="0.35" stroke="var(--hl-stroke)"/><text x="${f1(x + cs / 2 - 1)}" y="${f1(y + cs / 2 + 4)}" text-anchor="middle" class="gv">+1</text>`;
    else if (is(PIT, r, c)) s += `<rect x="${x}" y="${y}" width="${cs - 2}" height="${cs - 2}" rx="4" fill="var(--h-py)" fill-opacity="0.35" stroke="var(--h-py)"/><text x="${f1(x + cs / 2 - 1)}" y="${f1(y + cs / 2 + 4)}" text-anchor="middle" class="gv">−1</text>`;
    else { const f = fill?.(r, c); s += `<rect x="${x}" y="${y}" width="${cs - 2}" height="${cs - 2}" rx="4" fill="${f ?? 'var(--text-2)'}" fill-opacity="${f ? 0.28 : 0.07}" stroke="var(--border)" stroke-width="0.8"/>`; }
  }
  return s;
};
