// Signal de démonstration partagé par les widgets du chapitre MFCC : 0,6 s à 16 kHz, synthétique (rien n'est enregistré).
// Quatre segments : voyelle « a », bruit de type « s », voyelle « i », silence bruité.
export const SR = 16000;
export const DURATION = 0.6;
export const N = Math.round(SR * DURATION);

export type Segment = { from: number; to: number; label: string };
export const SEGMENTS: Segment[] = [
  { from: 0, to: 0.2, label: 'voyelle « a »' },
  { from: 0.2, to: 0.3, label: 'bruit « s »' },
  { from: 0.3, to: 0.5, label: 'voyelle « i »' },
  { from: 0.5, to: 0.6, label: 'silence' },
];

// générateur pseudo-aléatoire reproductible
const rng = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let r = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
  return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
};

// voyelle : somme d'harmoniques de f0, dont l'amplitude suit une enveloppe à deux pics (les formants)
function vowel(out: Float32Array, t0: number, t1: number, f0: number, formants: [number, number][], amp: number) {
  const i0 = Math.round(t0 * SR), i1 = Math.round(t1 * SR);
  for (let h = 1; h * f0 < SR / 2; h++) {
    const f = h * f0;
    let a = 0;
    for (const [fc, bw] of formants) a += Math.exp(-0.5 * ((f - fc) / bw) ** 2);
    a *= amp / h ** 0.35;
    if (a < 1e-3) continue;
    for (let i = i0; i < i1; i++) {
      const t = i / SR;
      const env = Math.min(1, (i - i0) / 200, (i1 - i) / 200); // fondu aux bords du segment
      out[i] += a * env * Math.sin(2 * Math.PI * f * t);
    }
  }
}

// floor : amplitude d'un bruit large bande ajouté partout après normalisation (comme dans un vrai enregistrement), 0 par défaut.
export function makeSignal(opts: { floor?: number } = {}): Float32Array {
  const x = new Float32Array(N);
  const r = rng(7);
  vowel(x, 0, 0.2, 120, [[700, 110], [1200, 150]], 0.11);
  vowel(x, 0.3, 0.5, 135, [[300, 60], [2300, 220]], 0.11);
  // « s » : bruit blanc dérivé (énergie surtout dans les hautes fréquences)
  let prev = 0;
  for (let i = Math.round(0.2 * SR); i < Math.round(0.3 * SR); i++) {
    const w = r() * 2 - 1;
    const env = Math.min(1, (i - 0.2 * SR) / 300, (0.3 * SR - i) / 300);
    x[i] += 0.28 * env * (w - prev);
    prev = w;
  }
  // silence : bruit très faible
  for (let i = Math.round(0.5 * SR); i < N; i++) x[i] += 0.0006 * (r() * 2 - 1);
  // normalisation à ±0,9
  let m = 0;
  for (const v of x) m = Math.max(m, Math.abs(v));
  for (let i = 0; i < N; i++) x[i] = (x[i] / m) * 0.9;
  if (opts.floor) { const q = rng(11); for (let i = 0; i < N; i++) x[i] += opts.floor * (q() * 2 - 1); }
  return x;
}
