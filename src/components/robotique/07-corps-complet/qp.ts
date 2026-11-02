// Cours Robotique : QP des forces de contact, réduit à la dynamique centroïdale dans le plan (x vers l'avant, z vers le haut).
// Corps de masse m, CoM en (cx, h) ; deux contacts ponctuels au sol en x1 (arrière) et x2 (avant) ; forces f_i = (t_i, n_i).
//   min  w_c ‖Σf + m g − m c̈*‖² + w_L L̇² + ε ‖f‖²    s.c.  n_i ≥ 0,  |t_i| ≤ μ n_i,   avec c̈* = (a*, 0)
//   L̇ = Σ_i h t_i + (x_i − cx) n_i : moment des forces de contact autour du CoM, compté positif quand le corps bascule vers l'arrière.
// Résolution exacte par énumération des 2⁶ ensembles actifs (4 variables, 6 inégalités) : système KKT, puis faisabilité
// primale et multiplicateurs ≥ 0. Le QP est strictement convexe (ε > 0) : le premier point KKT trouvé est l'optimum.
export const G = 9.81;
export type Scene = { m: number; h: number; cx: number; x1: number; x2: number; mu: number; ax: number; wc: number; wL: number; eps: number };
export type QpSol = { t1: number; n1: number; t2: number; n2: number; ax: number; az: number; Ldot: number; cop: number; active: number[] };

function solveLin(A: number[][], b: number[]): number[] | null {
  const n = b.length, M = A.map((r, i) => [...r, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    if (Math.abs(M[p][c]) < 1e-12) return null;
    [M[c], M[p]] = [M[p], M[c]];
    for (let r = 0; r < n; r++) if (r !== c) { const f = M[r][c] / M[c][c]; for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k]; }
  }
  return M.map((r, i) => r[n] / r[i]);
}

export function solveQP(s: Scene): QpSol {
  // résidus linéaires a·y − b, y = (t1, n1, t2, n2)
  const rows = [
    { a: [1, 0, 1, 0], b: s.m * s.ax, w: s.wc },                    // Σt = m a*
    { a: [0, 1, 0, 1], b: s.m * G, w: s.wc },                       // Σn = m g (a_z* = 0)
    { a: [s.h, s.x1 - s.cx, s.h, s.x2 - s.cx], b: 0, w: s.wL },     // L̇ = 0
  ];
  const I4 = [0, 1, 2, 3];
  const H = I4.map((i) => I4.map((j) => rows.reduce((acc, r) => acc + r.w * r.a[i] * r.a[j], 0) + (i === j ? s.eps : 0)));
  const q = I4.map((i) => rows.reduce((acc, r) => acc + r.w * r.a[i] * r.b, 0));
  // inégalités G y ≤ 0 : n1 ≥ 0, n2 ≥ 0, ±t1 ≤ μ n1, ±t2 ≤ μ n2
  const Gm = [[0, -1, 0, 0], [0, 0, 0, -1], [1, -s.mu, 0, 0], [-1, -s.mu, 0, 0], [0, 0, 1, -s.mu], [0, 0, -1, -s.mu]];
  for (let mask = 0; mask < 64; mask++) {
    const act = [0, 1, 2, 3, 4, 5].filter((i) => mask & (1 << i)), n = 4 + act.length;
    const K = Array.from({ length: n }, () => new Array(n).fill(0)), rhs = new Array(n).fill(0);
    for (let i = 0; i < 4; i++) { for (let j = 0; j < 4; j++) K[i][j] = H[i][j]; rhs[i] = q[i]; }
    act.forEach((c, k) => { for (let j = 0; j < 4; j++) { K[4 + k][j] = Gm[c][j]; K[j][4 + k] = Gm[c][j]; } });
    const sol = solveLin(K, rhs);
    if (!sol) continue;
    const y = sol.slice(0, 4), lam = sol.slice(4);
    if (lam.some((l) => l < -1e-9)) continue;                                   // H y + Gᵀλ = q, λ ≥ 0
    if (Gm.some((g) => g.reduce((a, v, j) => a + v * y[j], 0) > 1e-9)) continue; // G y ≤ 0
    const [t1, n1, t2, n2] = y, N = n1 + n2;
    return {
      t1, n1, t2, n2, ax: (t1 + t2) / s.m, az: N / s.m - G,
      Ldot: s.h * (t1 + t2) + (s.x1 - s.cx) * n1 + (s.x2 - s.cx) * n2,
      cop: N > 1e-9 ? (s.x1 * n1 + s.x2 * n2) / N : NaN, active: act,
    };
  }
  throw new Error('QP sans solution');
}
