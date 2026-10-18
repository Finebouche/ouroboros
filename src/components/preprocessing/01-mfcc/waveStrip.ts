// Rappel du signal d'origine x : tout le signal (0,6 s) avec ses quatre segments, et la trame choisie en surbrillance.
// Utilisé par les widgets qui ont un curseur « Position de la trame » (sections 3 et 4 du chapitre MFCC).
import { SR, N, SEGMENTS } from './signal';

export function drawWaveStrip(svg: SVGSVGElement, x: Float32Array, t0Ms: number, lenMs = 25) {
  const W = 640, ox = 8, wpx = W - 16, cy = 40, amp = 24, top = 16, h = 50;
  const X = (s: number) => ox + (s / N) * wpx;
  const s0 = Math.round((t0Ms * SR) / 1000), Ls = Math.round((lenMs * SR) / 1000);
  const lab = 'style="font:10.5px var(--font);fill:var(--text-2)"';
  let g = '';
  SEGMENTS.forEach((sg, i) => {
    const x0 = X(sg.from * SR), x1 = X(sg.to * SR);
    if (i > 0) g += `<line x1="${x0}" y1="${top}" x2="${x0}" y2="${top + h}" stroke="var(--border)" stroke-dasharray="3 3"/>`;
    g += `<text x="${(x0 + x1) / 2}" y="11" text-anchor="middle" ${lab}>${sg.label}</text>`;
  });
  g += `<rect x="${X(s0)}" y="${top}" width="${Math.max(1.5, (Ls / N) * wpx)}" height="${h}" fill="var(--hl-bg)" stroke="var(--hl-stroke)" stroke-width="1"/>`;
  let d = '';
  for (let px = 0; px < wpx; px++) {
    const a = Math.floor((px / wpx) * N), b = Math.max(a + 1, Math.floor(((px + 1) / wpx) * N));
    let mn = 1, mx = -1;
    for (let i = a; i < b; i++) { if (x[i] < mn) mn = x[i]; if (x[i] > mx) mx = x[i]; }
    d += `M${ox + px + 0.5} ${cy - mx * amp}V${cy - mn * amp}`;
  }
  g += `<path d="${d}" stroke="var(--p-wave)" stroke-width="1" fill="none"/>`;
  svg.setAttribute('viewBox', `0 0 ${W} ${top + h + 4}`);
  svg.innerHTML = g;
}
