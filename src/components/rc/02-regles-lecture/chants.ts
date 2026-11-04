// Cours Reservoir computing, chapitre 2 : jeu jouet partagé par les widgets du chapitre.
// Des « chants » faits de phrases (A à E) tirées d'une petite grammaire ; chaque phrase est une suite de 5 à 8 frames,
// un spectre grossier à 8 canaux. Un réservoir de 60 neurones à taux positifs, x = (1 + tanh(a)) / 2, lit les frames.
// À la dernière frame de chaque phrase, on garde l'état x ; la cible est le one-hot de la phrase suivante, ou FIN.
// Le réservoir repart de son état de repos à chaque chant. Réglages vérifiés par simulation (Node) : ρ = 1,6, entrée ±0,1.
import { rng, gauss, makeReservoir } from '../esn';

export const NAMES = ['A', 'B', 'C', 'D', 'E', 'FIN'];
export const NC = 6, END = 5, CH = 8;
export const N = 60, RHO = 1.6, SIGMA = 0.1;
export const N_TRAIN = 60, N_TEST = 40;

// grammaire : probabilités de la phrase suivante, selon la phrase courante et la précédente (−1 : début du chant)
export function nextProbs(prev: number, cur: number): number[] {
  if (cur === 0) return [0.3, 0.7, 0, 0, 0, 0]; // A → A ou B
  if (cur === 1) return prev === 0 ? [0, 0, 1, 0, 0, 0] : [0, 0, 0, 1, 0, 0]; // B → C après A, D après E
  if (cur === 2) return [0, 0, 0, 0, 0.6, 0.4]; // C → E ou FIN
  if (cur === 3) return [0, 0, 0, 0, 0.3, 0.7]; // D → E ou FIN
  return [0, 1, 0, 0, 0, 0]; // E → B
}
// canal dominant de chaque frame, selon la position relative p ∈ [0, 1] dans la phrase
const PITCH: ((p: number, t: number) => number)[] = [
  (p) => 1 + 3 * p, // A : montée
  () => 6, // B : note tenue aiguë
  (p) => 6.5 - 4 * p, // C : descente
  (_, t) => (t % 2 ? 2 : 5), // D : trille
  () => 0.5, // E : note grave
];

export function songs(nSongs: number, seed: number) {
  const r = rng(seed);
  const out: number[][] = [];
  for (let s = 0; s < nSongs; s++) {
    const seq = [0];
    while (seq.length < 14) {
      const p = nextProbs(seq.length > 1 ? seq[seq.length - 2] : -1, seq[seq.length - 1]), v = r();
      let k = 0, acc = p[0];
      while (v > acc && k < NC - 1) acc += p[++k];
      if (k === END) break;
      seq.push(k);
    }
    out.push(seq);
  }
  return out;
}

// frames d'une phrase : une bosse sur les canaux autour de la hauteur, longueur 5 à 8, petit bruit
export function phraseFrames(k: number, r: () => number) {
  const L = 5 + Math.floor(r() * 4), sh = (r() - 0.5) * 0.8, a = 0.8 + 0.4 * r();
  const F: Float64Array[] = [];
  for (let t = 0; t < L; t++) {
    const c0 = PITCH[k](t / (L - 1), t) + sh, f = new Float64Array(CH);
    for (let c = 0; c < CH; c++) f[c] = Math.max(0, a * Math.exp(-((c - c0) ** 2) / 1.2) + 0.08 * gauss(r));
    F.push(f);
  }
  return F;
}

export type Res = { W: Float64Array[]; Win: Float64Array[]; b: Float64Array; s: number };
// W et b viennent du réservoir commun du cours (esn.ts) ; W_in : 8 canaux, la moitié des poids nuls, les autres dans ±σ
export function reservoir(seed = 11): Res {
  const R = makeReservoir(N, seed), r = rng(seed + 1000);
  const Win = Array.from({ length: N }, () => Float64Array.from({ length: CH }, () => (r() < 0.5 ? SIGMA * (r() * 2 - 1) : 0)));
  return { W: R.W, Win, b: R.b, s: RHO / R.rho0 };
}
export function stepRate(res: Res, x: Float64Array, u: Float64Array) {
  const o = new Float64Array(N);
  for (let i = 0; i < N; i++) {
    let a = res.b[i];
    const w = res.W[i], wi = res.Win[i];
    for (let j = 0; j < N; j++) a += res.s * w[j] * x[j];
    for (let c = 0; c < CH; c++) a += wi[c] * u[c];
    o[i] = 0.5 * (1 + Math.tanh(a));
  }
  return o;
}
export function restState(res: Res) {
  let x = new Float64Array(N);
  const zero = new Float64Array(CH);
  for (let t = 0; t < 200; t++) x = stepRate(res, x, zero);
  return x;
}

export type Sample = { x: Float64Array; cur: number; next: number; song: number; pos: number };

// états à la fin de chaque phrase
export function collect(seqs: number[][], seed: number, res: Res, rest: Float64Array) {
  const r = rng(seed), S: Sample[] = [];
  seqs.forEach((seq, si) => {
    let x = rest;
    seq.forEach((k, j) => {
      for (const u of phraseFrames(k, r)) x = stepRate(res, x, u);
      S.push({ x, cur: k, next: j + 1 < seq.length ? seq[j + 1] : END, song: si, pos: j });
    });
  });
  return S;
}

// un chant frame par frame (pour la figure) : entrées, états, fin de chaque phrase
export function runSong(seq: number[], seed: number, res: Res, rest: Float64Array) {
  const r = rng(seed), U: Float64Array[] = [], X: Float64Array[] = [], ends: number[] = [];
  let x = rest;
  seq.forEach((k) => {
    for (const u of phraseFrames(k, r)) { x = stepRate(res, x, u); U.push(u); X.push(x); }
    ends.push(X.length - 1);
  });
  return { U, X, ends };
}

// le jeu complet : apprentissage (60 chants) et test (40 chants) ; calculé une fois par page
let cache: { res: Res; rest: Float64Array; train: Sample[]; test: Sample[] } | null = null;
export function dataset() {
  if (cache) return cache;
  const res = reservoir(11), rest = restState(res);
  const train = collect(songs(N_TRAIN, 111), 113, res, rest), test = collect(songs(N_TEST, 112), 114, res, rest);
  return (cache = { res, rest, train, test });
}
