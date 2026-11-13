// Chapitre 3, introduction et section 1 (la référence : périodogramme moyenné). Réglages et calculs communs à ChaineFigure et IntegrationWidget.
import { FS, rng, gauss, amplitude, tfct, contraste } from './raies';

export const F0 = 150.1; // Hz : fréquence de la raie des figures (pas au centre d'une case : cas ordinaire)
export const SEG = 4; // s : durée de trame de la référence (cases de 0,25 Hz)
export const DUR = 60; // s : durée d'un essai

// nombre de trames (recouvrement 50 %) entièrement contenues dans les T premières secondes
export const nTrames = (T: number, seg = SEG, fs = FS) => { const L = Math.round(seg * fs), n = Math.round(T * fs); return n < L ? 0 : Math.floor((n - L) / (L / 2)) + 1; };

// Périodogrammes moyennés (Welch) des T premières secondes, pour plusieurs T à la fois : une seule TFCT, moyenne des premières trames.
// Mêmes trames et mêmes valeurs que welch(x, seg, T) de raies.ts.
export function welchCumul(x: ArrayLike<number>, seg: number, Ts: number[], fmin = 0, fmax = Infinity, fs = FS) {
  const X = tfct(x, seg, fmin, fmax, fs), nf = X.f.length;
  const S = Ts.map((T) => {
    const K = Math.min(X.re.length, nTrames(T, seg, fs)), s = new Float64Array(nf);
    for (let t = 0; t < K; t++) for (let k = 0; k < nf; k++) s[k] += (X.re[t][k] ** 2 + X.im[t][k] ** 2) / K;
    return s;
  });
  return { f: X.f, S, df: X.df };
}

export const dB = (v: number) => 10 * Math.log10(v);
export const HW = 0.3, GARDE = 0.25, OUTER = 3; // fenêtre, garde et anneau du contraste : réglages par défaut de contraste() (raies.ts)
const quantile = (v: number[], q: number) => { const s = [...v].sort((a, b) => a - b), i = q * (s.length - 1), a = Math.floor(i); return s[a] + (s[Math.min(s.length - 1, a + 1)] - s[a]) * (i - a); };

// Banc de la référence : ce que vaut le périodogramme moyenné sur beaucoup d'essais, par durée de trame, durée d'observation T et niveau de raie.
// Un essai = 60 s de bruit blanc ; 40 emplacements tous les 7,5 Hz entre 100 et 400 Hz, chacun décalé au hasard de ±0,5 Hz (position quelconque
// dans la case) ; 20 emplacements tirés au hasard portent une raie (phase au hasard), les 20 autres sont des fréquences témoins.
// Les raies de tous les niveaux sont les mêmes sinusoïdes, à l'amplitude près, dans le même bruit (TFCT linéaire : X = bruit + A · raies).
// Par (seg, T) : J trames ; seuil = contraste que 5 % des témoins dépassent (témoins mesurés sur le bruit seul) ; rel = écart-type / moyenne des
// cases de bruit. Par niveau : pd = part des raies dont le contraste dépasse le seuil (probabilité de détection à 5 % de fausses alarmes) ;
// auc = probabilité qu'une raie ait un contraste plus grand qu'un témoin.
export type LigneBanc = { T: number; J: number; seuil: number; rel: number; pd: number[]; auc: number[] };
export function bancReference(seg: number, Ts: number[], niveaux: number[], essais: number, seed0 = 5000): LigneBanc[] {
  const n = DUR * FS, NS = 40, Js = Ts.map((T) => nTrames(T, seg)), A = niveaux.map((v) => amplitude(v));
  const pos: number[][][] = Ts.map(() => niveaux.map(() => [])), neg: number[][] = Ts.map(() => []);
  const m1 = Ts.map(() => 0), m2 = Ts.map(() => 0), nc = Ts.map(() => 0);
  for (let i = 0; i < essais; i++) {
    const r = rng(seed0 + i), b = new Float64Array(n), u = new Float64Array(n);
    const f0 = Array.from({ length: NS }, (_, j) => 103.75 + 7.5 * j + (r() - 0.5));
    const ordre = f0.map((_, j) => j);
    for (let j = NS - 1; j > 0; j--) { const k = Math.floor(r() * (j + 1)); [ordre[j], ordre[k]] = [ordre[k], ordre[j]]; }
    const raie = new Set(ordre.slice(0, NS / 2));
    for (const j of raie) { const ph = 2 * Math.PI * r(), w = (2 * Math.PI * f0[j]) / FS; for (let t = 0; t < n; t++) u[t] += Math.cos(w * t + ph); }
    for (let t = 0; t < n; t++) b[t] = gauss(r);
    const B = tfct(b, seg, 96, 404), U = tfct(u, seg, 96, 404), nf = B.f.length;
    const Sb = new Float64Array(nf), Sx = niveaux.map(() => new Float64Array(nf));
    // cases autour de chaque emplacement : la fenêtre et l'anneau du contraste
    const bornes = f0.map((f) => { let a = 0, z = nf; while (B.f[a] < f - OUTER - 0.01) a++; while (B.f[z - 1] > f + OUTER + 0.01) z--; return [a, z]; });
    for (let t = 0; t < B.re.length; t++) {
      const br = B.re[t], bi = B.im[t], ur = U.re[t], ui = U.im[t];
      for (let k = 0; k < nf; k++) {
        Sb[k] += br[k] * br[k] + bi[k] * bi[k];
        for (let l = 0; l < A.length; l++) { const xr = br[k] + A[l] * ur[k], xi = bi[k] + A[l] * ui[k]; Sx[l][k] += xr * xr + xi * xi; }
      }
      Js.forEach((J, q) => {
        if (J !== t + 1) return;
        for (let k = 0; k < nf; k += 4) { const v = Sb[k] / J; m1[q] += v; m2[q] += v * v; nc[q]++; }
        f0.forEach((f, j) => {
          const [a, z] = bornes[j], fs = B.f.subarray(a, z);
          if (raie.has(j)) Sx.forEach((S, l) => pos[q][l].push(contraste(fs, S.subarray(a, z), f)));
          else neg[q].push(contraste(fs, Sb.subarray(a, z), f));
        });
      });
    }
  }
  return Ts.map((T, q) => {
    const tem = Float64Array.from(neg[q]).sort(), seuil = quantile(neg[q], 0.95), m = m1[q] / nc[q];
    // AUC par les rangs : pour chaque raie, nombre de témoins de contraste plus petit (recherche dans les témoins triés)
    const sous = (c: number) => { let a = 0, z = tem.length; while (a < z) { const h = (a + z) >> 1; if (tem[h] < c) a = h + 1; else z = h; } return a; };
    return {
      T, J: Js[q], seuil, rel: Math.sqrt(m2[q] / nc[q] - m * m) / m,
      pd: pos[q].map((p) => p.filter((c) => c > seuil).length / p.length),
      auc: pos[q].map((p) => p.reduce((s, c) => s + sous(c), 0) / (p.length * tem.length)),
    };
  });
}

// Résultats figés de bancReference (1 000 essais : 20 000 raies et 20 000 témoins par réglage), pour IntegrationWidget et DetectionFigure.
// Par durée de trame seg (clé, en s) : durées T (une valeur par nombre de trames J), seuil (dB) = contraste que 5 % des témoins dépassent,
// rel = écart-type / moyenne des cases de bruit, pd[niveau][T] = probabilité de détection à 5 % de fausses alarmes, niveaux NIV_BANC.
// Refaire : dans le scratchpad, gen.ts appelle bancReference(seg, Ts, [6, 3, 0, −3, −6, −9, −12], 1000) avec
//   Ts = 4, 5, 6, 8, …, 60 (seg = 4) ou 1, 2, …, 60 (seg = 1) ; exécuter :
//   npx esbuild gen.ts --bundle --platform=node --format=esm --log-level=error > gen.mjs && node gen.mjs 4 1000 > b4.json (≈ 2 min par durée de trame)
export const NIV_BANC = [0, -3, -6, -9];
export const BANC_REF: Record<number, { T: number[]; J: number[]; seuil: number[]; rel: number[]; pd: number[][] }> = {
  4: {
    T: [4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48, 50, 52, 54, 56, 58, 60],
    J: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29],
    seuil: [8.13, 5.82, 4.86, 4.24, 3.81, 3.47, 3.23, 3.04, 2.90, 2.73, 2.62, 2.50, 2.42, 2.33, 2.26, 2.19, 2.13, 2.06, 2.00, 1.96, 1.92, 1.88, 1.84, 1.81, 1.78, 1.74, 1.71, 1.69, 1.65],
    rel: [1.002, 0.717, 0.588, 0.510, 0.457, 0.418, 0.387, 0.362, 0.342, 0.324, 0.309, 0.296, 0.284, 0.274, 0.264, 0.256, 0.248, 0.241, 0.235, 0.229, 0.224, 0.219, 0.214, 0.209, 0.205, 0.201, 0.197, 0.194, 0.191],
    pd: [
      [0.334, 0.513, 0.647, 0.763, 0.839, 0.896, 0.933, 0.957, 0.971, 0.983, 0.988, 0.994, 0.996, 0.997, 0.998, 0.999, 0.999, 1.000, 1.000, 1.000, 1.000, 1.000, 1.000, 1.000, 1.000, 1.000, 1.000, 1.000, 1.000],
      [0.181, 0.262, 0.327, 0.401, 0.468, 0.536, 0.591, 0.640, 0.678, 0.726, 0.758, 0.791, 0.818, 0.842, 0.865, 0.882, 0.897, 0.915, 0.928, 0.937, 0.945, 0.951, 0.959, 0.964, 0.970, 0.975, 0.980, 0.982, 0.985],
      [0.112, 0.143, 0.168, 0.202, 0.226, 0.260, 0.284, 0.308, 0.328, 0.359, 0.378, 0.410, 0.426, 0.446, 0.469, 0.486, 0.509, 0.533, 0.558, 0.570, 0.588, 0.606, 0.620, 0.632, 0.647, 0.664, 0.675, 0.687, 0.706],
      [0.080, 0.091, 0.100, 0.116, 0.123, 0.138, 0.147, 0.154, 0.161, 0.176, 0.180, 0.193, 0.196, 0.204, 0.214, 0.220, 0.227, 0.238, 0.254, 0.256, 0.265, 0.270, 0.280, 0.283, 0.293, 0.300, 0.310, 0.316, 0.327],
    ],
  },
  1: {
    T: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60],
    J: [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35, 37, 39, 41, 43, 45, 47, 49, 51, 53, 55, 57, 59, 61, 63, 65, 67, 69, 71, 73, 75, 77, 79, 81, 83, 85, 87, 89, 91, 93, 95, 97, 99, 101, 103, 105, 107, 109, 111, 113, 115, 117, 119],
    seuil: [7.23, 4.05, 3.13, 2.66, 2.34, 2.16, 1.97, 1.81, 1.72, 1.63, 1.55, 1.49, 1.42, 1.38, 1.32, 1.29, 1.25, 1.22, 1.19, 1.17, 1.13, 1.10, 1.07, 1.05, 1.04, 1.00, 0.99, 0.98, 0.95, 0.93, 0.92, 0.91, 0.89, 0.88, 0.86, 0.85, 0.84, 0.83, 0.82, 0.80, 0.80, 0.79, 0.78, 0.77, 0.76, 0.76, 0.74, 0.73, 0.72, 0.72, 0.71, 0.71, 0.70, 0.69, 0.69, 0.68, 0.68, 0.66, 0.66, 0.66],
    rel: [1.000, 0.586, 0.457, 0.386, 0.340, 0.308, 0.283, 0.264, 0.248, 0.235, 0.223, 0.213, 0.205, 0.197, 0.190, 0.184, 0.178, 0.173, 0.168, 0.164, 0.160, 0.157, 0.153, 0.150, 0.147, 0.144, 0.141, 0.139, 0.137, 0.134, 0.132, 0.130, 0.128, 0.126, 0.124, 0.122, 0.121, 0.119, 0.117, 0.116, 0.115, 0.113, 0.112, 0.111, 0.109, 0.108, 0.107, 0.106, 0.105, 0.104, 0.103, 0.102, 0.101, 0.100, 0.099, 0.098, 0.097, 0.096, 0.096, 0.095],
    pd: [
      [0.103, 0.174, 0.238, 0.288, 0.344, 0.381, 0.431, 0.485, 0.515, 0.561, 0.592, 0.621, 0.648, 0.674, 0.707, 0.725, 0.749, 0.766, 0.785, 0.800, 0.818, 0.835, 0.852, 0.862, 0.871, 0.888, 0.897, 0.903, 0.913, 0.921, 0.928, 0.932, 0.940, 0.946, 0.951, 0.956, 0.958, 0.962, 0.967, 0.971, 0.973, 0.977, 0.979, 0.980, 0.982, 0.983, 0.985, 0.986, 0.987, 0.989, 0.990, 0.991, 0.992, 0.993, 0.994, 0.994, 0.995, 0.995, 0.996, 0.996],
      [0.074, 0.106, 0.135, 0.152, 0.178, 0.188, 0.209, 0.237, 0.247, 0.264, 0.284, 0.301, 0.317, 0.325, 0.345, 0.353, 0.373, 0.385, 0.395, 0.406, 0.424, 0.441, 0.459, 0.472, 0.476, 0.497, 0.504, 0.510, 0.526, 0.538, 0.552, 0.560, 0.571, 0.584, 0.596, 0.606, 0.613, 0.623, 0.636, 0.651, 0.653, 0.667, 0.673, 0.683, 0.689, 0.695, 0.708, 0.713, 0.723, 0.728, 0.736, 0.740, 0.749, 0.755, 0.762, 0.769, 0.772, 0.785, 0.788, 0.793],
      [0.062, 0.077, 0.092, 0.097, 0.106, 0.109, 0.118, 0.130, 0.134, 0.141, 0.147, 0.152, 0.160, 0.161, 0.170, 0.171, 0.176, 0.183, 0.186, 0.192, 0.197, 0.202, 0.209, 0.216, 0.217, 0.228, 0.228, 0.230, 0.241, 0.247, 0.252, 0.254, 0.259, 0.262, 0.270, 0.273, 0.279, 0.282, 0.290, 0.298, 0.297, 0.302, 0.308, 0.314, 0.316, 0.320, 0.331, 0.332, 0.337, 0.341, 0.347, 0.347, 0.354, 0.357, 0.361, 0.367, 0.368, 0.379, 0.381, 0.384],
      [0.054, 0.064, 0.071, 0.070, 0.076, 0.075, 0.080, 0.086, 0.087, 0.089, 0.094, 0.093, 0.099, 0.099, 0.102, 0.102, 0.102, 0.104, 0.106, 0.105, 0.108, 0.112, 0.118, 0.117, 0.116, 0.124, 0.122, 0.122, 0.126, 0.128, 0.131, 0.130, 0.131, 0.132, 0.136, 0.137, 0.138, 0.138, 0.144, 0.148, 0.147, 0.150, 0.153, 0.153, 0.154, 0.154, 0.159, 0.161, 0.163, 0.163, 0.168, 0.166, 0.171, 0.170, 0.172, 0.174, 0.174, 0.182, 0.179, 0.180],
    ],
  }

};

// Les deux termes du contraste de raies.ts (mêmes réglages par défaut), pour les dessiner : pic de la fenêtre |f − f0| ≤ hw
// et médiane de l'anneau hw + garde ≤ |f − f0| ≤ outer. c = 10 log10(pic / ref) = contraste(f, S, f0).
export function termesContraste(f: ArrayLike<number>, S: ArrayLike<number>, f0: number) {
  let pic = -Infinity, fpic = f0;
  const ring: number[] = [];
  for (let k = 0; k < f.length; k++) {
    const d = Math.abs(f[k] - f0);
    if (d <= HW) { if (S[k] > pic) { pic = S[k]; fpic = f[k]; } }
    else if (d >= HW + GARDE && d <= OUTER) ring.push(S[k]);
  }
  const ref = quantile(ring, 0.5);
  return { pic, fpic, ref, c: dB(pic / ref), nAnneau: ring.length };
}
