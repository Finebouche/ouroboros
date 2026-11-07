// Cours Reservoir computing, chapitre 2 : à quoi sert la boucle fermée de FORCE (architecture A de Sussillo et Abbott, 2009, en petit).
// Réseau chaotique sans entrée : dx/dt = −x + J tanh(x) + w_f · retour, J creux (p = 0,1), gain g = 1,5, Euler dt = 0,1 ; w_f figé dans U(−1, 1).
// Sortie z = w · tanh(x) ; cible périodique f (période 60). Quatre cas, apprentissage sur 600 unités de temps puis coupé (300 unités) :
// sans retour ; retour de la cible pendant l'apprentissage (teacher forcing), de z ensuite ; FORCE (retour de z, RLS) ; LMS en boucle fermée.
import { rng, gauss } from '../esn';

export const N = 200, DT = 0.1, TTRAIN = 600, TTEST = 300, ETA_LMS = 0.02;
export const target = (t: number) => 0.6 * Math.sin((2 * Math.PI * t) / 60) + 0.3 * Math.sin((4 * Math.PI * t) / 60) + 0.15 * Math.sin((6 * Math.PI * t) / 60);
export type Case = 'none' | 'teacher' | 'force' | 'lms';
export type Run = { z: number[]; neu: number[][]; rmseTrain: number; rmseTest: number };

function net(seed = 7) {
  const r = rng(seed), p = 0.1, g = 1.5;
  const J = Array.from({ length: N }, () => { const row: [number, number][] = []; for (let j = 0; j < N; j++) if (r() < p) row.push([j, (gauss(r) * g) / Math.sqrt(p * N)]); return row; });
  const wf = Array.from({ length: N }, () => 2 * r() - 1), x0 = Array.from({ length: N }, () => 0.5 * gauss(r));
  return { J, wf, x0 };
}

// une simulation ; z et trois neurones échantillonnés toutes les unités de temps
export function simulate(c: Case): Run {
  const { J, wf, x0 } = net();
  let x = x0.slice(), rr = x.map(Math.tanh), z = 0;
  const w = new Float64Array(N);
  const P = c === 'force' || c === 'teacher' ? Array.from({ length: N }, (_, i) => { const a = new Float64Array(N); a[i] = 1; return a; }) : null;
  const nTr = Math.round(TTRAIN / DT), nTe = Math.round(TTEST / DT), out: Run = { z: [], neu: [[], [], []], rmseTrain: 0, rmseTest: 0 };
  let eTr = 0, eTe = 0;
  for (let s = 0; s < nTr + nTe; s++) {
    const t = s * DT, train = s < nTr;
    const fb = c === 'none' ? 0 : c === 'teacher' && train ? target(t) : z;
    x = x.map((v, i) => { let a = 0; for (const [j, cij] of J[i]) a += cij * rr[j]; return v + DT * (-v + a + wf[i] * fb); });
    rr = x.map(Math.tanh);
    z = rr.reduce((a, v, i) => a + v * w[i], 0);
    const e = z - target(t);
    if (train) {
      eTr += e * e;
      // une mise à jour tous les deux pas ; sans retour, la lecture apprend aussi (RLS), mais elle ne lit qu'un réservoir chaotique
      if (s % 2 === 0) {
        if (P || c === 'none') {
          const PP = P ?? (P2 ??= Array.from({ length: N }, (_, i) => { const a = new Float64Array(N); a[i] = 1; return a; }));
          const Pr = PP.map((row) => row.reduce((a, v, j) => a + v * rr[j], 0)), den = 1 + rr.reduce((a, v, i) => a + v * Pr[i], 0);
          for (let i = 0; i < N; i++) w[i] -= (e * Pr[i]) / den;
          for (let i = 0; i < N; i++) { const pi = Pr[i] / den, row = PP[i]; for (let j = 0; j < N; j++) row[j] -= pi * Pr[j]; }
        } else for (let i = 0; i < N; i++) w[i] -= ETA_LMS * e * rr[i];
      }
    } else eTe += e * e;
    if (s % 10 === 0) { out.z.push(Number.isFinite(z) ? z : NaN); out.neu.forEach((a, k) => a.push(rr[[3, 57, 121][k]])); }
  }
  out.rmseTrain = Math.sqrt(eTr / nTr); out.rmseTest = Math.sqrt(eTe / nTe);
  return out;
}
let P2: Float64Array[] | undefined;
let memo: Record<Case, Run> | undefined;
export const runs = () => (memo ??= { none: simulate('none'), teacher: simulate('teacher'), force: simulate('force'), lms: simulate('lms') });
