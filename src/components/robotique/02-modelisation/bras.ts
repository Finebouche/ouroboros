// Cours Robotique : le bras d'exemple commun aux widgets du chapitre.
// Bras plan vertical, deux articulations rotoïdes d'axe z, gravité −9,81 sur y ; deux tiges uniformes de 1 kg,
// l1 = 0,5 m et l2 = 0,4 m (centre de masse au milieu, I = m l² / 12). Mêmes valeurs que Pinocchio 4.1 (rnea, crba,
// computeFrameJacobian) et MuJoCo 3.17 (qfrc_bias, mj_fullM, mj_jacSite, énergie) à q = (45°, 90°).
export const P = { l1: 0.5, l2: 0.4, m1: 1, m2: 1, g: 9.81 };
const lc1 = P.l1 / 2, lc2 = P.l2 / 2;
const I1 = (P.m1 * P.l1 ** 2) / 12, I2 = (P.m2 * P.l2 ** 2) / 12;
export type V2 = [number, number];

// cinématique directe : coude p1, pince p2, centres de masse c1, c2
export function fk(q: number[]) {
  const [a, b] = q;
  const p1: V2 = [P.l1 * Math.cos(a), P.l1 * Math.sin(a)];
  const p2: V2 = [p1[0] + P.l2 * Math.cos(a + b), p1[1] + P.l2 * Math.sin(a + b)];
  const c1: V2 = [lc1 * Math.cos(a), lc1 * Math.sin(a)];
  const c2: V2 = [p1[0] + lc2 * Math.cos(a + b), p1[1] + lc2 * Math.sin(a + b)];
  return { p1, p2, c1, c2 };
}
// jacobienne de la position de la pince (2 × 2) : colonne i = vitesse de la pince pour q̇_i = 1 rad/s
export function jac(q: number[]): number[][] {
  const [a, b] = q, s1 = Math.sin(a), c1 = Math.cos(a), s12 = Math.sin(a + b), c12 = Math.cos(a + b);
  return [[-P.l1 * s1 - P.l2 * s12, -P.l2 * s12], [P.l1 * c1 + P.l2 * c12, P.l2 * c12]];
}
// valeurs singulières d'une matrice 2 × 2 (racines des valeurs propres de J Jᵀ), et axes de l'ellipse des vitesses
export function svd2(J: number[][]) {
  const a = J[0][0] ** 2 + J[0][1] ** 2, b = J[0][0] * J[1][0] + J[0][1] * J[1][1], c = J[1][0] ** 2 + J[1][1] ** 2;
  const tr = a + c, det = a * c - b * b, disc = Math.sqrt(Math.max(0, (tr * tr) / 4 - det));
  const l1 = tr / 2 + disc, l2 = Math.max(0, tr / 2 - disc);
  // direction du grand axe : vecteur propre de J Jᵀ pour l1
  const ang = Math.abs(b) > 1e-12 ? Math.atan2(l1 - a, b) : a >= c ? 0 : Math.PI / 2;
  return { smax: Math.sqrt(l1), smin: Math.sqrt(l2), ang };
}
export function mass(q: number[]): number[][] {
  const c2 = Math.cos(q[1]);
  const m11 = I1 + I2 + P.m1 * lc1 ** 2 + P.m2 * (P.l1 ** 2 + lc2 ** 2 + 2 * P.l1 * lc2 * c2);
  const m12 = I2 + P.m2 * (lc2 ** 2 + P.l1 * lc2 * c2);
  const m22 = I2 + P.m2 * lc2 ** 2;
  return [[m11, m12], [m12, m22]];
}
// terme de gravité g(q) = couple qui tient le bras immobile (= RNEA(q, 0, 0))
export function grav(q: number[]): V2 {
  const c1 = Math.cos(q[0]), c12 = Math.cos(q[0] + q[1]);
  const g2 = P.m2 * P.g * lc2 * c12;
  return [(P.m1 * lc1 + P.m2 * P.l1) * P.g * c1 + g2, g2];
}
// effets non linéaires b(q, q̇) : Coriolis, centrifuges, gravité
export function bias(q: number[], v: number[]): V2 {
  const h = -P.m2 * P.l1 * lc2 * Math.sin(q[1]), g = grav(q);
  return [h * (2 * v[0] * v[1] + v[1] ** 2) + g[0], -h * v[0] ** 2 + g[1]];
}
// dynamique directe : q̈ = M⁻¹ (τ − b)
export function acc(q: number[], v: number[], tau = [0, 0]): V2 {
  const M = mass(q), b = bias(q, v), r = [tau[0] - b[0], tau[1] - b[1]];
  const det = M[0][0] * M[1][1] - M[0][1] * M[1][0];
  return [(M[1][1] * r[0] - M[0][1] * r[1]) / det, (-M[1][0] * r[0] + M[0][0] * r[1]) / det];
}
// énergie mécanique (cinétique + potentielle, zéro du potentiel à y = 0)
export function energy(q: number[], v: number[]) {
  const M = mass(q);
  const T = 0.5 * (v[0] * (M[0][0] * v[0] + M[0][1] * v[1]) + v[1] * (M[1][0] * v[0] + M[1][1] * v[1]));
  const y1 = lc1 * Math.sin(q[0]), y2 = P.l1 * Math.sin(q[0]) + lc2 * Math.sin(q[0] + q[1]);
  return T + P.g * (P.m1 * y1 + P.m2 * y2);
}
export type Integ = 'euler' | 'semi' | 'rk4';
// un pas de h secondes, τ = 0
export function step(q: number[], v: number[], h: number, kind: Integ): [number[], number[]] {
  if (kind === 'euler') { const a = acc(q, v); return [[q[0] + h * v[0], q[1] + h * v[1]], [v[0] + h * a[0], v[1] + h * a[1]]]; }
  if (kind === 'semi') { const a = acc(q, v), vn = [v[0] + h * a[0], v[1] + h * a[1]]; return [[q[0] + h * vn[0], q[1] + h * vn[1]], vn]; }
  const add = (x: number[], y: number[], s: number) => [x[0] + s * y[0], x[1] + s * y[1]];
  const k1q = v, k1v = acc(q, v);
  const k2q = add(v, k1v, h / 2), k2v = acc(add(q, k1q, h / 2), k2q);
  const k3q = add(v, k2v, h / 2), k3v = acc(add(q, k2q, h / 2), k3q);
  const k4q = add(v, k3v, h), k4v = acc(add(q, k3q, h), k4q);
  const comb = (x: number[], a: number[], b: number[], c: number[], d: number[]) => [0, 1].map((i) => x[i] + (h / 6) * (a[i] + 2 * b[i] + 2 * c[i] + d[i]));
  return [comb(q, k1q, k2q, k3q, k4q), comb(v, k1v, k2v, k3v, k4v)];
}
// nombre au format français : virgule décimale, vrai signe moins
export const fr = (v: number, d = 2) => {
  const s = (Math.abs(v) < 0.5 * 10 ** -d ? 0 : v).toFixed(d);
  return s.replace('.', ',').replace('-', '−');
};
