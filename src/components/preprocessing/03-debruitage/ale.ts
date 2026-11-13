// Chapitre 3 (Preprocessing), section 2 : rehausseur de raies adaptatif (ALE, adaptive line enhancer) en NLMS.
// Prédiction x̂[n] = Σ_l w_l x[n−δ−l] (l = 0 … L−1) ; erreur e[n] = x[n] − x̂[n] ;
// mise à jour w_l ← w_l + μ e[n] x[n−δ−l] / (Σ_l x[n−δ−l]² + ε), stable pour 0 < μ < 2. Poids nuls à n = 0, traitement causal.
// Rangement en mémoire : w[j] multiplie x[n−δ−(L−1−j)], donc w_l = w[L−1−l].
// Différence avec le projet : mise à jour à chaque échantillon (le projet la fait par blocs de 32 échantillons).
import { FS, rng, essai, tfct, welch, contraste, auc } from './raies';

export type Ale = { y: Float64Array; e: Float64Array; w: Float64Array; ws: Float64Array[] };

// y = la prédiction x̂ (sortie débruitée), e = l'erreur, w = poids à la fin ; ws = copies des poids aux instants demandés
// (indices d'échantillon croissants ; ws[i] = poids avant de traiter l'échantillon instants[i]).
export function ale(x: ArrayLike<number>, L: number, delta: number, mu: number, instants: number[] = []): Ale {
  const n = x.length, pad = L - 1 + delta;
  const xp = new Float64Array(pad + n); // u(i) = xp[i .. i+L−1]
  for (let i = 0; i < n; i++) xp[pad + i] = x[i];
  const w = new Float64Array(L), y = new Float64Array(n), e = new Float64Array(n), ws: Float64Array[] = [];
  let p = 0, q = 0; // p = ‖u‖², tenu à jour d'un échantillon au suivant
  for (let i = 0; i < n; i++) {
    if (q < instants.length && instants[q] === i) { ws.push(w.slice()); q++; }
    const a = xp[i + L - 1];
    p += a * a;
    let s = 0;
    for (let j = 0; j < L; j++) s += w[j] * xp[i + j];
    const err = x[i] - s, g = (mu * err) / (p + 1e-9);
    for (let j = 0; j < L; j++) w[j] += g * xp[i + j];
    y[i] = s; e[i] = err;
    p -= xp[i] * xp[i];
    if (p < 0) p = 0;
  }
  return { y, e, w, ws };
}

// Réponse en fréquence H(f) = [partie réelle, partie imaginaire] du filtre de poids w précédé du retard δ :
// H(f) = Σ_j w_j exp(−i 2π f (δ + L − 1 − j) / fs). x̂ = H·x à la fréquence f tant que les poids ne bougent pas.
export function reponse(w: ArrayLike<number>, delta: number, f: number, fs = FS): [number, number] {
  const L = w.length, om = (2 * Math.PI * f) / fs;
  let re = 0, im = 0;
  for (let j = 0; j < L; j++) { const ph = om * (delta + L - 1 - j); re += w[j] * Math.cos(ph); im -= w[j] * Math.sin(ph); }
  return [re, im];
}
export const gain = (w: ArrayLike<number>, delta: number, f: number, fs = FS) => Math.hypot(...reponse(w, delta, f, fs));

// Gain du filtre optimal (Wiener) à f0 pour une raie de puissance P dans un bruit blanc de variance σ² :
// q / (1 + q), avec q = (L/2) P/σ² (valable quand la raie fait beaucoup de périodes dans les L échantillons).
// Ses poids sont une sinusoïde : w_l = (2/L) · q/(1+q) · cos(2π f0 (δ + l) / fs).
export const gainWiener = (L: number, snr: number) => { const q = (L / 2) * snr; return q / (1 + q); };

// ---------------------------------------------------------------- états du widget AleWidget
// Réglages fixés du widget : retard, pas (à chaque échantillon), longueurs proposées.
export const ALE_DELTA = 16, ALE_MU = 0.05, ALE_LS = [128, 512, 2048];

const dB = (v: number) => 10 * Math.log10(v);
const mediane = (v: number[]) => { const s = [...v].sort((a, b) => a - b), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

// Les deux termes du contraste de raies.ts (réglages par défaut : fenêtre ±0,3 Hz, garde 0,25 Hz, anneau jusqu'à 3 Hz) :
// pic = maximum de S dans la fenêtre, ref = médiane de l'anneau ; c = 10 log10(pic / ref) = contraste(f, S, f0).
function termes(f: ArrayLike<number>, S: ArrayLike<number>, f0: number, hw = 0.3, garde = 0.25, outer = 3) {
  let pic = -Infinity;
  const ring: number[] = [];
  for (let k = 0; k < f.length; k++) {
    const d = Math.abs(f[k] - f0);
    if (d <= hw) pic = Math.max(pic, S[k]);
    else if (d >= hw + garde && d <= outer) ring.push(S[k]);
  }
  return { pic, ref: mediane(ring) };
}

// Un état = un spectre de détection autour de la raie (dB re niveau moyen du bruit) ; c = contraste à f0 (dB) ;
// ref = médiane de l'anneau (dB, même échelle que S) : le pic doit dépasser ref + seuil pour que la raie soit détectée.
export type EtatAle = { S: number[]; c: number; ref: number };
export type EtatsAle = { f: number[]; x: EtatAle[]; y: EtatAle[][] };

// Pour chaque niveau : un essai (une raie à f0, même bruit pour tous les niveaux), le périodogramme moyenné de x sur toute la durée,
// et pour chaque longueur L celui de la sortie x̂ du rehausseur. Cases de f0 − span à f0 + span.
const memo = new Map<string, EtatsAle>();
export function etatsAle(niveaux: number[], f0: number, seg: number, dur: number, seed: number, span: number): EtatsAle {
  const key = [niveaux.join(), f0, seg, dur, seed, span].join('|');
  if (memo.has(key)) return memo.get(key)!;
  let f: number[] = [];
  const x: EtatAle[] = [], y: EtatAle[][] = [];
  const etat = (W: { f: Float64Array; S: Float64Array }, sel: number[]): EtatAle => {
    const t = termes(W.f, W.S, f0);
    return { S: sel.map((k) => +dB(W.S[k]).toFixed(2)), c: contraste(W.f, W.S, f0), ref: dB(t.ref) };
  };
  for (const niveau of niveaux) {
    const e = essai([{ f0, niveau }], dur, seed), Wx = welch(e.x, seg, dur, 20, 490);
    const sel = Array.from(Wx.f, (_, k) => k).filter((k) => Math.abs(Wx.f[k] - f0) <= span + 1e-9);
    f = sel.map((k) => Wx.f[k]);
    x.push(etat(Wx, sel));
    y.push(ALE_LS.map((L) => etat(welch(ale(e.x, L, ALE_DELTA, ALE_MU).y, seg, dur, 20, 490), sel)));
  }
  const out = { f, x, y };
  memo.set(key, out);
  return out;
}

// ---------------------------------------------------------------- figure AleFiltreFigure : ce que le filtre a appris
// Un essai d'une raie forte, le rehausseur jusqu'au bout ; renvoie les poids w_l (l = 0 … L−1, poids de x[n−δ−l]),
// ceux du filtre optimal (sinusoïde à f0), la corrélation entre les deux, et le gain |H(f)| de 0 à fs/2 (pas df).
// H(f) = Σ_l w_l exp(−i 2π f (δ + l) / fs) : x̂ = H·x à la fréquence f tant que les poids ne bougent plus.
export function filtreAppris(L: number, delta: number, mu: number, niveau: number, f0: number, dur: number, seed: number, df = 0.25) {
  const e = essai([{ f0, niveau }], dur, seed), r = ale(e.x, L, delta, mu);
  const wl = Array.from({ length: L }, (_, l) => r.w[L - 1 - l]);
  const P = 10 ** (niveau / 10) / (FS / 2), q = (L / 2) * P, g = q / (1 + q), plancher = Math.sqrt(mu / (2 - mu));
  const opt = (l: number) => ((2 * g) / L) * Math.cos((2 * Math.PI * f0 * (delta + l)) / FS);
  const wo = wl.map((_, l) => opt(l));
  const m = (v: number[]) => v.reduce((a, b) => a + b, 0) / v.length, ma = m(wl), mb = m(wo);
  let sab = 0, saa = 0, sbb = 0;
  wl.forEach((v, l) => { sab += (v - ma) * (wo[l] - mb); saa += (v - ma) ** 2; sbb += (wo[l] - mb) ** 2; });
  const fr: number[] = [], G: number[] = [];
  for (let k = 0; k * df <= FS / 2 + 1e-9; k++) { fr.push(k * df); G.push(gain(r.w, delta, k * df)); }
  const g0 = gain(r.w, delta, f0);
  // largeur du pic à mi-puissance (gain > g0/√2), mesurée par pas de 0,01 Hz
  let up = 0, dn = 0;
  while (gain(r.w, delta, f0 + up) > g0 / Math.SQRT2) up += 0.01;
  while (gain(r.w, delta, f0 - dn) > g0 / Math.SQRT2) dn += 0.01;
  // plancher mesuré : moyenne quadratique du gain à plus de 4 fs/L de f0 (au-delà des premiers lobes secondaires)
  const loin = G.filter((_, k) => Math.abs(fr[k] - f0) > (4 * FS) / L && fr[k] > 0);
  return { wl, wo, corr: sab / Math.sqrt(saa * sbb), q, g, g0, plancher, plancherMesure: Math.sqrt(m(loin.map((v) => v * v))), largeur: up + dn, f: fr, G };
}

// ---------------------------------------------------------------- banc : le rehausseur détecte-t-il mieux que le périodogramme seul ?
// N essais de `dur` secondes ; par essai, 5 raies de même niveau (100, 140, 180, 220, 260 Hz, chacune décalée au hasard de ±2 Hz)
// et 5 fréquences témoins sans raie (120, 160, 200, 240, 280 Hz, ±2 Hz). Deux spectres de détection par essai, sur les T premières
// secondes : périodogramme moyenné de x, et périodogramme moyenné de la sortie x̂ du rehausseur (qui a traité l'essai depuis n = 0).
// Pour chaque T : AUC (raies contre témoins), seuil = contraste dépassé par 5 % des témoins, det = part des raies au-dessus du seuil.
export type LigneBanc = { T: number; aucX: number; aucY: number; seuilX: number; seuilY: number; detX: number; detY: number };
const quantile = (v: number[], q: number) => { const s = [...v].sort((a, b) => a - b), i = q * (s.length - 1), a = Math.floor(i); return s[a] + (s[Math.min(s.length - 1, a + 1)] - s[a]) * (i - a); };
export function bancAle(niveau: number, L: number, delta: number, mu: number, N: number, seg = 4, Ts = [10, 30, 60], dur = 60): LigneBanc[] {
  const cx = Ts.map(() => ({ a: [] as number[], b: [] as number[] })), cy = Ts.map(() => ({ a: [] as number[], b: [] as number[] }));
  const Ls = Math.round(seg * FS);
  const mesure = (sig: ArrayLike<number>, f0s: number[], tem: number[], acc: typeof cx) => {
    const X = tfct(sig, seg, 80, 300);
    Ts.forEach((T, j) => {
      const K = Math.min(X.re.length, Math.floor((Math.round(T * FS) - Ls) / (Ls / 2)) + 1), S = new Float64Array(X.f.length);
      for (let t = 0; t < K; t++) for (let k = 0; k < S.length; k++) S[k] += (X.re[t][k] ** 2 + X.im[t][k] ** 2) / K;
      f0s.forEach((f) => acc[j].a.push(contraste(X.f, S, f)));
      tem.forEach((f) => acc[j].b.push(contraste(X.f, S, f)));
    });
  };
  for (let s = 0; s < N; s++) {
    const r = rng((1000 + s) * 7919 + 13);
    const f0s = [100, 140, 180, 220, 260].map((b) => b + 4 * r() - 2), tem = [120, 160, 200, 240, 280].map((b) => b + 4 * r() - 2);
    const e = essai(f0s.map((f0) => ({ f0, niveau })), dur, 1000 + s);
    mesure(e.x, f0s, tem, cx);
    mesure(ale(e.x, L, delta, mu).y, f0s, tem, cy);
  }
  return Ts.map((T, j) => {
    const sx = quantile(cx[j].b, 0.95), sy = quantile(cy[j].b, 0.95);
    return { T, aucX: auc(cx[j].a, cx[j].b), aucY: auc(cy[j].a, cy[j].b), seuilX: sx, seuilY: sy,
      detX: cx[j].a.filter((v) => v > sx).length / cx[j].a.length, detY: cy[j].a.filter((v) => v > sy).length / cy[j].a.length };
  });
}

// Résultats de bancAle(niveau, L, ALE_DELTA, ALE_MU, BANC_N) pour les états du widget (clé « niveau|L »), calculés hors ligne
// (trop long pour le build : environ 1 à 75 s par ligne). À recalculer si raies.ts, ale() ou les réglages changent :
// pour chaque L, bancAle(niveau, L, ALE_DELTA, ALE_MU, 200) pour niveau = 6, −3, −12 (script : node banc.mjs L 6,-3,-12 200,
// banc.ts = boucle sur les niveaux et JSON.stringify des lignes). Dernier recalcul : 13 novembre 2026, valeurs identiques.
export const BANC_N = 200;
export const BANC_ALE: Record<string, LigneBanc[]> = {
  '6|128': [{ T: 10, aucX: 1.000, aucY: 0.999, seuilX: 4.17, seuilY: 5.15, detX: 1.000, detY: 1.000 }, { T: 30, aucX: 1.000, aucY: 1.000, seuilX: 2.36, seuilY: 3.13, detX: 1.000, detY: 1.000 }, { T: 60, aucX: 1.000, aucY: 1.000, seuilX: 1.66, seuilY: 2.23, detX: 1.000, detY: 1.000 }],
  '6|512': [{ T: 10, aucX: 1.000, aucY: 0.995, seuilX: 4.17, seuilY: 6.31, detX: 1.000, detY: 0.973 }, { T: 30, aucX: 1.000, aucY: 0.999, seuilX: 2.36, seuilY: 4.44, detX: 1.000, detY: 0.993 }, { T: 60, aucX: 1.000, aucY: 1.000, seuilX: 1.66, seuilY: 3.48, detX: 1.000, detY: 0.998 }],
  '6|2048': [{ T: 10, aucX: 1.000, aucY: 0.993, seuilX: 4.17, seuilY: 6.91, detX: 1.000, detY: 0.964 }, { T: 30, aucX: 1.000, aucY: 0.995, seuilX: 2.36, seuilY: 5.55, detX: 1.000, detY: 0.979 }, { T: 60, aucX: 1.000, aucY: 0.996, seuilX: 1.66, seuilY: 4.46, detX: 1.000, detY: 0.986 }],
  '-3|128': [{ T: 10, aucX: 0.830, aucY: 0.721, seuilX: 4.17, seuilY: 5.08, detX: 0.431, detY: 0.218 }, { T: 30, aucX: 0.971, aucY: 0.867, seuilX: 2.36, seuilY: 3.22, detX: 0.850, detY: 0.478 }, { T: 60, aucX: 0.998, aucY: 0.945, seuilX: 1.66, seuilY: 2.19, detX: 0.990, detY: 0.768 }],
  '-3|512': [{ T: 10, aucX: 0.830, aucY: 0.705, seuilX: 4.17, seuilY: 6.77, detX: 0.431, detY: 0.291 }, { T: 30, aucX: 0.971, aucY: 0.865, seuilX: 2.36, seuilY: 4.70, detX: 0.850, detY: 0.583 }, { T: 60, aucX: 0.998, aucY: 0.958, seuilX: 1.66, seuilY: 3.67, detX: 0.990, detY: 0.813 }],
  '-3|2048': [{ T: 10, aucX: 0.830, aucY: 0.765, seuilX: 4.17, seuilY: 7.22, detX: 0.431, detY: 0.354 }, { T: 30, aucX: 0.971, aucY: 0.924, seuilX: 2.36, seuilY: 5.90, detX: 0.850, detY: 0.731 }, { T: 60, aucX: 0.998, aucY: 0.984, seuilX: 1.66, seuilY: 4.62, detX: 0.990, detY: 0.939 }],
  '-12|128': [{ T: 10, aucX: 0.569, aucY: 0.528, seuilX: 4.17, seuilY: 5.12, detX: 0.093, detY: 0.058 }, { T: 30, aucX: 0.613, aucY: 0.568, seuilX: 2.36, seuilY: 3.30, detX: 0.135, detY: 0.073 }, { T: 60, aucX: 0.665, aucY: 0.594, seuilX: 1.66, seuilY: 2.25, detX: 0.177, detY: 0.107 }],
  '-12|512': [{ T: 10, aucX: 0.569, aucY: 0.520, seuilX: 4.17, seuilY: 6.74, detX: 0.093, detY: 0.076 }, { T: 30, aucX: 0.613, aucY: 0.526, seuilX: 2.36, seuilY: 4.69, detX: 0.135, detY: 0.090 }, { T: 60, aucX: 0.665, aucY: 0.540, seuilX: 1.66, seuilY: 3.72, detX: 0.177, detY: 0.091 }],
  '-12|2048': [{ T: 10, aucX: 0.569, aucY: 0.539, seuilX: 4.17, seuilY: 7.15, detX: 0.093, detY: 0.097 }, { T: 30, aucX: 0.613, aucY: 0.546, seuilX: 2.36, seuilY: 5.86, detX: 0.135, detY: 0.095 }, { T: 60, aucX: 0.665, aucY: 0.595, seuilX: 1.66, seuilY: 4.76, detX: 0.177, detY: 0.137 }],
};
