// Cours Reservoir computing, chapitre 1 : théorème de Cover. Réservoir statique φ(x) = tanh(W x + b), lecture linéaire sans constante.
// Séparabilité testée par l'algorithme de Ho-Kashyap (fit) : zéro erreur est un certificat (séparable) ; des erreurs restantes ne prouvent pas l'inséparabilité.
import { rng, gauss } from '../esn';

export const binom = (n: number, k: number) => { let r = 1; for (let i = 0; i < k; i++) r = (r * (n - i)) / (i + 1); return r; };
// nombre de dichotomies de P points en position générale séparables par un hyperplan passant par l'origine de R^N
export const coverCount = (P: number, N: number) => { let s = 0; for (let k = 0; k < Math.min(N, P); k++) s += binom(P - 1, k); return 2 * s; };

export type Pts = { x: [number, number][]; y: number[] };
// P points du plan : quatre coins (± 0,25 à 1), étiquette XOR = signe de x1·x2, ou étiquettes tirées au hasard
export function makePoints(kind: 'xor' | 'rand', P: number, seed: number): Pts {
  const r = rng(seed), rl = rng(seed + 1000);
  const x: [number, number][] = [], y: number[] = [];
  for (let i = 0; i < P; i++) {
    const a = (r() < 0.5 ? -1 : 1) * (0.25 + 0.75 * r()), b = (r() < 0.5 ? -1 : 1) * (0.25 + 0.75 * r());
    x.push([a, b]);
    y.push(kind === 'xor' ? Math.sign(a * b) : rl() < 0.5 ? -1 : 1);
  }
  return { x, y };
}

export type Proj = { W: Float64Array[]; b: Float64Array };
export function makeProj(Nmax: number, seed: number, gain = 2): Proj {
  const r = rng(seed);
  return { W: Array.from({ length: Nmax }, () => Float64Array.from({ length: 2 }, () => gain * gauss(r))), b: Float64Array.from({ length: Nmax }, () => (r() * 2 - 1)) };
}
// N = 0 : entrée brute (2 coordonnées) ; sinon N neurones tanh
export function phi(p: Proj, N: number, x: [number, number]): number[] {
  if (N === 0) return [x[0], x[1]];
  return Array.from({ length: N }, (_, i) => Math.tanh(p.W[i][0] * x[0] + p.W[i][1] * x[1] + p.b[i]));
}
// Séparabilité par l'algorithme de Ho-Kashyap (lignes ŷ_i = y_i φ_i ; on cherche w avec ŷ_i · w > 0 pour tout i).
// Renvoie le w trouvé et le nombre d'erreurs ; err = 0 est un certificat de séparabilité. En cas d'échec après `iters` pas,
// la séparabilité n'est pas exclue (une marge très faible peut demander plus de pas).
export function fit(F: number[][], y: number[], iters = 3000): { w: number[]; err: number } {
  const P = F.length, D = F[0].length;
  const Y = F.map((f, i) => f.map((z) => y[i] * z));
  // pseudo-inverse (YᵀY + λI)⁻¹ Yᵀ par Gauss-Jordan
  const A = Array.from({ length: D }, (_, i) => { const r = new Array(2 * D).fill(0); for (let j = 0; j < D; j++) { for (let k = 0; k < P; k++) r[j] += Y[k][i] * Y[k][j]; } r[D + i] = 1; return r; });
  const tr = A.reduce((a, r, i) => a + r[i], 0) / D;
  for (let i = 0; i < D; i++) A[i][i] += 1e-9 * tr;
  for (let i = 0; i < D; i++) {
    let p = i; for (let k = i + 1; k < D; k++) if (Math.abs(A[k][i]) > Math.abs(A[p][i])) p = k;
    [A[i], A[p]] = [A[p], A[i]];
    const d = A[i][i]; for (let j = 0; j < 2 * D; j++) A[i][j] /= d;
    for (let k = 0; k < D; k++) if (k !== i) { const f = A[k][i]; if (f) for (let j = 0; j < 2 * D; j++) A[k][j] -= f * A[i][j]; }
  }
  const pinv = (b: number[]) => Array.from({ length: D }, (_, i) => { let s = 0; for (let j = 0; j < D; j++) { const a = A[i][D + j]; let t = 0; for (let k = 0; k < P; k++) t += Y[k][j] * b[k]; s += a * t; } return s; });
  const errs = (w: number[]) => Y.reduce((a, r) => a + (r.reduce((s, z, j) => s + z * w[j], 0) <= 1e-12 ? 1 : 0), 0);
  let b = new Array(P).fill(1), w = pinv(b), best = w, bestErr = errs(w);
  for (let it = 0; it < iters && bestErr > 0; it++) {
    const e = Y.map((r, k) => r.reduce((s, z, j) => s + z * w[j], 0) - b[k]);
    if (e.every((v) => v <= 1e-9)) break; // aucune amélioration possible : inséparable
    b = b.map((v, k) => v + (e[k] + Math.abs(e[k])) * 0.5 * 2);
    w = pinv(b);
    const c = errs(w); if (c < bestErr) { bestErr = c; best = w; }
  }
  return { w: best, err: bestErr };
}
