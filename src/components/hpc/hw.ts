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
