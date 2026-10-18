// Données partagées par les widgets du chapitre 0 : mêmes embeddings, mêmes matrices W.
// Valeurs tirées au hasard, comme à l'initialisation d'un modèle : rien n'est entraîné.
// E : embeddings bruts (échelle différente selon le mot). X = RMSNorm(E) : entrée de l'attention.
export const WORDS = ["Le", "chat", "noir", "dort", "sur", "le", "canapé", "du", "salon", "depuis", "ce", "matin", "car", "il"];
export const D_MODEL = 8;
export const D_K = 4;

export const E: number[][] = [
  [-2.2, 0.7, 1.8, -0.9, -2.3, -0.2, 0.9, 2],
  [-0.7, -0.8, 0.4, 0.3, 0.9, 0.6, -0.1, -0.2],
  [3.4, -0.4, -1, -1.4, 0.1, 0.1, -0.4, -0.1],
  [0.1, 0.3, 0.6, 0.1, -0.9, 0.3, -0.7, -0.1],
  [-3.3, 0, -1.8, 0.4, 7.3, 0, 1.8, -2.9],
  [-0.2, 0.5, -0.1, 0.3, 0.1, -0.7, 0.4, -0.6],
  [2.8, -0.8, 1, 0, 1.5, -0.9, 1.5, -0.2],
  [1.2, 0.5, 0.1, -0.7, 0.7, 0.5, 1.4, -0.4],
  [0.4, 0.3, 0.2, 0.1, 0.1, -0.4, -0.6, -0.2],
  [0.7, 1.8, 1.2, 1.3, 1, 0.8, 0.2, 1],
  [2.9, -0.5, -1.1, 3.2, 0.3, 1.6, 1.4, -1.8],
  [1.9, 1.4, 0.2, 0.6, 0.1, -0.7, -0.1, 0.3],
  [1.1, 0.7, 0.1, 1.4, -0.8, 0.8, 1.1, -0.3],
  [-3.4, -1.7, 0.4, 0.9, 2.8, -1.9, 0, 1.1],
];

export const WQ: number[][] = [
  [-0.1, -0.8, 0.3, 0.8],
  [0.4, -0.3, -0.1, 0.1],
  [0.9, 0.2, 0, 0.6],
  [0, 0.7, -0.2, -0.2],
  [0.3, 0.5, 0.2, 0.1],
  [-0.6, -0.3, -0.2, -0.2],
  [0.2, -0.1, 0.3, 0],
  [-0.1, 0, 0.2, 0.3],
];

export const WK: number[][] = [
  [-0.2, -0.1, -0.5, 0.6],
  [0.5, -0.1, -0.2, -0.4],
  [0.1, 0.1, 0.8, 0.1],
  [-0.3, -0.9, 0.5, 0.1],
  [-0.6, 0.1, -0.6, 1.2],
  [0.4, 0.2, -0.1, -0.8],
  [0, -0.5, 0.2, -0.8],
  [-0.3, 0.4, 0.6, -0.4],
];

export const WV: number[][] = [
  [-0.5, 0.3, 0.3, -0.3],
  [-0.2, -0.2, -0.4, -0.2],
  [0.4, 0.2, 0.7, 0],
  [0, -0.3, 0, -0.5],
  [-0.6, 0.2, 0.5, 0.3],
  [0.5, 0.1, -0.3, 0],
  [-0.1, -0.4, -0.6, -0.5],
  [0, 0.1, -0.2, 0.5],
];

/** Projection de sortie : ramène la sortie d'une tête (d_k = 4) à d_model = 8. */
export const WO: number[][] = [
  [1.1, -0.6, 0.2, -0.1, -0.4, -0.3, -0.3, 0],
  [0.2, 0.5, 0.1, 0.5, 0.2, 0, -0.1, -0.5],
  [-0.8, -0.1, -0.1, 0.1, 0.1, -0.7, -0.4, -0.6],
  [0.5, -0.1, 0, -0.5, -0.7, -0.3, -0.1, 0.2],
];

/** RMSNorm sans gain appris (g = 1) : divise la ligne par la racine de la moyenne de ses carrés. */
export const rmsnorm = (v: readonly number[]): number[] => {
  const rms = Math.sqrt(v.reduce((a, x) => a + x * x, 0) / v.length + 1e-6);
  return v.map((x) => x / rms);
};

export const X: number[][] = E.map(rmsnorm);

export const mul = (v: readonly number[], M: readonly (readonly number[])[]): number[] =>
  M[0].map((_, c) => v.reduce((acc, x, r) => acc + x * M[r][c], 0));

/** Poids d'attention softmax(Q Kᵀ / √d_k) avec masque causal, une ligne par mot (ligne i : j = 0..i). */
export function attentionWeights(): number[][] {
  const Q = X.map((x) => mul(x, WQ));
  const K = X.map((x) => mul(x, WK));
  return Q.map((q, i) => {
    const scores = K.slice(0, i + 1).map((k) => q.reduce((a, v, d) => a + v * k[d], 0) / Math.sqrt(D_K));
    const ex = scores.map((s) => Math.exp(s));
    const z = ex.reduce((a, b) => a + b, 0);
    return ex.map((e) => e / z);
  });
}

/** Valeurs v_j de tous les mots (même matrice que dans le widget des projections). */
export const V: number[][] = X.map((x) => mul(x, WV));
