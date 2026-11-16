// Chapitre 4 (Preprocessing) : calculs des figures d'intuition (scène, RTF, MVDR guidé par masques, différence entre deux micros).
// Tous les signaux sont synthétiques. Article illustré : Tan, Wang, Wang, « Neural Spectrospatial Filtering », TASLP 30, 2022.
// Notations du cours (entre parenthèses, celles de l'article) : C micros (P), micro i (p), référence i = 0 (q), trame j (t),
// cible directe au micro de référence s (S_q), vecteur RTF d (d_q), partie non cible v (V), covariances R_s, R_v (Φ_s, Φ_v), filtre h (w).
// Antenne linéaire de l'article (fig. 5b) : 8 micros espacés de 5 cm, le micro de référence à un bout.
// Azimut θ compté depuis la perpendiculaire à l'antenne ; θ < 0 du côté du micro 0 (dans l'article, −90° regarde vers le micro 1, p. 611).
// Algèbre complexe : mêmes conventions que le chapitre 3 (antenne.ts) : vecteur = Float64Array [re0, im0, re1, im1, …].
import { vec, mat, herm, mulMV, ajouteDyade, poidsAdaptatif, type Vec, type Mat } from '../03-debruitage/antenne';
import { rng, gauss } from '../03-debruitage/raies';

export { rng, gauss, herm, type Vec, type Mat };
export const FS = 16000; // Hz (article, p. 611)
export const CSON = 343; // m/s
export const C8 = 8, PAS8 = 0.05; // antenne linéaire de 8 micros, 5 cm (fig. 5b)
const rad = (deg: number) => (deg * Math.PI) / 180;

// ---------------------------------------------------------------- champ libre
// Retard du micro i par rapport au micro 0 pour une onde plane d'azimut θ : τ_i = −i · pas · sin θ / c (θ > 0 : arrive d'abord sur les derniers micros)
export const retardLibre = (i: number, pas: number, azDeg: number) => (-i * pas * Math.sin(rad(azDeg))) / CSON;

// RTF en champ libre : d_i(f) = exp(−2πi f τ_i), d_0 = 1
export function rtfLibre(C: number, pas: number, azDeg: number, f: number): Vec {
  const d = vec(C);
  for (let i = 0; i < C; i++) {
    const ph = -2 * Math.PI * f * retardLibre(i, pas, azDeg);
    d[2 * i] = Math.cos(ph); d[2 * i + 1] = Math.sin(ph);
  }
  return d;
}

// ---------------------------------------------------------------- pièce (méthode des sources images, pièce rectangulaire)
// Chaque réflexion sur un mur multiplie l'onde par β (coefficient de réflexion en pression, le même pour les six parois).
// T60 d'Eyring : T60 = 0,161 V / (−S ln(1 − α)), α = 1 − β².
export type P3 = [number, number, number];
export type Piece = { L: P3; beta: number; tMax: number }; // tMax : on garde les images dont le trajet dure moins de tMax secondes
export type Image = { p: P3; g: number; ordre: number };

export const t60Eyring = (pc: Piece) => {
  const [a, b, c] = pc.L, V = a * b * c, S = 2 * (a * b + a * c + b * c);
  return (0.161 * V) / (-S * Math.log(pc.beta * pc.beta));
};

export function images(pc: Piece, src: P3, centre: P3): Image[] {
  const out: Image[] = [], rMax = pc.tMax * CSON;
  const nMax = pc.L.map((l) => Math.ceil(rMax / (2 * l)) + 1);
  for (let nx = -nMax[0]; nx <= nMax[0]; nx++) for (let ny = -nMax[1]; ny <= nMax[1]; ny++) for (let nz = -nMax[2]; nz <= nMax[2]; nz++)
    for (let qx = 0; qx < 2; qx++) for (let qy = 0; qy < 2; qy++) for (let qz = 0; qz < 2; qz++) {
      const n = [nx, ny, nz], q = [qx, qy, qz], p: P3 = [0, 0, 0];
      let ordre = 0;
      for (let a = 0; a < 3; a++) {
        p[a] = (1 - 2 * q[a]) * src[a] + 2 * n[a] * pc.L[a];
        ordre += Math.abs(n[a] - q[a]) + Math.abs(n[a]);
      }
      const r = Math.hypot(p[0] - centre[0], p[1] - centre[1], p[2] - centre[2]);
      if (r > rMax) continue;
      out.push({ p, g: pc.beta ** ordre, ordre });
    }
  return out;
}

const dist = (a: P3, b: P3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

// Fonction de transfert source → micro à la fréquence f : H(f) = Σ g / (4π r) · exp(−2πi f r / c). direct : seulement l'image d'ordre 0.
export function transfert(imgs: Image[], mic: P3, f: number, direct = false): [number, number] {
  let re = 0, im = 0;
  for (const im0 of imgs) {
    if (direct && im0.ordre > 0) continue;
    const r = dist(im0.p, mic), a = im0.g / (4 * Math.PI * r), ph = (-2 * Math.PI * f * r) / CSON;
    re += a * Math.cos(ph); im += a * Math.sin(ph);
  }
  return [re, im];
}

// Réponse impulsionnelle échantillonnée (retard fractionnaire : sinus cardinal fenêtré de Hann sur 2·demi + 1 échantillons)
export function rir(imgs: Image[], mic: P3, n: number, fs = FS, sauf: 'direct' | 'reverb' | null = null, demi = 8): Float64Array {
  const h = new Float64Array(n);
  for (const im0 of imgs) {
    if (sauf === 'direct' && im0.ordre === 0) continue;
    if (sauf === 'reverb' && im0.ordre > 0) continue;
    const r = dist(im0.p, mic), t = (r / CSON) * fs, a = im0.g / (4 * Math.PI * r), k0 = Math.floor(t);
    for (let k = k0 - demi; k <= k0 + demi; k++) {
      if (k < 0 || k >= n) continue;
      const x = k - t, w = 0.5 * (1 + Math.cos((Math.PI * x) / (demi + 1)));
      h[k] += a * w * (Math.abs(x) < 1e-12 ? 1 : Math.sin(Math.PI * x) / (Math.PI * x));
    }
  }
  return h;
}

export function convolue(x: Float64Array, h: Float64Array): Float64Array {
  const y = new Float64Array(x.length);
  let k0 = h.length;
  while (k0 > 0 && h[k0 - 1] === 0) k0--;
  for (let k = 0; k < k0; k++) { const hk = h[k]; if (hk === 0) continue; for (let t = k; t < x.length; t++) y[t] += hk * x[t - k]; }
  return y;
}

// ---------------------------------------------------------------- parole synthétique voisée
// Somme d'harmoniques d'un fondamental f0(t) qui varie, sous une enveloppe spectrale à trois formants (qui changent d'une « syllabe » à l'autre),
// et sous une enveloppe d'énergie par syllabes. Évaluée en temps continu : s(t − τ) est exacte pour tout retard τ.
export type Syllabe = { t0: number; t1: number; f0: [number, number]; formants: [number, number, number] };
export const SYLLABES: Syllabe[] = [
  { t0: 0.08, t1: 0.36, f0: [118, 142], formants: [700, 1200, 2600] },
  { t0: 0.52, t1: 0.74, f0: [150, 128], formants: [350, 2100, 2900] },
  { t0: 0.90, t1: 1.14, f0: [132, 108], formants: [500, 900, 2400] },
];
// Fricatives (« s », « ch ») : bruit à large bande de 2 à 7,5 kHz, somme de 400 sinusoïdes de fréquences et phases tirées au hasard (graine fixe),
// évaluée en temps continu comme la partie voisée, sous une enveloppe en sinus carré.
export type Fricative = { t0: number; t1: number; niveau: number; seed: number };
export const FRICATIVES: Fricative[] = [
  { t0: 0.38, t1: 0.50, niveau: 0.15, seed: 11 },
  { t0: 0.76, t1: 0.88, niveau: 0.15, seed: 12 },
];
export function fricatives(n: number, fs = FS, retard = 0, frs = FRICATIVES): Float64Array {
  const x = new Float64Array(n);
  for (const fc of frs) {
    const r = rng(fc.seed), K = 400, fq = Array.from({ length: K }, () => 2000 + 5500 * r()), ph = Array.from({ length: K }, () => 2 * Math.PI * r());
    const g = fc.niveau * Math.sqrt(2 / K), d = fc.t1 - fc.t0;
    for (let t = 0; t < n; t++) {
      const u = t / fs - retard - fc.t0;
      if (u < 0 || u > d) continue;
      let v = 0;
      for (let k = 0; k < K; k++) v += Math.cos(2 * Math.PI * fq[k] * u + ph[k]);
      x[t] += g * Math.sin((Math.PI * u) / d) ** 2 * v;
    }
  }
  return x;
}
const formant = (f: number, fc: number, bw: number) => 1 / Math.sqrt(1 + ((f - fc) / bw) ** 2);

export function parole(n: number, fs = FS, retard = 0, sylls = SYLLABES): Float64Array {
  const x = new Float64Array(n);
  for (const sy of sylls) {
    const d = sy.t1 - sy.t0;
    // phase du fondamental : intégrale de f0 linéaire, évaluée analytiquement
    const phase = (u: number) => 2 * Math.PI * (sy.f0[0] * u + ((sy.f0[1] - sy.f0[0]) * u * u) / (2 * d));
    const kMax = Math.floor(7800 / Math.max(sy.f0[0], sy.f0[1]));
    for (let t = 0; t < n; t++) {
      const u = t / fs - retard - sy.t0;
      if (u < 0 || u > d) continue;
      const env = Math.sin((Math.PI * u) / d) ** 2, f0 = sy.f0[0] + ((sy.f0[1] - sy.f0[0]) * u) / d, ph = phase(u);
      let v = 0;
      for (let k = 1; k <= kMax; k++) {
        const f = k * f0;
        const a = (formant(f, sy.formants[0], 90) + 0.6 * formant(f, sy.formants[1], 110) + 0.35 * formant(f, sy.formants[2], 150)) / k;
        v += a * Math.cos(k * ph);
      }
      x[t] += env * v;
    }
  }
  return x;
}

// TFCT de l'article (p. 611) : fenêtre de Hamming de 20 ms, recouvrement de 50 %, TFD de 320 points → 161 cases (0 à 8 kHz).
export const NFEN = 320, NSAUT = 160, NCASES = 161;
export function tfct(x: Float64Array): { re: Float64Array[]; im: Float64Array[] } {
  const w = Float64Array.from({ length: NFEN }, (_, k) => 0.54 - 0.46 * Math.cos((2 * Math.PI * k) / (NFEN - 1)));
  const cs = new Float64Array(NFEN), sn = new Float64Array(NFEN);
  for (let k = 0; k < NFEN; k++) { cs[k] = Math.cos((2 * Math.PI * k) / NFEN); sn[k] = Math.sin((2 * Math.PI * k) / NFEN); }
  const re: Float64Array[] = [], im: Float64Array[] = [];
  for (let s = 0; s + NFEN <= x.length; s += NSAUT) {
    const r = new Float64Array(NCASES), i = new Float64Array(NCASES);
    for (let f = 0; f < NCASES; f++) {
      let a = 0, b = 0;
      for (let k = 0; k < NFEN; k++) { const v = x[s + k] * w[k], m = (f * k) % NFEN; a += v * cs[m]; b -= v * sn[m]; }
      r[f] = a; i[f] = b;
    }
    re.push(r); im.push(i);
  }
  return { re, im };
}

// Compression logarithmique symétrique de l'article (éq. 14), α = 100
export const zlog = (x: number, alpha = 100) => (x > 0 ? Math.log10(alpha * x + 1) : x < 0 ? -Math.log10(-alpha * x + 1) : 0);

// Figure « différence entre deux micros » : deux micros à 10 cm (fig. 5a), source en champ libre d'azimut θ.
// Le micro 0 reçoit s(t), le micro 1 reçoit s(t − τ), τ = −pas · sin θ / c. Normalisation de l'article (p. 611) : valeur efficace 1 au micro de référence.
export const PAS2 = 0.1, AZ2 = 60, DUREE2 = 1.2;
export function deuxMicros(azDeg = AZ2, pas = PAS2, duree = DUREE2) {
  const n = Math.round(duree * FS), tau = retardLibre(1, pas, azDeg);
  const s1 = parole(n), s2 = parole(n, FS, tau), f1 = fricatives(n), f2 = fricatives(n, FS, tau);
  for (let t = 0; t < n; t++) { s1[t] += f1[t]; s2[t] += f2[t]; }
  let e = 0; for (const v of s1) e += v * v;
  const g = 1 / Math.sqrt(e / n);
  for (let t = 0; t < n; t++) { s1[t] *= g; s2[t] *= g; }
  const d = s1.map((v, t) => v - s2[t]);
  return { tau, S1: tfct(s1), S2: tfct(s2), D: tfct(d) };
}

// ---------------------------------------------------------------- MVDR guidé par masques, en bande étroite (une case de fréquence)
// y_j = d s_j + a_n n_j + e_j : cible d'azimut θ_s (RTF d, d_0 = 1), interférent d'azimut θ_n (RTF a_n), bruit propre à chaque micro e_j.
// Puissances de trame : la cible parle par intermittence (des « syllabes » de quelques trames), l'interférent ne s'arrête pas
// et sa puissance fluctue (loi exponentielle autour de sa moyenne), comme un bruit de fond.
export type ReglagesMasque = { C: number; pas: number; f: number; azS: number; azN: number; J: number; pS: number; pN: number; pE: number; sigma: number; seed: number };
export const REGLAGES_MASQUE: ReglagesMasque = { C: C8, pas: PAS8, f: 1000, azS: 30, azN: 0, J: 60, pS: 1, pN: 1, pE: 0.01, sigma: 2, seed: 1 };
export type Cas = 'oracle' | 'imparfait' | 'sans';
export const CAS: Cas[] = ['oracle', 'imparfait', 'sans'];

export type Trames = { y: Vec[]; S: Vec[]; V: Vec[]; actif: boolean[]; ps: number[]; mIdeal: number[][]; d: Vec; aN: Vec };
const cmul = (a: number, b: number, c: number, e: number): [number, number] => [a * c - b * e, a * e + b * c];

export function trames(g: ReglagesMasque = REGLAGES_MASQUE): Trames {
  const r = rng(g.seed), d = rtfLibre(g.C, g.pas, g.azS, g.f), aN = rtfLibre(g.C, g.pas, g.azN, g.f);
  // activité de la cible : chaîne de Markov à deux états (parle / se tait), séjours moyens de 4 trames
  const actif: boolean[] = [];
  let on = false;
  for (let j = 0; j < g.J; j++) { if (r() < 0.25) on = !on; actif.push(on); }
  const ps: number[] = [], y: Vec[] = [], S: Vec[] = [], V: Vec[] = [], mIdeal: number[][] = [];
  const nb = actif.filter(Boolean).length || 1;
  for (let j = 0; j < g.J; j++) {
    // puissance de la cible : nulle en silence, sinon tirée autour de pS · J / (trames actives) pour que la moyenne sur J trames vaille pS
    const p = actif[j] ? (g.pS * g.J) / nb * (0.4 + 1.2 * r()) : 0;
    ps.push(p);
    const s = [Math.sqrt(p / 2) * gauss(r), Math.sqrt(p / 2) * gauss(r)];
    const pn = -g.pN * Math.log(1 - r()); // exponentielle de moyenne pN
    const nn = [Math.sqrt(pn / 2) * gauss(r), Math.sqrt(pn / 2) * gauss(r)];
    const Sj = vec(g.C), Vj = vec(g.C), yj = vec(g.C), m: number[] = [];
    for (let i = 0; i < g.C; i++) {
      const [sr, si] = cmul(d[2 * i], d[2 * i + 1], s[0], s[1]);
      const [nr, ni] = cmul(aN[2 * i], aN[2 * i + 1], nn[0], nn[1]);
      const er = Math.sqrt(g.pE / 2) * gauss(r), ei = Math.sqrt(g.pE / 2) * gauss(r);
      Sj[2 * i] = sr; Sj[2 * i + 1] = si; Vj[2 * i] = nr + er; Vj[2 * i + 1] = ni + ei;
      yj[2 * i] = sr + nr + er; yj[2 * i + 1] = si + ni + ei;
      // masque de rapport idéal de l'article (éq. 20) : |S_i| / (|S_i| + |Y_i − S_i|)
      const a = Math.hypot(sr, si), b = Math.hypot(nr + er, ni + ei);
      m.push(a + b > 0 ? a / (a + b) : 0);
    }
    y.push(yj); S.push(Sj); V.push(Vj); mIdeal.push(m);
  }
  return { y, S, V, actif, ps, mIdeal, d, aN };
}

// Masque imparfait : bruit gaussien ajouté au logit du masque idéal (borné à [0,01 ; 0,99]) : une erreur commune aux C micros de la trame
// (écart-type σ : un réseau qui se trompe sur une trame se trompe sur tous les micros) plus une erreur propre à chaque micro (écart-type σ/2).
export function masquesBruites(m: number[][], sigma: number, seed: number): number[][] {
  const r = rng(seed ^ 0x2545f491);
  const lg = (p: number) => { const q = Math.min(0.99, Math.max(0.01, p)); return Math.log(q / (1 - q)); };
  return m.map((row) => { const e = sigma * gauss(r); return row.map((p) => 1 / (1 + Math.exp(-(lg(p) + e + (sigma / 2) * gauss(r))))); });
}

export const mediane = (v: number[]) => { const s = [...v].sort((a, b) => a - b), n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };

// Vecteur propre principal d'une matrice hermitienne semi-définie positive (itération de la puissance)
export function vecteurPropre(R: Mat, iter = 2000): { v: Vec; lambda: number } {
  const n = Math.round(Math.sqrt(R.length / 2));
  let v = vec(n);
  for (let i = 0; i < n; i++) { v[2 * i] = 1 + 0.1 * i; v[2 * i + 1] = 0.05 * i; }
  let lambda = 0;
  for (let k = 0; k < iter; k++) {
    const w = mulMV(R, v), nr = Math.sqrt(herm(w, w)[0]);
    for (let i = 0; i < w.length; i++) w[i] /= nr;
    const l = herm(w, mulMV(R, w))[0];
    v = w;
    if (Math.abs(l - lambda) < 1e-14 * Math.abs(l)) { lambda = l; break; }
    lambda = l;
  }
  return { v, lambda };
}

// RTF estimée (éq. 10) : vecteur propre principal, divisé par sa composante de référence (micro 0)
export function rtfEstimee(R: Mat): Vec {
  const { v } = vecteurPropre(R), d = vec(v.length / 2), a = v[0], b = v[1], q = a * a + b * b;
  for (let i = 0; i < v.length / 2; i++) { // v_i / v_0 = v_i · conj(v_0) / |v_0|²
    d[2 * i] = (v[2 * i] * a + v[2 * i + 1] * b) / q;
    d[2 * i + 1] = (v[2 * i + 1] * a - v[2 * i] * b) / q;
  }
  return d;
}

// Angle entre deux vecteurs complexes (en degrés) : arccos(|aᴴb| / (‖a‖ ‖b‖)) ; 0 = colinéaires
export function angle(a: Vec, b: Vec): number {
  const [re, im] = herm(a, b), c = Math.hypot(re, im) / Math.sqrt(herm(a, a)[0] * herm(b, b)[0]);
  return (Math.acos(Math.min(1, c)) * 180) / Math.PI;
}

export function covPonderee(y: Vec[], poids: number[]): Mat {
  const C = y[0].length / 2, R = mat(C);
  y.forEach((yj, j) => ajouteDyade(R, yj, poids[j] / y.length));
  return R;
}

// Réponse en puissance du filtre h à une onde plane d'azimut θ (RTF normalisée au micro 0), en dB
export function directiviteDb(h: Vec, g: ReglagesMasque, azDeg: number): number {
  const [re, im] = herm(h, rtfLibre(g.C, g.pas, azDeg, g.f));
  return 10 * Math.log10(Math.max(1e-12, re * re + im * im));
}

export type Resultat = {
  cas: Cas; eta: number[]; xi: number[]; Rs: Mat; Rv: Mat; dHat: Vec; h: Vec;
  ecartDeg: number; // angle entre d̂ et d
  gainDb: number; // RSB en sortie − RSB au micro de référence, mesurés sur les J trames (vraies parties cible et non cible)
  versCibleDb: number; versBruitDb: number; // réponse du filtre dans la vraie direction de la cible et dans celle de l'interférent
};

export function gainRsb(T: Trames, h: Vec): number {
  let pS = 0, pV = 0, pS0 = 0, pV0 = 0;
  T.S.forEach((S, j) => {
    const [a, b] = herm(h, S), [c, e] = herm(h, T.V[j]);
    pS += a * a + b * b; pV += c * c + e * e;
    pS0 += S[0] ** 2 + S[1] ** 2; pV0 += T.V[j][0] ** 2 + T.V[j][1] ** 2;
  });
  return 10 * Math.log10(pS / pV) - 10 * Math.log10(pS0 / pV0);
}

export function mvdrMasque(cas: Cas, g: ReglagesMasque = REGLAGES_MASQUE, T: Trames = trames(g)): Resultat {
  let eta: number[], xi: number[];
  if (cas === 'sans') { eta = T.y.map(() => 1); xi = eta; }
  else {
    const m = cas === 'oracle' ? T.mIdeal : masquesBruites(T.mIdeal, g.sigma, g.seed);
    eta = m.map((row) => mediane(row)); // éq. 8
    xi = m.map((row) => mediane(row.map((p) => 1 - p))); // éq. 9
  }
  const Rs = covPonderee(T.y, eta), Rv = covPonderee(T.y, xi); // éq. 6 et 7
  const dHat = rtfEstimee(Rs); // éq. 10
  const h = poidsAdaptatif(Rv, dHat)!; // éq. 5
  return {
    cas, eta, xi, Rs, Rv, dHat, h,
    ecartDeg: angle(dHat, T.d),
    gainDb: gainRsb(T, h),
    versCibleDb: directiviteDb(h, g, g.azS),
    versBruitDb: directiviteDb(h, g, g.azN),
  };
}

// Bornes de comparaison : MVDR oracle de l'article (vraie cible : R_s et R_v calculés avec S et V vrais) et somme après retard pointée sur la cible.
export function mvdrOracle(g: ReglagesMasque = REGLAGES_MASQUE, T: Trames = trames(g)) {
  const C = g.C, Rv = mat(C);
  T.V.forEach((v) => ajouteDyade(Rv, v, 1 / T.V.length));
  const h = poidsAdaptatif(Rv, T.d)!;
  return { h, gainDb: gainRsb(T, h) };
}
export function sommeApresRetard(g: ReglagesMasque = REGLAGES_MASQUE, T: Trames = trames(g)) {
  const h = T.d.map((v) => v / g.C) as Vec;
  return { h, gainDb: gainRsb(T, h) };
}

// ---------------------------------------------------------------- scène de l'éq. 1 (figures « scène » et « RTF »)
// Pièce de 6 × 4,5 × 3 m, β = 0,85 (T60 d'Eyring ≈ 0,34 s), images gardées jusqu'à 0,3 s de trajet.
// Antenne de 8 micros (5 cm) au milieu, parallèle au mur du bas, à 1,5 m de lui ; perpendiculaire à l'antenne = +y.
// Cible à 1,2 m, azimut 30° ; source de bruit à 1,8 m, azimut −50°. Hauteur commune 1,4 m.
export const PIECE: Piece = { L: [6, 4.5, 3], beta: 0.85, tMax: 0.3 };
export const CENTRE: P3 = [3, 1.5, 1.4];
export const AZ_CIBLE = 30, AZ_BRUIT = -50, R_CIBLE = 1.2, R_BRUIT = 1.8;
export const micro = (i: number, C = C8, pas = PAS8): P3 => [CENTRE[0] + (i - (C - 1) / 2) * pas, CENTRE[1], CENTRE[2]];
export const pointA = (azDeg: number, r: number): P3 => [CENTRE[0] + r * Math.sin(rad(azDeg)), CENTRE[1] + r * Math.cos(rad(azDeg)), CENTRE[2]];

// RTF à la fréquence f dans la pièce : trajet direct seul (d de l'éq. 1) et fonctions de transfert complètes (direct + réverbération), divisées par celle du micro 0
export function rtfPiece(f: number, complet: boolean, imgs = images(PIECE, pointA(AZ_CIBLE, R_CIBLE), CENTRE)): Vec {
  const H = Array.from({ length: C8 }, (_, i) => transfert(imgs, micro(i), f, !complet));
  const d = vec(C8), [a, b] = H[0], q = a * a + b * b;
  H.forEach(([re, im], i) => { d[2 * i] = (re * a + im * b) / q; d[2 * i + 1] = (im * a - re * b) / q; });
  return d;
}

// Formes d'onde au micro de référence : y_0 = s (trajet direct) + h_0 (réverbération de la cible) + n_0 (bruit, lui aussi réverbéré).
// Cible : une syllabe synthétique de 100 ms ; bruit : bruit blanc gaussien émis par la source de bruit. Échelle : s divisé par sa valeur crête.
export const SYLLABE_SCENE: Syllabe[] = [{ t0: 0.03, t1: 0.13, f0: [150, 125], formants: [650, 1150, 2500] }];
export function formesOnde(duree = 0.26, rsb = 0) {
  const n = Math.round(duree * FS), src = pointA(AZ_CIBLE, R_CIBLE), bru = pointA(AZ_BRUIT, R_BRUIT);
  const iS = images(PIECE, src, CENTRE), iN = images(PIECE, bru, CENTRE), nh = Math.round(PIECE.tMax * FS) + 40;
  const x = parole(n, FS, 0, SYLLABE_SCENE);
  const r = rng(404), w = Float64Array.from({ length: n }, () => gauss(r));
  const mic = micro(0);
  const s = convolue(x, rir(iS, mic, nh, FS, 'reverb')), h = convolue(x, rir(iS, mic, nh, FS, 'direct'));
  const nn = convolue(w, rir(iN, mic, nh));
  // RSB : puissance de s pendant la syllabe / puissance du bruit, réglée à `rsb` dB
  const t0 = Math.round(SYLLABE_SCENE[0].t0 * FS), t1 = Math.round(SYLLABE_SCENE[0].t1 * FS);
  let ps = 0, pn = 0;
  for (let t = t0; t < t1; t++) { ps += s[t] * s[t]; pn += nn[t] * nn[t]; }
  const gN = Math.sqrt((ps / pn) * 10 ** (-rsb / 10));
  let pk = 0; for (const v of s) pk = Math.max(pk, Math.abs(v));
  for (let t = 0; t < n; t++) { s[t] /= pk; h[t] /= pk; nn[t] *= gN / pk; }
  const y = s.map((v, t) => v + h[t] + nn[t]);
  // rapport trajet direct / réverbération sur toute la durée (énergies)
  let es = 0, eh = 0; for (let t = 0; t < n; t++) { es += s[t] * s[t]; eh += h[t] * h[t]; }
  return { s, h, n: nn, y, drrDb: 10 * Math.log10(es / eh), t60: t60Eyring(PIECE), retardDirectMs: (Math.hypot(src[0] - mic[0], src[1] - mic[1]) / CSON) * 1000 };
}
