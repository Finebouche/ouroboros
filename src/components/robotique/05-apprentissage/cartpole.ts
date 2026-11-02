// Cours Robotique : CartPole-v1 recopié de gymnasium/envs/classic_control/cartpole.py (intégrateur « euler »,
// dt = 0,02 s), vérifié contre Gymnasium 1.4 (écart nul en float64 sur une trajectoire d'actions au hasard).
// État s = (q1, q̇1, q2, q̇2) dans l'ordre de Gymnasium : position du chariot, sa vitesse, angle de la perche, vitesse angulaire.
// Variante à paramètres physiques (masses, demi-longueur, force), retard d'action et bruit de capteur pour la randomisation.

export type S4 = [number, number, number, number];
export type Phys = { mc: number; mp: number; l: number; F: number; delay: number; noise: number };

export const G = 9.8, DT = 0.02, X_MAX = 2.4, ANG_MAX = (12 * 2 * Math.PI) / 360, T_MAX = 500;
export const NOMINAL: Phys = { mc: 1.0, mp: 0.1, l: 0.5, F: 10, delay: 0, noise: 0 };
// amplitude du bruit uniforme de capteur sur chaque composante, quand noise = 1
export const NOISE = [0.05, 0.1, 0.01, 0.1];

// mulberry32 : générateur pseudo-aléatoire à graine fixe ; gauss : Box-Muller
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const gauss = (r: () => number) => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());

// un pas d'Euler explicite ; a = 1 pousse à droite (+F), a = 0 à gauche (−F)
export function step(s: S4, a: number, P: Phys = NOMINAL): S4 {
  const [x, xd, th, thd] = s;
  const force = a === 1 ? P.F : -P.F, c = Math.cos(th), sn = Math.sin(th);
  const tm = P.mp + P.mc, pml = P.mp * P.l;
  const temp = (force + pml * thd * thd * sn) / tm;
  const thacc = (G * sn - c * temp) / (P.l * (4 / 3 - (P.mp * c * c) / tm));
  const xacc = temp - (pml * thacc * c) / tm;
  return [x + DT * xd, xd + DT * xacc, th + DT * thd, thd + DT * thacc];
}
// état terminal du MDP : chariot hors du rail ou perche au-delà de 12°
export const fallen = (s: S4) => s[0] < -X_MAX || s[0] > X_MAX || s[2] < -ANG_MAX || s[2] > ANG_MAX;

// politique linéaire à seuil : a = 1 si w · s > 0
export const act = (w: number[], s: number[]) => (w[0] * s[0] + w[1] * s[1] + w[2] * s[2] + w[3] * s[3] > 0 ? 1 : 0);

// un épisode d'au plus T pas ; renvoie sa durée (nombre de pas, récompense +1 par pas, pas de la chute compris)
export function episode(w: number[], s0: S4, P: Phys = NOMINAL, seed = 0, T = T_MAX) {
  const r = rng(seed + 777), buf: number[] = [];
  let s = s0;
  for (let t = 0; t < T; t++) {
    const o = P.noise ? s.map((v, i) => v + P.noise * NOISE[i] * (2 * r() - 1)) : s;
    buf.push(act(w, o));
    // retard de d pas : l'action appliquée est celle décidée d pas plus tôt (a = 0 au tout début)
    const a = buf.length > P.delay ? buf[buf.length - 1 - P.delay] : 0;
    s = step(s, a, P);
    if (fallen(s)) return t + 1;
  }
  return T;
}

// états initiaux tirés comme Gymnasium : chaque composante uniforme dans [−0,05 ; 0,05]
export function initStates(n: number, seed: number): S4[] {
  const r = rng(seed);
  return Array.from({ length: n }, () => [0, 0, 0, 0].map(() => -0.05 + 0.1 * r()) as S4);
}
// robots randomisés : masse du chariot, masse et demi-longueur de la perche, force, retard 0 à 2 pas, bruit de capteur
export function drawRobots(n: number, seed: number): Phys[] {
  const r = rng(seed), U = (a: number, b: number) => a + (b - a) * r();
  return Array.from({ length: n }, () => ({ mc: U(0.5, 1.5), mp: U(0.05, 0.3), l: U(0.3, 0.8), F: U(7, 13), delay: Math.floor(3 * r()), noise: 1 }));
}
