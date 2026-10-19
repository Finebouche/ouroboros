// Cours Reservoir computing : un réservoir (echo state network) minimal, partagé par les widgets.
// x(n) = tanh(ρ' W x(n−1) + σ W_in u(n) + b), W gaussien dense remis à l'échelle pour avoir le rayon spectral ρ voulu.
// Lecture : régression ridge sur [x(n) ; 1], résolue par élimination de Gauss (système (N+1) × (N+1)).

export const rng = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let r = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
  return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
};
export const gauss = (r: () => number) => {
  let u = 0;
  while (u === 0) u = r();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r());
};

export type Reservoir = { N: number; W: Float64Array[]; Win: Float64Array; b: Float64Array; rho0: number };

// tirage d'un réservoir ; rho0 : rayon spectral de W tiré, estimé par itération de puissance (croissance moyenne de la norme)
export function makeReservoir(N: number, seed: number): Reservoir {
  const r = rng(seed);
  const W = Array.from({ length: N }, () => Float64Array.from({ length: N }, () => gauss(r)));
  const Win = Float64Array.from({ length: N }, () => r() * 2 - 1);
  const b = Float64Array.from({ length: N }, () => (r() * 2 - 1) * 0.2);
  let v = Array.from({ length: N }, () => gauss(r)), lg = 0;
  const K = 300;
  for (let k = 0; k < K; k++) {
    const w = W.map((row) => row.reduce((s, x, j) => s + x * v[j], 0));
    const n = Math.hypot(...w);
    if (k >= 100) lg += Math.log(n);
    v = w.map((x) => x / n);
  }
  return { N, W, Win, b, rho0: Math.exp(lg / (K - 100)) };
}

// un pas du réservoir : renvoie le nouvel état
export function step(res: Reservoir, rho: number, sigma: number, x: Float64Array, u: number): Float64Array {
  const s = rho / res.rho0, out = new Float64Array(res.N);
  for (let i = 0; i < res.N; i++) {
    let a = 0;
    const row = res.W[i];
    for (let j = 0; j < res.N; j++) a += row[j] * x[j];
    out[i] = Math.tanh(s * a + sigma * res.Win[i] * u + res.b[i]);
  }
  return out;
}

// régression ridge : w minimise Σ (w · [x ; 1] − y)² + λ |w|²
export function ridge(X: Float64Array[], y: number[], lam: number): Float64Array {
  const D = X[0].length + 1;
  const A = Array.from({ length: D }, () => new Float64Array(D)), c = new Float64Array(D);
  X.forEach((x, t) => {
    const z = [...x, 1];
    for (let i = 0; i < D; i++) { c[i] += z[i] * y[t]; for (let j = 0; j < D; j++) A[i][j] += z[i] * z[j]; }
  });
  for (let i = 0; i < D; i++) A[i][i] += lam;
  for (let i = 0; i < D; i++) {
    let p = i;
    for (let k = i + 1; k < D; k++) if (Math.abs(A[k][i]) > Math.abs(A[p][i])) p = k;
    [A[i], A[p]] = [A[p], A[i]]; [c[i], c[p]] = [c[p], c[i]];
    for (let k = i + 1; k < D; k++) { const f = A[k][i] / A[i][i]; for (let j = i; j < D; j++) A[k][j] -= f * A[i][j]; c[k] -= f * c[i]; }
  }
  const w = new Float64Array(D);
  for (let i = D - 1; i >= 0; i--) { let s = c[i]; for (let j = i + 1; j < D; j++) s -= A[i][j] * w[j]; w[i] = s / A[i][i]; }
  return w;
}
export const readout = (w: Float64Array, x: Float64Array) => { let s = w[x.length]; for (let i = 0; i < x.length; i++) s += w[i] * x[i]; return s; };

// erreur quadratique normalisée par la variance de la cible : 0 = parfait, 1 = pas mieux que la moyenne
export function nrmse(p: number[], y: number[]) {
  const m = y.reduce((a, b) => a + b, 0) / y.length;
  const v = y.reduce((a, b) => a + (b - m) ** 2, 0) / y.length;
  return Math.sqrt(p.reduce((a, b, i) => a + (b - y[i]) ** 2, 0) / p.length / v);
}

// entrée : bruit uniforme lissé (moyenne mobile exponentielle), écart-type ramené à 0,5
export function signal(T: number, seed: number, smooth = 0.5) {
  const r = rng(seed);
  let s = 0;
  const u = Array.from({ length: T }, () => (s = smooth * s + (1 - smooth) * (r() * 2 - 1)));
  const sd = Math.sqrt(u.reduce((a, b) => a + b * b, 0) / T);
  return u.map((v) => (v / sd) * 0.5);
}
