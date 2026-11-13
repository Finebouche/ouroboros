// Chapitre 3, introduction et section 1 (la référence : périodogramme moyenné). Réglages et calculs communs à ChaineFigure et IntegrationWidget.
import { FS, rng, gauss, tfct, contraste } from './raies';

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
const quantile = (v: number[], q: number) => { const s = [...v].sort((a, b) => a - b), i = q * (s.length - 1), a = Math.floor(i); return s[a] + (s[Math.min(s.length - 1, a + 1)] - s[a]) * (i - a); };

// Bruit seul (essais sans raie), pour chaque T : intervalle qui contient 90 % des cases de S (en dB re niveau moyen du bruit),
// et contraste dépassé par 5 % des fréquences témoins (témoins tous les 7,5 Hz, même position dans la case que F0).
// rel : écart-type relatif des cases (écart-type / moyenne). Résultat gardé en mémoire (un seul calcul par construction du site).
const memo = new Map<string, { lo: number; hi: number; rel: number; seuil: number; n: number }[]>();
export function bruitSeul(Ts: number[], seg = SEG, tirages = 24, seed = 9000) {
  const key = [Ts.join(), seg, tirages, seed].join('|');
  if (memo.has(key)) return memo.get(key)!;
  const cases: number[][] = Ts.map(() => []), tem: number[][] = Ts.map(() => []);
  for (let i = 0; i < tirages; i++) {
    const r = rng(seed + i), x = new Float64Array(DUR * FS);
    for (let n = 0; n < x.length; n++) x[n] = gauss(r);
    const W = welchCumul(x, seg, Ts, 20, 490);
    Ts.forEach((_, j) => {
      for (let k = 0; k < W.f.length; k++) cases[j].push(W.S[j][k]);
      for (let f = F0 - 15 * 7.5; f < 485; f += 7.5) tem[j].push(contraste(W.f, W.S[j], f));
    });
  }
  const out = Ts.map((_, j) => {
    const m = cases[j].reduce((a, v) => a + v, 0) / cases[j].length, sd = Math.sqrt(cases[j].reduce((a, v) => a + (v - m) ** 2, 0) / cases[j].length);
    return { lo: dB(quantile(cases[j], 0.05)), hi: dB(quantile(cases[j], 0.95)), rel: sd / m, seuil: quantile(tem[j], 0.95), n: tem[j].length };
  });
  memo.set(key, out);
  return out;
}

// Les deux termes du contraste de raies.ts (mêmes réglages par défaut), pour les dessiner : pic de la fenêtre |f − f0| ≤ hw
// et médiane de l'anneau hw + garde ≤ |f − f0| ≤ outer. c = 10 log10(pic / ref) = contraste(f, S, f0).
export const HW = 0.3, GARDE = 0.25, OUTER = 3;
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
