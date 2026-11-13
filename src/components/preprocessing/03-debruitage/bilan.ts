// Chapitre 3 (Preprocessing), section 6 : toutes les méthodes du chapitre mesurées sur les mêmes essais (figure BilanFigure, tableau Methodes).
// Banc : celui de masque.ts. Essais de test de graines GRAINE_TEST + i ; par essai, 6 raies (une par niveau : −12, −9, −6, −3, 0, +3 dB
// re bruit dans 1 Hz) et 13 fréquences témoins, à des fréquences quelconques entre 100 et 200 Hz ; bruit blanc de variance 1 par capteur ;
// 60 s ; TFCT en trames de 2 s (cases de 0,5 Hz) pour toutes les méthodes ; contraste et AUC de raies.ts.
// Le capteur de référence reçoit EXACTEMENT l'essai à un capteur de masque.ts (essaiBanc(GRAINE_TEST + i, NIVEAUX, 'hasard')) : la référence
// est donc la même courbe dans tous les panneaux, et ses AUC sont celles de MESURES.hasard (masque.ts) à nombre d'essais égal.
// Les 7 autres capteurs sont tirés autour de lui (essaiBilan) avec la même loi que essaiAntenne de masque.ts.
import { FS, rng, gauss, amplitude, essai, tfct, contraste, auc, type Tfct } from './raies';
import { ale } from './ale';
import { spectreAntenne } from './antenne';
import {
  C_SON, PAS_CAPTEUR, SEG, DUR, BANDE, DUREES, NIVEAUX, HW, REF, GRAINE_TEST, nTrames, plan, scene, vue, masque, moyenne, periodogramme, modeleCours,
  type Bruit, type Plan, type Vue,
} from './masque';

export { DUREES, NIVEAUX };

// rehausseur du bilan : retard et pas du widget AleWidget, les trois longueurs du widget
export const ALE_BILAN = { delta: 16, mu: 0.05, Ls: [128, 512, 2048] };

export type EssaiBilan = { plan: Plan; x: Float64Array[]; mono: Vue; antenne: Vue; Xs: Tfct[] };

// Essai d'antenne dont le capteur de référence est l'essai à un capteur de masque.ts (mêmes raies, mêmes phases, même bruit).
// Bruit indépendant : les autres capteurs reçoivent chacun un bruit blanc de variance 1.
// Interférent (part q de la puissance du bruit, retard d échantillons par capteur) : le bruit b du capteur de référence est partagé en
// une part directionnelle I = q·b + √(q(1−q))·ξ et une part propre b − I (ξ blanc de variance 1) : I a la variance q, b − I la variance
// 1 − q, et les deux sont indépendantes, comme dans essaiAntenne. Le capteur c reçoit I retardé de (c − REF)·d échantillons.
export function essaiBilan(i: number, bruit: Bruit): EssaiBilan {
  const seed = GRAINE_TEST + i, p = plan(seed, NIVEAUX, false), e = essai(p.raies, DUR, 7000 + seed);
  const n = e.x.length, sc = scene(seed, bruit), C = sc.C;
  const r0 = rng(7000 + seed), phases = p.raies.map(() => 2 * Math.PI * r0()); // les phases tirées par essai()
  const r = rng((seed * 2654435761) | 0);
  const tau = (c: number) => ((c - REF) * PAS_CAPTEUR * Math.sin((sc.gisement * Math.PI) / 180)) / C_SON;
  const s = Array.from({ length: C }, () => new Float64Array(n));
  p.raies.forEach(({ f0, niveau }, q) => {
    const A = amplitude(niveau, FS), w = (2 * Math.PI * f0) / FS;
    for (let c = 0; c < C; c++) { const ph = phases[q] - 2 * Math.PI * f0 * tau(c); for (let k = 0; k < n; k++) s[c][k] += A * Math.cos(w * k + ph); }
  });
  const q = sc.interferent?.part ?? 0, d = sc.interferent?.retard ?? 0, pad = d * (C - 1), off = pad - REF * d;
  const inter = new Float64Array(n + pad);
  if (q > 0) for (let k = 0; k < inter.length; k++) {
    const m = k - off;
    inter[k] = m >= 0 && m < n ? q * (e.x[m] - e.s[m]) + Math.sqrt(q * (1 - q)) * gauss(r) : Math.sqrt(q) * gauss(r);
  }
  const g = Math.sqrt(1 - q);
  const x = Array.from({ length: C }, (_, c) => {
    if (c === REF) return e.x;
    const xc = new Float64Array(n);
    for (let k = 0; k < n; k++) xc[k] = s[c][k] + g * gauss(r) + inter[k + off - (c - REF) * d];
    return xc;
  });
  s[REF] = e.s;
  return { plan: p, x, mono: vue(e, false), antenne: vue({ x, s }, true), Xs: x.map((xc) => tfct(xc, SEG, BANDE[0], BANDE[1])) };
}

const retard = (c: number, theta: number) => (c * PAS_CAPTEUR * Math.sin((theta * Math.PI) / 180)) / C_SON;

type Spectre = [(e: EssaiBilan, n: number) => Float64Array, 'ratio' | 'diff'];
const memoSpectre = <T,>(calc: (e: EssaiBilan) => T) => { const m = new WeakMap<EssaiBilan, T>(); return (e: EssaiBilan) => { if (!m.has(e)) m.set(e, calc(e)); return m.get(e)!; }; };

// Méthodes à un capteur (capteur de référence). Le rehausseur traite l'essai depuis n = 0 ; son spectre de détection est le périodogramme
// moyenné de sa sortie x̂ (mêmes trames de 2 s). Le masque est celui du widget MasqueWidget : modeleCours('hasard').
export function methodesCapteur(): Record<string, Spectre> {
  const m = modeleCours('hasard'), M = memoSpectre((e) => masque(m, e.mono));
  const out: Record<string, Spectre> = {
    periodogramme: [(e, n) => periodogramme(e.mono.X, n), 'ratio'],
    masque: [(e, n) => moyenne(M(e), n), 'diff'],
  };
  for (const L of ALE_BILAN.Ls) {
    const Y = memoSpectre((e) => tfct(ale(e.x[REF], L, ALE_BILAN.delta, ALE_BILAN.mu).y, SEG, BANDE[0], BANDE[1]));
    out[`ale${L}`] = [(e, n) => periodogramme(Y(e), n), 'ratio'];
  }
  return out;
}

// Méthodes d'antenne. Voies classiques et traitement adaptatif : spectreAntenne (antenne.ts) avec ses réglages par défaut (ceux du projet :
// R_b estimée sur les cases à ±4 Hz hors d'une garde de 0,55 Hz, charge ε = 0,03, gisements balayés tous les 3°), maximum sur le gisement.
// incoherent : moyenne des périodogrammes des 8 capteurs. masqueAntenne : modeleCours('hasard', bruit, true), entraîné sur 24 essais
// d'antenne de la même scène (graines 1 à 24, essaiAntenne).
export function methodesAntenne(bruit: Bruit): Record<string, Spectre> {
  const m = modeleCours('hasard', bruit, true), M = memoSpectre((e) => masque(m, e.antenne));
  return {
    incoherent: [(e, n) => periodogramme(e.Xs, n), 'ratio'],
    classique: [(e, n) => spectreAntenne(e.Xs, n, retard, { variante: 'classique' }).S, 'ratio'],
    adaptatif: [(e, n) => spectreAntenne(e.Xs, n, retard, { variante: 'adaptatif' }).S, 'ratio'],
    masqueAntenne: [(e, n) => moyenne(M(e), n), 'diff'],
  };
}

// contrastes des essais i0 à i1 − 1 : c[méthode] = { a[essai][durée][raie], t[essai][durée][témoin] } (la raie q a le niveau NIVEAUX[q])
export type Contrastes = Record<string, { a: number[][][]; t: number[][][] }>;
export function contrastesBilan(quoi: 'capteur' | Bruit, i0: number, i1: number): Contrastes {
  const methodes = quoi === 'capteur' ? methodesCapteur() : methodesAntenne(quoi), noms = Object.keys(methodes);
  const out: Contrastes = Object.fromEntries(noms.map((nom) => [nom, { a: [], t: [] }]));
  for (let i = i0; i < i1; i++) {
    const e = essaiBilan(i, quoi === 'capteur' ? 'independant' : quoi), f = e.mono.f;
    for (const nom of noms) {
      const [spectre, kind] = methodes[nom], a: number[][] = [], t: number[][] = [];
      for (const T of DUREES) {
        const S = spectre(e, nTrames(T));
        a.push(e.plan.raies.map((ra) => contraste(f, S, ra.f0, kind, HW)));
        t.push(e.plan.temoins.map((ft) => contraste(f, S, ft, kind, HW)));
      }
      out[nom].a.push(a); out[nom].t.push(t);
    }
  }
  return out;
}

// AUC raies contre témoins par durée et par niveau : table[méthode][durée][niveau]
export function tableBilan(c: Contrastes): Record<string, number[][]> {
  return Object.fromEntries(Object.entries(c).map(([nom, { a, t }]) => [nom, DUREES.map((_, iT) => {
    const tem = t.flatMap((essai) => essai[iT]);
    return NIVEAUX.map((_, iN) => auc(a.map((essai) => essai[iT][iN]), tem));
  })]));
}

// ---------------------------------------------------------------- résultats figés (13/11/2026)
// 300 essais de test par panneau (i = 0 … 299, graines GRAINE_TEST + i), les mêmes essais (mêmes raies, même capteur de référence) dans
// les trois panneaux. AUC raies contre témoins : auc[durée][niveau] (DUREES × NIVEAUX) ; parT[durée] = moyenne sur les six niveaux
// (= AUC de toutes les raies contre tous les témoins, puisque chaque essai a une raie par niveau) ; moyenne = moyenne de parT.
// La référence (periodogramme) et le masque à un capteur redonnent exactement MESURES.hasard de masque.ts (mêmes essais, même modèle).
// Pour refaire (environ 6 min sur 4 cœurs ; scripts dans le dossier scratchpad bilan-v2 de la session du 13/11/2026) :
//   run.ts : console.log(JSON.stringify(contrastesBilan(quoi, i0, i1)))   pour quoi = 'capteur' | 'independant' | 'interferent',
//            (i0, i1) = (0, 150) puis (150, 300), chaque tranche dans son processus :
//            npx esbuild run.ts --bundle --platform=node --format=esm --outfile=run.mjs && node run.mjs <quoi> <i0> <i1> > c-<quoi>-<i0>.json
//   agg.mjs : concatène les tranches, puis tableBilan (AUC par durée et par niveau), moyennes sur les niveaux et sur les durées.
type Res = { moyenne: number; parT: number[]; auc: number[][] };
export const N_BILAN = 300;
export const BILAN: { capteur: Record<'periodogramme' | 'ale128' | 'ale512' | 'ale2048' | 'masque', Res>; independant: Record<'incoherent' | 'classique' | 'adaptatif' | 'masqueAntenne', Res>; interferent: Record<'incoherent' | 'classique' | 'adaptatif' | 'masqueAntenne', Res> } = {
  capteur: {
    periodogramme: { moyenne: 0.8168, parT: [0.718, 0.768, 0.822, 0.843, 0.866, 0.884], auc: [
      [0.558, 0.57, 0.651, 0.731, 0.845, 0.956],
      [0.553, 0.598, 0.711, 0.815, 0.931, 0.997],
      [0.587, 0.657, 0.793, 0.904, 0.991, 1],
      [0.609, 0.675, 0.833, 0.946, 0.998, 1],
      [0.631, 0.724, 0.872, 0.969, 0.999, 1],
      [0.655, 0.756, 0.904, 0.986, 1, 1],
    ] },
    ale128: { moyenne: 0.761, parT: [0.673, 0.723, 0.762, 0.78, 0.807, 0.821], auc: [
      [0.552, 0.577, 0.58, 0.686, 0.751, 0.891],
      [0.563, 0.579, 0.629, 0.732, 0.862, 0.974],
      [0.556, 0.607, 0.677, 0.805, 0.934, 0.994],
      [0.565, 0.606, 0.703, 0.848, 0.96, 0.999],
      [0.582, 0.648, 0.744, 0.89, 0.979, 1],
      [0.585, 0.666, 0.775, 0.912, 0.987, 1],
    ] },
    ale512: { moyenne: 0.7464, parT: [0.657, 0.702, 0.747, 0.772, 0.795, 0.806], auc: [
      [0.536, 0.547, 0.565, 0.661, 0.726, 0.906],
      [0.53, 0.565, 0.596, 0.705, 0.833, 0.979],
      [0.528, 0.571, 0.644, 0.794, 0.946, 0.997],
      [0.534, 0.574, 0.693, 0.853, 0.978, 0.999],
      [0.546, 0.603, 0.736, 0.894, 0.991, 1],
      [0.552, 0.598, 0.765, 0.927, 0.995, 1],
    ] },
    ale2048: { moyenne: 0.7844, parT: [0.679, 0.734, 0.787, 0.812, 0.839, 0.856], auc: [
      [0.537, 0.544, 0.602, 0.68, 0.781, 0.928],
      [0.539, 0.569, 0.645, 0.778, 0.888, 0.986],
      [0.547, 0.606, 0.722, 0.881, 0.975, 0.995],
      [0.561, 0.619, 0.769, 0.937, 0.988, 0.997],
      [0.569, 0.673, 0.831, 0.97, 0.993, 0.998],
      [0.581, 0.696, 0.878, 0.986, 0.995, 0.999],
    ] },
    masque: { moyenne: 0.7769, parT: [0.671, 0.724, 0.776, 0.809, 0.833, 0.849], auc: [
      [0.521, 0.545, 0.623, 0.669, 0.751, 0.916],
      [0.537, 0.565, 0.671, 0.746, 0.854, 0.973],
      [0.549, 0.588, 0.734, 0.842, 0.946, 0.999],
      [0.576, 0.622, 0.778, 0.895, 0.982, 1],
      [0.593, 0.656, 0.81, 0.941, 0.996, 1],
      [0.601, 0.681, 0.842, 0.967, 0.999, 1],
    ] },
  },
  independant: {
    incoherent: { moyenne: 0.9243, parT: [0.846, 0.894, 0.93, 0.946, 0.96, 0.97], auc: [
      [0.62, 0.674, 0.83, 0.954, 0.998, 1],
      [0.68, 0.773, 0.919, 0.993, 1, 1],
      [0.748, 0.855, 0.976, 0.999, 1, 1],
      [0.778, 0.906, 0.993, 1, 1, 1],
      [0.813, 0.947, 0.999, 1, 1, 1],
      [0.852, 0.97, 1, 1, 1, 1],
    ] },
    classique: { moyenne: 0.9534, parT: [0.878, 0.924, 0.961, 0.975, 0.988, 0.994], auc: [
      [0.643, 0.731, 0.901, 0.993, 1, 1],
      [0.707, 0.85, 0.986, 1, 1, 1],
      [0.811, 0.956, 1, 1, 1, 1],
      [0.863, 0.989, 1, 1, 1, 1],
      [0.93, 0.998, 1, 1, 1, 1],
      [0.964, 1, 1, 1, 1, 1],
    ] },
    adaptatif: { moyenne: 0.9397, parT: [0.841, 0.906, 0.951, 0.967, 0.983, 0.991], auc: [
      [0.589, 0.686, 0.806, 0.964, 0.999, 1],
      [0.679, 0.801, 0.958, 0.999, 1, 1],
      [0.78, 0.927, 0.998, 1, 1, 1],
      [0.826, 0.974, 1, 1, 1, 1],
      [0.905, 0.993, 1, 1, 1, 1],
      [0.946, 0.999, 1, 1, 1, 1],
    ] },
    masqueAntenne: { moyenne: 0.8995, parT: [0.811, 0.86, 0.904, 0.924, 0.943, 0.955], auc: [
      [0.583, 0.604, 0.763, 0.924, 0.992, 1],
      [0.628, 0.683, 0.869, 0.984, 0.999, 1],
      [0.691, 0.78, 0.952, 0.999, 1, 1],
      [0.722, 0.846, 0.978, 1, 1, 1],
      [0.76, 0.906, 0.991, 1, 1, 1],
      [0.795, 0.938, 0.996, 1, 1, 1],
    ] },
  },
  interferent: {
    incoherent: { moyenne: 0.8484, parT: [0.762, 0.806, 0.852, 0.872, 0.891, 0.907], auc: [
      [0.561, 0.593, 0.685, 0.799, 0.94, 0.992],
      [0.573, 0.634, 0.752, 0.89, 0.987, 1],
      [0.594, 0.705, 0.85, 0.964, 0.999, 1],
      [0.629, 0.72, 0.898, 0.985, 1, 1],
      [0.646, 0.771, 0.935, 0.997, 1, 1],
      [0.685, 0.804, 0.957, 0.999, 1, 1],
    ] },
    classique: { moyenne: 0.6979, parT: [0.661, 0.677, 0.701, 0.708, 0.715, 0.725], auc: [
      [0.521, 0.519, 0.55, 0.591, 0.812, 0.974],
      [0.513, 0.526, 0.554, 0.596, 0.874, 0.998],
      [0.51, 0.545, 0.595, 0.625, 0.93, 1],
      [0.528, 0.525, 0.599, 0.642, 0.957, 1],
      [0.526, 0.542, 0.605, 0.644, 0.976, 1],
      [0.549, 0.556, 0.608, 0.651, 0.984, 1],
    ] },
    adaptatif: { moyenne: 0.9831, parT: [0.952, 0.98, 0.99, 0.991, 0.993, 0.994], auc: [
      [0.816, 0.94, 0.973, 0.992, 0.992, 0.999],
      [0.933, 0.967, 0.986, 0.995, 0.997, 1],
      [0.969, 0.981, 0.989, 1, 1, 1],
      [0.969, 0.984, 0.992, 1, 1, 1],
      [0.975, 0.985, 0.997, 1, 1, 1],
      [0.978, 0.986, 0.999, 1, 1, 1],
    ] },
    masqueAntenne: { moyenne: 0.9281, parT: [0.857, 0.897, 0.932, 0.95, 0.962, 0.97], auc: [
      [0.627, 0.727, 0.879, 0.941, 0.976, 0.991],
      [0.678, 0.811, 0.932, 0.973, 0.991, 1],
      [0.738, 0.894, 0.969, 0.991, 0.999, 1],
      [0.797, 0.927, 0.981, 0.996, 1, 1],
      [0.837, 0.951, 0.988, 0.997, 1, 1],
      [0.864, 0.964, 0.993, 0.998, 1, 1],
    ] },
  },
};
