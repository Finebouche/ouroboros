// Outils de traitement du signal partagés par les widgets du chapitre MFCC (rien d'optimisé : les signaux font quelques milliers de valeurs).

export const nextPow2 = (n: number) => 2 ** Math.ceil(Math.log2(n));

// FFT en place, radix 2 (la longueur doit être une puissance de 2).
export function fft(re: Float64Array, im: Float64Array) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const a = i + k, b = i + k + len / 2;
        const tr = re[b] * cr - im[b] * ci, ti = re[b] * ci + im[b] * cr;
        re[b] = re[a] - tr; im[b] = im[a] - ti;
        re[a] += tr; im[a] += ti;
        const nr = cr * wr - ci * wi;
        ci = cr * wi + ci * wr;
        cr = nr;
      }
    }
  }
}

export type WindowName = 'rect' | 'hamming' | 'hann';
export const WINDOW_LABELS: Record<WindowName, string> = { rect: 'Rectangulaire', hamming: 'Hamming', hann: 'Hann' };

// Fenêtres symétriques de L points.
export function windowOf(name: WindowName, L: number): Float64Array {
  const w = new Float64Array(L);
  for (let m = 0; m < L; m++) {
    const c = Math.cos((2 * Math.PI * m) / (L - 1));
    w[m] = name === 'rect' ? 1 : name === 'hamming' ? 0.54 - 0.46 * c : 0.5 - 0.5 * c;
  }
  return w;
}

// y[n] = x[n] − a·x[n−1]
export function preemphasis(x: ArrayLike<number>, a = 0.97): Float32Array {
  const y = new Float32Array(x.length);
  y[0] = x[0];
  for (let n = 1; n < x.length; n++) y[n] = x[n] - a * x[n - 1];
  return y;
}

// Spectre de puissance |X[k]|², k = 0 … nfft/2, d'une trame déjà fenêtrée (complétée par des zéros jusqu'à nfft).
export function powerSpectrum(frame: ArrayLike<number>, nfft: number): Float64Array {
  if ((nfft & (nfft - 1)) !== 0) return naivePower(frame, nfft); // longueur qui n'est pas une puissance de 2 (ex. 100)
  const re = new Float64Array(nfft), im = new Float64Array(nfft);
  for (let i = 0; i < frame.length && i < nfft; i++) re[i] = frame[i];
  fft(re, im);
  const p = new Float64Array(nfft / 2 + 1);
  for (let k = 0; k < p.length; k++) p[k] = re[k] * re[k] + im[k] * im[k];
  return p;
}

// DFT directe pour une longueur quelconque (O(n²), réservée aux petites longueurs).
function naivePower(frame: ArrayLike<number>, nfft: number): Float64Array {
  const p = new Float64Array(Math.floor(nfft / 2) + 1);
  for (let k = 0; k < p.length; k++) {
    let re = 0, im = 0;
    for (let m = 0; m < frame.length && m < nfft; m++) {
      const a = (-2 * Math.PI * k * m) / nfft;
      re += frame[m] * Math.cos(a);
      im += frame[m] * Math.sin(a);
    }
    p[k] = re * re + im * im;
  }
  return p;
}
