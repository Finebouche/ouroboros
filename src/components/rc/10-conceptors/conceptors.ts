// Cours Reservoir computing, chapitre 10 : l'expérience « quatre motifs » de Jaeger (Controlling Recurrent Neural Networks by Conceptors, 2014,
// sections 3.2 à 3.4, 3.7 et 4.1), recalculée ici à la construction du site (graine fixe) :
// N = 100 ; W_in ~ N(0, 1) × 1,5 ; b ~ N(0, 1) × 0,2 ; W* creuse (10 %), rayon spectral 1,5 ;
// quatre motifs (sinus de périodes 8,8342 et 9,8342, un motif 5-périodique aléatoire et une variante) ;
// 500 pas d'amorçage puis L = 1000 pas collectés par motif ; W_out et W par régression ridge (0,01 et 10⁻⁴) ;
// conceptors C_j = R_j (R_j + α⁻² I)⁻¹ ; rappel x(n+1) = C tanh(W x(n) + b), y(n) = W_out x(n).

export const N = 100;
type Mat = Float64Array[];

export function makeRng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let r = Math.imul(s ^ (s >>> 15), 1 | s);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
export const gauss = (rnd: () => number) => Math.sqrt(-2 * Math.log(rnd() + 1e-12)) * Math.cos(2 * Math.PI * rnd());
export const zeros = (r: number, c: number): Mat => Array.from({ length: r }, () => new Float64Array(c));
export const matvec = (A: Mat, x: Float64Array) => {
  const y = new Float64Array(A.length);
  for (let i = 0; i < A.length; i++) { const a = A[i]; let s = 0; for (let j = 0; j < x.length; j++) s += a[j] * x[j]; y[i] = s; }
  return y;
};
// résout A X = B (élimination de Gauss avec pivot partiel)
export function solve(A: Mat, B: Mat): Mat {
  const n = A.length, m = B[0].length;
  const M = A.map((r, i) => { const row = new Float64Array(n + m); row.set(r, 0); row.set(B[i], n); return row; });
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let i = c + 1; i < n; i++) if (Math.abs(M[i][c]) > Math.abs(M[p][c])) p = i;
    [M[c], M[p]] = [M[p], M[c]];
    const piv = M[c][c];
    for (let i = 0; i < n; i++) {
      if (i === c) continue;
      const f = M[i][c] / piv;
      if (!f) continue;
      const ri = M[i], rc = M[c];
      for (let j = c; j < n + m; j++) ri[j] -= f * rc[j];
    }
  }
  return M.map((r, i) => { const out = new Float64Array(m); for (let j = 0; j < m; j++) out[j] = r[n + j] / r[i]; return out; });
}
// rayon spectral estimé par la croissance de ‖W^k x‖
function specRad(W: Mat) {
  let x = new Float64Array(N).fill(1 / Math.sqrt(N)), lg = 0;
  const K = 300;
  for (let k = 0; k < K; k++) { x = matvec(W, x); const nr = Math.hypot(...x); lg += Math.log(nr); x = x.map((v) => v / nr); }
  return Math.exp(lg / K);
}
// valeurs propres d'une matrice symétrique (méthode de Jacobi), triées par ordre décroissant
export function eigSym(A: Mat): number[] {
  const n = A.length, a = A.map((r) => Float64Array.from(r));
  for (let sweep = 0; sweep < 60; sweep++) {
    let off = 0;
    for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) off += a[p][q] ** 2;
    if (off < 1e-22) break;
    for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) {
      if (Math.abs(a[p][q]) < 1e-30) continue;
      const th = (a[q][q] - a[p][p]) / (2 * a[p][q]);
      const t = Math.sign(th || 1) / (Math.abs(th) + Math.sqrt(th * th + 1));
      const c = 1 / Math.sqrt(t * t + 1), s = t * c;
      for (let k = 0; k < n; k++) { const akp = a[k][p], akq = a[k][q]; a[k][p] = c * akp - s * akq; a[k][q] = s * akp + c * akq; }
      for (let k = 0; k < n; k++) { const apk = a[p][k], aqk = a[q][k]; a[p][k] = c * apk - s * aqk; a[q][k] = s * apk + c * aqk; }
    }
  }
  return a.map((r, i) => Math.max(0, r[i])).sort((x, y) => y - x);
}

export function experiment(seed = 1) {
  const rnd = makeRng(seed);
  const Win = Float64Array.from({ length: N }, () => 1.5 * gauss(rnd));
  const b = Float64Array.from({ length: N }, () => 0.2 * gauss(rnd));
  const Ws = zeros(N, N);
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) if (rnd() < 0.1) Ws[i][j] = gauss(rnd);
  const rho = specRad(Ws);
  for (const row of Ws) for (let j = 0; j < N; j++) row[j] *= 1.5 / rho;
  const r3 = Array.from({ length: 5 }, () => rnd() * 2 - 1), mx = Math.max(...r3.map(Math.abs));
  const p3v = r3.map((v) => (0.9 * v) / mx);
  const p4v = p3v.slice(); p4v[2] = p4v[2] * 0.4 + (p4v[2] > 0 ? -0.2 : 0.2); // variante : une seule valeur modifiée
  const P = [(n: number) => Math.sin((2 * Math.PI * n) / 8.8342), (n: number) => Math.sin((2 * Math.PI * n) / 9.8342), (n: number) => p3v[n % 5], (n: number) => p4v[n % 5]];

  // conduite par chaque motif ; X : états, Xt : états du pas précédent, Pc : motif
  const L = 1000, WO = 500, X: Float64Array[] = [], Xt: Float64Array[] = [], Pc: number[] = [], Rs: Mat[] = [];
  P.forEach((p) => {
    let x = new Float64Array(N);
    const R = zeros(N, N);
    for (let n = 0; n < WO + L; n++) {
      const prev = x;
      x = matvec(Ws, x).map((v, i) => Math.tanh(v + Win[i] * p(n + 1) + b[i]));
      if (n >= WO) {
        X.push(x); Xt.push(prev); Pc.push(p(n + 1));
        for (let i = 0; i < N; i++) { const xi = x[i], Ri = R[i]; for (let j = 0; j < N; j++) Ri[j] += (xi * x[j]) / L; }
      }
    }
    Rs.push(R);
  });
  // lecture : W_out = (X X' + 0,01 I)⁻¹ X P'
  const XX = zeros(N, N), XP = zeros(N, 1);
  X.forEach((v, k) => { for (let i = 0; i < N; i++) { const vi = v[i], r = XX[i]; for (let j = 0; j < N; j++) r[j] += vi * v[j]; XP[i][0] += vi * Pc[k]; } });
  XX.forEach((r, i) => (r[i] += 0.01));
  const Wout = solve(XX, XP).map((r) => r[0]);
  // chargement : W = argmin Σ ‖W x(n−1) − (atanh x(n) − b)‖² + 10⁻⁴ ‖W‖²
  const TT = zeros(N, N), TB = zeros(N, N);
  Xt.forEach((v, k) => {
    const tgt = X[k].map((xv, i) => Math.atanh(Math.max(-0.999999, Math.min(0.999999, xv))) - b[i]);
    for (let i = 0; i < N; i++) { const vi = v[i], r = TT[i], q = TB[i]; for (let j = 0; j < N; j++) { r[j] += vi * v[j]; q[j] += vi * tgt[j]; } }
  });
  TT.forEach((r, i) => (r[i] += 1e-4));
  const WT = solve(TT, TB), W = zeros(N, N);
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) W[i][j] = WT[j][i];

  const conceptor = (R: Mat, alpha: number) => solve(R.map((r, i) => { const q = Float64Array.from(r); q[i] += alpha ** -2; return q; }), R);
  const mix = (A: Mat, B: Mat, mu: number) => A.map((r, i) => r.map((v, k) => (1 - mu) * v + mu * B[i][k]));
  // rappel autonome (sans entrée), départ aléatoire fixe
  const run = (C: Mat | null, steps = 700) => {
    const r = makeRng(5);
    let x = Float64Array.from({ length: N }, () => 0.5 * gauss(r));
    const ys: number[] = [];
    for (let n = 0; n < steps; n++) {
      const a = matvec(W, x).map((v, i) => Math.tanh(v + b[i]));
      x = C ? matvec(C, a) : a;
      ys.push(x.reduce((s, xi, i) => s + xi * Wout[i], 0));
    }
    return ys;
  };
  return { P, Rs, conceptor, mix, run };
}

// écart quadratique normalisé au motif, après le meilleur décalage de phase (en pas entiers) sur une fenêtre de len pas
export function aligned(y: number[], p: (n: number) => number, len = 40) {
  const tgt = Array.from({ length: len }, (_, n) => p(n)), m = tgt.reduce((a, c) => a + c, 0) / len;
  const vt = tgt.reduce((a, t) => a + (t - m) ** 2, 0);
  let best = Infinity, shift = 0;
  for (let k = 0; k < 100; k++) {
    let e = 0;
    for (let n = 0; n < len; n++) e += (y[y.length - len - 100 + k + n] - tgt[n]) ** 2;
    const r = Math.sqrt(e / vt);
    if (r < best) { best = r; shift = k; }
  }
  return { nrmse: best, seg: y.slice(y.length - len - 100 + shift, y.length - 100 + shift), tgt };
}
// période moyenne, par les passages à zéro montants (interpolés) des 300 derniers pas
export function period(y: number[]) {
  const z: number[] = [];
  for (let n = y.length - 300; n < y.length - 1; n++) if (y[n] < 0 && y[n + 1] >= 0) z.push(n - y[n] / (y[n + 1] - y[n]));
  return z.length > 1 ? (z[z.length - 1] - z[0]) / (z.length - 1) : NaN;
}

// une seule expérience par construction du site, partagée par les widgets du chapitre
let cached: ReturnType<typeof experiment> | null = null;
export const getExperiment = () => (cached ??= experiment(1));
