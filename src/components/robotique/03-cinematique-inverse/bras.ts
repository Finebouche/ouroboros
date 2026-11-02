// Cours Robotique : le bras plan 3R du chapitre et les calculs de cinématique inverse que montrent les widgets.
// Segments l = (0,5 ; 0,4 ; 0,3) m, base à l'origine, départ q0 = (0,4 ; 0,8 ; 0,8) rad.
// Convention du cours : e = x⋆ − x(q), J = ∂x/∂q, on cherche J Δq ≈ e.
export const L = [0.5, 0.4, 0.3];
export const REACH = L[0] + L[1] + L[2];
export const Q0 = [0.4, 0.8, 0.8];
export type V2 = [number, number];

// positions de la base, des deux articulations suivantes et de la main
export function fk(q: number[], l: number[] = L): V2[] {
  const pts: V2[] = [[0, 0]];
  let a = 0, x = 0, y = 0;
  for (let i = 0; i < l.length; i++) { a += q[i]; x += l[i] * Math.cos(a); y += l[i] * Math.sin(a); pts.push([x, y]); }
  return pts;
}
export const tip = (q: number[]): V2 => fk(q)[3];

// jacobienne 2 × 3 : colonne j = Σ_{i ≥ j} l_i (−sin φ_i, cos φ_i), φ_i = q_1 + … + q_i
export function jac(q: number[]): number[][] {
  const J = [[0, 0, 0], [0, 0, 0]];
  let a = 0; const phi: number[] = [];
  for (let i = 0; i < 3; i++) { a += q[i]; phi.push(a); }
  for (let j = 0; j < 3; j++) for (let i = j; i < 3; i++) { J[0][j] -= L[i] * Math.sin(phi[i]); J[1][j] += L[i] * Math.cos(phi[i]); }
  return J;
}
const dot3 = (a: number[], b: number[]) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
// J Jᵀ (2 × 2)
const jjt = (J: number[][]) => [[dot3(J[0], J[0]), dot3(J[0], J[1])], [dot3(J[0], J[1]), dot3(J[1], J[1])]];
// valeurs singulières de J, de la plus grande à la plus petite (racines des valeurs propres de J Jᵀ)
export function sigmas(J: number[][]): V2 {
  const [[a, b], [, d]] = jjt(J), tr = a + d, det = a * d - b * b, disc = Math.sqrt(Math.max(0, (tr * tr) / 4 - det));
  return [Math.sqrt(tr / 2 + disc), Math.sqrt(Math.max(0, tr / 2 - disc))];
}
export const mulJ = (J: number[][], v: number[]): V2 => [dot3(J[0], v), dot3(J[1], v)];
// Δq = Jᵀ (J Jᵀ + λ² I)⁻¹ e ; null si la matrice 2 × 2 est singulière
export function dlsStep(J: number[][], e: V2, lam: number): number[] | null {
  const [[a0, b], [, d0]] = jjt(J), a = a0 + lam * lam, d = d0 + lam * lam, det = a * d - b * b;
  if (Math.abs(det) < 1e-12) return null;
  const y0 = (d * e[0] - b * e[1]) / det, y1 = (-b * e[0] + a * e[1]) / det;
  return [0, 1, 2].map((j) => J[0][j] * y0 + J[1][j] * y1);
}
export const err = (q: number[], t: V2): V2 => { const p = tip(q); return [t[0] - p[0], t[1] - p[1]]; };
export const norm = (v: number[]) => Math.hypot(...v);

// petit système linéaire dense (pivot partiel)
export function solve(A: number[][], b: number[]): number[] {
  const n = b.length, M = A.map((r, i) => [...r, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    for (let r = 0; r < n; r++) if (r !== c) { const f = M[r][c] / M[c][c]; for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k]; }
  }
  return M.map((r, i) => r[n] / r[i]);
}

// ---- widget 1 : itérations des moindres carrés amortis, sans limites, pas complet
export type DlsState = { q: number[]; e: V2; nE: number; sig: V2; dq: number[] | null; nDq: number; pred: V2 | null };
export function runDls(t: V2, lam: number, K: number, q0: number[] = Q0): DlsState[] {
  const out: DlsState[] = []; let q = q0.slice();
  for (let k = 0; k <= K; k++) {
    const e = err(q, t), J = jac(q), dq = dlsStep(J, e, lam), p = tip(q);
    const pred: V2 | null = dq ? (() => { const v = mulJ(J, dq); return [p[0] + v[0], p[1] + v[1]] as V2; })() : null;
    out.push({ q: q.slice(), e, nE: norm(e), sig: sigmas(J), dq, nDq: dq ? norm(dq) : 0, pred });
    if (!dq) break;
    q = q.map((v, i) => v + dq[i]);
  }
  return out;
}

// ---- widget 2 : main + posture, pondérées ou hiérarchisées (λ amortit la tâche de la main)
export type Mode = { kind: 'seule' } | { kind: 'poids'; w: number } | { kind: 'hier' };
export function tachesStep(q: number[], t: V2, qref: number[], lam: number, mode: Mode): number[] {
  const e1 = err(q, t), e2 = qref.map((v, i) => v - q[i]), J = jac(q);
  if (mode.kind === 'hier') {
    // Δq = J# e1 + N1 e2, J# = Jᵀ (J Jᵀ + λ² I)⁻¹, N1 = I − J⁺ J (pseudo-inverse exacte)
    const d1 = dlsStep(J, e1, lam)!, Je2 = mulJ(J, e2), z = dlsStep(J, Je2, 0)!;
    return [0, 1, 2].map((j) => d1[j] + e2[j] - z[j]);
  }
  // min ‖J Δq − e1‖² + w ‖Δq − e2‖² + λ² ‖Δq‖²  →  (JᵀJ + (w + λ²) I) Δq = Jᵀ e1 + w e2
  const w = mode.kind === 'poids' ? mode.w : 0;
  const H = [0, 1, 2].map((i) => [0, 1, 2].map((j) => J[0][i] * J[0][j] + J[1][i] * J[1][j] + (i === j ? w + lam * lam : 0)));
  const g = [0, 1, 2].map((i) => J[0][i] * e1[0] + J[1][i] * e1[1] + w * e2[i]);
  return solve(H, g);
}
export function runTaches(t: V2, qref: number[], lam: number, mode: Mode, K = 400, q0: number[] = Q0) {
  let q = q0.slice(); const qs: number[][] = [q.slice()]; let steps = -1;
  for (let k = 0; k < K; k++) {
    const dq = tachesStep(q, t, qref, lam, mode);
    if (steps < 0 && norm(dq) < 1e-6) steps = k;
    q = q.map((v, i) => v + dq[i]);
    if (steps < 0) qs.push(q.slice());
  }
  return { q, qs, steps, eMain: norm(err(q, t)), dPost: norm(q.map((v, i) => v - qref[i])) };
}

// ---- figure des butées : QP à bornes, min ½ Δqᵀ H Δq + gᵀ Δq sous lo ≤ Δq ≤ hi, résolu exactement en énumérant
// les 3ⁿ faces (chaque variable libre, en borne basse ou en borne haute) ; H définie positive, n = 3
export function boxQP(H: number[][], g: number[], lo: number[], hi: number[]): number[] {
  const n = g.length; let best: number[] = new Array(n).fill(0), bestF = Infinity;
  for (let code = 0; code < 3 ** n; code++) {
    const st: number[] = []; let c = code; for (let i = 0; i < n; i++) { st.push(c % 3); c = Math.floor(c / 3); }
    if (st.some((s, i) => (s === 1 && !isFinite(lo[i])) || (s === 2 && !isFinite(hi[i])))) continue;
    const x = st.map((s, i) => (s === 1 ? lo[i] : s === 2 ? hi[i] : 0)), free = st.flatMap((s, i) => (s === 0 ? [i] : []));
    if (free.length) {
      const xf = solve(free.map((i) => free.map((j) => H[i][j])), free.map((i) => -g[i] - x.reduce((s, xj, j) => s + (st[j] === 0 ? 0 : H[i][j] * xj), 0)));
      free.forEach((i, k) => (x[i] = xf[k]));
    }
    if (x.some((v, i) => v < lo[i] - 1e-12 || v > hi[i] + 1e-12)) continue;
    const f = 0.5 * x.reduce((s, xi, i) => s + xi * H[i].reduce((u, h, j) => u + h * x[j], 0), 0) + g.reduce((s, gi, i) => s + gi * x[i], 0);
    if (f < bestF - 1e-15) { bestF = f; best = x; }
  }
  return best;
}
// butées qmin ≤ q ≤ qmax ; « clip » : pas amorti sans limites, puis q écrêté ; « qp » : les butées sont dans le problème
export function runButee(t: V2, qmin: number[], qmax: number[], lam: number, mode: 'clip' | 'qp', K: number, q0: number[] = Q0) {
  let q = q0.slice(); const qs: number[][] = [q.slice()], errs: number[] = [norm(err(q, t))];
  for (let k = 0; k < K; k++) {
    const e = err(q, t), J = jac(q);
    let dq: number[];
    if (mode === 'qp') {
      const H = [0, 1, 2].map((i) => [0, 1, 2].map((j) => J[0][i] * J[0][j] + J[1][i] * J[1][j] + (i === j ? lam * lam : 0)));
      const g = [0, 1, 2].map((i) => -(J[0][i] * e[0] + J[1][i] * e[1]));
      dq = boxQP(H, g, q.map((v, i) => qmin[i] - v), q.map((v, i) => qmax[i] - v));
    } else dq = dlsStep(J, e, lam)!;
    q = q.map((v, i) => Math.min(qmax[i], Math.max(qmin[i], v + dq[i])));
    qs.push(q.slice()); errs.push(norm(err(q, t)));
  }
  return { qs, errs };
}
