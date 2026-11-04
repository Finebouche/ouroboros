// Cours Reservoir computing, chapitre 11 : chargement des chorégraphies du banc (modes.ts) dans un réservoir, à la construction du site.
// Mêmes étapes que conceptors.ts (Jaeger 2014) : conduite par chaque motif, lecture W_out (ridge 0,01), chargement de W (ridge 10⁻⁴),
// un conceptor par motif C_j = R_j (R_j + α⁻² I)⁻¹, gardé sous forme réduite U_j diag(s_j) U_jᵀ (directions où s > 10⁻³ : au plus T,
// car un cycle de T pas ne visite que T états). Réglages retenus après simulation (300 neurones, rayon spectral 1, entrée × 0,8, α = 20) :
// sur trois tirages, les dix modes sont rappelés, aucun mélange de deux conceptors ne s'arrête et les 90 transitions aboutissent.
// Poids envoyés au navigateur en entiers 16 bits (échelle par ligne ou par colonne) : même résultat qu'en Float64, à 10⁻² près sur l'écart.
import { matvec, addOuterSym, symmetrize, addOuter, solveSPD, symEig } from './linalg';
import { MODES, pattern, M, T, D, IQ } from './modes';
import { unpack, step, readout, order, type Packed } from './model';
import { makeRng, gauss } from '../conceptors';

const N = 300, SEED = 1, SIN = 0.8, SB = 0.2, RHO = 1, ALPHA = 20, SC = 0.5, L = 1000, WO = 300, R_W = 1e-4, R_OUT = 0.01, S_MIN = 1e-3;

function train() {
  const K = MODES.length, rnd = makeRng(SEED);
  const Win = new Float64Array(N * D);
  for (let i = 0; i < N * D; i++) Win[i] = SIN * gauss(rnd);
  const b = Float64Array.from({ length: N }, () => SB * gauss(rnd));
  const Ws = new Float64Array(N * N);
  for (let i = 0; i < N * N; i++) if (rnd() < 0.1) Ws[i] = gauss(rnd);
  // rayon spectral estimé par la croissance de ‖W* v‖ (après 100 pas de mise en route)
  let v = new Float64Array(N).fill(1 / Math.sqrt(N)), lg = 0;
  for (let k = 0; k < 400; k++) { v = matvec(Ws, N, N, v); const nr = Math.hypot(...v); if (k >= 100) lg += Math.log(nr); v = v.map((q) => q / nr); }
  const rho = Math.exp(lg / 300);
  for (let i = 0; i < N * N; i++) Ws[i] *= RHO / rho;

  const XX = new Float64Array(N * N), XP = new Float64Array(N * D), TT = new Float64Array(N * N), TB = new Float64Array(N * N);
  const Rs: Float64Array[] = [], x0: Float64Array[] = [];
  const pre = new Float64Array(N), u = new Float64Array(D), tgt = new Float64Array(N);
  for (let j = 0; j < K; j++) {
    let x = new Float64Array(N);
    const R = new Float64Array(N * N);
    for (let n = 0; n < WO + L; n++) {
      pattern(j, n + 1, u);
      for (let d = 0; d < D; d++) u[d] *= SC;
      matvec(Ws, N, N, x, pre);
      const xn = new Float64Array(N);
      for (let i = 0; i < N; i++) {
        let s = pre[i] + b[i];
        const o = i * D;
        for (let d = 0; d < D; d++) s += Win[o + d] * u[d];
        xn[i] = Math.tanh(s);
      }
      if (n >= WO) {
        addOuterSym(XX, N, xn);
        addOuter(XP, N, D, xn, u);
        addOuterSym(R, N, xn, 1 / L);
        // cible du chargement : W x(n) ≈ W* x(n) + W_in p(n+1), l'entrée de tanh sans le biais
        for (let i = 0; i < N; i++) tgt[i] = Math.atanh(Math.max(-0.999999, Math.min(0.999999, xn[i]))) - b[i];
        addOuterSym(TT, N, x);
        addOuter(TB, N, N, x, tgt);
      }
      x = xn;
    }
    x0.push(x);
    symmetrize(R, N);
    Rs.push(R);
  }
  symmetrize(XX, N); symmetrize(TT, N);
  const WoutT = solveSPD(XX, N, XP, D, R_OUT);
  const WT = solveSPD(TT, N, TB, N, R_W);
  const W = new Float64Array(N * N);
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) W[i * N + j] = WT[j * N + i];
  const a2 = ALPHA ** -2;
  const C = Rs.map((R) => {
    const { vals, vecs } = symEig(R, N);
    const keep: number[] = [];
    for (let i = 0; i < N; i++) { const sv = Math.max(0, vals[i]); if (sv / (sv + a2) > S_MIN) keep.push(i); }
    const r = keep.length, U = new Float64Array(N * r), s = keep.map((i) => vals[i] / (vals[i] + a2));
    keep.forEach((src, c) => { for (let k = 0; k < N; k++) U[k * r + c] = vecs[k * N + src]; });
    return { r, s, U };
  });
  return { W, b, WoutT, C, x0 };
}

// tableau → entiers 16 bits en base 64, avec une échelle par ligne (byRow) ou par colonne
const b64 = (a: Int16Array) => Buffer.from(a.buffer, a.byteOffset, a.byteLength).toString('base64');
function quant(A: Float64Array, rows: number, cols: number, perRow: boolean) {
  const n = perRow ? rows : cols, scale = new Array(n).fill(0), q = new Int16Array(rows * cols);
  for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) { const k = perRow ? i : j; scale[k] = Math.max(scale[k], Math.abs(A[i * cols + j])); }
  for (let k = 0; k < n; k++) scale[k] = scale[k] / 32767 || 1;
  for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) q[i * cols + j] = Math.round(A[i * cols + j] / scale[perRow ? i : j]);
  return { scale, q: b64(q) };
}

function build(): Packed {
  const t = train();
  const p: Packed = {
    N, D, M, T, IQ, SC,
    keys: MODES.map((m) => m.key), names: MODES.map((m) => m.name), predator: MODES.map((m) => m.predator),
    b: Array.from(t.b),
    W: quant(t.W, N, N, true),
    Wout: quant(t.WoutT, N, D, false),
    C: t.C.map((c) => ({ r: c.r, s: c.s, ...quant(c.U, N, c.r, false) })),
    x0: t.x0.map((x) => { const { scale, q } = quant(x, 1, N, true); return { scale: scale[0], q }; }),
    ref: [],
  };
  // référence de chaque mode, calculée avec le modèle tel que le navigateur le reçoit : paramètres d'ordre moyens sur une période
  // et écart au motif (NRMSE des positions, meilleur décalage de phase)
  const m = unpack(p), K = MODES.length;
  p.ref = MODES.map((_, j) => {
    const w = new Float64Array(K); w[j] = 1;
    let x = Float64Array.from(m.x0[j]), xn = new Float64Array(N);
    const ys: Float64Array[] = [];
    for (let n = 0; n < 300; n++) { step(m, x, w, xn); [x, xn] = [xn, x]; if (n >= 300 - T - 2) ys.push(readout(m, x)); }
    let P = 0, Mr = 0, R = 0;
    for (let n = 1; n <= T; n++) { const o = order(ys[n - 1], ys[n], ys[n + 1], M); P += o.P / T; Mr += o.Mr / T; R += o.R / T; }
    let err = Infinity;
    for (let sh = 0; sh < T; sh++) {
      let e = 0, v2 = 0;
      for (let n = 0; n < T; n++) { const pt = pattern(j, n + sh); for (let d = 0; d < 2 * M; d++) { e += (ys[n + 1][d] - pt[d]) ** 2; v2 += pt[d] ** 2; } }
      err = Math.min(err, Math.sqrt(e / v2));
    }
    const r3 = (q: number) => Math.round(q * 1000) / 1000;
    return { P: r3(P), M: r3(Mr), R: r3(R), err: r3(err) };
  });
  return p;
}

// un seul calcul par construction (et par processus du serveur de développement)
let cached: Packed | null = null;
export const getBanc = () => (cached ??= build());
