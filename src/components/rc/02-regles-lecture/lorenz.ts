// Cours Reservoir computing, chapitre 2 : l'expérience « open-loop » d'Ohkubo et Inubushi (2024), en petit.
// Lorenz (σ = 10, ρ = 28, β = 8/3) intégré par RK4 (dt = 0,02), échantillonné tous les τ = 0,2 ; entrée x_t, cible x_{t+1}.
// ESN sans fuite r_{t+1} = tanh(A r_t + B x_t), A ~ U(−σ_A, σ_A), B ~ U(−σ_B, σ_B) ; lecture ridge sans biais (comme l'article),
// d'ordre 1 (r) ou 2 (r et les r_j r_k, j ≤ k : φ de ordre2.ts). Les réglages de l'article (supplément) n'ont pas été lus :
// ceux-ci sont choisis pour ce chapitre, sur une validation (tune(), graines 1 à 3, environ 80 s, non lancé à la construction).
import { rng } from '../esn';
import { phi } from './ordre2';

export const SPLIT = { wash: 200, ntr: 4000, nval: 1000, nte: 1000 };

export function lorenz(n: number) {
  const f = (s: number[]) => [10 * (s[1] - s[0]), 28 * s[0] - s[1] - s[0] * s[2], s[0] * s[1] - (8 / 3) * s[2]];
  const dt = 0.02, add = (a: number[], b: number[], h: number) => a.map((v, i) => v + h * b[i]);
  let s = [1, 1, 20];
  const step = () => {
    const k1 = f(s), k2 = f(add(s, k1, dt / 2)), k3 = f(add(s, k2, dt / 2)), k4 = f(add(s, k3, dt));
    s = s.map((v, i) => v + (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
  };
  for (let i = 0; i < 2000; i++) step(); // transitoire : on part sur l'attracteur
  const out: number[][] = [];
  for (let t = 0; t < n; t++) { out.push(s.slice()); for (let k = 0; k < 10; k++) step(); } // τ = 10 dt
  return out;
}

function states(X: number[][], N: number, sA: number, sB: number, seed: number) {
  const r = rng(seed);
  const A = Array.from({ length: N }, () => Float64Array.from({ length: N }, () => sA * (2 * r() - 1)));
  const B = Array.from({ length: N }, () => Float64Array.from({ length: 3 }, () => sB * (2 * r() - 1)));
  let x = new Float64Array(N);
  return X.map((u) => {
    const nx = new Float64Array(N);
    for (let i = 0; i < N; i++) { let s = B[i][0] * u[0] + B[i][1] * u[1] + B[i][2] * u[2]; const a = A[i]; for (let j = 0; j < N; j++) s += a[j] * x[j]; nx[i] = Math.tanh(s); }
    return (x = nx);
  });
}

// ridge à plusieurs sorties : (FᵀF + βI) W = FᵀY, par Cholesky
function ridge(F: Float64Array[], Y: number[][], beta: number) {
  const D = F[0].length, K = Y[0].length;
  const G = Array.from({ length: D }, () => new Float64Array(D)), R = Array.from({ length: D }, () => new Float64Array(K));
  F.forEach((f, t) => { for (let i = 0; i < D; i++) { const fi = f[i], Gi = G[i]; for (let j = 0; j <= i; j++) Gi[j] += fi * f[j]; for (let k = 0; k < K; k++) R[i][k] += fi * Y[t][k]; } });
  const L = Array.from({ length: D }, () => new Float64Array(D));
  for (let i = 0; i < D; i++) for (let j = 0; j <= i; j++) {
    let s = G[i][j] + (i === j ? beta : 0);
    for (let k = 0; k < j; k++) s -= L[i][k] * L[j][k];
    L[i][j] = i === j ? Math.sqrt(Math.max(s, 1e-300)) : s / L[j][j];
  }
  return Array.from({ length: K }, (_, k) => {
    const z = new Float64Array(D), w = new Float64Array(D);
    for (let i = 0; i < D; i++) { let s = R[i][k]; for (let j = 0; j < i; j++) s -= L[i][j] * z[j]; z[i] = s / L[i][i]; }
    for (let i = D - 1; i >= 0; i--) { let s = z[i]; for (let j = i + 1; j < D; j++) s -= L[j][i] * w[j]; w[i] = s / L[i][i]; }
    return w;
  });
}

export type Run = { N: number; order: 1 | 2; sA: number; sB: number; beta: number; seed: number };
// apprend sur l'apprentissage ; renvoie la RMSE (3 composantes) et les prédictions sur la validation (test = false) ou le test
export function fitPredict(X: number[][], o: Run, test = true) {
  const { wash, ntr, nval, nte } = SPLIT;
  const S = states(X, o.N, o.sA, o.sB, o.seed);
  const feat = (t: number) => (o.order === 1 ? S[t] : phi(S[t]));
  const F: Float64Array[] = [], Y: number[][] = [];
  for (let t = wash; t < wash + ntr; t++) { F.push(feat(t)); Y.push(X[t + 1]); }
  const W = ridge(F, Y, o.beta);
  const t0 = wash + ntr + (test ? nval : 0), n = test ? nte : nval;
  const P: number[][] = [], T: number[][] = [];
  let se = 0;
  for (let t = t0; t < t0 + n; t++) {
    const f = feat(t), p = W.map((w) => w.reduce((s, v, i) => s + v * f[i], 0));
    P.push(p); T.push(X[t + 1]);
    p.forEach((v, k) => (se += (v - X[t + 1][k]) ** 2));
  }
  return { rmse: Math.sqrt(se / (3 * n)), P, T };
}

export const nParams = (order: 1 | 2, N: number) => 3 * (order === 1 ? N : N + (N * (N + 1)) / 2);

// réglages choisis par tune() : [ordre, N, σ_A, σ_B, β]
export const TUNED: [1 | 2, number, number, number, number][] = [
  [1, 3, 0.03, 0.2, 1e-6], [1, 5, 0.01, 0.2, 1e-10], [1, 10, 0.1, 0.1, 1e-10], [1, 20, 0.1, 0.2, 1e-6], [1, 40, 0.01, 0.2, 1e-6],
  [1, 65, 0.01, 0.2, 1e-10], [1, 120, 0.01, 0.2, 1e-6], [1, 230, 0.01, 0.2, 1e-10],
  [2, 2, 0.03, 0.2, 1e-10], [2, 3, 0.03, 0.05, 1e-10], [2, 5, 0.01, 0.1, 1e-10], [2, 7, 0.01, 0.1, 1e-10], [2, 10, 0.01, 0.1, 1e-10],
  [2, 14, 0.01, 0.1, 1e-10], [2, 20, 0.01, 0.2, 1e-10],
];
export function tune(X: number[][], order: 1 | 2, N: number) {
  let best = { v: Infinity, sA: 0, sB: 0, beta: 0 };
  for (const sA of [0.01, 0.03, 0.1, 0.3]) for (const sB of [0.05, 0.1, 0.2]) for (const beta of [1e-10, 1e-6]) {
    let v = 0;
    for (let seed = 1; seed <= 3; seed++) v += fitPredict(X, { N, order, sA, sB, beta, seed }, false).rmse / 3;
    if (v < best.v) best = { v, sA, sB, beta };
  }
  return best;
}

const TEST_SEEDS = [11, 12, 13, 14, 15];
let memo: ReturnType<typeof compute> | undefined;
function compute() {
  const { wash, ntr, nval, nte } = SPLIT;
  const X = lorenz(wash + ntr + nval + nte + 1);
  // mêmes états (N = 10, réglages retenus pour l'ordre 1), deux lectures
  const same = { N: 10, sA: 0.1, sB: 0.1, beta: 1e-10, seed: TEST_SEEDS[0] };
  const pair = ([1, 2] as const).map((order) => ({ order, M: nParams(order, 10), ...fitPredict(X, { ...same, order }) }));
  // erreur de test contre le nombre de paramètres appris : médiane sur cinq tirages de A et B
  const curve = TUNED.map(([order, N, sA, sB, beta]) => {
    const r = TEST_SEEDS.map((seed) => fitPredict(X, { N, order, sA, sB, beta, seed }).rmse).sort((a, b) => a - b);
    return { order, N, M: nParams(order, N), med: r[2], lo: r[0], hi: r[4] };
  });
  return { same, pair, curve };
}
export const experiment = () => (memo ??= compute());
