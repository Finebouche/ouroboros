// Données et dessin du schéma de gauche du cours MFCC (PipelineSidebar).
// Vue d'ensemble : les 5 étapes de l'introduction. Dans le détail d'une étape, seule cette étape se déplie en ses sous-étapes.
// Les dimensions affichées sont celles de l'exemple du cours (1 s de parole à 16 kHz, trames de 25 ms, pas de 10 ms, FFT 512, 40 filtres, 13 coefficients).

export type Step = { part: string; title: string; sub: string; optional?: boolean };
export type Group = { title: string; sub: string; optional?: boolean; steps: Step[] };

export const GROUPS: Group[] = [
  {
    title: 'Trames', sub: 'pré-accentuation, découpage',
    steps: [
      { part: 'signal', title: 'Signal audio', sub: '16 000 valeurs par seconde' },
      { part: 'preemph', title: 'Pré-accentuation', sub: 'optionnelle', optional: true },
      { part: 'frames', title: 'Découpage en trames', sub: '98 trames × 400 valeurs' },
    ],
  },
  {
    title: 'Fenêtre et spectre', sub: '98 × 257',
    steps: [
      { part: 'window', title: 'Fenêtre', sub: 'adoucit les bords de chaque trame' },
      { part: 'dft', title: 'Spectre de puissance', sub: '98 × 257 fréquences' },
    ],
  },
  {
    title: 'Échelle de Mel', sub: '98 × 40',
    steps: [{ part: 'mel', title: 'Filtres Mel', sub: '98 × 40' }],
  },
  {
    title: 'Log et DCT', sub: '98 × 13',
    steps: [
      { part: 'log', title: 'Logarithme', sub: '98 × 40' },
      { part: 'dct', title: 'DCT, on garde 13', sub: '98 × 13' },
      { part: 'mfcc', title: 'MFCC', sub: 'un vecteur de 13 par trame' },
    ],
  },
  {
    title: 'Deltas et normalisation', sub: 'optionnels', optional: true,
    steps: [{ part: 'post', title: 'Deltas, normalisation', sub: 'optionnels', optional: true }],
  },
];

const X = 20, W = 170, GAP = 16, BOX = 40, STEP = 36, SGAP = 12, PAD = 10, HEAD = 22;

const box = (y: number, h: number, title: string, sub: string, cls: string) =>
  `<g class="pb ${cls}"><rect x="${X}" y="${y}" width="${W}" height="${h}" rx="6"/><text x="${X + W / 2}" y="${y + h / 2 - 2}" text-anchor="middle">${title}</text><text x="${X + W / 2}" y="${y + h / 2 + 11}" text-anchor="middle" class="sub">${sub}</text></g>`;
const arrow = (y0: number, y1: number) => `<path d="M${X + W / 2} ${y0}V${y1 - 1}"/>`;

// `on` : parties allumées. La première étape contenant une partie allumée est dépliée ; les autres restent d'un seul bloc.
export function renderPipeline(on: Set<string>): { html: string; height: number } {
  const open = GROUPS.findIndex((g) => g.steps.some((s) => on.has(s.part)));
  let y = 8, edges = '', body = '';
  let prevBottom: number | null = null;
  GROUPS.forEach((g, gi) => {
    const label = `${gi + 1}. ${g.title}`;
    let top = y, bottom: number;
    if (gi !== open || g.steps.length === 1) {
      const lit = gi === open;
      body += box(y, BOX, label, g.sub, `${lit ? 'on' : ''} ${g.optional ? 'opt' : ''}`);
      bottom = y + BOX;
    } else {
      let yy = y + HEAD;
      g.steps.forEach((s, si) => {
        if (si > 0) edges += arrow(yy - SGAP, yy);
        body += box(yy, STEP, s.title, s.sub, `${on.has(s.part) ? 'on' : ''} ${s.optional ? 'opt' : ''}`);
        yy += STEP + SGAP;
      });
      bottom = yy - SGAP + PAD;
      body = `<g class="pg"><rect x="${X - 8}" y="${y}" width="${W + 16}" height="${bottom - y}" rx="10"/><text x="${X}" y="${y + 14}" class="gl">${label}</text></g>` + body;
    }
    if (prevBottom !== null) edges += arrow(prevBottom, top);
    prevBottom = bottom;
    y = bottom + GAP;
  });
  return { html: `<g class="edges">${edges}</g>${body}`, height: y - GAP + 8 };
}
