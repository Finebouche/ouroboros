// Outils Mel / DCT partagés par les widgets des sections 4 et 5 du chapitre MFCC (formule de Mel de HTK, filtres triangulaires sans normalisation).
import { SR } from './signal';
import { nextPow2, windowOf, powerSpectrum } from './dsp';

export const hz2mel = (f: number) => 2595 * Math.log10(1 + f / 700);
export const mel2hz = (m: number) => 700 * (Math.pow(10, m / 2595) - 1);

// M filtres triangulaires entre 0 et sr/2, sur nfft/2 + 1 cases.
export function melFilterbank(M: number, nfft: number, sr = SR): Float64Array[] {
  const pts: number[] = [];
  for (let i = 0; i < M + 2; i++) pts.push(mel2hz((i / (M + 1)) * hz2mel(sr / 2)));
  const nb = nfft / 2 + 1, df = sr / nfft;
  const H: Float64Array[] = [];
  for (let m = 1; m <= M; m++) {
    const lo = pts[m - 1], c = pts[m], hi = pts[m + 1];
    const h = new Float64Array(nb);
    for (let k = 0; k < nb; k++) {
      const f = k * df;
      h[k] = Math.max(0, Math.min((f - lo) / (c - lo), (hi - f) / (hi - c)));
    }
    H.push(h);
  }
  return H;
}

// Énergies de Mel d'une trame de 25 ms (Hamming, FFT 512) commençant à t0 ms, pour un signal x.
export function melEnergiesAt(x: ArrayLike<number>, t0Ms: number, M = 40, gain = 1): number[] {
  const L = Math.round((25 * SR) / 1000), nfft = nextPow2(L);
  const w = windowOf('hamming', L);
  const s0 = Math.round((t0Ms * SR) / 1000);
  const fr = new Float64Array(L);
  for (let i = 0; i < L; i++) fr[i] = x[s0 + i] * w[i] * gain;
  const P = powerSpectrum(fr, nfft);
  return melFilterbank(M, nfft).map((h) => h.reduce((a, v, k) => a + v * P[k], 0));
}

// DCT-II orthonormale : c_n = s_n Σ_m v_m cos(π n (m + ½) / M), s_0 = √(1/M), s_n = √(2/M).
export function dct2(v: number[]): number[] {
  const M = v.length;
  return Array.from({ length: M }, (_, n) => {
    const s = n === 0 ? Math.sqrt(1 / M) : Math.sqrt(2 / M);
    return s * v.reduce((a, x, m) => a + x * Math.cos((Math.PI * n * (m + 0.5)) / M), 0);
  });
}

// Reconstruction à partir des K premiers coefficients.
export function idctK(c: number[], K: number): number[] {
  const M = c.length;
  return Array.from({ length: M }, (_, m) => {
    let a = 0;
    for (let n = 0; n < Math.min(K, M); n++) {
      const s = n === 0 ? Math.sqrt(1 / M) : Math.sqrt(2 / M);
      a += s * c[n] * Math.cos((Math.PI * n * (m + 0.5)) / M);
    }
    return a;
  });
}

// MFCC de toutes les trames (25 ms toutes les 10 ms, Hamming, FFT 512, M filtres de Mel, ln, DCT, K premiers coefficients).
export function mfccFrames(x: ArrayLike<number>, K = 13, M = 40): number[][] {
  const L = Math.round((25 * SR) / 1000), HOP = Math.round((10 * SR) / 1000), nfft = nextPow2(L);
  const w = windowOf('hamming', L), H = melFilterbank(M, nfft);
  const n = 1 + Math.floor((x.length - L) / HOP);
  return Array.from({ length: n }, (_, j) => {
    const fr = new Float64Array(L);
    for (let i = 0; i < L; i++) fr[i] = x[j * HOP + i] * w[i];
    const P = powerSpectrum(fr, nfft);
    const logE = H.map((h) => Math.log(Math.max(h.reduce((a, v, k) => a + v * P[k], 0), 1e-12)));
    return dct2(logE).slice(0, K);
  });
}

// Delta d'une suite : Σ n (c[t+n] − c[t−n]) / (2 Σ n²), bords répétés.
export function delta(c: number[], N = 2): number[] {
  const den = 2 * Array.from({ length: N }, (_, i) => (i + 1) ** 2).reduce((a, b) => a + b, 0);
  const at = (i: number) => c[Math.max(0, Math.min(c.length - 1, i))];
  return c.map((_, t) => {
    let a = 0;
    for (let n = 1; n <= N; n++) a += n * (at(t + n) - at(t - n));
    return a / den;
  });
}
