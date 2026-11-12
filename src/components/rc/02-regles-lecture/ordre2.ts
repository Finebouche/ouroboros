// Cours Reservoir computing, chapitre 2 : lecture d'ordre 2, en primal (monômes explicites) et en dual (noyau).
// x : état du réservoir. φ(x) = (x_j, x_j x_j' pour j ≤ j' ; j : neurone), centré sur l'apprentissage ; noyau k(a, b) = φ(a)·φ(b) = a·b + ((a·b)² + Σ a_j² b_j²) / 2.
// NLMS sur [φ ; 1] : W_out ← W_out − η e φᵀ, b_out ← b_out − η e. Dual : W_out = Σ_ℓ a_ℓ φ_ℓᵀ, sortie Σ_ℓ a_ℓ k_c(x_ℓ, x) + b_out,
// mise à jour a_ℓ ← a_ℓ − η_ℓ e_ℓ (ℓ : phrase d'apprentissage ; dans le code, i et j numérotent les phrases).
import { dataset, NC } from './chants';
import { stats, epochOrder } from './regles';
import { rng } from '../esn';

export const nFeat = (n: number) => n + (n * (n + 1)) / 2;
export function phi(x: Float64Array) {
  const n = x.length, f = new Float64Array(nFeat(n));
  let p = 0;
  for (let i = 0; i < n; i++) f[p++] = x[i];
  for (let i = 0; i < n; i++) for (let j = i; j < n; j++) f[p++] = x[i] * x[j];
  return f;
}
// noyau sans φ explicite : sommes des puissances p₁ = Σ c_i, p₂ = Σ c_i² des produits c_i = a_i b_i ; Σ_{i ≤ j} c_i c_j = (p₁² + p₂) / 2
export function ker(a: Float64Array, b: Float64Array) {
  let p = 0, q = 0;
  for (let i = 0; i < a.length; i++) { const c = a[i] * b[i]; p += c; q += c * c; }
  return p + (p * p + q) / 2;
}
// noyau centré : k_c(a, b) = k(a, b) − moyenne_j k(a, x_j) − moyenne_j k(x_j, b) + moyenne_ij k(x_i, x_j)  (= H K H sur l'apprentissage)
export function centeredGram(X: Float64Array[]) {
  const n = X.length, Kr = X.map((a) => X.map((b) => ker(a, b)));
  const rm = Kr.map((r) => r.reduce((s, v) => s + v, 0) / n), all = rm.reduce((s, v) => s + v, 0) / n;
  const Kc = Kr.map((r, i) => Float64Array.from(r, (v, j) => v - rm[i] - rm[j] + all));
  return { Kc, rm, all };
}

// moteur du widget : NLMS d'ordre 2 mené en parallèle sous les deux formes, sur les mêmes données et dans le même ordre
export function makeO2(X: Float64Array[], T: number[], nc: number) {
  const n = X.length, D = nFeat(X[0].length);
  const P = X.map(phi), mu = new Float64Array(D);
  P.forEach((p) => { for (let k = 0; k < D; k++) mu[k] += p[k] / n; });
  P.forEach((p) => { for (let k = 0; k < D; k++) p[k] -= mu[k]; });
  const { Kc } = centeredGram(X);
  const diag = Kc.map((r, i) => r[i]), meanDiag = diag.reduce((a, b) => a + b, 0) / n;
  let W: Float64Array[], b: Float64Array, A: Float64Array[], bd: Float64Array;
  const reset = () => { W = Array.from({ length: nc }, () => new Float64Array(D)); b = new Float64Array(nc); A = Array.from({ length: n }, () => new Float64Array(nc)); bd = new Float64Array(nc); };
  reset();
  const primalOut = (i: number) => W.map((w, k) => { let s = b[k]; const p = P[i]; for (let d = 0; d < D; d++) s += w[d] * p[d]; return s; });
  const dualOut = (i: number) => { const y = Float64Array.from(bd); for (let j = 0; j < n; j++) { const kv = Kc[j][i], a = A[j]; if (kv) for (let k = 0; k < nc; k++) y[k] += a[k] * kv; } return Array.from(y); };
  // un pas sur l'exemple i ; single : taux unique c / (moyenne K_ii + 1), sinon c / (K_ii + 1)
  function step(i: number, c: number, single: boolean) {
    const yp = primalOut(i), yd = dualOut(i), t = T[i];
    const eta = c / ((single ? meanDiag : diag[i]) + 1);
    for (let k = 0; k < nc; k++) {
      const ep = yp[k] - (t === k ? 1 : 0), ed = yd[k] - (t === k ? 1 : 0), w = W[k], p = P[i];
      for (let d = 0; d < D; d++) w[d] -= eta * ep * p[d];
      b[k] -= eta * ep; A[i][k] -= eta * ed; bd[k] -= eta * ed;
    }
    return { yp, yd, eta, kii: diag[i], gain: eta * (diag[i] + 1) };
  }
  // erreur quadratique moyenne d'apprentissage (primal et dual), et plus grand écart relatif entre leurs sorties, |Δy| / max(1, |y|)
  function mse() {
    let mp = 0, md = 0, gap = 0;
    const Yd = Array.from({ length: n }, () => Float64Array.from(bd));
    for (let j = 0; j < n; j++) { const a = A[j]; if (a.some((v) => v)) for (let i = 0; i < n; i++) { const kv = Kc[j][i]; for (let k = 0; k < nc; k++) Yd[i][k] += a[k] * kv; } }
    for (let i = 0; i < n; i++) {
      const yp = primalOut(i);
      for (let k = 0; k < nc; k++) { const d = T[i] === k ? 1 : 0; mp += (yp[k] - d) ** 2 / n; md += (Yd[i][k] - d) ** 2 / n; gap = Math.max(gap, Math.abs(yp[k] - Yd[i][k]) / Math.max(1, Math.abs(yp[k]))); }
    }
    return { mp, md, gap };
  }
  return { n, D, diag, meanDiag, maxDiag: Math.max(...diag), step, mse, reset };
}

// courbes du widget « Pourquoi normaliser le taux ? », précalculées (à la construction) : pour chaque c, erreur quadratique moyenne
// d'apprentissage (forme primale) à la fin de chaque époque, taux normalisé et taux unique ; une courbe s'arrête dès que l'erreur
// dépasse STOP. gap : plus grand écart relatif entre les sorties primales et duales, sur les deux courbes.
export const STOP = 1e6;
const memo = new Map<string, ReturnType<typeof computeRates>>();
export const rateCurves = (cs: number[], emax = 20) => {
  const key = `${cs.join(',')}|${emax}`;
  if (!memo.has(key)) memo.set(key, computeRates(cs, emax));
  return memo.get(key)!;
};
function computeRates(cs: number[], emax: number) {
  const { train } = dataset();
  const st = stats(train.map((s) => s.x));
  const X = train.map((s) => Float64Array.from(s.x, (v, i) => (v - st.m[i]) / st.s[i])), T = train.map((s) => s.next), n = X.length;
  const songIdx: number[][] = [];
  train.forEach((s, k) => (songIdx[s.song] ??= []).push(k));
  const O = makeO2(X, T, NC);
  const run = (c: number, single: boolean) => {
    O.reset();
    const ro = rng(77), err = [1];
    let gap = 0;
    for (let e = 0; e < emax; e++) {
      const order = epochOrder(songIdx, ro);
      for (const i of order) {
        const s = O.step(i, c, single);
        s.yp.forEach((v, k) => (gap = Math.max(gap, Math.abs(v - s.yd[k]) / Math.max(1, Math.abs(v)))));
      }
      const m = O.mse();
      gap = Math.max(gap, m.gap);
      err.push(m.mp);
      if (!(m.mp < STOP)) break;
    }
    return { err, gap };
  };
  const ratio = (O.maxDiag + 1) / (O.meanDiag + 1);
  return {
    n, D: O.D, meanK1: O.meanDiag + 1, maxK1: O.maxDiag + 1, ratio,
    runs: cs.map((c) => { const a = run(c, false), b = run(c, true); return { c, norm: a.err, uniq: b.err, gap: Math.max(a.gap, b.gap), gain: c * ratio }; }),
  };
}
