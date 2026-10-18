// Moindres carrés min ||Ax − b||₂ : quatre solveurs écrits à la main, dans une précision de travail choisie (float64 ou float32 émulé
// par Math.fround après chaque opération). Matrices m × n, m ≥ n, en tableaux de lignes. Sert aux widgets du chapitre « Moindres carrés ».
export type Prec = 'f64' | 'f32';
export type Mat = number[][];
export type Rnd = (x: number) => number;
export const rounder = (p: Prec): Rnd => (p === 'f32' ? Math.fround : (x) => x);
export const unitRoundoff = (p: Prec) => (p === 'f32' ? 2 ** -24 : 2 ** -53);

// générateur pseudo-aléatoire reproductible, loi normale par Box–Muller
export function gauss(seed: number) {
  let s = seed | 0;
  const u = () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  return () => Math.sqrt(-2 * Math.log(1 - u())) * Math.cos(2 * Math.PI * u());
}

const dot = (a: number[], b: number[]) => a.reduce((s, v, i) => s + v * b[i], 0);
const norm = (a: number[]) => Math.sqrt(dot(a, a));

// colonnes orthonormées (Gram–Schmidt modifié, deux fois, en double précision)
function orthoCols(m: number, n: number, g: () => number): Mat {
  const cols: number[][] = [];
  for (let j = 0; j < n; j++) {
    let v = Array.from({ length: m }, g);
    for (let pass = 0; pass < 2; pass++) for (const q of cols) { const d = dot(q, v); v = v.map((x, i) => x - d * q[i]); }
    const nv = norm(v);
    cols.push(v.map((x) => x / nv));
  }
  return cols;
}

// A = U diag(σ) Vᵀ avec σ_i géométriques de 1 à 1/κ ; x_vrai = V·1, donc b = A x_vrai = Σ σ_i u_i.
// Le bruit est pris orthogonal à l'image de A : la solution des moindres carrés reste x_vrai, seul le résidu change (||r|| = nu ||b||).
export function makeProblem(m: number, n: number, kappa: number, nu: number, seed = 5) {
  const g = gauss(seed);
  const U = orthoCols(m, n, g), V = orthoCols(n, n, g);
  const sig = Array.from({ length: n }, (_, i) => kappa ** (-i / (n - 1)));
  const A: Mat = Array.from({ length: m }, (_, i) => Array.from({ length: n }, (_, j) => { let s = 0; for (let k = 0; k < n; k++) s += U[k][i] * sig[k] * V[k][j]; return s; }));
  const xt = Array.from({ length: n }, (_, j) => V.reduce((s, col) => s + col[j], 0));
  const b = Array.from({ length: m }, (_, i) => U.reduce((s, col, k) => s + col[i] * sig[k], 0));
  if (nu > 0) {
    let z = Array.from({ length: m }, g);
    for (const q of U) { const d = dot(q, z); z = z.map((x, i) => x - d * q[i]); }
    const f = (nu * norm(b)) / norm(z);
    for (let i = 0; i < m; i++) b[i] += f * z[i];
  }
  return { A, b, xt, sig, U, V };
}

export const rel = (x: number[] | null, xt: number[]) => (x && x.every(Number.isFinite) ? Math.sqrt(x.reduce((s, v, i) => s + (v - xt[i]) ** 2, 0)) / norm(xt) : NaN);

export function quantize(A: Mat, b: number[], r: Rnd): [Mat, number[]] { return [A.map((row) => row.map(r)), b.map(r)]; }

// --- Cholesky sur les équations normales AᵀA x = Aᵀb ---
export function cholSolve(A: Mat, b: number[], r: Rnd): number[] | null {
  const m = A.length, n = A[0].length;
  const G = Array.from({ length: n }, () => new Array(n).fill(0)), c = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) { let s = 0; for (let k = 0; k < m; k++) s = r(s + r(A[k][i] * A[k][j])); G[i][j] = G[j][i] = s; }
    let s = 0; for (let k = 0; k < m; k++) s = r(s + r(A[k][i] * b[k])); c[i] = s;
  }
  const L = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let j = 0; j < n; j++) {
    let d = G[j][j];
    for (let k = 0; k < j; k++) d = r(d - r(L[j][k] * L[j][k]));
    if (!(d > 0)) return null; // AᵀA n'est plus numériquement définie positive
    L[j][j] = r(Math.sqrt(d));
    for (let i = j + 1; i < n; i++) { let s = G[i][j]; for (let k = 0; k < j; k++) s = r(s - r(L[i][k] * L[j][k])); L[i][j] = r(s / L[j][j]); }
  }
  const y = new Array(n).fill(0), x = new Array(n).fill(0);
  for (let i = 0; i < n; i++) { let s = c[i]; for (let k = 0; k < i; k++) s = r(s - r(L[i][k] * y[k])); y[i] = r(s / L[i][i]); }
  for (let i = n - 1; i >= 0; i--) { let s = y[i]; for (let k = i + 1; k < n; k++) s = r(s - r(L[k][i] * x[k])); x[i] = r(s / L[i][i]); }
  return x;
}

// --- QR de Householder ---
export function qrSolve(A0: Mat, b0: number[], r: Rnd): number[] | null {
  const m = A0.length, n = A0[0].length;
  const A = A0.map((row) => row.slice()), b = b0.slice();
  for (let k = 0; k < n; k++) {
    let nx = 0; for (let i = k; i < m; i++) nx = r(nx + r(A[i][k] * A[i][k]));
    nx = r(Math.sqrt(nx));
    if (nx === 0) return null;
    const alpha = A[k][k] > 0 ? -nx : nx;
    const v = new Array(m).fill(0);
    for (let i = k; i < m; i++) v[i] = A[i][k];
    v[k] = r(v[k] - alpha);
    let vv = 0; for (let i = k; i < m; i++) vv = r(vv + r(v[i] * v[i]));
    if (vv === 0) continue;
    const apply = (col: (i: number) => number, set: (i: number, x: number) => void) => {
      let d = 0; for (let i = k; i < m; i++) d = r(d + r(v[i] * col(i)));
      const f = r((2 * d) / vv);
      for (let i = k; i < m; i++) set(i, r(col(i) - r(f * v[i])));
    };
    for (let j = k; j < n; j++) apply((i) => A[i][j], (i, x) => (A[i][j] = x));
    apply((i) => b[i], (i, x) => (b[i] = x));
  }
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) { let s = b[i]; for (let k = i + 1; k < n; k++) s = r(s - r(A[i][k] * x[k])); if (A[i][i] === 0) return null; x[i] = r(s / A[i][i]); }
  return x;
}

// --- SVD (Jacobi unilatérale) : x = V Σ⁺ Uᵀ b, valeurs singulières sous rcond·σ_max mises à zéro (comme numpy.linalg.lstsq) ---
export function svdSolve(A0: Mat, b: number[], r: Rnd, u: number): number[] | null {
  const m = A0.length, n = A0[0].length;
  const W = Array.from({ length: n }, (_, j) => A0.map((row) => row[j])); // colonnes
  const V = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))); // V[j] = colonne j
  const tol = u * 4;
  for (let sweep = 0; sweep < 40; sweep++) {
    let rotated = false;
    for (let p = 0; p < n - 1; p++) for (let q = p + 1; q < n; q++) {
      let al = 0, be = 0, ga = 0;
      for (let i = 0; i < m; i++) { al = r(al + r(W[p][i] * W[p][i])); be = r(be + r(W[q][i] * W[q][i])); ga = r(ga + r(W[p][i] * W[q][i])); }
      if (ga === 0 || Math.abs(ga) <= tol * Math.sqrt(al * be)) continue;
      rotated = true;
      const zeta = (be - al) / (2 * ga);
      const t = Math.sign(zeta || 1) / (Math.abs(zeta) + Math.sqrt(1 + zeta * zeta));
      const c = r(1 / Math.sqrt(1 + t * t)), s = r(c * t);
      for (const M of [W, V]) for (let i = 0; i < (M === W ? m : n); i++) { const x = M[p][i], y = M[q][i]; M[p][i] = r(r(c * x) - r(s * y)); M[q][i] = r(r(s * x) + r(c * y)); }
    }
    if (!rotated) break;
  }
  const sv = W.map((col) => r(Math.sqrt(col.reduce((s, v) => r(s + r(v * v)), 0))));
  const smax = Math.max(...sv), rcond = u * Math.max(m, n);
  const x = new Array(n).fill(0);
  for (let j = 0; j < n; j++) {
    if (sv[j] <= rcond * smax) continue; // valeur singulière tronquée
    const coef = r(W[j].reduce((s, v, i) => r(s + r(v * b[i])), 0) / r(sv[j] * sv[j]));
    for (let i = 0; i < n; i++) x[i] = r(x[i] + r(coef * V[j][i]));
  }
  return x;
}

// --- LSQR (Paige et Saunders) : n'utilise que des produits A·v et Aᵀ·u. Renvoie les itérés x_1 … x_K. ---
export function lsqrPath(A: Mat, b: number[], K: number, r: Rnd): number[][] {
  const m = A.length, n = A[0].length;
  const Av = (v: number[]) => A.map((row) => row.reduce((s, a, j) => r(s + r(a * v[j])), 0));
  const Atu = (u: number[]) => Array.from({ length: n }, (_, j) => { let s = 0; for (let i = 0; i < m; i++) s = r(s + r(A[i][j] * u[i])); return s; });
  const nrm = (v: number[]) => r(Math.sqrt(v.reduce((s, x) => r(s + r(x * x)), 0)));
  let beta = nrm(b);
  if (beta === 0) return [new Array(n).fill(0)];
  let u = b.map((x) => r(x / beta));
  let v = Atu(u); let alpha = nrm(v);
  if (alpha === 0) return [new Array(n).fill(0)];
  v = v.map((x) => r(x / alpha));
  let w = v.slice(), x = new Array(n).fill(0), phibar = beta, rhobar = alpha;
  const path: number[][] = [];
  for (let it = 0; it < K; it++) {
    const Avv = Av(v);
    u = Avv.map((a, i) => r(a - r(alpha * u[i])));
    beta = nrm(u);
    if (beta > 0) u = u.map((z) => r(z / beta));
    const Atuu = Atu(u);
    v = Atuu.map((a, j) => r(a - r(beta * v[j])));
    alpha = nrm(v);
    if (alpha > 0) v = v.map((z) => r(z / alpha));
    // rotation de Givens
    const rho = r(Math.sqrt(rhobar * rhobar + beta * beta));
    const c = r(rhobar / rho), s = r(beta / rho), theta = r(s * alpha);
    rhobar = r(-c * alpha);
    const phi = r(c * phibar); phibar = r(s * phibar);
    x = x.map((xi, i) => r(xi + r(r(phi / rho) * w[i])));
    w = v.map((vi, i) => r(vi - r(r(theta / rho) * w[i])));
    path.push(x);
    if (alpha === 0 || beta === 0) break;
  }
  return path;
}

// 10 puissance e, avec exposant en caractères supérieurs (entier) ; sinon forme « 10^e »
export const pow10 = (e: number | string) => {
  const t = String(e);
  if (!/^-?\d+$/.test(t)) return `10^${t}`;
  const sup: Record<string, string> = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
  return `10${t.split('').map((c) => sup[c]).join('')}`;
};

// v sous la forme « 1,6 × 10⁷ »
export const sciFr = (v: number) => {
  const e = Math.floor(Math.log10(v)), m = v / 10 ** e;
  return `${m.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} × ${pow10(e)}`;
};
