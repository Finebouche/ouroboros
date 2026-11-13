// Chapitre 3 (Preprocessing) : signaux d'essai et mesures communs aux figures et widgets du chapitre.
// Un essai = un bruit blanc gaussien (variance 1) + des raies (sinusoïdes de fréquence fixe, phase tirée au hasard).
// Niveau d'une raie : « dB re bruit dans 1 Hz » = 10 log10(puissance de la raie / densité spectrale du bruit),
// avec puissance = A²/2 et densité N0 = variance / (fs/2).
import { fft } from '../01-mfcc/dsp';

export const FS = 1024; // Hz ; les durées de trame 0,5 à 16 s donnent des puissances de 2

export const rng = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let r = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
  return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
};
export const gauss = (r: () => number) => {
  let u = 0;
  while (u === 0) u = r();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r());
};

export type Raie = { f0: number; niveau: number };
export type Essai = { fs: number; x: Float64Array; s: Float64Array; raies: Raie[] };

// amplitude d'une raie de niveau donné (dB re bruit dans 1 Hz) dans un bruit blanc de variance 1
export const amplitude = (niveau: number, fs = FS) => Math.sqrt((2 * 10 ** (niveau / 10)) / (fs / 2));

// x = bruit + raies ; s = les raies seules (la vérité, connue parce que l'essai est synthétique)
export function essai(raies: Raie[], dur: number, seed: number, fs = FS): Essai {
  const r = rng(seed), n = Math.round(dur * fs);
  const x = new Float64Array(n), s = new Float64Array(n);
  for (const { f0, niveau } of raies) {
    const A = amplitude(niveau, fs), ph = 2 * Math.PI * r(), w = (2 * Math.PI * f0) / fs;
    for (let i = 0; i < n; i++) s[i] += A * Math.cos(w * i + ph);
  }
  for (let i = 0; i < n; i++) x[i] = s[i] + gauss(r);
  return { fs, x, s, raies };
}

export type Tfct = { re: Float64Array[]; im: Float64Array[]; f: Float64Array; df: number; k0: number };

// TFCT : fenêtre de Hann normalisée à énergie unité, recouvrement de 50 %, trames de `seg` secondes (seg·fs = puissance de 2).
// On ne garde que les cases de fmin à fmax. re[trame][case], im[trame][case] ; k0 = indice absolu de la première case gardée.
export function tfct(x: ArrayLike<number>, seg: number, fmin = 0, fmax = Infinity, fs = FS): Tfct {
  const L = Math.round(seg * fs), hop = L / 2, df = fs / L;
  const k0 = Math.max(0, Math.ceil(fmin / df)), k1 = Math.min(L / 2, Math.floor(fmax / df));
  const w = new Float64Array(L);
  let e = 0;
  for (let m = 0; m < L; m++) { w[m] = 0.5 - 0.5 * Math.cos((2 * Math.PI * m) / L); e += w[m] * w[m]; }
  for (let m = 0; m < L; m++) w[m] /= Math.sqrt(e);
  const re: Float64Array[] = [], im: Float64Array[] = [];
  for (let t = 0; t + L <= x.length; t += hop) {
    const a = new Float64Array(L), b = new Float64Array(L);
    for (let m = 0; m < L; m++) a[m] = x[t + m] * w[m];
    fft(a, b);
    re.push(a.slice(k0, k1 + 1)); im.push(b.slice(k0, k1 + 1));
  }
  return { re, im, f: Float64Array.from({ length: k1 - k0 + 1 }, (_, k) => (k0 + k) * df), df, k0 };
}

// Périodogramme moyenné (Welch) : moyenne de |X|² sur les trames entièrement contenues dans les T premières secondes.
export function welch(x: ArrayLike<number>, seg: number, T: number, fmin = 0, fmax = Infinity, fs = FS) {
  const n = Math.min(x.length, Math.round(T * fs));
  const X = tfct(Array.prototype.slice.call(x, 0, n), seg, fmin, fmax, fs);
  const S = new Float64Array(X.f.length);
  X.re.forEach((r, t) => { for (let k = 0; k < S.length; k++) S[k] += (r[k] * r[k] + X.im[t][k] * X.im[t][k]) / X.re.length; });
  return { f: X.f, S, trames: X.re.length, df: X.df };
}

const mediane = (v: number[]) => { const s = [...v].sort((a, b) => a - b), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

// Contraste d'une fréquence f0 dans un spectre de détection S : maximum dans la fenêtre |f − f0| ≤ hw,
// rapporté à la médiane de l'anneau hw + garde ≤ |f − f0| ≤ outer. En dB (rapport), ou en différence pour un masque.
export function contraste(f: ArrayLike<number>, S: ArrayLike<number>, f0: number, kind: 'ratio' | 'diff' = 'ratio', hw = 0.3, garde = 0.25, outer = 3): number {
  let pic = -Infinity, best = Infinity, near = 0;
  const ring: number[] = [];
  for (let k = 0; k < f.length; k++) {
    const d = Math.abs(f[k] - f0);
    if (d < best) { best = d; near = S[k]; }
    if (d <= hw) pic = Math.max(pic, S[k]);
    else if (d >= hw + garde && d <= outer) ring.push(S[k]);
  }
  if (pic === -Infinity) pic = near;
  if (ring.length < 2) return NaN;
  const ref = mediane(ring);
  return kind === 'ratio' ? 10 * Math.log10(pic / ref) : pic - ref;
}

// AUC (Mann-Whitney) : probabilité qu'une fréquence avec raie ait un contraste supérieur à celui d'une fréquence témoin. 0,5 = hasard.
export function auc(avec: number[], temoins: number[]): number {
  let s = 0;
  for (const a of avec) for (const b of temoins) s += a > b ? 1 : a === b ? 0.5 : 0;
  return s / (avec.length * temoins.length);
}
