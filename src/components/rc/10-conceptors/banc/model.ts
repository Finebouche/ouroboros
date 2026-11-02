// Cours Reservoir computing, chapitre 10 : le réservoir du banc de poissons, côté exécution. Ce module tourne dans le navigateur
// (le widget fait tourner le réservoir en direct) et dans Node (vérifications) : même code, mêmes poids.
// Poids transmis en entiers 16 bits avec une échelle par ligne ou par colonne (train.ts), reconstruits ici en Float64.
// Rappel : x(n+1) = Σ_j w_j C_j tanh(W x(n) + b), avec C_j = U_j diag(s_j) U_jᵀ (conceptor réduit à ses directions utiles), y = W_out x.

export type Packed = {
  N: number; D: number; M: number; T: number; IQ: number; SC: number;
  keys: string[]; names: string[]; predator: boolean[];
  b: number[];
  W: { scale: number[]; q: string }; // N × N, échelle par ligne
  Wout: { scale: number[]; q: string }; // N × D (y = Woutᵀ x), échelle par colonne
  C: { r: number; s: number[]; scale: number[]; q: string }[]; // U : N × r, échelle par colonne
  x0: { scale: number; q: string }[]; // un état de départ par mode, pris sur son cycle
  ref: { P: number; M: number; R: number; err: number }[]; // chaque mode rappelé seul : paramètres d'ordre moyens, écart au motif
};

export type Model = {
  N: number; D: number; M: number; T: number; IQ: number; SC: number; K: number;
  keys: string[]; names: string[]; predator: boolean[];
  W: Float64Array; b: Float64Array; WoutT: Float64Array;
  C: { r: number; s: Float64Array; U: Float64Array }[];
  x0: Float64Array[];
  ref: Packed['ref'];
  z: Float64Array; c: Float64Array; // tampons de calcul
};

// entiers 16 bits (petit-boutiste) en base 64 ↔ tableau
const decode = (q: string): Int16Array => {
  const bin = typeof atob === 'function' ? atob(q) : Buffer.from(q, 'base64').toString('binary');
  const u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  return new Int16Array(u8.buffer);
};
const byRow = (q: string, scale: number[], rows: number, cols: number) => {
  const a = decode(q), out = new Float64Array(rows * cols);
  for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) out[i * cols + j] = a[i * cols + j] * scale[i];
  return out;
};
const byCol = (q: string, scale: number[], rows: number, cols: number) => {
  const a = decode(q), out = new Float64Array(rows * cols);
  for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) out[i * cols + j] = a[i * cols + j] * scale[j];
  return out;
};

export function unpack(p: Packed): Model {
  const { N, D } = p;
  const C = p.C.map((c) => ({ r: c.r, s: Float64Array.from(c.s), U: byCol(c.q, c.scale, N, c.r) }));
  return {
    N, D, M: p.M, T: p.T, IQ: p.IQ, SC: p.SC, K: p.C.length, keys: p.keys, names: p.names, predator: p.predator,
    W: byRow(p.W.q, p.W.scale, N, N), b: Float64Array.from(p.b), WoutT: byCol(p.Wout.q, p.Wout.scale, N, D),
    C, x0: p.x0.map((x) => { const a = decode(x.q); return Float64Array.from(a, (v) => v * x.scale); }),
    ref: p.ref, z: new Float64Array(N), c: new Float64Array(Math.max(...C.map((q) => q.r))),
  };
}

// un pas de rappel : out ← Σ_j w_j C_j tanh(W x + b) ; w : poids des conceptors (somme 1 en général)
export function step(m: Model, x: Float64Array, w: ArrayLike<number>, out: Float64Array) {
  const { N, W, b, z, c } = m;
  for (let i = 0; i < N; i++) {
    let s = b[i];
    const o = i * N;
    for (let j = 0; j < N; j++) s += W[o + j] * x[j];
    z[i] = Math.tanh(s);
  }
  out.fill(0);
  for (let j = 0; j < m.K; j++) {
    const wj = w[j];
    if (!wj) continue;
    const { U, s, r } = m.C[j];
    c.fill(0, 0, r);
    for (let k = 0; k < N; k++) { const zk = z[k], o = k * r; for (let q = 0; q < r; q++) c[q] += U[o + q] * zk; }
    for (let q = 0; q < r; q++) c[q] *= s[q] * wj;
    for (let k = 0; k < N; k++) { let a = 0; const o = k * r; for (let q = 0; q < r; q++) a += U[o + q] * c[q]; out[k] += a; }
  }
  return out;
}

// sortie lue : y = W_outᵀ x, remise à l'échelle du bassin
export function readout(m: Model, x: Float64Array, y = new Float64Array(m.D)) {
  const { N, D, WoutT, SC } = m;
  y.fill(0);
  for (let i = 0; i < N; i++) { const xi = x[i]; if (!xi) continue; const o = i * D; for (let d = 0; d < D; d++) y[d] += xi * WoutT[o + d]; }
  for (let d = 0; d < D; d++) y[d] /= SC;
  return y;
}

// paramètres d'ordre d'un banc à un pas, à partir des positions au pas précédent, courant et suivant (vitesses par différence centrée) :
// polarisation P = |moyenne des directions de nage| ; rotation M = |moyenne de r̂_i × û_i|, r̂_i direction du centre du groupe vers le poisson i ;
// R = distance moyenne au centre du groupe.
export function order(prev: ArrayLike<number>, cur: ArrayLike<number>, next: ArrayLike<number>, M: number) {
  let cx = 0, cy = 0;
  for (let i = 0; i < M; i++) { cx += cur[2 * i] / M; cy += cur[2 * i + 1] / M; }
  let px = 0, py = 0, mz = 0, R = 0;
  for (let i = 0; i < M; i++) {
    const vx = next[2 * i] - prev[2 * i], vy = next[2 * i + 1] - prev[2 * i + 1], v = Math.hypot(vx, vy) || 1e-12;
    const ux = vx / v, uy = vy / v, rx = cur[2 * i] - cx, ry = cur[2 * i + 1] - cy, r = Math.hypot(rx, ry) || 1e-12;
    px += ux; py += uy; mz += (rx / r) * uy - (ry / r) * ux; R += r;
  }
  return { P: Math.hypot(px, py) / M, Mr: Math.abs(mz) / M, R: R / M };
}
