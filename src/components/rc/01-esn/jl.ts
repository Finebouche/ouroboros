// Cours Reservoir computing, chapitre 1 : lemme de Johnson-Lindenstrauss. P points de R^d, projection gaussienne f(u) = G u / √m (m lignes de G).
// Les m lignes sont les m premières d'une même matrice G : agrandir m ajoute des lignes sans changer les précédentes.
import { rng, gauss } from '../esn';

export const MS = [5, 10, 20, 50, 100, 200];
export const P = 40, D = 200;
// demi-largeur de la bande tracée : fixe, la même pour tous les m
export const EPS = 0.5;

export function makeCloud(seed: number) {
  const r = rng(seed);
  // points gaussiens à des échelles différentes (0,3 à 2) ; le rapport des distances n'en dépend pas
  return Array.from({ length: P }, () => { const s = 0.3 + 1.7 * r(); return Float64Array.from({ length: D }, () => s * gauss(r)); });
}
export const makeG = (seed: number) => { const r = rng(seed); return Array.from({ length: Math.max(...MS) }, () => Float64Array.from({ length: D }, () => gauss(r))); };

// rapports d1²/d0² (distance au carré après / avant projection sur m dimensions) des P(P−1)/2 paires, triés par ordre croissant
export function ratios(X: Float64Array[], G: Float64Array[], m: number): number[] {
  const Y = X.map((x) => { const y = new Float64Array(m); for (let i = 0; i < m; i++) { let s = 0; const g = G[i]; for (let j = 0; j < D; j++) s += g[j] * x[j]; y[i] = s / Math.sqrt(m); } return y; });
  const d2 = (a: Float64Array, b: Float64Array) => { let s = 0; for (let i = 0; i < a.length; i++) { const t = a[i] - b[i]; s += t * t; } return s; };
  const out: number[] = [];
  for (let i = 0; i < X.length; i++) for (let j = i + 1; j < X.length; j++) out.push(d2(Y[i], Y[j]) / d2(X[i], X[j]));
  return out.sort((a, b) => a - b);
}
// distorsion mesurée : plus grand |rapport − 1|
export const distortion = (rs: number[]) => rs.reduce((a, r) => Math.max(a, Math.abs(r - 1)), 0);
// plus petit ε de ]0, 1[ tel que m ≥ 4 ln P / (ε²/2 − ε³/3) (forme de Dasgupta et Gupta) ; null s'il n'y en a pas
export function epsBound(m: number, p = P): number | null {
  const f = (e: number) => (4 * Math.log(p)) / (e * e / 2 - (e * e * e) / 3);
  if (f(0.999) > m) return null;
  let lo = 0.001, hi = 0.999;
  for (let i = 0; i < 60; i++) { const mid = (lo + hi) / 2; if (f(mid) <= m) hi = mid; else lo = mid; }
  return hi;
}
// plus petit m entier pour lequel la borne donne un ε < 1
export const mMin = (p = P) => Math.ceil((4 * Math.log(p)) / (1 / 2 - 1 / 3));
