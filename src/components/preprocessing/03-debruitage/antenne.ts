// Chapitre 3 (Preprocessing), traitement d'antenne en bande étroite : une case de fréquence, un vecteur complexe par trame.
//   x_k = s_k · v(θ_s) + i_k · v(θ_i) + b_k        (raie, interférent, bruit indépendant entre capteurs)
// Antenne linéaire uniforme de C capteurs espacés de `esp` longueurs d'onde (0,5 par défaut).
// Gisement θ mesuré depuis la perpendiculaire à l'antenne. Même convention que le projet :
//   retard τ_c = −(u · r_c)/c,  a_c(θ) = exp(−2πi f τ_c)/√C,  soit ici a_c = exp(2πi · esp · (c − (C−1)/2) · sin θ)/√C.
// v(θ) = √C · a(θ) : onde plane d'amplitude 1 sur chaque capteur.
//
// Algèbre complexe : un vecteur de taille n est un Float64Array de 2n réels [re0, im0, re1, im1, …] ;
// une matrice n×n est rangée par lignes de la même façon (élément (i, j) à l'indice 2(i·n + j)).
import { gauss, rng, type Tfct } from './raies';

export type Vec = Float64Array;
export type Mat = Float64Array;

export const vec = (n: number): Vec => new Float64Array(2 * n);
export const mat = (n: number): Mat => new Float64Array(2 * n * n);
export const taille = (m: Mat) => Math.round(Math.sqrt(m.length / 2));

// a(θ), de norme 1
export function pointage(C: number, thetaDeg: number, esp = 0.5): Vec {
  const a = vec(C), u = Math.sin((thetaDeg * Math.PI) / 180), g = 1 / Math.sqrt(C);
  for (let c = 0; c < C; c++) {
    const ph = 2 * Math.PI * esp * (c - (C - 1) / 2) * u;
    a[2 * c] = g * Math.cos(ph); a[2 * c + 1] = g * Math.sin(ph);
  }
  return a;
}

// produit hermitien aᴴb → [re, im]
export function herm(a: Vec, b: Vec): [number, number] {
  let re = 0, im = 0;
  for (let i = 0; i < a.length; i += 2) {
    re += a[i] * b[i] + a[i + 1] * b[i + 1];
    im += a[i] * b[i + 1] - a[i + 1] * b[i];
  }
  return [re, im];
}

// M v
export function mulMV(M: Mat, v: Vec): Vec {
  const n = v.length / 2, out = vec(n);
  for (let i = 0; i < n; i++) {
    let re = 0, im = 0;
    for (let j = 0; j < n; j++) {
      const mr = M[2 * (i * n + j)], mi = M[2 * (i * n + j) + 1];
      re += mr * v[2 * j] - mi * v[2 * j + 1];
      im += mr * v[2 * j + 1] + mi * v[2 * j];
    }
    out[2 * i] = re; out[2 * i + 1] = im;
  }
  return out;
}

// M ← M + p · v vᴴ
export function ajouteDyade(M: Mat, v: Vec, p = 1) {
  const n = v.length / 2;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    M[2 * (i * n + j)] += p * (v[2 * i] * v[2 * j] + v[2 * i + 1] * v[2 * j + 1]);
    M[2 * (i * n + j) + 1] += p * (v[2 * i + 1] * v[2 * j] - v[2 * i] * v[2 * j + 1]);
  }
}

export const identite = (n: number, p = 1): Mat => { const M = mat(n); for (let i = 0; i < n; i++) M[2 * (i * n + i)] = p; return M; };
export const trace = (M: Mat) => { const n = taille(M); let t = 0; for (let i = 0; i < n; i++) t += M[2 * (i * n + i)]; return t; };

// Covariance exacte du bruit vu par l'antenne : bruit indépendant de puissance `bruit` par capteur
// + interférents de puissance `p` par capteur dans les directions `theta`.
export function covarianceExacte(C: number, interferents: { theta: number; p: number }[], bruit = 1, esp = 0.5): Mat {
  const K = identite(C, bruit);
  for (const { theta, p } of interferents) if (p > 0) ajouteDyade(K, pointage(C, theta, esp), p * C);
  return K;
}

// Covariance estimée : moyenne des x xᴴ sur les observations
export function covariance(obs: Vec[]): Mat {
  const K = mat(obs[0].length / 2);
  for (const x of obs) ajouteDyade(K, x, 1 / obs.length);
  return K;
}

// Charge diagonale du projet : K + (ε + 10⁻⁶) · ℓ · I, avec ℓ = tr(K)/C (niveau moyen par capteur)
export function charge(K: Mat, eps: number): Mat {
  const n = taille(K), out = K.slice(), l = Math.max(trace(K) / n, 1e-300);
  for (let i = 0; i < n; i++) out[2 * (i * n + i)] += (eps + 1e-6) * l;
  return out;
}

// Cholesky d'une matrice hermitienne définie positive : K = L Lᴴ, L triangulaire inférieure. null si K n'est pas définie positive.
export function cholesky(K: Mat): Mat | null {
  const n = taille(K), L = mat(n);
  for (let j = 0; j < n; j++) {
    let d = K[2 * (j * n + j)];
    for (let k = 0; k < j; k++) d -= L[2 * (j * n + k)] ** 2 + L[2 * (j * n + k) + 1] ** 2;
    if (!(d > 0)) return null;
    const ljj = Math.sqrt(d);
    L[2 * (j * n + j)] = ljj;
    for (let i = j + 1; i < n; i++) {
      let re = K[2 * (i * n + j)], im = K[2 * (i * n + j) + 1];
      for (let k = 0; k < j; k++) {
        const ar = L[2 * (i * n + k)], ai = L[2 * (i * n + k) + 1], br = L[2 * (j * n + k)], bi = L[2 * (j * n + k) + 1];
        re -= ar * br + ai * bi; // L_ik · conj(L_jk)
        im -= ai * br - ar * bi;
      }
      L[2 * (i * n + j)] = re / ljj; L[2 * (i * n + j) + 1] = im / ljj;
    }
  }
  return L;
}

// y = L⁻¹ b (descente) : c'est le blanchiment d'une trame
export function descente(L: Mat, b: Vec): Vec {
  const n = b.length / 2, y = vec(n);
  for (let i = 0; i < n; i++) {
    let re = b[2 * i], im = b[2 * i + 1];
    for (let k = 0; k < i; k++) {
      const lr = L[2 * (i * n + k)], li = L[2 * (i * n + k) + 1];
      re -= lr * y[2 * k] - li * y[2 * k + 1];
      im -= lr * y[2 * k + 1] + li * y[2 * k];
    }
    const d = L[2 * (i * n + i)];
    y[2 * i] = re / d; y[2 * i + 1] = im / d;
  }
  return y;
}

// z = L⁻ᴴ y (remontée)
export function remontee(L: Mat, y: Vec): Vec {
  const n = y.length / 2, z = vec(n);
  for (let i = n - 1; i >= 0; i--) {
    let re = y[2 * i], im = y[2 * i + 1];
    for (let k = i + 1; k < n; k++) {
      const lr = L[2 * (k * n + i)], li = -L[2 * (k * n + i) + 1]; // conj(L_ki)
      re -= lr * z[2 * k] - li * z[2 * k + 1];
      im -= lr * z[2 * k + 1] + li * z[2 * k];
    }
    const d = L[2 * (i * n + i)];
    z[2 * i] = re / d; z[2 * i + 1] = im / d;
  }
  return z;
}

// K⁻¹ b à partir du facteur de Cholesky
export const resoudre = (L: Mat, b: Vec): Vec => remontee(L, descente(L, b));

// Poids des voies classiques : w = a. Poids adaptatifs : w = K⁻¹a / (aᴴK⁻¹a). Dans les deux cas wᴴa = 1 (la raie visée passe sans gain ni perte).
export function poidsAdaptatif(K: Mat, a: Vec): Vec | null {
  const L = cholesky(K);
  if (!L) return null;
  const w = resoudre(L, a), q = herm(a, w)[0];
  for (let i = 0; i < w.length; i++) w[i] /= q;
  return w;
}

// Diagramme de directivité : |wᴴ a(θ)|², réponse en puissance à une onde plane venue de θ (1 dans la direction visée)
export function directivite(w: Vec, thetaDeg: number, esp = 0.5): number {
  const [re, im] = herm(w, pointage(w.length / 2, thetaDeg, esp));
  return re * re + im * im;
}

// Rapport signal/bruit en sortie pour une raie de puissance 1 par capteur dans la direction de a : C·|wᴴa|² / (wᴴ K w)
export function rsbSortie(w: Vec, a: Vec, K: Mat): number {
  const [re, im] = herm(w, a);
  return ((w.length / 2) * (re * re + im * im)) / herm(w, mulMV(K, w))[0];
}

// Gain sur un capteur seul : rapport signal/bruit en sortie divisé par celui d'un capteur (1 / K_cc)
export const gain = (w: Vec, a: Vec, K: Mat): number => rsbSortie(w, a, K) * (trace(K) / (w.length / 2));

// Bruit complexe gaussien circulaire de puissance p (E|z|² = p)
export function bruitComplexe(r: () => number, n: number, p = 1): Vec {
  const z = vec(n), g = Math.sqrt(p / 2);
  for (let i = 0; i < 2 * n; i++) z[i] = g * gauss(r);
  return z;
}

// Une observation : bruit indépendant + sources (amplitude complexe gaussienne de puissance p par capteur, direction theta)
export function observation(r: () => number, C: number, sources: { theta: number; p: number }[], bruit = 1, esp = 0.5): Vec {
  const x = bruitComplexe(r, C, bruit);
  for (const { theta, p } of sources) {
    if (!(p > 0)) continue;
    const a = pointage(C, theta, esp), s = bruitComplexe(r, 1, p * C);
    for (let c = 0; c < C; c++) {
      x[2 * c] += s[0] * a[2 * c] - s[1] * a[2 * c + 1];
      x[2 * c + 1] += s[0] * a[2 * c + 1] + s[1] * a[2 * c];
    }
  }
  return x;
}

// Voies classiques (Bartlett) : P(θ) = (1/K) Σ_k |a(θ)ᴴ x_k|²
export function voiesClassiques(X: Vec[], a: Vec): number {
  let s = 0;
  for (const x of X) { const [re, im] = herm(a, x); s += re * re + im * im; }
  return s / X.length;
}

// Filtre adapté adaptatif (AMF) : P(θ) = (1/K) Σ_k |a(θ)ᴴ K_n⁻¹ x_k|² / (a(θ)ᴴ K_n⁻¹ a(θ)), L = facteur de Cholesky de K_n.
// Comme dans le projet : trames blanchies y_k = L⁻¹x_k, pointage blanchi a_w = L⁻¹a, P = (1/K) Σ |a_wᴴ y_k|² / ‖a_w‖².
export function amf(Y: Vec[], L: Mat, a: Vec): number {
  const aw = descente(L, a), q = herm(aw, aw)[0];
  let s = 0;
  for (const y of Y) { const [re, im] = herm(aw, y); s += re * re + im * im; }
  return s / (Y.length * q);
}

// ---------------------------------------------------------------- spectre de détection à partir de la TFCT des C capteurs (comme `ArrayDetector` du projet)

export type ReglagesAntenne = {
  variante: 'classique' | 'adaptatif';
  bw?: number; // demi-largeur (Hz) de la bande de fréquences voisines qui sert à estimer K_n
  garde?: number; // garde (Hz) autour de la case testée, exclue de l'estimation (projet : fenêtre Doppler + 0,25 Hz)
  eps?: number; // charge diagonale ε
  pas?: number; // pas des gisements balayés (degrés), de −90° à +90°
  surTrames?: boolean; // essai : estimer K_n sur les trames de la case testée elle-même (dans le temps) au lieu des fréquences voisines
};

// S(f) = max_θ (1/K) Σ_k |aᴴx_k|² (classique) ou max_θ (1/K) Σ_k |aᴴK_n⁻¹x_k|² / (aᴴK_n⁻¹a) (adaptatif).
// Xs[c] : TFCT du capteur c ; n : nombre de trames utilisées ; retard(c, θ) : retard (s) du capteur c pour une onde plane venue de θ (degrés).
// K_n(f) : moyenne des x xᴴ sur les cases f′ avec garde ≤ |f′ − f| ≤ bw, sans les cases anormalement fortes
// (trace > 2 × médiane glissante), puis charge diagonale (ε + 10⁻⁶) · tr(K_n)/C.
export function spectreAntenne(Xs: Tfct[], n: number, retard: (c: number, theta: number) => number, reglages: ReglagesAntenne): { f: Float64Array; S: Float64Array } {
  const { variante, bw = 4, garde = 0.55, eps = 0.03, pas = 3, surTrames = false } = reglages;
  const C = Xs.length, f = Xs[0].f, F = f.length, df = Xs[0].df, K = Math.min(n, Xs[0].re.length);
  const thetas: number[] = [];
  for (let t = -90; t <= 90; t += pas) thetas.push(t);
  const trame = (k: number, j: number) => { const x = vec(C); for (let c = 0; c < C; c++) { x[2 * c] = Xs[c].re[k][j]; x[2 * c + 1] = Xs[c].im[k][j]; } return x; };
  const cases = Array.from({ length: F }, (_, j) => Array.from({ length: K }, (_, k) => trame(k, j)));
  const Cf = cases.map((X) => { const M = mat(C); for (const x of X) ajouteDyade(M, x); return M; }); // Σ_k x xᴴ par case
  const tr = Cf.map(trace);
  const nb = Math.max(3, Math.round(bw / df)), g = Math.ceil(garde / df - 1e-9);
  const ok = tr.map((t, j) => {
    const w: number[] = [];
    for (let d = -nb; d <= nb; d++) w.push(tr[Math.min(F - 1, Math.max(0, j + d))]);
    w.sort((a, b) => a - b);
    return t <= 2 * w[nb];
  });
  const S = new Float64Array(F);
  for (let j = 0; j < F; j++) {
    const steer = (th: number) => { const a = vec(C); for (let c = 0; c < C; c++) { const ph = -2 * Math.PI * f[j] * retard(c, th); a[2 * c] = Math.cos(ph) / Math.sqrt(C); a[2 * c + 1] = Math.sin(ph) / Math.sqrt(C); } return a; };
    let best = 0;
    if (variante === 'classique') {
      for (const th of thetas) best = Math.max(best, voiesClassiques(cases[j], steer(th)));
    } else {
      let Kn = mat(C), cnt = 0;
      if (surTrames) { Kn = Cf[j].slice(); cnt = 1; }
      else for (let d = -nb; d <= nb; d++) {
        const i = j + d;
        if (Math.abs(d) < g || i < 0 || i >= F || !ok[i]) continue;
        for (let m = 0; m < Kn.length; m++) Kn[m] += Cf[i][m];
        cnt++;
      }
      for (let m = 0; m < Kn.length; m++) Kn[m] /= Math.max(cnt, 1) * K;
      const L = cholesky(charge(Kn, eps));
      if (!L) { S[j] = NaN; continue; }
      const Y = cases[j].map((x) => descente(L, x));
      for (const th of thetas) best = Math.max(best, amf(Y, L, steer(th)));
    }
    S[j] = best;
  }
  return { f, S };
}

// ---------------------------------------------------------------- K_n estimée sur N observations : gain moyen selon N et ε (figure CovarianceFigure)

export type GainsEstimes = { Ns: number[]; eps: number[]; gains: number[][]; optimal: number; classique: number; tirages: number };
const cacheGains = new Map<string, GainsEstimes>();

// Pour chaque N : `tirages` estimations de K_n sur N observations sans raie (bruit + interférents), puis poids adaptatifs avec chaque
// charge ε, et gain exact de ces poids (calculé avec la vraie K_n). Renvoie la moyenne des gains (rapports de puissances, pas dB).
// gains[i][j] : charge eps[i], N = Ns[j]. Raie visée au gisement 0°.
export function gainsEstimes(C: number, scene: { theta: number; p: number }[], Ns: number[], eps: number[], tirages = 800, seed = 2026): GainsEstimes {
  const cle = JSON.stringify([C, scene, Ns, eps, tirages, seed]);
  const deja = cacheGains.get(cle);
  if (deja) return deja;
  const r = rng(seed), a = pointage(C, 0), K = covarianceExacte(C, scene);
  const gains = eps.map(() => Ns.map(() => 0));
  Ns.forEach((N, j) => {
    for (let t = 0; t < tirages; t++) {
      const Ke = covariance(Array.from({ length: N }, () => observation(r, C, scene)));
      eps.forEach((e, i) => { const w = poidsAdaptatif(charge(Ke, e), a); if (w) gains[i][j] += gain(w, a, K) / tirages; });
    }
  });
  const out = { Ns, eps, gains, optimal: gain(poidsAdaptatif(K, a)!, a, K), classique: gain(a, a, K), tirages };
  cacheGains.set(cle, out);
  return out;
}
