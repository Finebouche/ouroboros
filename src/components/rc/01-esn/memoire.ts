// Cours Reservoir computing, chapitre 1 : mémoire d'un réservoir selon son rayon spectral ρ. Calculé au build (frontmatter).
// Même réservoir que esn.ts (60 neurones, graine 7, σ = 0,1). Entrée : bruit blanc uniforme sur [−1, 1].
// 1) Courbe de mémoire : pour chaque retard k, une lecture ridge apprend u(n − k) ; R² mesuré sur des pas jamais vus.
// 2) Réponse impulsionnelle : écart entre deux copies du réservoir, l'une reçoit u(0) = 1, l'autre rien (entrée nulle sinon).
import { makeReservoir, step, rng, type Reservoir } from '../esn.ts';

export const N = 60, SEED = 7, SIGMA = 0.1;
export const KMAX = 40;
export const T = 3200, WASH = 200, SPLIT = 2200, ALPHA = 1e-4;

// résout A w = c (A symétrique définie positive, copiée), élimination de Gauss avec pivot partiel
function solve(A0: Float64Array[], c0: Float64Array) {
  const D = c0.length, A = A0.map((r) => Float64Array.from(r)), c = Float64Array.from(c0);
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

export const whiteInput = (len: number, seed = 3) => { const r = rng(seed); return Array.from({ length: len }, () => r() * 2 - 1); };

// R²(k) pour k = 0..KMAX, sur les pas de test [SPLIT, T). La matrice X Xᵀ + α I est la même pour tous les k : seul le second membre change.
export function memoryCurve(res: Reservoir, rho: number, u = whiteInput(T)) {
  const X: Float64Array[] = [];
  let x = new Float64Array(res.N);
  for (let n = 0; n < T; n++) { x = step(res, rho, SIGMA, x, u[n]); X.push(x); }
  const D = res.N + 1, z = (n: number) => { const v = new Float64Array(D); v.set(X[n]); v[res.N] = 1; return v; };
  const A = Array.from({ length: D }, () => new Float64Array(D));
  for (let n = WASH; n < SPLIT; n++) { const v = z(n); for (let i = 0; i < D; i++) for (let j = 0; j < D; j++) A[i][j] += v[i] * v[j]; }
  for (let i = 0; i < D; i++) A[i][i] += ALPHA;
  const r2: number[] = [];
  for (let k = 0; k <= KMAX; k++) {
    const c = new Float64Array(D);
    for (let n = WASH; n < SPLIT; n++) { const v = z(n); for (let i = 0; i < D; i++) c[i] += v[i] * u[n - k]; }
    const w = solve(A, c);
    let m = 0; for (let n = SPLIT; n < T; n++) m += u[n - k]; m /= T - SPLIT;
    let se = 0, sv = 0;
    for (let n = SPLIT; n < T; n++) { const v = z(n); let y = 0; for (let i = 0; i < D; i++) y += w[i] * v[i]; se += (y - u[n - k]) ** 2; sv += (u[n - k] - m) ** 2; }
    r2.push(1 - se / sv);
  }
  return r2;
}
// capacité mémoire : somme des R² (négatifs ramenés à 0) pour k = 1..KMAX
export const capacity = (r2: number[]) => r2.slice(1).reduce((a, b) => a + Math.max(0, b), 0);

// réponse impulsionnelle : δx(n) = x(n) avec impulsion − x(n) sans, pour n = 0..len−1, depuis l'état atteint après REST pas d'entrée nulle
export function impulse(res: Reservoir, rho: number, neurons: number[], len = KMAX + 1, amp = 1, REST = 3000) {
  let x = new Float64Array(res.N);
  for (let n = 0; n < REST; n++) x = step(res, rho, SIGMA, x, 0);
  let a = x, b = x;
  const out = neurons.map(() => [] as number[]);
  for (let n = 0; n < len; n++) {
    a = step(res, rho, SIGMA, a, n === 0 ? amp : 0); b = step(res, rho, SIGMA, b, 0);
    neurons.forEach((j, q) => out[q].push(a[j] - b[j]));
  }
  return out;
}

// réservoir du chapitre et courbes mises en cache (le serveur de dev réexécute le frontmatter à chaque requête)
let RES: Reservoir | null = null;
export const reservoir = () => (RES ??= makeReservoir(N, SEED));
const CURVES = new Map<number, number[]>();
export const curveFor = (rho: number) => { if (!CURVES.has(rho)) CURVES.set(rho, memoryCurve(reservoir(), rho)); return CURVES.get(rho)!; };
