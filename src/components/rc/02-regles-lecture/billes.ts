// Cours Reservoir computing, chapitre 2 : petit modèle réel derrière l'animation des billes (BillesWidget).
// Réservoir de 12 neurones tanh, connexions creuses (3 entrées par neurone), rayon spectral 0,9 ; entrée scalaire u(n) ;
// trois sorties y_k = w_k · x (sans biais, entrée et états centrés) et trois cibles, l'entrée retardée de 1, 3 et 5 pas (de plus en plus de mémoire).
// Règles : ridge (états collectés puis une résolution), RLS, LMS, EH (référence = sortie sans bruit sur le même pas).
import { rng } from '../esn';

export const NR = 12, NK = 3, WASH = 8, NCOL = 20;
export const input = (n: number) => 0.6 * Math.sin(0.31 * n) + 0.4 * Math.sin(0.73 * n + 1);
export const TNAMES = ['u(n − 1)', 'u(n − 3)', 'u(n − 5)'];
export const targets = (n: number) => [input(n - 1), input(n - 3), input(n - 5)];

export type Net = { edges: { from: number; to: number; w: number }[]; win: number[]; W: number[][] };
export function makeNet(seed = 3): Net {
  const r = rng(seed);
  const W = Array.from({ length: NR }, () => new Array(NR).fill(0));
  const edges: Net['edges'] = [];
  for (let i = 0; i < NR; i++) {
    const src = new Set<number>();
    while (src.size < 3) { const j = Math.floor(r() * NR); if (j !== i) src.add(j); }
    src.forEach((j) => { W[i][j] = 2 * r() - 1; });
  }
  // rayon spectral par la formule de Gelfand, ‖W^k‖^(1/k)
  const mul = (A: number[][], B: number[][]) => A.map((row) => B[0].map((_, j) => row.reduce((s, v, k) => s + v * B[k][j], 0)));
  const K = 60;
  // ρ ≈ ‖W^K‖^(1/K), calculé en renormalisant à chaque pas
  let P = W.map((row) => row.slice()), logn = 0;
  for (let k = 1; k < K; k++) { P = mul(P, W); const s = Math.sqrt(P.flat().reduce((a, v) => a + v * v, 0)); logn += Math.log(s); P = P.map((row) => row.map((v) => v / s)); }
  const rho = Math.exp(logn / (K - 1));
  for (let i = 0; i < NR; i++) for (let j = 0; j < NR; j++) if (W[i][j]) { W[i][j] *= 0.9 / rho; edges.push({ from: j, to: i, w: W[i][j] }); }
  const win = new Array(NR).fill(0);
  [0, 3, 6, 9].forEach((i) => (win[i] = (r() < 0.5 ? -1 : 1) * (0.6 + 0.4 * r())));
  return { edges, win, W };
}
export const stepNet = (net: Net, x: number[], u: number) => net.W.map((row, i) => Math.tanh(row.reduce((s, v, j) => s + v * x[j], 0) + net.win[i] * u));

export type Rule = 'ridge' | 'rls' | 'lms' | 'eh';
export type Learn = { e: number[]; y: number[]; d: number[]; dw: number[][]; g?: number[]; xi?: number[]; M?: number; solved?: boolean; stored?: number };
// W : NK × NR ; toutes les règles apprennent les trois sorties sur les mêmes états
export function makeLearner(rule: Rule, seed = 9) {
  const W = Array.from({ length: NK }, () => new Array(NR).fill(0)), r = rng(seed);
  let P = Array.from({ length: NR }, (_, i) => Array.from({ length: NR }, (_, j) => (i === j ? 100 : 0)));
  const X: number[][] = [], D: number[][] = [];
  let solved = false;
  const ETA = 0.15, SIG = 0.3, ETA_EH = 0.6;
  const out = (x: number[]) => W.map((w) => w.reduce((s, v, i) => s + v * x[i], 0));
  function step(x: number[], d: number[]): Learn {
    const y = out(x), e = y.map((v, k) => v - d[k]);
    const dw = W.map(() => new Array(NR).fill(0));
    if (rule === 'ridge') {
      if (solved) return { e, y, d, dw, solved: true };
      X.push(x.slice()); D.push(d.slice());
      if (X.length < NCOL) return { e, y, d, dw, stored: X.length };
      // une seule résolution : W = D Xᵀ (X Xᵀ + λI)⁻¹, par élimination de Gauss (une colonne de second membre par sortie)
      const A = Array.from({ length: NR }, (_, i) => [...Array.from({ length: NR }, (_, j) => X.reduce((s, row) => s + row[i] * row[j], 0) + (i === j ? 1e-4 : 0)), ...Array.from({ length: NK }, (_, k) => X.reduce((s, row, t) => s + row[i] * D[t][k], 0))]);
      for (let i = 0; i < NR; i++) {
        let p = i; for (let k = i + 1; k < NR; k++) if (Math.abs(A[k][i]) > Math.abs(A[p][i])) p = k;
        [A[i], A[p]] = [A[p], A[i]];
        for (let k = 0; k < NR; k++) if (k !== i) { const f = A[k][i] / A[i][i]; for (let j = i; j < NR + NK; j++) A[k][j] -= f * A[i][j]; }
      }
      for (let k = 0; k < NK; k++) for (let i = 0; i < NR; i++) { const v = A[i][NR + k] / A[i][i]; dw[k][i] = v - W[k][i]; W[k][i] = v; }
      solved = true;
      return { e, y, d, dw, solved: true, stored: X.length };
    }
    if (rule === 'rls') {
      // un seul P pour toutes les sorties : chaque ligne reçoit −e_k P x / (1 + xᵀ P x)
      const Px = P.map((row) => row.reduce((s, v, j) => s + v * x[j], 0)), den = 1 + x.reduce((s, v, i) => s + v * Px[i], 0);
      for (let k = 0; k < NK; k++) for (let i = 0; i < NR; i++) { dw[k][i] = -e[k] * Px[i] / den; W[k][i] += dw[k][i]; }
      P = P.map((row, i) => row.map((v, j) => v - (Px[i] * Px[j]) / den));
      return { e, y, d, dw, g: Px.map((v) => v / den) };
    }
    if (rule === 'lms') {
      for (let k = 0; k < NK; k++) for (let i = 0; i < NR; i++) { dw[k][i] = -ETA * e[k] * x[i]; W[k][i] += dw[k][i]; }
      return { e, y, d, dw };
    }
    // EH : un bruit par sortie, une seule récompense pour les trois (référence : sortie sans bruit sur le même pas)
    const xi = y.map(() => (2 * r() - 1) * SIG), z = y.map((v, k) => v + xi[k]);
    const M = z.reduce((s, v, k) => s + (v - d[k]) ** 2, 0) < y.reduce((s, v, k) => s + (v - d[k]) ** 2, 0) ? 1 : 0;
    for (let k = 0; k < NK; k++) for (let i = 0; i < NR; i++) { dw[k][i] = ETA_EH * M * xi[k] * x[i]; W[k][i] += dw[k][i]; }
    return { e, y, d, dw, xi, M };
  }
  return { W, out, step, isSolved: () => solved, stored: () => X.length };
}
