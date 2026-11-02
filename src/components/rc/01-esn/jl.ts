// Cours Reservoir computing, chapitre 1 : lemme de Johnson-Lindenstrauss. m points de R^d, projection gaussienne G/√k (k lignes de G).
// Les k lignes sont les k premières d'une même matrice G : agrandir k ajoute des lignes sans changer les précédentes.
import { rng, gauss } from '../esn';

export const KS = [5, 10, 20, 50, 100, 200, 400];
export const M = 40, D = 200;

export function makeCloud(seed: number) {
  const r = rng(seed);
  // points gaussiens à des échelles différentes (0,3 à 2), pour que les distances ne soient pas toutes presque égales
  return Array.from({ length: M }, () => { const s = 0.3 + 1.7 * r(); return Float64Array.from({ length: D }, () => s * gauss(r)); });
}
export const makeG = (seed: number) => { const r = rng(seed); return Array.from({ length: Math.max(...KS) }, () => Float64Array.from({ length: D }, () => gauss(r))); };

export type Pair = { d0: number; d1: number };
// distances par paire avant (d0) et après (d1) la projection sur k dimensions
export function pairs(X: Float64Array[], G: Float64Array[], k: number): Pair[] {
  const Y = X.map((x) => { const y = new Float64Array(k); for (let i = 0; i < k; i++) { let s = 0; const g = G[i]; for (let j = 0; j < D; j++) s += g[j] * x[j]; y[i] = s / Math.sqrt(k); } return y; });
  const dist = (a: Float64Array, b: Float64Array) => { let s = 0; for (let i = 0; i < a.length; i++) { const t = a[i] - b[i]; s += t * t; } return Math.sqrt(s); };
  const out: Pair[] = [];
  for (let i = 0; i < X.length; i++) for (let j = i + 1; j < X.length; j++) out.push({ d0: dist(X[i], X[j]), d1: dist(Y[i], Y[j]) });
  return out;
}
// distorsion mesurée : plus grand |d1²/d0² − 1| sur les paires
export const distortion = (ps: Pair[]) => ps.reduce((a, p) => Math.max(a, Math.abs((p.d1 * p.d1) / (p.d0 * p.d0) - 1)), 0);
// plus petit ε de ]0, 1[ tel que k ≥ 4 ln m / (ε²/2 − ε³/3) (forme de Dasgupta et Gupta) ; null s'il n'y en a pas
export function epsBound(k: number, m = M): number | null {
  const f = (e: number) => (4 * Math.log(m)) / (e * e / 2 - (e * e * e) / 3);
  if (f(0.999) > k) return null;
  let lo = 0.001, hi = 0.999;
  for (let i = 0; i < 60; i++) { const mid = (lo + hi) / 2; if (f(mid) <= k) hi = mid; else lo = mid; }
  return hi;
}
