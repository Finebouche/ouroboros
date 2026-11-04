// Cours Reservoir computing, chapitre 11 : quatre formes 2D (cercle, étoile, carré, huit) tracées par un réservoir à conceptors.
// Chaque forme est un motif périodique à deux dimensions (x, y), un tour en 30 pas. Chargées dans un réservoir de 200 neurones
// (mêmes réglages que conceptors.ts : W_in × 1,5, b × 0,2, W* creuse à 10 % de rayon spectral 1,5 ; graine 3), un conceptor par forme (α = 20).
// Calculé à la construction : chaque forme seule, et les mélanges (1 − μ) C_A + μ C_B pour μ de 0,1 à 0,9, pour chaque paire.
// Pour chaque résultat : les 120 derniers points (quatre tours) après 1500 pas. Transitions A → B : μ passe de 0 à 1 en 180 pas (6 tours).
import { makeRng, gauss, zeros, matvec, solve } from './conceptors';

const N = 200, D = 2, T = 30, SC = 0.7, ALPHA = 20;
type Mat = Float64Array[];
const TAU = 2 * Math.PI, C = Math.cos, S = Math.sin;
const sp = (v: number, e: number) => Math.sign(v) * Math.abs(v) ** e;
// étoile à 5 branches : on parcourt les 10 segments entre sommets (rayon 1) et creux (rayon 0,45)
const star = (th: number) => {
  const u = ((th / TAU) * 10) % 10, i = Math.floor(u), f = u - i;
  const pt = (j: number) => { const r = j % 2 ? 0.45 : 1, a = (j * TAU) / 10 + Math.PI / 2; return [r * C(a), r * S(a)]; };
  const p0 = pt(i), p1 = pt(i + 1);
  return [p0[0] + f * (p1[0] - p0[0]), p0[1] + f * (p1[1] - p0[1])];
};
export const SHAPES = [
  { name: 'cercle', f: (th: number) => [C(th), S(th)] },
  { name: 'étoile', f: star },
  { name: 'carré', f: (th: number) => [sp(C(th), 0.5), sp(S(th), 0.5)] }, // coins arrondis : à coins vifs, le rappel échoue pour certaines graines
  { name: 'huit', f: (th: number) => [S(th), 0.8 * S(2 * th)] },
];
export const MUS = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
const r2 = (v: number) => Math.round(v * 100) / 100;

export function shapesExperiment() {
  const rnd = makeRng(3);
  const P = SHAPES.map((s) => (n: number) => s.f((TAU * n) / T).map((v) => v * SC));
  const Win = zeros(N, D);
  for (const r of Win) for (let d = 0; d < D; d++) r[d] = 1.5 * gauss(rnd);
  const b = Float64Array.from({ length: N }, () => 0.2 * gauss(rnd));
  const Ws = zeros(N, N);
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) if (rnd() < 0.1) Ws[i][j] = gauss(rnd);
  let v = new Float64Array(N).fill(1 / Math.sqrt(N)), lg = 0;
  for (let k = 0; k < 300; k++) { v = matvec(Ws, v); const nr = Math.hypot(...v); lg += Math.log(nr); v = v.map((q) => q / nr); }
  const rho = Math.exp(lg / 300);
  for (const r of Ws) for (let j = 0; j < N; j++) r[j] *= 1.5 / rho;

  // conduite par chaque forme, puis lecture (ridge 0,01) et chargement (ridge 10⁻⁴), comme conceptors.ts
  const L = 1000, WO = 300, X: Float64Array[] = [], Xt: Float64Array[] = [], Pc: number[][] = [], Rs: Mat[] = [];
  P.forEach((p) => {
    let x = new Float64Array(N);
    const R = zeros(N, N);
    for (let n = 0; n < WO + L; n++) {
      const prev = x, u = p(n + 1);
      x = matvec(Ws, x).map((q, i) => { let s = q + b[i]; for (let d = 0; d < D; d++) s += Win[i][d] * u[d]; return Math.tanh(s); });
      if (n >= WO) {
        X.push(x); Xt.push(prev); Pc.push(u);
        for (let i = 0; i < N; i++) { const xi = x[i], Ri = R[i]; for (let j = 0; j < N; j++) Ri[j] += (xi * x[j]) / L; }
      }
    }
    Rs.push(R);
  });
  const XX = zeros(N, N), XP = zeros(N, D);
  X.forEach((q, k) => { for (let i = 0; i < N; i++) { const qi = q[i], r = XX[i]; for (let j = 0; j < N; j++) r[j] += qi * q[j]; for (let d = 0; d < D; d++) XP[i][d] += qi * Pc[k][d]; } });
  XX.forEach((r, i) => (r[i] += 0.01));
  const Wout = solve(XX, XP); // N × D
  const TT = zeros(N, N), TB = zeros(N, N);
  Xt.forEach((q, k) => {
    const tgt = X[k].map((xv, i) => Math.atanh(Math.max(-0.999999, Math.min(0.999999, xv))) - b[i]);
    for (let i = 0; i < N; i++) { const qi = q[i], r = TT[i], t = TB[i]; for (let j = 0; j < N; j++) { r[j] += qi * q[j]; t[j] += qi * tgt[j]; } }
  });
  TT.forEach((r, i) => (r[i] += 1e-4));
  const WT = solve(TT, TB), W = zeros(N, N);
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) W[i][j] = WT[j][i];
  const Cs = Rs.map((R) => solve(R.map((r, i) => { const q = Float64Array.from(r); q[i] += ALPHA ** -2; return q; }), R));

  // le réservoir tourne seul sous le conceptor (1 − μ) C_a + μ C_c ; μ constant, ou μ(n) qui varie au fil des pas (transition)
  const run = (a: number, c: number, mu: number | ((n: number) => number), steps: number, keep: number) => {
    const r = makeRng(5);
    const Cfix = typeof mu === 'number' ? Cs[a].map((row, i) => row.map((q, k) => (1 - mu) * q + mu * Cs[c][i][k])) : null;
    let x = Float64Array.from({ length: N }, () => 0.3 * gauss(r));
    const pts: number[][] = [];
    for (let n = 0; n < steps; n++) {
      const z = matvec(W, x).map((q, i) => Math.tanh(q + b[i]));
      if (Cfix) x = matvec(Cfix, z);
      else { const m = (mu as (n: number) => number)(n), xa = matvec(Cs[a], z), xc = matvec(Cs[c], z); x = xa.map((q, i) => (1 - m) * q + m * xc[i]); }
      if (n >= steps - keep) {
        const y = [0, 0];
        for (let i = 0; i < N; i++) for (let d = 0; d < D; d++) y[d] += x[i] * Wout[i][d];
        pts.push(y.map((q) => r2(q / SC)));
      }
    }
    return pts;
  };
  // régime établi : 4 derniers tours après 1500 pas
  const single = Cs.map((_, a) => run(a, a, 0, 1500, 4 * T));
  const mixes: Record<string, number[][]> = {};
  for (let a = 0; a < Cs.length; a++) for (let c = a + 1; c < Cs.length; c++) for (const mu of MUS)
    mixes[`${a}-${c}-${mu.toFixed(1)}`] = run(a, c, mu, 1500, 4 * T);
  // transitions A → B : 1500 pas sous C_A, puis on garde 1 tour sous C_A, 180 pas où μ passe linéairement de 0 à 1 (6 tours), 2 tours sous C_B
  const HA = T, TR = 6 * T, HB = 2 * T, W0 = 1500 - HA;
  const trans: Record<string, number[][]> = {};
  for (let a = 0; a < Cs.length; a++) for (let c = 0; c < Cs.length; c++)
    if (a !== c) trans[`${a}-${c}`] = run(a, c, (n) => Math.min(1, Math.max(0, (n - W0 - HA) / TR)), W0 + HA + TR + HB, HA + TR + HB);
  return { single, mixes, trans, T, TRANS: { HA, TR, HB } };
}

// un seul calcul par construction (et par processus du serveur de développement)
let cachedShapes: ReturnType<typeof shapesExperiment> | null = null;
export const getShapes = () => (cachedShapes ??= shapesExperiment());
