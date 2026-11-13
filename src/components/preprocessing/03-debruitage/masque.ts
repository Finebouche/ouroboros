// Chapitre 3 (Preprocessing), sections 4 et 5 : masque temps-fréquence appris par un réservoir, version réduite du `ReservoirMask` du projet.
// L'entrée du réservoir est la TFCT : chaque case de fréquence est une séquence de trames ; le même réservoir et la même lecture
// servent à toutes les cases. La lecture (ridge) est entraînée à prédire le masque idéal m* = P_s / (P_s + P_b) sur des essais
// synthétiques dont on connaît la raie seule s(n). Spectre de détection : masque moyen sur les trames observées.
// Réservoir : r_k = (1 − a) r_{k−1} + a tanh(W r_{k−1} + W_in u_k + b), r_0 = 0 ; W creux (10 % de liens), gaussien, ramené au rayon spectral ρ.
import { FS, rng, gauss, amplitude, essai, tfct, contraste, auc, type Tfct, type Raie } from './raies';

// ---------------------------------------------------------------- antenne : essai à C capteurs (modèle d'onde plane)

export const C_SON = 1490; // célérité (m/s)
export const PAS_CAPTEUR = (2 * C_SON) / FS; // espacement des capteurs (m) : 2,91 m, soit 2 échantillons de trajet entre voisins en bout d'antenne

export type Scene = { C: number; gisement: number; interferent?: { part: number; retard: number } };
export type EssaiAntenne = { fs: number; x: Float64Array[]; s: Float64Array[]; raies: Raie[]; retards: number[] };

// Antenne linéaire de C capteurs espacés de PAS_CAPTEUR. La source des raies est dans la direction `gisement` (degrés, 0 = travers) :
// le capteur c reçoit la raie avec le retard c · PAS_CAPTEUR · sin(gisement) / C_SON. Bruit de variance 1 sur chaque capteur :
// indépendant entre capteurs, sauf la part `interferent.part` de sa puissance, qui vient d'une seule source large bande
// (même bruit sur tous les capteurs, retardé de `interferent.retard` échantillons par capteur : 1 échantillon ↔ 30° du travers).
export function essaiAntenne(raies: Raie[], dur: number, seed: number, scene: Scene, fs = FS): EssaiAntenne {
  const r = rng(seed), n = Math.round(dur * fs), { C } = scene;
  const retards = Array.from({ length: C }, (_, c) => (c * PAS_CAPTEUR * Math.sin((scene.gisement * Math.PI) / 180)) / C_SON);
  const s = Array.from({ length: C }, () => new Float64Array(n)), x = Array.from({ length: C }, () => new Float64Array(n));
  for (const { f0, niveau } of raies) {
    const A = amplitude(niveau, fs), ph = 2 * Math.PI * r(), w = (2 * Math.PI * f0) / fs;
    for (let c = 0; c < C; c++) { const p = ph - 2 * Math.PI * f0 * retards[c]; for (let i = 0; i < n; i++) s[c][i] += A * Math.cos(w * i + p); }
  }
  const q = scene.interferent?.part ?? 0, d = scene.interferent?.retard ?? 0, pad = d * (C - 1);
  const inter = new Float64Array(n + pad);
  if (q > 0) for (let i = 0; i < inter.length; i++) inter[i] = Math.sqrt(q) * gauss(r);
  const g = Math.sqrt(1 - q);
  for (let c = 0; c < C; c++) for (let i = 0; i < n; i++) x[c][i] = s[c][i] + g * gauss(r) + inter[i + pad - c * d];
  return { fs, x, s, raies, retards };
}

// ---------------------------------------------------------------- caractéristiques : ce que le réservoir reçoit pour une case et une trame

// plancher de bruit local : médiane glissante en fréquence (±demi Hz) de la puissance d'une trame
export function plancher(P: Float64Array, df: number, demi = 3): Float64Array {
  const h = Math.max(2, Math.round(demi / df)), F = P.length, out = new Float64Array(F), buf = new Float64Array(2 * h + 1);
  for (let k = 0; k < F; k++) {
    for (let j = -h; j <= h; j++) buf[j + h] = P[Math.min(F - 1, Math.max(0, k + j))];
    out[k] = buf.slice().sort()[h] + 1e-30;
  }
  return out;
}

export const D_MONO = 9;
export const dAntenne = (C: number) => C + 4 * (C - 1);

// Un capteur, 9 valeurs par case et par trame : pour les cases f−1, f, f+1, Re z, Im z et log10(|z|² + 10⁻³),
// avec z = X · démod / √n0 ; n0 : plancher local ; démod = (−1)^(trame × indice absolu de la case), qui annule l'avance de phase
// d'une demi-trame à l'autre (une raie centrée sur la case garde alors une phase constante). Sortie : U[case] = trames × 9, à plat.
export function caracMono(X: Tfct): Float64Array[] {
  const K = X.re.length, F = X.f.length, D = D_MONO;
  const U = Array.from({ length: F }, () => new Float64Array(K * D));
  const zr = new Float64Array(F), zi = new Float64Array(F), P = new Float64Array(F);
  for (let t = 0; t < K; t++) {
    for (let k = 0; k < F; k++) P[k] = X.re[t][k] ** 2 + X.im[t][k] ** 2;
    const n0 = plancher(P, X.df);
    for (let k = 0; k < F; k++) { const g = ((t * (X.k0 + k)) % 2 ? -1 : 1) / Math.sqrt(n0[k]); zr[k] = X.re[t][k] * g; zi[k] = X.im[t][k] * g; }
    for (let k = 0; k < F; k++) for (let o = 0; o < 3; o++) {
      const j = Math.min(F - 1, Math.max(0, k + o - 1)), b = t * D + 3 * o;
      U[k][b] = zr[j]; U[k][b + 1] = zi[j]; U[k][b + 2] = Math.log10(zr[j] ** 2 + zi[j] ** 2 + 1e-3);
    }
  }
  return U;
}

// interspectre comprimé de deux capteurs : Z_a · Z_b* / √(|Z_a Z_b*| + 10⁻³). Sa phase est la différence de phase entre les capteurs.
const croise = (ar: number, ai: number, br: number, bi: number): [number, number] => {
  const re = ar * br + ai * bi, im = ai * br - ar * bi, g = 1 / Math.sqrt(Math.hypot(re, im) + 1e-3);
  return [re * g, im * g];
};

// Antenne, C + 4 (C − 1) valeurs : log10(|Z_c|² + 10⁻³) de chaque capteur, puis parties réelle et imaginaire des interspectres comprimés
// Z_c · Z_ref* (les C − 1 autres capteurs) et Z_c · Z_{c+1}* (les C − 1 paires de voisins). Z = X / √n0, n0 : plancher local de la
// puissance moyennée sur les capteurs. Ni cases voisines ni démodulation.
export function caracAntenne(Xs: Tfct[], ref: number): Float64Array[] {
  const C = Xs.length, K = Xs[0].re.length, F = Xs[0].f.length, D = dAntenne(C), nx = 2 * (C - 1);
  const U = Array.from({ length: F }, () => new Float64Array(K * D));
  const P = new Float64Array(F), zr = new Float64Array(C), zi = new Float64Array(C);
  for (let t = 0; t < K; t++) {
    P.fill(0);
    for (let c = 0; c < C; c++) for (let k = 0; k < F; k++) P[k] += (Xs[c].re[t][k] ** 2 + Xs[c].im[t][k] ** 2) / C;
    const n0 = plancher(P, Xs[0].df);
    for (let k = 0; k < F; k++) {
      const g = 1 / Math.sqrt(n0[k]), b = t * D;
      for (let c = 0; c < C; c++) { zr[c] = Xs[c].re[t][k] * g; zi[c] = Xs[c].im[t][k] * g; U[k][b + c] = Math.log10(zr[c] ** 2 + zi[c] ** 2 + 1e-3); }
      let j = 0;
      const put = (v: [number, number]) => { U[k][b + C + j] = v[0]; U[k][b + C + nx + j] = v[1]; j++; };
      for (let c = 0; c < C; c++) if (c !== ref) put(croise(zr[c], zi[c], zr[ref], zi[ref]));
      for (let c = 0; c < C - 1; c++) put(croise(zr[c], zi[c], zr[c + 1], zi[c + 1]));
    }
  }
  return U;
}

// masque idéal m*[case][trame] = P_s / (P_s + P_b), P_s = |TFCT de la raie seule|², P_b = |TFCT du reçu − TFCT de la raie seule|²
export function masqueIdeal(X: Tfct, S: Tfct): Float64Array[] {
  const K = X.re.length, F = X.f.length;
  return Array.from({ length: F }, (_, k) => Float64Array.from({ length: K }, (_, t) => {
    const ps = S.re[t][k] ** 2 + S.im[t][k] ** 2, pb = (X.re[t][k] - S.re[t][k]) ** 2 + (X.im[t][k] - S.im[t][k]) ** 2;
    return ps / (ps + pb + 1e-30);
  }));
}

// ---------------------------------------------------------------- réservoir à entrée vectorielle

export type Reglages = { N: number; rho: number; fuite: number; sigma: number; biais: number; alpha: number; carres: boolean; seed: number };
export type Reservoir = { N: number; D: number; fuite: number; ptr: Int32Array; col: Int32Array; val: Float64Array; Win: Float64Array; b: Float64Array };

// W : 10 % de liens, valeurs gaussiennes, ramené au rayon spectral rho (estimé par la croissance moyenne de la norme sous itération) ;
// W_in : uniforme dans [−sigma, sigma] ; b : uniforme dans [−biais, biais]. Tout est tiré une fois et figé.
export function reservoir(D: number, g: Reglages, lien = 0.1): Reservoir {
  const r = rng(g.seed), N = g.N;
  const rows: { j: number; v: number }[][] = Array.from({ length: N }, () => []);
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) if (r() < lien) rows[i].push({ j, v: gauss(r) });
  const nnz = rows.reduce((a, row) => a + row.length, 0);
  const ptr = new Int32Array(N + 1), col = new Int32Array(nnz), val = new Float64Array(nnz);
  let p = 0;
  rows.forEach((row, i) => { ptr[i] = p; for (const { j, v } of row) { col[p] = j; val[p++] = v; } });
  ptr[N] = p;
  let v = Float64Array.from({ length: N }, () => gauss(r)), lg = 0;
  const IT = 400, SKIP = 100;
  for (let it = 0; it < IT; it++) {
    const w = new Float64Array(N);
    for (let i = 0; i < N; i++) { let a = 0; for (let q = ptr[i]; q < ptr[i + 1]; q++) a += val[q] * v[col[q]]; w[i] = a; }
    const nrm = Math.hypot(...w) || 1;
    if (it >= SKIP) lg += Math.log(nrm);
    v = w.map((x) => x / nrm);
  }
  const sc = g.rho / Math.exp(lg / (IT - SKIP));
  for (let q = 0; q < nnz; q++) val[q] *= sc;
  const Win = Float64Array.from({ length: N * D }, () => (r() * 2 - 1) * g.sigma);
  const b = Float64Array.from({ length: N }, () => (r() * 2 - 1) * g.biais);
  return { N, D, fuite: g.fuite, ptr, col, val, Win, b };
}

// états du réservoir pour une séquence U (K trames × D, à plat), état initial nul. Sortie : K × N, à plat.
export function etats(res: Reservoir, U: Float64Array): Float64Array {
  const { N, D, fuite: a, ptr, col, val, Win, b } = res, K = U.length / D, R = new Float64Array(K * N);
  let prev = new Float64Array(N);
  for (let t = 0; t < K; t++) {
    const cur = R.subarray(t * N, (t + 1) * N), u = t * D;
    for (let i = 0; i < N; i++) {
      let s = b[i];
      for (let q = ptr[i]; q < ptr[i + 1]; q++) s += val[q] * prev[col[q]];
      const w = i * D;
      for (let d = 0; d < D; d++) s += Win[w + d] * U[u + d];
      cur[i] = (1 - a) * prev[i] + a * Math.tanh(s);
    }
    prev = cur;
  }
  return R;
}

// ---------------------------------------------------------------- lecture : ridge sur [états ; états² ; 1]

export type Modele = { res: Reservoir; wout: Float64Array; carres: boolean };
export type Exemple = { U: Float64Array[]; y: Float64Array[] }; // une séquence de caractéristiques et un masque idéal par case retenue

const nLect = (N: number, carres: boolean) => N * (carres ? 2 : 1) + 1;

// lecture d'un état : masque = W_out · [r ; r² ; 1]
function lire(wout: Float64Array, R: Float64Array, t: number, N: number, carres: boolean): number {
  let s = wout[wout.length - 1];
  const o = t * N;
  for (let i = 0; i < N; i++) { const v = R[o + i]; s += wout[i] * v; if (carres) s += wout[N + i] * v * v; }
  return s;
}

// W_out = (G + α (tr G / n) I)⁻¹ c, avec G = Σ h hᵀ, c = Σ h m*, h = [r ; r² ; 1] ; pas de pénalité sur le terme constant (Cholesky).
export function entrainer(exemples: Exemple[], D: number, g: Reglages): Modele {
  const res = reservoir(D, g), N = g.N, n = nLect(N, g.carres);
  const G = new Float64Array(n * n), c = new Float64Array(n), h = new Float64Array(n);
  h[n - 1] = 1;
  for (const ex of exemples) ex.U.forEach((U, i) => {
    const R = etats(res, U), K = U.length / D, y = ex.y[i];
    for (let t = 0; t < K; t++) {
      for (let j = 0; j < N; j++) { const v = R[t * N + j]; h[j] = v; if (g.carres) h[N + j] = v * v; }
      const yt = y[t];
      for (let a = 0; a < n; a++) { const ha = h[a], row = a * n; c[a] += ha * yt; for (let b = a; b < n; b++) G[row + b] += ha * h[b]; }
    }
  });
  let tr = 0;
  for (let a = 0; a < n; a++) tr += G[a * n + a];
  const lam = (g.alpha * tr) / n;
  for (let a = 0; a < n - 1; a++) G[a * n + a] += lam;
  // Cholesky G = Lᵀ L sur le triangle supérieur, puis deux substitutions
  for (let a = 0; a < n; a++) {
    for (let b = a; b < n; b++) {
      let s = G[a * n + b];
      for (let k = 0; k < a; k++) s -= G[k * n + a] * G[k * n + b];
      G[a * n + b] = b === a ? Math.sqrt(Math.max(s, 1e-12)) : s / G[a * n + a];
    }
  }
  const wout = new Float64Array(n);
  for (let a = 0; a < n; a++) { let s = c[a]; for (let k = 0; k < a; k++) s -= G[k * n + a] * wout[k]; wout[a] = s / G[a * n + a]; }
  for (let a = n - 1; a >= 0; a--) { let s = wout[a]; for (let k = a + 1; k < n; k++) s -= G[a * n + k] * wout[k]; wout[a] = s / G[a * n + a]; }
  return { res, wout, carres: g.carres };
}

// masque prédit d'une case, trame par trame (non borné : la lecture est linéaire)
export function predire(m: Modele, U: Float64Array): Float64Array {
  const R = etats(m.res, U), N = m.res.N, K = U.length / m.res.D;
  return Float64Array.from({ length: K }, (_, t) => lire(m.wout, R, t, N, m.carres));
}

// ---------------------------------------------------------------- banc d'essai du chapitre

export const SEG = 2; // durée de trame (s) : cases de 0,5 Hz
export const DUR = 60; // durée d'un essai (s) : 59 trames
export const BANDE: [number, number] = [100, 200];
export const DUREES = [5, 10, 20, 30, 45, 60];
export const NIVEAUX = [-12, -9, -6, -3, 0, 3]; // dB re bruit dans 1 Hz
export const EMPLACEMENTS = Array.from({ length: 19 }, (_, i) => 105 + 5 * i); // un emplacement tous les 5 Hz
export const HW = 0.3; // demi-largeur (Hz) de la fenêtre de recherche autour d'une raie
export const REF = 0; // capteur de référence
export const nTrames = (T: number, seg = SEG) => Math.max(0, Math.floor((T - seg) / (seg / 2) + 1e-9) + 1);

export type Plan = { raies: Raie[]; temoins: number[] };
// Tirage d'un essai : n emplacements portent une raie (fréquence décalée de ±0,4 Hz au hasard), les autres sont des témoins sans émission
// (décalés de la même façon). niveaux : une liste (un niveau par raie), ou un intervalle où chaque niveau est tiré uniformément.
// centre : toutes les fréquences sont ramenées au centre de la case la plus proche (multiples de 1/seg).
export function plan(seed: number, niveaux: number[] | { lo: number; hi: number }, centre = false, n = 6, seg = SEG): Plan {
  const r = rng(seed), idx = EMPLACEMENTS.map((_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
  const fr = (i: number) => { const f = EMPLACEMENTS[i] + (r() * 2 - 1) * 0.4; return centre ? Math.round(f * seg) / seg : f; };
  const raies = idx.slice(0, n).map((i, q) => ({ f0: fr(i), niveau: Array.isArray(niveaux) ? niveaux[q] : niveaux.lo + r() * (niveaux.hi - niveaux.lo) }));
  return { raies, temoins: idx.slice(n).map(fr) };
}

export type Vue = { f: Float64Array; X: Tfct; U: Float64Array[]; ideal: Float64Array[] };
// TFCT, caractéristiques et masque idéal (sur le capteur de référence) d'un essai à un capteur ou d'antenne
export function vue(e: { x: Float64Array | Float64Array[]; s: Float64Array | Float64Array[] }, antenne: boolean, seg = SEG): Vue {
  const xs = Array.isArray(e.x) ? e.x : [e.x], ss = Array.isArray(e.s) ? e.s : [e.s];
  const Xs = (antenne ? xs : [xs[REF]]).map((x) => tfct(x, seg, BANDE[0], BANDE[1]));
  const X = antenne ? Xs[REF] : Xs[0], S = tfct(ss[REF], seg, BANDE[0], BANDE[1]);
  return { f: X.f, X, U: antenne ? caracAntenne(Xs, REF) : caracMono(X), ideal: masqueIdeal(X, S) };
}

// cases d'entraînement d'un essai : toutes celles de la fenêtre d'une raie, plus nBruit cases tirées au hasard hors de ces fenêtres
export function exemple(v: Vue, raies: Raie[], seed: number, nBruit = 60): Exemple {
  const r = rng(seed), F = v.f.length;
  const pres = Array.from({ length: F }, (_, k) => raies.some(({ f0 }) => Math.abs(v.f[k] - f0) <= HW));
  const libres = pres.map((p, k) => (p ? -1 : k)).filter((k) => k >= 0);
  for (let i = libres.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [libres[i], libres[j]] = [libres[j], libres[i]]; }
  const pick = [...pres.map((p, k) => (p ? k : -1)).filter((k) => k >= 0), ...libres.slice(0, nBruit)];
  return { U: pick.map((k) => v.U[k]), y: pick.map((k) => v.ideal[k]) };
}

// masque prédit de toutes les cases d'un essai : M[case][trame]
export const masque = (m: Modele, v: Vue): Float64Array[] => v.U.map((U) => predire(m, U));

// moyenne sur les n premières trames d'un tableau [case][trame] : spectre de détection du masque
export const moyenne = (M: Float64Array[], n: number): Float64Array => Float64Array.from(M, (row) => { let s = 0; for (let t = 0; t < n; t++) s += row[t]; return s / n; });

// périodogramme moyenné (Welch) sur les n premières trames d'une TFCT, ou de plusieurs capteurs (moyenne incohérente)
export function periodogramme(Xs: Tfct | Tfct[], n: number): Float64Array {
  const L = Array.isArray(Xs) ? Xs : [Xs], S = new Float64Array(L[0].f.length);
  for (const X of L) for (let t = 0; t < n; t++) for (let k = 0; k < S.length; k++) S[k] += (X.re[t][k] ** 2 + X.im[t][k] ** 2) / (n * L.length);
  return S;
}

// ---------------------------------------------------------------- le modèle du cours et ses mesures

// Réglages par défaut du projet (sr 0,8, lr 0,3, input_scaling 0,3, bias_scaling 0,3, ridge 10⁻², états au carré), réservoir réduit à 100 neurones.
export const REGLAGES: Reglages = { N: 100, rho: 0.8, fuite: 0.3, sigma: 0.3, biais: 0.3, alpha: 1e-2, carres: true, seed: 0 };
export const N_ENTRAINEMENT = 24; // essais synthétiques d'entraînement (graines 1 à 24), 6 raies chacun
export const NIVEAUX_ENTRAINEMENT = { lo: -15, hi: 6 }; // niveaux tirés uniformément (dB re bruit dans 1 Hz)
export const N_BRUIT = 30; // cases « bruit » tirées par essai d'entraînement
export const GRAINE_TEST = 100000; // les essais de test ont les graines 100000, 100001, … : jamais vus à l'entraînement

export type Cas = 'hasard' | 'centre'; // fréquences des raies : quelconques (±0,4 Hz autour de l'emplacement), ou au centre d'une case
export type Bruit = 'independant' | 'interferent';
export const C_ANTENNE = 8;
// scène d'un essai d'antenne : gisement de la source tiré entre −90° et +90° ; interférent : 80 % de la puissance du bruit, à 30° du travers
export const rngGisement = (seed: number) => (rng(seed ^ 0x5bd1e995)() * 2 - 1) * 90;
export const scene = (seed: number, bruit: Bruit): Scene => ({ C: C_ANTENNE, gisement: rngGisement(seed), interferent: bruit === 'interferent' ? { part: 0.8, retard: 1 } : undefined });

export type EssaiBanc = { plan: Plan; vue: Vue; Xs?: Tfct[] };
// essai du banc : un capteur (bruit blanc), ou antenne (bruit = 'independant' | 'interferent' ; antenne = false : on n'en garde que le capteur de référence)
export function essaiBanc(seed: number, niveaux: number[] | { lo: number; hi: number }, cas: Cas, bruit?: Bruit, antenne = false): EssaiBanc {
  const p = plan(seed, niveaux, cas === 'centre');
  if (!bruit) return { plan: p, vue: vue(essai(p.raies, DUR, 7000 + seed), false) };
  const e = essaiAntenne(p.raies, DUR, 7000 + seed, scene(seed, bruit));
  return { plan: p, vue: vue(e, antenne), Xs: antenne ? e.x.map((x) => tfct(x, SEG, BANDE[0], BANDE[1])) : undefined };
}

// entraînement de la lecture sur les N_ENTRAINEMENT essais synthétiques ; gardé en mémoire (un seul calcul par construction du site)
const memoModele = new Map<string, Modele>();
export function modeleCours(cas: Cas, bruit?: Bruit, antenne = false, g: Reglages = REGLAGES): Modele {
  const cle = JSON.stringify([cas, bruit, antenne, g]);
  const deja = memoModele.get(cle);
  if (deja) return deja;
  const ex: Exemple[] = [];
  for (let i = 1; i <= N_ENTRAINEMENT; i++) { const e = essaiBanc(i, NIVEAUX_ENTRAINEMENT, cas, bruit, antenne); ex.push(exemple(e.vue, e.plan.raies, 99 + i, N_BRUIT)); }
  const m = entrainer(ex, antenne ? dAntenne(C_ANTENNE) : D_MONO, g);
  memoModele.set(cle, m);
  return m;
}

export type Mesure = { n: number; auc: number[][]; moyenne: number; seuil: number[] };
// AUC raies contre témoins, par durée (DUREES) et par niveau (NIVEAUX), sur n essais de test (un essai à la fois : essaiDe(i)),
// pour plusieurs spectres de détection. methodes : nom → [spectre(essai, nombre de trames), type de contraste].
// auc[durée][niveau] ; moyenne sur les durées et les niveaux ; seuil[durée] : contraste dépassé par 5 % des témoins (PFA = 0,05).
export const PFA = 0.05;
export function mesurer(n: number, essaiDe: (i: number) => EssaiBanc, methodes: Record<string, [(e: EssaiBanc, n: number) => Float64Array, 'ratio' | 'diff']>): Record<string, Mesure> {
  const noms = Object.keys(methodes);
  const avec = noms.map(() => DUREES.map(() => NIVEAUX.map(() => [] as number[]))), tem = noms.map(() => DUREES.map(() => [] as number[]));
  for (let i = 0; i < n; i++) {
    const e = essaiDe(i);
    noms.forEach((nom, q) => DUREES.forEach((T, iT) => {
      const S = methodes[nom][0](e, nTrames(T)), kind = methodes[nom][1];
      e.plan.raies.forEach((r) => avec[q][iT][NIVEAUX.indexOf(r.niveau)].push(contraste(e.vue.f, S, r.f0, kind, HW)));
      e.plan.temoins.forEach((ft) => tem[q][iT].push(contraste(e.vue.f, S, ft, kind, HW)));
    }));
  }
  const out: Record<string, Mesure> = {};
  noms.forEach((nom, q) => {
    const t = DUREES.map((_, iT) => NIVEAUX.map((_, iN) => auc(avec[q][iT][iN], tem[q][iT])));
    const seuil = tem[q].map((v) => { const s = [...v].sort((a, b) => a - b), i = (1 - PFA) * (s.length - 1), a = Math.floor(i); return s[a] + (s[Math.min(s.length - 1, a + 1)] - s[a]) * (i - a); });
    out[nom] = { n, auc: t, moyenne: t.flat().reduce((a, b) => a + b, 0) / (DUREES.length * NIVEAUX.length), seuil };
  });
  return out;
}

// spectre de détection d'un modèle : masque moyen (le masque de l'essai entier est calculé une fois, puis moyenné sur les n premières trames)
export function spectreMasque(m: Modele) {
  const memo = new WeakMap<EssaiBanc, Float64Array[]>();
  return (e: EssaiBanc, n: number) => { if (!memo.has(e)) memo.set(e, masque(m, e.vue)); return moyenne(memo.get(e)!, n); };
}

// Mesures du modèle du cours (REGLAGES, N_ENTRAINEMENT, N_BRUIT ci-dessus) sur 300 essais de test par cas (graines 100000 à 100299,
// 6 raies et 13 témoins par essai), faites le 13/11/2026 avec mesurer() : AUC raies contre témoins, auc[durée][niveau] (DUREES × NIVEAUX) ;
// seuil[durée] : contraste dépassé par 5 % des témoins (dB pour le périodogramme, différence de masque pour le masque).
// Même TFCT (trames de 2 s) pour les deux méthodes. À refaire si un réglage, raies.ts ou ce fichier change :
//   const m = modeleCours(cas);
//   mesurer(300, (i) => essaiBanc(GRAINE_TEST + i, NIVEAUX, cas), { periodogramme: [(e, n) => periodogramme(e.vue.X, n), 'ratio'], masque: [spectreMasque(m), 'diff'] })
type MesureCours = { moyenne: number; seuil: number[]; auc: number[][] };
export const MESURES: Record<Cas, { n: number; periodogramme: MesureCours; masque: MesureCours }> = {
  hasard: {
    n: 300,
    periodogramme: { moyenne: 0.8168, seuil: [3.7673, 2.5051, 1.8062, 1.4628, 1.2135, 1.042], auc: [
      [0.558, 0.57, 0.651, 0.731, 0.845, 0.956],
      [0.553, 0.598, 0.711, 0.815, 0.931, 0.997],
      [0.587, 0.657, 0.793, 0.904, 0.991, 1],
      [0.609, 0.675, 0.833, 0.946, 0.998, 1],
      [0.631, 0.724, 0.872, 0.969, 0.999, 1],
      [0.655, 0.756, 0.904, 0.986, 1, 1],
    ] },
    masque: { moyenne: 0.7769, seuil: [0.099, 0.1191, 0.1237, 0.1106, 0.0915, 0.0788], auc: [
      [0.521, 0.545, 0.623, 0.669, 0.751, 0.916],
      [0.537, 0.565, 0.671, 0.746, 0.854, 0.973],
      [0.549, 0.588, 0.734, 0.842, 0.946, 0.999],
      [0.576, 0.622, 0.778, 0.895, 0.982, 1],
      [0.593, 0.656, 0.81, 0.941, 0.996, 1],
      [0.601, 0.681, 0.842, 0.967, 0.999, 1],
    ] },
  },
  centre: {
    n: 300,
    periodogramme: { moyenne: 0.8242, seuil: [3.7097, 2.4459, 1.7898, 1.4399, 1.175, 1.0292], auc: [
      [0.545, 0.568, 0.647, 0.727, 0.883, 0.966],
      [0.556, 0.607, 0.727, 0.834, 0.962, 0.996],
      [0.589, 0.653, 0.812, 0.902, 0.993, 1],
      [0.616, 0.689, 0.859, 0.949, 0.999, 1],
      [0.644, 0.725, 0.892, 0.98, 1, 1],
      [0.671, 0.766, 0.922, 0.991, 1, 1],
    ] },
    masque: { moyenne: 0.8453, seuil: [0.0568, 0.0707, 0.0686, 0.0611, 0.0522, 0.047], auc: [
      [0.534, 0.556, 0.648, 0.694, 0.828, 0.945],
      [0.584, 0.623, 0.736, 0.842, 0.963, 0.997],
      [0.633, 0.686, 0.861, 0.954, 0.999, 1],
      [0.663, 0.745, 0.917, 0.983, 1, 1],
      [0.709, 0.795, 0.961, 0.996, 1, 1],
      [0.751, 0.848, 0.982, 0.999, 1, 1],
    ] },
  },
};

// Mesures d'antenne (13/11/2026), même protocole, 150 essais de test par cas, C_ANTENNE capteurs, gisement de la source tiré à chaque essai,
// AUC moyenne sur les durées et les niveaux. Modèles : modeleCours('hasard', bruit, false) et modeleCours('hasard', bruit, true).
//   bruit indépendant entre capteurs : périodogramme d'un capteur 0,813 ; masque un capteur 0,772 ; moyenne incohérente des 8 capteurs 0,919 ; masque antenne 0,898
//   bruit à 80 % directionnel (interférent) : périodogramme d'un capteur 0,810 ; masque un capteur 0,768 ; moyenne incohérente 0,847 ; masque antenne 0,929
// Non utilisées par un composant : elles documentent ce que le texte du chapitre annonce.

export { essai, contraste, auc, tfct };
