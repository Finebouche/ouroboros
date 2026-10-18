// Chapitre 3 (exploration) : outils communs aux widgets de bandit : générateur reproductible, tirage gaussien,
// paramètres des cinq stratégies et leurs couleurs (propres à ce chapitre).
export const rng = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let r = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
  return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
};
export const gauss = (r: () => number) => {
  let u = 0;
  while (u === 0) u = r();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r());
};
// indice du maximum ; les égalités sont départagées au hasard
export const argmaxTie = (v: number[], r: () => number) => {
  const m = Math.max(...v);
  const ids = v.flatMap((x, i) => (x >= m - 1e-12 ? [i] : []));
  return ids[Math.floor(r() * ids.length)];
};
export type Strat = 'glouton' | 'eps' | 'soft' | 'opt' | 'ucb';
export const STRATS: Strat[] = ['glouton', 'eps', 'soft', 'opt', 'ucb'];
export const LABELS: Record<Strat, string> = { glouton: 'Glouton', eps: 'ε-greedy', soft: 'Softmax', opt: 'Optimiste', ucb: 'UCB' };
export const COLORS: Record<Strat, string> = { glouton: 'var(--c-neutral)', eps: 'var(--a-bc)', soft: 'var(--a-fqi)', opt: 'var(--a-ppo)', ucb: 'var(--a-lspi)' };
export const EPS = 0.1, TAU = 0.25, UCB_C = 2, Q0_OPT = 5, ALPHA_OPT = 0.1;
export const softmax = (Q: number[], tau: number) => {
  const m = Math.max(...Q), w = Q.map((v) => Math.exp((v - m) / tau)), s = w.reduce((a, b) => a + b, 0);
  return w.map((x) => x / s);
};
