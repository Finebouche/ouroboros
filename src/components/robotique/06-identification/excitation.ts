// Cours Robotique : moindres carrés sur un pendule commandé en couple (données synthétiques).
// Modèle linéaire en θ = (I, mgl, K_v, K_c) : τ = I q̈ + mgl sin q + K_v q̇ + K_c sign(q̇) ; une ligne de Y par instant.
// Trois excitations (sommes de sinus, 6 s à 200 Hz) ; couple mesuré = vrai couple + bruit gaussien (écart-type 0,02 N·m).
// Pour chaque excitation : conditionnement de Y, une estimation (premier tirage), et l'écart-type relatif de θ̂ sur 200 tirages du bruit.

export const THETA = [0.012, 0.75, 0.03, 0.09];
export const NOISE = 0.02, DT = 0.005, NS = 1200, DRAWS = 200;
export const CASES = [
  { key: 'lent', label: 'lent, petite amplitude', w: [0.5], a: [0.2] },
  { key: 'un', label: 'un sinus', w: [2.0], a: [0.8] },
  { key: 'trois', label: 'trois sinus', w: [1.3, 3.1, 5.7], a: [0.8, 0.4, 0.15] },
];

// générateur à graine fixe (mulberry32) et loi normale (Box-Muller)
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const gaussian = (r: () => number) => { let u = 0; while (u === 0) u = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r()); };

// résolution de A x = b (4 × 4, pivot partiel)
function solve(A: number[][], b: number[]) {
  const n = b.length, M = A.map((row, i) => [...row, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let i = c + 1; i < n; i++) if (Math.abs(M[i][c]) > Math.abs(M[p][c])) p = i;
    [M[c], M[p]] = [M[p], M[c]];
    for (let i = c + 1; i < n; i++) { const f = M[i][c] / M[c][c]; for (let j = c; j <= n; j++) M[i][j] -= f * M[c][j]; }
  }
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) { let s = M[i][n]; for (let j = i + 1; j < n; j++) s -= M[i][j] * x[j]; x[i] = s / M[i][i]; }
  return x;
}
// valeurs propres d'une matrice symétrique (Jacobi) : cond(Y) = √(λ_max / λ_min) de YᵀY
function eigvals(A: number[][]) {
  const n = A.length, a = A.map((r) => r.slice());
  for (let sweep = 0; sweep < 100; sweep++) {
    let off = 0;
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) off += a[i][j] ** 2;
    if (off < 1e-30) break;
    for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) {
      if (Math.abs(a[p][q]) < 1e-300) continue;
      const th = (a[q][q] - a[p][p]) / (2 * a[p][q]);
      const t = Math.sign(th || 1) / (Math.abs(th) + Math.sqrt(th * th + 1)), c = 1 / Math.sqrt(t * t + 1), s = t * c;
      for (let k = 0; k < n; k++) { const akp = a[k][p], akq = a[k][q]; a[k][p] = c * akp - s * akq; a[k][q] = s * akp + c * akq; }
      for (let k = 0; k < n; k++) { const apk = a[p][k], aqk = a[q][k]; a[p][k] = c * apk - s * aqk; a[q][k] = s * apk + c * aqk; }
    }
  }
  return a.map((r, i) => r[i]);
}

export function excitation() {
  return CASES.map((c, ci) => {
    const q: number[] = [], qd: number[] = [], qdd: number[] = [];
    for (let k = 0; k < NS; k++) {
      const t = k * DT;
      q.push(c.w.reduce((s, w, i) => s + c.a[i] * Math.sin(w * t), 0));
      qd.push(c.w.reduce((s, w, i) => s + c.a[i] * w * Math.cos(w * t), 0));
      qdd.push(c.w.reduce((s, w, i) => s - c.a[i] * w * w * Math.sin(w * t), 0));
    }
    const Y = q.map((_, k) => [qdd[k], Math.sin(q[k]), qd[k], Math.sign(qd[k])]);
    const YtY = [0, 1, 2, 3].map((i) => [0, 1, 2, 3].map((j) => Y.reduce((s, r) => s + r[i] * r[j], 0)));
    const ev = eigvals(YtY), cond = Math.sqrt(Math.max(...ev) / Math.min(...ev));
    const tau0 = Y.map((r) => r.reduce((s, v, i) => s + v * THETA[i], 0));
    const r = rng(1000 + ci), est: number[][] = [];
    for (let d = 0; d < DRAWS; d++) {
      const tau = tau0.map((v) => v + NOISE * gaussian(r));
      const Ytt = [0, 1, 2, 3].map((i) => Y.reduce((s, row, k) => s + row[i] * tau[k], 0));
      est.push(solve(YtY, Ytt));
    }
    const mean = [0, 1, 2, 3].map((i) => est.reduce((s, e) => s + e[i], 0) / DRAWS);
    const rel = [0, 1, 2, 3].map((i) => Math.sqrt(est.reduce((s, e) => s + (e[i] - mean[i]) ** 2, 0) / DRAWS) / THETA[i]);
    return { key: c.key, label: c.label, q, qdd, sinq: q.map(Math.sin), cond, first: est[0], rel };
  });
}

if (import.meta.main) {
  for (const c of excitation()) console.log(c.label.padEnd(24), 'cond', c.cond.toFixed(1), '| θ̂ (1er tirage)', c.first.map((v) => v.toFixed(4)).join(' '), '| écart-type relatif', c.rel.map((v) => v.toFixed(4)).join(' '), '| max|q̈|', Math.max(...c.qdd.map(Math.abs)).toFixed(2));
}
