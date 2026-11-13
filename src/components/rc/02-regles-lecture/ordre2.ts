// Cours Reservoir computing, chapitre 2 : lecture d'ordre 2 (monômes et noyau), utilisée par lorenz.ts.
// x : état du réservoir. φ(x) = (x_j, x_j x_j' pour j ≤ j' ; j : neurone) ; noyau k(a, b) = φ(a)·φ(b) = a·b + ((a·b)² + Σ a_j² b_j²) / 2.

export const nFeat = (n: number) => n + (n * (n + 1)) / 2;
export function phi(x: Float64Array) {
  const n = x.length, f = new Float64Array(nFeat(n));
  let p = 0;
  for (let i = 0; i < n; i++) f[p++] = x[i];
  for (let i = 0; i < n; i++) for (let j = i; j < n; j++) f[p++] = x[i] * x[j];
  return f;
}
// noyau sans φ explicite : sommes des puissances p₁ = Σ c_i, p₂ = Σ c_i² des produits c_i = a_i b_i ; Σ_{i ≤ j} c_i c_j = (p₁² + p₂) / 2
export function ker(a: Float64Array, b: Float64Array) {
  let p = 0, q = 0;
  for (let i = 0; i < a.length; i++) { const c = a[i] * b[i]; p += c; q += c * c; }
  return p + (p * p + q) / 2;
}
// noyau centré : k_c(a, b) = k(a, b) − moyenne_j k(a, x_j) − moyenne_j k(x_j, b) + moyenne_ij k(x_i, x_j)  (= C K C sur l'apprentissage)
export function centeredGram(X: Float64Array[]) {
  const n = X.length, Kr = X.map((a) => X.map((b) => ker(a, b)));
  const rm = Kr.map((r) => r.reduce((s, v) => s + v, 0) / n), all = rm.reduce((s, v) => s + v, 0) / n;
  const Kc = Kr.map((r, i) => Float64Array.from(r, (v, j) => v - rm[i] - rm[j] + all));
  return { Kc, rm, all };
}

