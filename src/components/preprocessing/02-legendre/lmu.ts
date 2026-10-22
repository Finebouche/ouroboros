// Chapitre 2 (mémoire de Legendre) : le système de la Legendre Memory Unit (Voelker, Kajić & Eliasmith, 2019), comme dans keras-lmu.
// θ ṁ = A m + B u, avec A_ij = (2i+1)·(−1 si i < j, sinon (−1)^(i−j+1)) et B_i = (2i+1)·(−1)^i ;
// A et B divisés par θ, puis discrétisés sur un pas avec l'entrée tenue constante (bloqueur d'ordre zéro) : m ← A_d m + B_d u.

type Mat = number[][];
const mm = (X: Mat, Y: Mat): Mat => X.map((r) => Y[0].map((_, j) => r.reduce((s, v, k) => s + v * Y[k][j], 0)));
const eye = (n: number): Mat => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => +(i === j)));

// exponentielle de matrice : mise à l'échelle, série de Taylor, puis élévations au carré
function expm(M: Mat): Mat {
  const n = M.length;
  const nrm = Math.max(...M.map((r) => r.reduce((s, v) => s + Math.abs(v), 0)));
  const sq = Math.max(0, Math.ceil(Math.log2(nrm || 1)) + 1);
  const A = M.map((r) => r.map((v) => v / 2 ** sq));
  let E = eye(n), T = eye(n);
  for (let k = 1; k < 30; k++) {
    T = mm(T, A).map((r) => r.map((v) => v / k));
    E = E.map((r, i) => r.map((v, j) => v + T[i][j]));
  }
  for (let i = 0; i < sq; i++) E = mm(E, E);
  return E;
}

export function lmuMatrices(n: number, theta: number) {
  const A: Mat = [], B: number[] = [];
  for (let i = 0; i < n; i++) {
    A.push([]);
    for (let j = 0; j < n; j++) A[i].push(((2 * i + 1) * (i < j ? -1 : (-1) ** (i - j + 1))) / theta);
    B.push(((2 * i + 1) * (-1) ** i) / theta);
  }
  // bloqueur d'ordre zéro : exponentielle de la matrice augmentée [[A, B], [0, 0]]
  const M: Mat = Array.from({ length: n + 1 }, (_, i) => Array.from({ length: n + 1 }, (_, j) => (i < n ? (j < n ? A[i][j] : B[i]) : 0)));
  const E = expm(M);
  return { Ad: E.slice(0, n).map((r) => r.slice(0, n)), Bd: E.slice(0, n).map((r) => r[n]) };
}

// polynôme de Legendre décalé sur [0, 1] : P̃_i(r) = (−1)^i Σ_j C(i, j) C(i+j, j) (−r)^j ; r = τ/θ (0 = maintenant, 1 = il y a θ pas)
const binom = (a: number, b: number) => { let r = 1; for (let k = 1; k <= b; k++) r = (r * (a - b + k)) / k; return r; };
export const legendre = (i: number, r: number) => {
  let s = 0;
  for (let j = 0; j <= i; j++) s += binom(i, j) * binom(i + j, j) * (-r) ** j;
  return (-1) ** i * s;
};

// coefficients m(t) pour toute la suite u ; départ à l'état stationnaire de u[0] : m = (u[0], 0, …, 0)
export function runLmu(u: number[], n: number, theta: number): number[][] {
  const { Ad, Bd } = lmuMatrices(n, theta);
  let m = Array.from({ length: n }, (_, i) => (i === 0 ? u[0] : 0));
  const out: number[][] = [];
  for (const x of u) {
    m = Ad.map((r, i) => r.reduce((s, v, j) => s + v * m[j], 0) + Bd[i] * x);
    out.push(m);
  }
  return out;
}

// u(t − τ) ≈ Σ_i m_i(t) P̃_i(τ/θ)
export const reconstruct = (m: number[], r: number) => m.reduce((s, v, i) => s + v * legendre(i, r), 0);

// moyenne glissante exponentielle de constante de temps T (en pas)
export function runEma(u: number[], T: number, e0 = u[0]): number[] {
  let e = e0;
  return u.map((x) => (e += (x - e) / T));
}
