// Cours Reservoir computing, chapitre 11 : chorégraphies SYNTHÉTIQUES d'un banc de M poissons (et d'un prédateur), une par mode collectif,
// dessinées à la main d'après les descriptions de la littérature (pas de données de vrais bancs). Toutes ont la même période T :
// le réservoir n'a qu'une horloge à entretenir, le conceptor choisit la forme. Bassin : x dans [-1, 1], y dans [-0,6, 0,6] (le dessin est découpé au bord du bassin).
// Sortie d'un pas (D = 65 signaux) : [x_0, y_0, …, x_{M-1}, y_{M-1}] les poissons, puis [x_P, y_P, q] le prédateur et sa présence
// (q = 1 présent, 0 absent : il est alors au centre et n'est pas dessiné), puis [cos φ, sin φ] × CLK, une horloge commune à toutes
// les chorégraphies, non dessinée : elle donne aux régions des différents modes des directions communes, sans lesquelles
// le mélange de deux conceptors éteint l'oscillation.
import { makeRng } from '../conceptors';

export const M = 30, T = 40, CLK = 3, IP = 2 * M, IQ = 2 * M + 2, D = 2 * M + 5;
const TAU = 2 * Math.PI, { sin, cos, sqrt, hypot, tanh, exp } = Math;
const NONE = [0, 0];

// identité de chaque poisson, fixée une fois : place dans un disque (spirale de Vogel, répartition régulière), phase et rayon
// répartis régulièrement (suite du nombre d'or, pour que les directions se compensent), sens de rotation alterné
const rnd = makeRng(11);
const GOLD = Math.PI * (3 - sqrt(5)), PHI = (sqrt(5) - 1) / 2;
export const FISH = Array.from({ length: M }, (_, i) => {
  const r = sqrt((i + 0.5) / M), a = i * GOLD;
  return {
    a: r * cos(a) + 0.04 * (rnd() - 0.5), b: r * sin(a) + 0.04 * (rnd() - 0.5),
    rho: TAU * ((i * PHI) % 1) + 0.3 * (rnd() - 0.5), sg: i % 2 ? 1 : -1, u: ((i * 0.7548776662 + 0.3) % 1),
  };
});

// trajet commun des bancs qui se déplacent : lemniscate de Gerono (huit couché), et direction de nage (vecteur unitaire)
const path = (ph: number) => [0.6 * sin(ph), 0.28 * sin(2 * ph)];
const head = (ph: number) => { const dx = 0.6 * cos(ph), dy = 0.56 * cos(2 * ph), l = hypot(dx, dy); return [dx / l, dy / l]; };
// repère du banc (u vers l'avant, v vers la gauche) → bassin
const world = (ph: number, u: number, v: number) => { const c = path(ph), h = head(ph); return [c[0] + u * h[0] - v * h[1], c[1] + u * h[1] + v * h[0]]; };

// impulsion périodique lisse : montée rapide, retombée lente, réduite à ses 4 premières harmoniques (facile à apprendre)
const PULSE = (() => {
  const K = 4, S = 400, g = (p: number) => (p < 0.45 ? 0.5 - 0.5 * cos((Math.PI * p) / 0.45) : exp(-(p - 0.45) / 1.1));
  const c = new Float64Array(K + 1), s = new Float64Array(K + 1);
  for (let n = 0; n < S; n++) {
    const p = (TAU * n) / S, v = g(p);
    for (let k = 0; k <= K; k++) { c[k] += (v * cos(k * p)) / S; s[k] += (v * sin(k * p)) / S; }
  }
  const f = (p: number) => { let v = c[0]; for (let k = 1; k <= K; k++) v += 2 * (c[k] * cos(k * p) + s[k] * sin(k * p)); return v; };
  let lo = Infinity, hi = -Infinity;
  for (let n = 0; n < S; n++) { const v = f((TAU * n) / S); lo = Math.min(lo, v); hi = Math.max(hi, v); }
  return (p: number) => (f(p) - lo) / (hi - lo);
})();

type Frame = (ph: number, out: Float64Array) => void;
const put = (out: Float64Array, i: number, p: number[]) => { out[2 * i] = p[0]; out[2 * i + 1] = p[1]; };

export const MODES: { key: string; name: string; predator: boolean; frame: Frame }[] = [
  {
    key: 'school', name: 'banc polarisé', predator: false,
    frame: (ph, out) => { FISH.forEach((f, i) => put(out, i, world(ph, 0.28 * f.a, 0.18 * f.b))); put(out, M, NONE); },
  },
  {
    key: 'shoal', name: 'banc lâche', predator: false,
    // dérive lente du groupe + boucle propre à chaque poisson, d'amplitudes comparables : alignement partiel. Chez le zébrafish,
    // le shoal est moins polarisé, plus lent et plus dense que le school (Miller et Gerlai 2012) : « lâche » vise la coordination
    frame: (ph, out) => {
      const cx = 0.12 * sin(ph), cy = 0.05 * sin(2 * ph);
      FISH.forEach((f, i) => put(out, i, [cx + 0.17 * f.a + 0.11 * cos(ph + f.rho), cy + 0.12 * f.b + 0.11 * f.sg * sin(ph + f.rho)]));
      put(out, M, NONE);
    },
  },
  {
    key: 'swarm', name: 'essaim', predator: false,
    // groupe immobile et dense, chaque poisson tourne sur sa petite boucle, dans un sens tiré au hasard
    frame: (ph, out) => { FISH.forEach((f, i) => put(out, i, [0.16 * f.a + 0.06 * cos(ph + f.rho), 0.13 * f.b + 0.06 * f.sg * sin(ph + f.rho)])); put(out, M, NONE); },
  },
  {
    key: 'mill', name: 'tourbillon', predator: false,
    // anneau autour d'un centre vide, tous dans le même sens
    frame: (ph, out) => {
      FISH.forEach((f, i) => { const r = 0.22 + 0.17 * f.u, a = f.rho + ph; put(out, i, [r * cos(a), r * sin(a)]); });
      put(out, M, NONE);
    },
  },
  {
    key: 'ball', name: "boule d'appât", predator: true,
    // boule pleine et serrée qui tourne, un prédateur tourne autour
    frame: (ph, out) => {
      FISH.forEach((f, i) => { const r = 0.03 + 0.11 * sqrt(f.u), a = f.rho + ph; put(out, i, [r * cos(a), r * sin(a)]); });
      put(out, M, [0.33 * cos(ph + Math.PI), 0.33 * sin(ph + Math.PI)]);
    },
  },
  {
    key: 'wedge', name: 'coin (V)', predator: false,
    // deux bras d'un V, pointe en avant, qui suit le même trajet que le banc polarisé
    frame: (ph, out) => {
      FISH.forEach((_, i) => { const s = i % 2 ? 1 : -1, k = Math.floor(i / 2) + 0.5; put(out, i, world(ph, 0.22 - k * 0.03, s * k * 0.021)); });
      put(out, M, NONE);
    },
  },
  {
    key: 'line', name: 'cordon (ligne)', predator: false,
    // d'après l'état « ligne » de Calovi et al. (2014) : deux colonnes qui nagent en sens opposé, reliées par un demi-tour ;
    // dessin stylisé en boucle fermée très allongée (20 fois plus longue que large), que les poissons parcourent à la file
    frame: (ph, out) => {
      FISH.forEach((_, i) => { const a = (TAU * i) / M + ph; put(out, i, [0.7 * cos(a), 0.035 * sin(a)]); });
      put(out, M, NONE);
    },
  },
  {
    key: 'vacuole', name: 'vacuole', predator: true,
    // le prédateur nage dans le banc ; les poissons s'écartent et laissent un trou autour de lui
    frame: (ph, out) => {
      const pu = 0.02 + 0.06 * cos(ph), pv = 0.04 * sin(ph), R = 0.1;
      FISH.forEach((f, i) => {
        const du = 0.3 * f.a - pu, dv = 0.21 * f.b - pv, d = hypot(du, dv) + 1e-9, k = sqrt(d * d + R * R) / d;
        put(out, i, world(ph, pu + du * k, pv + dv * k));
      });
      put(out, M, world(ph, pu, pv));
    },
  },
  {
    key: 'fountain', name: 'effet fontaine', predator: true,
    // le prédateur traverse le banc de face, de l'avant vers l'arrière (dans le repère du banc, 2 fois la vitesse du banc ; au sol,
    // à peu près la vitesse des proies, car il arrive de face) ; les poissons s'écartent des deux côtés et se referment derrière lui.
    // Sa présence q ne vaut 1 qu'autour de la traversée : loin du banc, hors du bassin, il n'est pas dessiné
    frame: (ph, out) => {
      const pu = -1.2 * cos(ph), pv = 0.45 + 0.45 * sin(ph);
      FISH.forEach((f, i) => {
        const u = 0.28 * f.a, v = 0.18 * f.b, du = u - pu, dv = v - pv;
        const push = 0.17 * exp(-(du * du) / 0.022 - (dv * dv) / 0.045);
        put(out, i, world(ph, u, v + tanh(dv / 0.035) * push));
      });
      put(out, M, world(ph, pu, pv));
    },
  },
  {
    key: 'flash', name: 'expansion éclair', predator: true,
    // le prédateur frappe le bord du banc ; les poissons de la zone visée fuient d'un coup, en s'éloignant du point de frappe, et se
    // tassent contre le reste du banc (ce n'est pas une dilatation de tout le banc, Hulsman et Tularam 2021) ; puis le banc se reforme
    frame: (ph, out) => {
      const q = PULSE(ph), su = 0.05, sv = 0.09; // point de frappe, dans le repère du banc
      const pu = su + 0.2 * sin(ph), pv = sv + 0.5 * (1 - cos(ph)) / 2;
      FISH.forEach((f, i) => {
        const u = 0.28 * f.a, v = 0.18 * f.b, du = u - su, dv = v - sv, d = hypot(du, dv) + 1e-9;
        const push = 0.16 * q * exp(-(d * d) / 0.012);
        put(out, i, world(ph, u + (push * du) / d, v + (push * dv) / d));
      });
      put(out, M, world(ph, pu, pv));
    },
  },
];

// motif j au pas n
export function pattern(j: number, n: number, out = new Float64Array(D)) {
  const ph = (TAU * n) / T;
  MODES[j].frame(ph, out);
  out[IQ] = !MODES[j].predator ? 0 : MODES[j].key === 'fountain' ? (1 - sin(ph)) / 2 : 1;
  out[IQ + 1] = CLK * cos(ph);
  out[IQ + 2] = CLK * sin(ph);
  return out;
}
