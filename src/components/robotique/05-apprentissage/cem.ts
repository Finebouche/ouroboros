// Cours Robotique : méthode de l'entropie croisée (CEM) sur une politique linéaire de CartPole, calculée à la
// construction de la page (environ 2 s, une seule fois : le résultat est gardé en mémoire).
// Réglages : 20 candidats w ~ N(μ, diag σ²) par itération, chacun jugé sur 8 épisodes (durée moyenne, 500 pas au plus), départs pris
// dans un ensemble fixe de 64 ; 4 élites ; μ ← moyenne des élites, σ ← écart-type des élites + 0,02 ; départ μ = 0, σ = 1 ; 10 itérations.
// Deux entraînements à budget égal : sur le robot nominal, ou sur 16 robots randomisés fixés (bruit de capteur et retard compris).
// Test : 1000 robots tirés à part (graine différente), départ S0[i mod 64].
import { episode, initStates, drawRobots, NOMINAL, rng, gauss, type Phys } from './cartpole.ts';

export const N_POP = 20, N_ELITE = 4, N_EP = 8, N_IT = 10, SIGMA_EXTRA = 0.02, N_TEST = 1000, N_GRID = 100;
export const SEEDS = [1, 2, 3, 4, 5, 6, 7, 8];

const S0 = initStates(64, 3), TRAIN = drawRobots(16, 21), TEST = drawRobots(N_TEST, 99);

// score d'un candidat k à l'itération it : durée moyenne sur 8 épisodes (départs et robots choisis par une règle fixe)
function score(w: number[], dr: boolean, it: number, k: number) {
  let tot = 0;
  for (let j = 0; j < N_EP; j++) {
    const idx = (it * 131 + k * 17 + j * 7) % 64;
    tot += episode(w, S0[idx], dr ? TRAIN[(it * 7 + k * 3 + j) % 16] : NOMINAL, idx);
  }
  return tot / N_EP;
}
// durée moyenne d'une politique sur les 64 départs, robot nominal
const scoreNominal = (w: number[]) => S0.reduce((t, s, i) => t + episode(w, s, NOMINAL, i), 0) / S0.length;

export type Iter = { mu: number[]; sd: number[]; pop: number[][]; J: number[]; elites: number[]; muNext: number[]; sdNext: number[] };
export type Run = { iters: Iter[]; final: number[]; muScore: number[]; grid: number[]; okGrid: number; ok1000: number; okNominal: number };

function cem(dr: boolean, seed: number): Run {
  const r = rng(seed), iters: Iter[] = [];
  let mu = [0, 0, 0, 0], sd = [1, 1, 1, 1];
  for (let it = 0; it < N_IT; it++) {
    const pop = Array.from({ length: N_POP }, () => mu.map((m, i) => m + sd[i] * gauss(r)));
    const J = pop.map((w, k) => score(w, dr, it, k));
    const elites = pop.map((_, i) => i).sort((a, b) => J[b] - J[a]).slice(0, N_ELITE);
    const muNext = mu.map((_, i) => elites.reduce((s, e) => s + pop[e][i], 0) / N_ELITE);
    const sdNext = mu.map((_, i) => Math.sqrt(elites.reduce((t, e) => t + (pop[e][i] - muNext[i]) ** 2, 0) / N_ELITE) + SIGMA_EXTRA);
    iters.push({ mu, sd, pop, J, elites, muNext, sdNext });
    mu = muNext; sd = sdNext;
  }
  const test = TEST.map((P, i) => episode(mu, S0[i % 64], P, 5000 + i));
  const grid = test.slice(0, N_GRID);
  const muScore = [...iters.map((x) => scoreNominal(x.mu)), scoreNominal(mu)];
  const okNominal = S0.filter((s, i) => episode(mu, s, NOMINAL, i) === 500).length;
  return { iters, final: mu, muScore, grid, okGrid: grid.filter((d) => d === 500).length, ok1000: test.filter((d) => d === 500).length, okNominal };
}

export type Data = { runs: Record<number, { nom: Run; dr: Run }>; gridRobots: Phys[] };
let cache: Data | null = null;
export function getData(): Data {
  if (cache) return cache;
  const runs: Data['runs'] = {};
  for (const s of SEEDS) runs[s] = { nom: cem(false, s), dr: cem(true, s) };
  cache = { runs, gridRobots: TEST.slice(0, N_GRID) };
  return cache;
}
