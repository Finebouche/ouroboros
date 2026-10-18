// Matériel de référence du cours HPC.
// GPU et TPU : chiffres constructeur (fiches NVIDIA A100 80 Go SXM, H100 SXM ; doc Google Cloud TPU v5e), valeurs denses (sans parcimonie).
// CPU : machines types, crête calculée = voies FMA × 2 FLOP × fréquence ; bande passante = canaux × débit d'un canal DDR5-4800 (38,4 Go/s).
export type HW = {
  id: string;
  name: string;
  kind: 'cpu' | 'gpu' | 'tpu';
  vec: number | null; // crête FP32 « vectorielle » (FLOP/s)
  mat: number | null; // crête des unités matricielles en BF16 dense (FLOP/s)
  bw: number; // bande passante de la mémoire principale (octets/s)
  lanes: number | null; // voies FMA FP32 (multiplications-additions par cycle)
  how: string; // d'où viennent les chiffres
};

export const HWS: HW[] = [
  { id: 'laptop', name: 'Portable', kind: 'cpu', vec: 8 * 2 * 8 * 2 * 3e9, mat: null, bw: 2 * 38.4e9, lanes: 8 * 2 * 8, how: '8 cœurs × 2 unités FMA × 8 voies (AVX2) × 2 FLOP × 3 GHz ; 2 canaux DDR5-4800' },
  { id: 'server', name: 'Serveur CPU', kind: 'cpu', vec: 32 * 2 * 16 * 2 * 2.5e9, mat: null, bw: 8 * 38.4e9, lanes: 32 * 2 * 16, how: '32 cœurs × 2 unités FMA × 16 voies (AVX-512) × 2 FLOP × 2,5 GHz ; 8 canaux DDR5-4800' },
  { id: 'a100', name: 'A100', kind: 'gpu', vec: 19.5e12, mat: 312e12, bw: 2.039e12, lanes: 108 * 64, how: 'fiche NVIDIA A100 80 Go SXM : 19,5 TFLOP/s FP32, 312 TFLOP/s BF16 dense, 2 039 Go/s ; 108 SM × 64 voies FP32' },
  { id: 'h100', name: 'H100', kind: 'gpu', vec: 67e12, mat: 989e12, bw: 3.35e12, lanes: 132 * 128, how: 'fiche NVIDIA H100 SXM : 67 TFLOP/s FP32, 989 TFLOP/s BF16 dense, 3,35 To/s ; 132 SM × 128 voies FP32' },
  { id: 'v5e', name: 'TPU v5e', kind: 'tpu', vec: null, mat: 197e12, bw: 819e9, lanes: null, how: 'doc Google Cloud : 197 TFLOP/s BF16 par puce, 819 Go/s de HBM' },
];

export const fmtRate = (v: number, unit: string) => {
  const u: [number, string][] = [[1e15, 'P'], [1e12, 'T'], [1e9, 'G'], [1e6, 'M'], [1e3, 'k'], [1, '']];
  const [d, p] = u.find(([x]) => v >= x) ?? [1, ''];
  return `${(v / d).toLocaleString('fr-FR', { maximumFractionDigits: v / d < 10 ? 2 : v / d < 100 ? 1 : 0 })} ${p}${unit}`;
};

export const fmtTime = (s: number) => {
  if (s >= 1) return `${s.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} s`;
  if (s >= 1e-3) return `${(s * 1e3).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} ms`;
  if (s >= 1e-6) return `${(s * 1e6).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} µs`;
  return `${(s * 1e9).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} ns`;
};

// Code couleur du cours : une opération est colorée par ce qui la limite (--h-calc, --h-mem) ; le surcoût est hachuré en gris, sans couleur.
// Motif hachuré à placer une fois dans chaque SVG (id propre au widget, pour ne pas dépendre d'un autre SVG de la page).
export const hatchDef = (id: string) =>
  `<defs><pattern id="${id}" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="5" fill="var(--surface)"/><line x1="0" y1="0" x2="0" y2="5" stroke="var(--text-2)" stroke-opacity="0.5" stroke-width="1.6"/></pattern></defs>`;
// Bloc de surcoût : hachures grises, étiquette facultative (compilation…)
export const overBlock = (id: string, x: number, y: number, w: number, h: number, label = '') =>
  `<rect x="${x}" y="${y}" width="${Math.max(0.8, w)}" height="${h}" rx="2" fill="url(#${id})" stroke="var(--text-2)" stroke-opacity="0.35" stroke-width="0.8"/>` +
  (label && w > label.length * 5.6 + 8 ? `<text x="${x + w / 2}" y="${y + h / 2 + 3.8}" text-anchor="middle" style="font:500 10.5px var(--font);fill:var(--text)">${label}</text>` : '');
// Bloc d'opération : teinte claire et contour ; plein pour l'élément actif ; nom écrit dedans s'il tient
export const opBlock = (x: number, y: number, w: number, h: number, col: string, label = '', strong = false) =>
  `<rect x="${x}" y="${y}" width="${Math.max(0.8, w)}" height="${h}" rx="2" fill="${col}" fill-opacity="${strong ? 0.85 : 0.2}" stroke="${col}" stroke-width="1"/>` +
  (label && w > label.length * 5.6 + 6 ? `<text x="${x + w / 2}" y="${y + h / 2 + 3.8}" text-anchor="middle" style="font:500 10.5px var(--font);fill:${strong ? 'var(--surface)' : col}">${label}</text>` : '');
