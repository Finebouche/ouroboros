// Cours Reservoir computing, chapitre 2 : les règles d'apprentissage de la lecture, sur les mêmes données.
// Lecture : W (6 × (N+1)) sur x complété par la constante 1, sortie y = W x, prédiction argmax y, cible d one-hot, erreur e = y − d.
// ridge (hors ligne, biais pénalisé comme les poids), RLS (P₀ = I/α, une passe), LMS (η = c / moyenne ‖x‖²), NLMS (η = c / ‖x‖²),
// EH et ses variantes : sortie bruitée z = y + ξ, ξ ~ U(−σ, σ) ; récompense r = −‖z − d‖² ; W ← W + η M (z − z̄) xᵀ.
import { rng } from '../esn';

export const dot = (a: ArrayLike<number>, b: ArrayLike<number>) => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * b[i]; return s; };
export const argmax = (v: ArrayLike<number>) => { let b = 0; for (let i = 1; i < v.length; i++) if (v[i] > v[b]) b = i; return b; };
export const outW = (W: Float64Array[], z: ArrayLike<number>) => W.map((w) => dot(w, z));
export const accuracy = (W: Float64Array[], Z: Float64Array[], T: number[]) => Z.reduce((a, z, n) => a + (argmax(outW(W, z)) === T[n] ? 1 : 0), 0) / Z.length;

// A X = B (A D × D, B D × m), élimination de Gauss avec pivot partiel
export function solve(A: Float64Array[], B: Float64Array[]) {
  const D = A.length, M = A.map((r) => Float64Array.from(r)), R = B.map((r) => Float64Array.from(r)), m = B[0].length;
  for (let i = 0; i < D; i++) {
    let p = i;
    for (let k = i + 1; k < D; k++) if (Math.abs(M[k][i]) > Math.abs(M[p][i])) p = k;
    [M[i], M[p]] = [M[p], M[i]]; [R[i], R[p]] = [R[p], R[i]];
    for (let k = i + 1; k < D; k++) { const f = M[k][i] / M[i][i]; if (!f) continue; for (let j = i; j < D; j++) M[k][j] -= f * M[i][j]; for (let j = 0; j < m; j++) R[k][j] -= f * R[i][j]; }
  }
  const X = Array.from({ length: D }, () => new Float64Array(m));
  for (let i = D - 1; i >= 0; i--) for (let j = 0; j < m; j++) { let s = R[i][j]; for (let k = i + 1; k < D; k++) s -= M[i][k] * X[k][j]; X[i][j] = s / M[i][i]; }
  return X;
}

// ridge : W = Y Xᵀ (X Xᵀ + λ I)⁻¹, constante comprise dans la pénalité (c'est ce que donne RLS avec P₀ = I/α)
export function ridgeW(Z: Float64Array[], T: number[], nc: number, lam: number) {
  const D = Z[0].length;
  const A = Array.from({ length: D }, () => new Float64Array(D)), B = Array.from({ length: D }, () => new Float64Array(nc));
  Z.forEach((z, n) => { for (let i = 0; i < D; i++) { B[i][T[n]] += z[i]; const zi = z[i], Ai = A[i]; for (let j = 0; j < D; j++) Ai[j] += zi * z[j]; } });
  for (let i = 0; i < D; i++) A[i][i] += lam;
  const X = solve(A, B);
  return Array.from({ length: nc }, (_, k) => Float64Array.from({ length: D }, (_, i) => X[i][k]));
}

// normalisation : moyenne et écart-type de chaque neurone sur les chants d'apprentissage
export function stats(X: Float64Array[]) {
  const n = X[0].length, m = new Float64Array(n), s = new Float64Array(n);
  X.forEach((x) => { for (let i = 0; i < n; i++) m[i] += x[i] / X.length; });
  X.forEach((x) => { for (let i = 0; i < n; i++) s[i] += (x[i] - m[i]) ** 2 / X.length; });
  for (let i = 0; i < n; i++) s[i] = Math.sqrt(s[i]) || 1;
  return { m, s };
}
export type Stats = ReturnType<typeof stats>;
// x complété par la constante 1 ; standardisé si st est donné
export const feat = (x: Float64Array, st: Stats | null) => {
  const n = x.length, z = new Float64Array(n + 1);
  for (let i = 0; i < n; i++) z[i] = st ? (x[i] - st.m[i]) / st.s[i] : x[i];
  z[n] = 1;
  return z;
};

// ordre des données : chants dans un ordre aléatoire à chaque époque, chaque chant dans l'ordre du temps
export function epochOrder(songIdx: number[][], r: () => number) {
  const o = songIdx.map((_, i) => i);
  for (let i = o.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [o[i], o[j]] = [o[j], o[i]]; }
  return o.flatMap((s) => songIdx[s]);
}

export type RuleName = 'rls' | 'lms' | 'nlms' | 'eh' | 'eh_np' | 'eh_np_local' | 'neh';
export type Opts = { alpha?: number; c?: number; sigma?: number; tau?: number; meanZ2: number; seed?: number };
export type StepInfo = {
  y: number[]; e: number[]; eta: number; den?: number; xi?: number[]; zn?: number[]; zref?: number[];
  rw?: number[]; rref?: number[]; M?: number[]; dW: number;
};

// une règle : W part de zéro ; step(z, t) applique la mise à jour pour l'état z et la cible t, et renvoie le détail du calcul
export function makeRule(name: RuleName, nc: number, D: number, o: Opts) {
  const W = Array.from({ length: nc }, () => new Float64Array(D));
  const r = rng(o.seed ?? 5);
  const P = name === 'rls' ? Array.from({ length: D }, (_, i) => { const v = new Float64Array(D); v[i] = 1 / o.alpha!; return v; }) : null;
  const zbar = new Float64Array(nc);
  let rbar = 0, first = true;
  function step(z: Float64Array, t: number): StepInfo {
    const y = outW(W, z), d = y.map((_, k) => (k === t ? 1 : 0)), e = y.map((v, k) => v - d[k]);
    if (P) {
      const Pz = P.map((row) => dot(row, z)), den = 1 + dot(z, Pz), k = Pz.map((v) => v / den);
      let dW = 0;
      for (let a = 0; a < nc; a++) for (let i = 0; i < D; i++) { const v = e[a] * k[i]; W[a][i] -= v; dW += v * v; }
      // P ← P − k (zᵀ P) ; P est symétrique, donc zᵀ P = (P z)ᵀ
      for (let i = 0; i < D; i++) { const ki = k[i], row = P[i]; for (let j = 0; j < D; j++) row[j] -= ki * Pz[j]; }
      return { y, e, eta: NaN, den, dW: Math.sqrt(dW) };
    }
    const z2 = dot(z, z);
    if (name === 'lms' || name === 'nlms') {
      const eta = name === 'lms' ? o.c! / o.meanZ2 : o.c! / z2;
      for (let a = 0; a < nc; a++) { const f = eta * e[a]; for (let i = 0; i < D; i++) W[a][i] -= f * z[i]; }
      return { y, e, eta, dW: eta * Math.sqrt(z2 * dot(e, e)) };
    }
    // EH : bruit sur la sortie, récompense, mise à jour hebbienne modulée
    const sig = o.sigma!, xi = y.map(() => (r() * 2 - 1) * sig), zn = y.map((v, k) => v + xi[k]);
    const eta = name === 'neh' ? o.c! / z2 : o.c! / o.meanZ2;
    const sq = (v: number[], k: number) => (v[k] - d[k]) ** 2;
    let zref: number[], rw: number[], rref: number[], M: number[];
    if (name === 'eh') {
      // article : z̄ et r̄ filtrés dans le temps (moyennes glissantes de constante τ), récompense globale
      const a = 1 / o.tau!, rr = -zn.reduce((s, _, k) => s + sq(zn, k), 0);
      if (first) { for (let k = 0; k < nc; k++) zbar[k] = zn[k]; rbar = rr; first = false; }
      for (let k = 0; k < nc; k++) zbar[k] = (1 - a) * zbar[k] + a * zn[k];
      rbar = (1 - a) * rbar + a * rr;
      zref = Array.from(zbar); rw = y.map(() => rr); rref = y.map(() => rbar);
      M = y.map(() => (rr > rbar ? 1 : 0));
    } else if (name === 'eh_np') {
      // z̄ = sortie sans bruit sur la même entrée, r̄ = sa récompense ; récompense globale
      const rr = -zn.reduce((s, _, k) => s + sq(zn, k), 0), r0 = -y.reduce((s, _, k) => s + sq(y, k), 0);
      zref = y; rw = y.map(() => rr); rref = y.map(() => r0); M = y.map(() => (rr > r0 ? 1 : 0));
    } else {
      // récompense propre à chaque sortie
      zref = y; rw = y.map((_, k) => -sq(zn, k)); rref = y.map((_, k) => -sq(y, k)); M = rw.map((v, k) => (v > rref[k] ? 1 : 0));
    }
    let dW = 0;
    for (let a = 0; a < nc; a++) { const f = eta * (zn[a] - zref[a]) * M[a]; if (f) { for (let i = 0; i < D; i++) W[a][i] += f * z[i]; dW += f * f * z2; } }
    return { y, e, eta, xi, zn, zref, rw, rref, M, dW: Math.sqrt(dW) };
  }
  return { W, step };
}

// réglages fixés du chapitre (vérifiés par simulation)
export const RULES: { id: RuleName; label: string; o: Omit<Opts, 'meanZ2'> }[] = [
  { id: 'rls', label: 'RLS', o: { alpha: 1 } },
  { id: 'lms', label: 'LMS', o: { c: 0.1 } },
  { id: 'nlms', label: 'NLMS', o: { c: 0.1 } },
  { id: 'eh', label: 'eh', o: { c: 0.03, sigma: 0.5, tau: 5, seed: 21 } },
  { id: 'eh_np', label: 'eh_np', o: { c: 0.1, sigma: 0.5, seed: 22 } },
  { id: 'eh_np_local', label: 'eh_np_local', o: { c: 0.1, sigma: 0.5, seed: 23 } },
  { id: 'neh', label: 'neh', o: { c: 0.1, sigma: 0.5, seed: 24 } },
];
export const LAMBDA = 1;
