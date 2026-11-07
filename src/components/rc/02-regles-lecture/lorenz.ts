// Cours Reservoir computing, chapitre 2 : l'expérience « open-loop » d'Ohkubo et Inubushi (2024), en petit.
// Notations du cours (entre parenthèses, celles de l'article) : l'état de Lorenz est l'entrée u(n) = (u_1, u_2, u_3) (x_t),
// l'état du réservoir x(n) (r_t), les poids W (A) et W_in (B), la régularisation ridge α (β).
// Lorenz (paramètres usuels 10, 28, 8/3) intégré par RK4 (dt = 0,02) ; entrée u(n) à chaque pas, cible u(n + H), 0,2 plus loin
// (leur figure 2 est échantillonnée finement ; leur programme publié apprend sur 100 unités de temps à dt = 0,02).
// ESN sans fuite ni biais x(n) = tanh(W x(n−1) + W_in u(n)), W ~ U(−s_W, s_W), W_in ~ U(−s_in, s_in) ; lecture ridge sans biais (comme
// l'article), d'ordre 1 (x) ou 2 (x et les x_j x_j', j ≤ j' : φ de ordre2.ts). Comme dans leur supplément, s_W, s_in et α sont choisis sur
// une grille pour chaque ordre et chaque N (tune(), validation, graines 1 à 3, environ 2 min, non lancé à la construction) ; nos grilles diffèrent.
import { rng } from '../esn';
import { phi } from './ordre2';

export const SPLIT = { wash: 500, ntr: 5000, nval: 2500, nte: 2500 }, H = 10;

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
  for (let t = 0; t < n; t++) { out.push(s.slice()); step(); }
  return out;
}

function states(U: number[][], N: number, sW: number, sIn: number, seed: number) {
  const r = rng(seed);
  const W = Array.from({ length: N }, () => Float64Array.from({ length: N }, () => sW * (2 * r() - 1)));
  const Win = Array.from({ length: N }, () => Float64Array.from({ length: 3 }, () => sIn * (2 * r() - 1)));
  let x = new Float64Array(N);
  return U.map((u) => {
    const nx = new Float64Array(N);
    for (let i = 0; i < N; i++) { let s = Win[i][0] * u[0] + Win[i][1] * u[1] + Win[i][2] * u[2]; const w = W[i]; for (let j = 0; j < N; j++) s += w[j] * x[j]; nx[i] = Math.tanh(s); }
    return (x = nx);
  });
}

// ridge à plusieurs sorties : (FᵀF + αI) W_out = FᵀY, par Cholesky
function ridge(F: Float64Array[], Y: number[][], alpha: number) {
  const D = F[0].length, K = Y[0].length;
  const G = Array.from({ length: D }, () => new Float64Array(D)), R = Array.from({ length: D }, () => new Float64Array(K));
  F.forEach((f, t) => { for (let i = 0; i < D; i++) { const fi = f[i], Gi = G[i]; for (let j = 0; j <= i; j++) Gi[j] += fi * f[j]; for (let k = 0; k < K; k++) R[i][k] += fi * Y[t][k]; } });
  const L = Array.from({ length: D }, () => new Float64Array(D));
  for (let i = 0; i < D; i++) for (let j = 0; j <= i; j++) {
    let s = G[i][j] + (i === j ? alpha : 0);
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

export type Run = { N: number; order: 1 | 2; sW: number; sIn: number; alpha: number; seed: number };
// apprend sur l'apprentissage ; renvoie la RMSE (3 composantes) et les prédictions sur la validation (test = false) ou le test
export function fitPredict(X: number[][], o: Run, test = true) {
  const { wash, ntr, nval, nte } = SPLIT;
  const S = states(X, o.N, o.sW, o.sIn, o.seed);
  const feat = (t: number) => (o.order === 1 ? S[t] : phi(S[t]));
  const F: Float64Array[] = [], Y: number[][] = [];
  for (let t = wash; t < wash + ntr; t++) { F.push(feat(t)); Y.push(X[t + H]); }
  const Wout = ridge(F, Y, o.alpha);
  const t0 = wash + ntr + (test ? nval : 0), n = test ? nte : nval;
  const P: number[][] = [], T: number[][] = [];
  let se = 0;
  for (let t = t0; t < t0 + n; t++) {
    const f = feat(t), p = Wout.map((w) => w.reduce((s, v, i) => s + v * f[i], 0));
    P.push(p); T.push(X[t + H]);
    p.forEach((v, k) => (se += (v - X[t + H][k]) ** 2));
  }
  return { rmse: Math.sqrt(se / (3 * n)), P, T };
}

// nombre de poids appris : 3 sorties × (monômes)
export const nWeights = (order: 1 | 2, N: number) => 3 * (order === 1 ? N : N + (N * (N + 1)) / 2);

// réglages choisis par tune() : [ordre, N, s_W, s_in, α]
export const TUNED: [1 | 2, number, number, number, number][] = [
  [1, 3, 0.01, 0.2, 1e-10], [1, 5, 0.3, 0.2, 1e-6], [1, 10, 0.3, 0.1, 1e-10], [1, 20, 0.1, 0.1, 1e-10], [1, 40, 0.1, 0.2, 1e-6],
  [1, 65, 0.03, 0.2, 1e-6], [1, 120, 0.03, 0.1, 1e-10], [1, 230, 0.03, 0.1, 1e-10],
  [2, 2, 0.01, 0.1, 1e-10], [2, 3, 0.01, 0.1, 1e-10], [2, 5, 0.1, 0.1, 1e-6], [2, 7, 0.03, 0.1, 1e-6], [2, 10, 0.01, 0.1, 1e-10],
  [2, 14, 0.03, 0.1, 1e-10], [2, 20, 0.1, 0.1, 1e-10],
];
export function tune(X: number[][], order: 1 | 2, N: number) {
  let best = { v: Infinity, sW: 0, sIn: 0, alpha: 0 };
  for (const sW of [0.01, 0.03, 0.1, 0.3]) for (const sIn of [0.05, 0.1, 0.2]) for (const alpha of [1e-10, 1e-6]) {
    let v = 0;
    for (let seed = 1; seed <= 3; seed++) v += fitPredict(X, { N, order, sW, sIn, alpha, seed }, false).rmse / 3;
    if (v < best.v) best = { v, sW, sIn, alpha };
  }
  return best;
}

const TEST_SEEDS = [11, 12, 13, 14, 15];
let memo: ReturnType<typeof compute> | undefined;
function compute() {
  const { wash, ntr, nval, nte } = SPLIT;
  const X = lorenz(wash + ntr + nval + nte + H);
  // mêmes états (N = 10, réglages retenus pour l'ordre 1), deux lectures
  const same = { N: 10, sW: 0.3, sIn: 0.1, alpha: 1e-10, seed: TEST_SEEDS[0] };
  const pair = ([1, 2] as const).map((order) => ({ order, nw: nWeights(order, 10), ...fitPredict(X, { ...same, order }) }));
  // erreur de test contre le nombre de poids appris : médiane sur cinq tirages de W et W_in
  const curve = TUNED.map(([order, N, sW, sIn, alpha]) => {
    const r = TEST_SEEDS.map((seed) => fitPredict(X, { N, order, sW, sIn, alpha, seed }).rmse).sort((a, b) => a - b);
    return { order, N, nw: nWeights(order, N), med: r[2], lo: r[0], hi: r[4] };
  });
  return { same, pair, curve };
}
export const experiment = () => (memo ??= compute());
