// Chapitre 4 (formation de voies) : grammaire visuelle commune à tous les schémas de fonctionnement du chapitre.
// Importer depuis un autre composant : import { ... } from './schema';
//
// SENS DES COULEURS (variables de global.css, jamais d'hexadécimal) :
//   'in'     gris   (--text-2, ondes --p-wave)   signaux reçus, micros, mélanges, tout ce qui est brut ;
//   'net'    violet (--r-out)                    ce qui est appris : un réseau F et ce qu'il prédit (masque, spectrogramme estimé) ;
//   'calc'   brun   (--p-mel)                    ce que calcule l'algèbre de la formation de voies (covariances, vecteur propre, poids h, sortie hᴴy) ;
//   'oracle' pointillé --text                    vérité terrain, connue seulement en simulation (cible vraie, direction d'arrivée vraie) ;
//   'note'   texte gris en italique, sans boîte  remarque dans une colonne vide (« aucune : poids fixes »).
//   Une étape facultative (post-filtre) garde sa couleur, avec un trait plus fin et la ligne « facultatif » : le pointillé est réservé à l'oracle.
//
// COLONNES COMMUNES (même alignement horizontal dans tous les schémas, pour comparer d'un coup d'œil) :
//   0 entrée · 1 estimation · 2 statistiques · 3 pointage · 4 filtre · 5 post-filtre · 6 sortie (COLS ci-dessous).
//   Une colonne vide reste vide (son en-tête reste affiché) ; un bloc peut couvrir plusieurs colonnes (span), ex. le réseau de MC-CSM.
//
// BRIQUES (toutes rendent une chaîne SVG ; coordonnées en px du viewBox, (x, y) = coin haut gauche sauf mention) :
//   Texte : it(s) italique ; sym(base, { hat, bold, sub }) symbole mathématique (gras droit = vecteur ou matrice, italique = scalaire,
//           hat = chapeau d'estimation, sub = indice en <tspan>) ; SY : symboles prêts (y, yi, mi, si, shi, vhi, Rs, Rv, Rhs, Rhv, d, dh, h, sh…).
//   Boîtes : box(kind, x, y, w, h, { optional }) : rectangle arrondi aux couleurs du sens ; deck(x, y, w, h) : deux cartes derrière
//           un bloc 'net' (le même réseau appliqué à chaque micro) ; brace(x1, x2, y, label) : accolade horizontale « ×C » sous le bloc.
//   Icônes (objets { w, h, draw(x, y) }) : icMics() pile de micros avec leur onde ; icWave(tone, w) petite forme d'onde ;
//           icSpec(tone, planes) petit spectrogramme (planes = 2 : spectrogramme complexe, plans Re et Im décalés) ;
//           icMask() masque appris (une grille en violet) ; icMats(labels, tone) deux petites matrices C×C côte à côte avec leur nom ;
//           icVec(tone, label) petit vecteur colonne ; icStack() pile de 2C plans (Re et Im des C micros concaténés).
//   Flèches : arrow(x1, y1, x2, y2, tone) segment droit avec pointe ; poly(points, tone) ligne brisée avec pointe au dernier point.
//   Mise en page : renderPipeline(spec, 'h' | 'v') place les blocs dans les colonnes communes (h : de gauche à droite, largeur 748 =
//           colonne de texte du site, donc 1 px de viewBox = 1 px à l'écran ; v : de haut en bas, largeur 358 = écran de 390 px) et trace
//           les flèches (étiquette = l'objet qui circule), le bus du mélange y (sous les blocs en h, à droite en v) et les flèches qui
//           sautent une colonne (au-dessus en h, à gauche en v).
//
// ÉTIQUETTES EMPLOYÉES (à reprendre telles quelles dans le texte) : en-têtes de colonnes de COLS ; « réseau F » ; « monocanal » ;
//   « ×C, même réseau » ; « oracle » ; « cible vraie » ; « direction d'arrivée θ » ; « médianes » ; « vecteur propre » ; « MVDR » ;
//   « post-filtre » ; « facultatif » ; « TFCT », « TFCT⁻¹ » ; « Re, Im ».

export type Kind = 'in' | 'net' | 'calc' | 'oracle' | 'note';

export const COLS = [
  { id: 'entree', h: 'entrée', w: 60 },
  { id: 'estim', h: 'estimation', w: 96 },
  { id: 'stats', h: 'statistiques', w: 104 },
  { id: 'point', h: 'pointage', w: 96 },
  { id: 'filtre', h: 'filtre', w: 86 },
  { id: 'post', h: 'post-filtre', w: 70 },
  { id: 'sortie', h: 'sortie', w: 50 },
] as const;

// ---------- couleurs ----------
export const TONE: Record<Kind, string> = { in: 'var(--text-2)', net: 'var(--r-out)', calc: 'var(--p-mel)', oracle: 'var(--text)', note: 'var(--text-2)' };
const FILL: Record<Kind, string> = {
  in: 'var(--surface)',
  net: 'color-mix(in srgb, var(--r-out) 11%, var(--surface))',
  calc: 'color-mix(in srgb, var(--p-mel) 14%, var(--surface))',
  oracle: 'var(--surface)',
  note: 'none',
};
const DASH = '4 3';

// ---------- texte ----------
export const it = (s: string) => `<tspan font-style="italic">${s}</tspan>`;
const ZW = '​';
/** symbole : gras droit (vecteur, matrice) ou italique (scalaire) ; chapeau ; indice en tspan (la ligne de base est rétablie après) */
export function sym(base: string, o: { hat?: boolean; bold?: boolean; sub?: string; post?: string } = {}) {
  const b = base + (o.hat ? '̂' : '');
  let s = o.bold ? `<tspan font-weight="700">${b}</tspan>` : `<tspan font-style="italic">${b}</tspan>`;
  if (o.post) s += o.post;
  if (o.sub) s += `<tspan dy="3.5" font-size="0.82em" font-style="italic">${o.sub}</tspan><tspan dy="-3.5">${ZW}</tspan>`;
  return s;
}
export const SY = {
  y: sym('y', { bold: true }),
  yi: sym('y', { sub: 'i' }),
  mi: sym('m', { hat: true, sub: 'i' }),
  si: sym('s', { sub: 'i' }),
  shi: sym('ŝ', { sub: 'i' }),
  vi: sym('v', { sub: 'i' }),
  vhi: sym('v', { hat: true, sub: 'i' }),
  sh: sym('ŝ'),
  Rs: sym('R', { bold: true, sub: 's' }),
  Rv: sym('R', { bold: true, sub: 'v' }),
  Rhs: sym('R', { bold: true, hat: true, sub: 's' }),
  Rhv: sym('R', { bold: true, hat: true, sub: 'v' }),
  d: sym('d', { bold: true }),
  dh: sym('d', { bold: true, hat: true }),
  h: sym('h', { bold: true }),
  hH: sym('h', { bold: true, post: 'ᴴ' }),
  th: sym('θ'),
  C: it('C'),
};

// ---------- boîtes ----------
export function box(kind: Kind, x: number, y: number, w: number, h: number, o: { optional?: boolean } = {}) {
  if (kind === 'note') return '';
  const sw = o.optional ? 1.1 : kind === 'in' ? 1.3 : 1.6;
  const dash = kind === 'oracle' ? ` stroke-dasharray="${DASH}"` : '';
  const fill = o.optional && kind === 'net' ? 'color-mix(in srgb, var(--r-out) 5%, var(--surface))' : FILL[kind];
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="7" style="fill:${fill};stroke:${TONE[kind]}" stroke-width="${sw}"${dash}/>`;
}
/** deux cartes derrière un bloc réseau : le même réseau, appliqué à chaque micro */
export function deck(x: number, y: number, w: number, h: number) {
  let s = '';
  for (const k of [2, 1]) s += `<rect x="${x + 4 * k}" y="${y - 4 * k}" width="${w}" height="${h}" rx="7" style="fill:${FILL.net};stroke:var(--r-out)" stroke-width="1" stroke-opacity="${0.35 + 0.2 * (2 - k)}"/>`;
  return s;
}
/** accolade horizontale sous un bloc, pointe vers le bas, avec son étiquette centrée dessous */
export function brace(x1: number, x2: number, y: number, label: string, tone: Kind = 'net') {
  const m = (x1 + x2) / 2, d = 6;
  const p = `M${x1},${y} q0,${d} ${d},${d} H${m - d} q${d},0 ${d},${d} q0,${-d} ${d},${-d} H${x2 - d} q${d},0 ${d},${-d}`;
  return `<path d="${p}" fill="none" style="stroke:${TONE[tone]}" stroke-width="1.2"/>` +
    `<text x="${m}" y="${y + 2 * d + 12}" text-anchor="middle" font-size="11.5" style="fill:${TONE[tone]}">${label}</text>`;
}
/** accolade verticale à gauche d'un bloc (version empilée), étiquette à gauche */
export function braceV(x: number, y1: number, y2: number, label: string, tone: Kind = 'net') {
  const m = (y1 + y2) / 2, d = 5;
  const p = `M${x},${y1} q${-d},0 ${-d},${d} V${m - d} q0,${d} ${-d},${d} q${d},0 ${d},${d} V${y2 - d} q0,${d} ${d},${d}`;
  return `<path d="${p}" fill="none" style="stroke:${TONE[tone]}" stroke-width="1.2"/>` +
    `<text x="${x - 2 * d - 3}" y="${m + 4}" text-anchor="end" font-size="11.5" style="fill:${TONE[tone]}">${label}</text>`;
}

// ---------- flèches ----------
const head = (x: number, y: number, dir: 'r' | 'l' | 'u' | 'd', tone: Kind) => {
  const d = { r: `l-7,-3.6 v7.2 z`, l: `l7,-3.6 v7.2 z`, d: `l-3.6,-7 h7.2 z`, u: `l-3.6,7 h7.2 z` }[dir];
  return `<path d="M${x},${y} ${d}" style="fill:${TONE[tone]}"/>`;
};
const stroke = (tone: Kind) => `fill="none" style="stroke:${TONE[tone]}" stroke-width="1.6" stroke-linejoin="round"${tone === 'oracle' ? ` stroke-dasharray="${DASH}"` : ''}`;
export function arrow(x1: number, y1: number, x2: number, y2: number, tone: Kind) {
  return poly([[x1, y1], [x2, y2]], tone);
}
/** ligne brisée (segments horizontaux ou verticaux), pointe au dernier point */
export function poly(pts: number[][], tone: Kind) {
  const n = pts.length, [xa, ya] = pts[n - 2], [xb, yb] = pts[n - 1];
  const dir = xb > xa ? 'r' : xb < xa ? 'l' : yb > ya ? 'd' : 'u';
  const back = 6, end = [xb - (dir === 'r' ? back : dir === 'l' ? -back : 0), yb - (dir === 'd' ? back : dir === 'u' ? -back : 0)];
  const d = pts.slice(0, -1).map((p, i) => `${i ? 'L' : 'M'}${p[0]},${p[1]}`).join(' ') + ` L${end[0]},${end[1]}`;
  return `<path d="${d}" ${stroke(tone)}/>` + head(xb, yb, dir, tone);
}
const dot = (x: number, y: number, tone: Kind) => `<circle cx="${x}" cy="${y}" r="2.6" style="fill:${TONE[tone]}"/>`;

// ---------- icônes ----------
export interface Ic { w: number; h: number; draw: (x: number, y: number) => string }
const rng = (seed: number) => { let s = seed; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; };
export function icWave(tone: 'in' | 'calc' | 'net' = 'in', w = 34, h = 12, seed = 3): Ic {
  return {
    w, h, draw: (x, y) => {
      const r = rng(seed), n = Math.round(w / 1.7), pts: string[] = [];
      for (let k = 0; k <= n; k++) {
        const t = k / n, env = Math.sin(Math.PI * t) ** 0.7 * (0.55 + 0.45 * Math.sin(5 * t + seed));
        pts.push(`${(x + t * w).toFixed(1)},${(y + h / 2 + (k % 2 ? 1 : -1) * env * (0.25 + 0.75 * r()) * h / 2).toFixed(1)}`);
      }
      const c = tone === 'in' ? 'var(--p-wave)' : TONE[tone];
      return `<polyline points="${pts.join(' ')}" fill="none" style="stroke:${c}" stroke-width="1.1" stroke-linejoin="round"/>`;
    },
  };
}
const micGlyph = (x: number, y: number) =>
  `<rect x="${x}" y="${y}" width="6" height="9" rx="3" style="fill:var(--surface);stroke:var(--text-2)" stroke-width="1.2"/>` +
  `<path d="M${x - 2},${y + 6} q0,5 5,5 q5,0 5,-5 M${x + 3},${y + 11} v3" fill="none" style="stroke:var(--text-2)" stroke-width="1.1"/>`;
/** pile de micros, chacun suivi de son onde ; « ⋮ » entre le 2e et le dernier */
export function icMics(): Ic {
  const row = 17;
  return {
    w: 44, h: row * 3 + 10, draw: (x, y) => {
      let s = '';
      [0, 1, 3].forEach((k, j) => {
        const yy = y + (k === 3 ? row * 2 + 10 : k * row);
        s += micGlyph(x + 2, yy) + icWave('in', 30, 10, 3 + 4 * j).draw(x + 14, yy + 1);
      });
      s += `<text x="${x + 5}" y="${y + row * 2 + 6}" text-anchor="middle" font-size="11" style="fill:var(--text-2)">⋮</text>`;
      return s;
    },
  };
}
/** petit spectrogramme (grille temps-fréquence) ; planes = 2 : complexe, deux plans (Re devant, Im derrière) */
export function icSpec(tone: Kind = 'in', planes: 1 | 2 = 1, seed = 7, cols = 8, rows = 5): Ic {
  const c = 4.2, off = planes === 2 ? 5 : 0;
  return {
    w: cols * c + off, h: rows * c + off, draw: (x, y) => {
      const col = tone === 'in' ? 'var(--p-wave)' : TONE[tone];
      let s = '';
      for (let p = planes - 1; p >= 0; p--) {
        const r = rng(seed + 11 * p), ox = x + (planes === 2 && p === 1 ? off : 0), oy = y + (planes === 2 && p === 0 ? off : 0);
        s += `<rect x="${ox}" y="${oy}" width="${cols * c}" height="${rows * c}" style="fill:var(--surface);stroke:${col}" stroke-width="0.9"/>`;
        for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
          const v = r() * (0.4 + 0.6 * Math.sin(((i + 1) / (cols + 1)) * Math.PI)) * (j < 2 ? 1 : 0.65);
          if (v > 0.18) s += `<rect x="${(ox + i * c).toFixed(1)}" y="${(oy + (rows - 1 - j) * c).toFixed(1)}" width="${c}" height="${c}" style="fill:${col}" fill-opacity="${(0.15 + 0.7 * v).toFixed(2)}"/>`;
        }
      }
      return s;
    },
  };
}
export const icMask = (seed = 5) => icSpec('net', 1, seed);
/** petite matrice C×C (4×4 cases, diagonale plus foncée) */
const mat = (x: number, y: number, tone: Kind, seed: number, n = 4, c = 5) => {
  const r = rng(seed), col = TONE[tone];
  let s = `<rect x="${x}" y="${y}" width="${n * c}" height="${n * c}" style="fill:var(--surface);stroke:${col}" stroke-width="0.9"${tone === 'oracle' ? ` stroke-dasharray="2 1.5"` : ''}/>`;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const v = i === j ? 0.85 : 0.15 + 0.4 * r();
    s += `<rect x="${x + j * c}" y="${y + i * c}" width="${c}" height="${c}" style="fill:${col}" fill-opacity="${v.toFixed(2)}"/>`;
  }
  return s;
};
/** deux matrices C×C côte à côte, chacune avec son nom dessous (ex. R̂_s, R̂_v) */
export function icMats(labels: [string, string], tone: Kind = 'calc'): Ic {
  return {
    w: 70, h: 20 + 15, draw: (x, y) =>
      mat(x + 8, y, tone, 3) + mat(x + 42, y, tone, 9) +
      `<text x="${x + 18}" y="${y + 34}" text-anchor="middle" font-size="12.5" style="fill:var(--text)">${labels[0]}</text>` +
      `<text x="${x + 52}" y="${y + 34}" text-anchor="middle" font-size="12.5" style="fill:var(--text)">${labels[1]}</text>`,
  };
}
/** petit vecteur colonne (C cases) avec son nom à droite */
export function icVec(tone: Kind, label: string): Ic {
  const n = 4, c = 5;
  return {
    w: 26, h: n * c, draw: (x, y) => {
      let s = `<rect x="${x}" y="${y}" width="${c}" height="${n * c}" style="fill:var(--surface);stroke:${TONE[tone]}" stroke-width="0.9"/>`;
      for (let i = 0; i < n; i++) s += `<rect x="${x}" y="${y + i * c}" width="${c}" height="${c}" style="fill:${TONE[tone]}" fill-opacity="${i === 0 ? 0.9 : 0.35 + 0.12 * i}"/>`;
      return s + `<text x="${x + c + 5}" y="${y + n * c / 2 + 4.5}" font-size="12.5" style="fill:var(--text)">${label}</text>`;
    },
  };
}
/** pile de 2C plans : parties réelle et imaginaire des C micros, concaténées */
export function icStack(): Ic {
  const k = 6, off = 3.2, w = 22, h = 16;
  return {
    w: w + off * (k - 1), h: h + off * (k - 1), draw: (x, y) => {
      let s = '';
      for (let i = k - 1; i >= 0; i--) s += `<rect x="${x + i * off}" y="${y + (k - 1 - i) * off}" width="${w}" height="${h}" style="fill:var(--surface);stroke:var(--p-wave)" stroke-width="0.9" stroke-opacity="${(1 - i * 0.1).toFixed(2)}"/>`;
      return s + icSpec('in', 1, 21, 5, 4).draw(x + 0.5, y + (k - 1) * off + 0.5).replace(/width="4.2" height="4.2"/g, 'width="4.2" height="3.8"');
    },
  };
}

// ---------- mise en page d'un schéma ----------
/** une ligne de texte d'un bloc : rich = texte SVG prêt (tspans) ; b = titre (gras, couleur du bloc) ; g = secondaire (gris) */
export interface Line { t: string; b?: boolean; g?: boolean }
export interface SNode {
  id: string; col: number; span?: number; kind: Kind; lines: Line[]; icon?: Ic;
  rep?: string;          // étiquette de l'accolade sous le bloc (bloc répété par micro, ex. '×C, même réseau') : dessine aussi les cartes derrière
  optional?: boolean;    // étape facultative (post-filtre)
  vHead?: string;        // en-tête en version empilée (sinon celui de la colonne)
  custom?: (x: number, y: number, w: number, h: number, o: 'h' | 'v') => string; // intérieur dessiné à la main (remplace icône et lignes)
  vH?: number;           // hauteur imposée en version empilée (avec custom)
}
export interface SEdge { from: string; to: string; label?: string; tone?: Kind; route?: 'over' }
export interface Spec { nodes: SNode[]; edges: SEdge[]; bus?: { from: string; to: string[]; label: string } }

const LH = 14.5;
const textLine = (l: Line, kind: Kind, x: number, y: number, anchor: 'middle' | 'start') => {
  const fill = l.b ? (kind === 'in' || kind === 'oracle' ? 'var(--text)' : TONE[kind]) : l.g || kind === 'note' ? 'var(--text-2)' : 'var(--text)';
  const fs = l.b ? 12.5 : 11.5, fw = l.b ? ' font-weight="600"' : '', st = kind === 'note' ? ' font-style="italic"' : '';
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-size="${fs}"${fw}${st} style="fill:${fill}">${l.t}</text>`;
};
const label = (x: number, y: number, t: string, tone: Kind, anchor = 'middle') =>
  `<text x="${x}" y="${y}" text-anchor="${anchor}" font-size="12.5" style="fill:${tone === 'oracle' || tone === 'in' ? 'var(--text)' : TONE[tone]}" paint-order="stroke" stroke="var(--surface)" stroke-width="3" stroke-linejoin="round">${t}</text>`;

interface Placed { n: SNode; x: number; y: number; w: number; h: number }

export const WH = 748, WV = 358;
export function renderPipeline(spec: Spec, o: 'h' | 'v'): { svg: string; w: number; h: number } {
  return o === 'h' ? horiz(spec) : vert(spec);
}

function horiz(spec: Spec) {
  const M = 2, sumW = COLS.reduce((a, c) => a + c.w, 0), gap = (WH - 2 * M - sumW) / (COLS.length - 1);
  const cx: number[] = [];
  let acc = M;
  COLS.forEach((c) => { cx.push(acc); acc += c.w + gap; });
  const yB = 56, HB = 96, yc = yB + HB / 2;
  const hasRep = spec.nodes.some((n) => n.rep);
  const yBus = yB + HB + (hasRep ? 42 : 20);
  const H = spec.bus ? yBus + 8 : yB + HB + (hasRep ? 34 : 8);
  const P = new Map<string, Placed>();
  let s = '';
  // en-têtes de colonnes
  COLS.forEach((c, i) => (s += `<text x="${(cx[i] + c.w / 2).toFixed(1)}" y="12" text-anchor="middle" font-size="11" letter-spacing="0.2" style="fill:var(--text-2)">${c.h}</text>`));
  s += `<path d="M${M},20 H${WH - M}" style="stroke:var(--border)" stroke-width="1"/>`;
  // blocs
  for (const n of spec.nodes) {
    const span = n.span ?? 1, x = cx[n.col], w = cx[n.col + span - 1] + COLS[n.col + span - 1].w - x;
    const p: Placed = { n, x, y: yB, w, h: HB };
    P.set(n.id, p);
    if (n.rep) s += deck(x, yB, w, HB);
    s += box(n.kind, x, yB, w, HB, { optional: n.optional });
    if (n.custom) { s += n.custom(x, yB, w, HB, 'h'); continue; }
    if (n.kind === 'note') { n.lines.forEach((l, i) => (s += textLine(l, 'note', x + w / 2, yc + 22 + i * LH, 'middle'))); continue; }
    const ih = n.icon ? n.icon.h + 7 : 0, ch = ih + n.lines.length * LH - 3;
    let y0 = yB + (HB - ch) / 2;
    if (n.icon) { s += n.icon.draw(x + (w - n.icon.w) / 2, y0); y0 += ih; }
    n.lines.forEach((l, i) => (s += textLine(l, n.kind, x + w / 2, y0 + 9 + i * LH, 'middle')));
    if (n.rep) s += brace(x + 2, x + w - 2, yB + HB + 5, n.rep);
  }
  // flèches
  for (const e of spec.edges) {
    const a = P.get(e.from)!, b = P.get(e.to)!, tone = e.tone ?? a.n.kind;
    if (e.route === 'over') {
      const xa = a.x + a.w - 18, xb = b.x + 18, yl = yB - 17;
      s += poly([[xa, yB], [xa, yl], [xb, yl], [xb, yB]], tone);
      if (e.label) s += label((xa + xb) / 2, yl - 5, e.label, tone);
    } else {
      const x1 = a.x + a.w + (a.n.rep ? 8 : 0), x2 = b.x;
      s += arrow(x1, yc, x2, yc, tone);
      if (e.label) s += label((x1 + x2) / 2 - 2, yc - 7, e.label, tone);
    }
  }
  // bus du mélange
  if (spec.bus) {
    const a = P.get(spec.bus.from)!, ts = spec.bus.to.map((id) => P.get(id)!), xa = a.x + a.w / 2, xEnd = Math.max(...ts.map((t) => t.x + t.w / 2));
    s += `<path d="M${xa},${yB + HB} V${yBus} H${xEnd}" ${stroke('in')}/>`;
    ts.forEach((t, i) => {
      const xt = t.x + t.w / 2;
      s += arrow(xt, yBus, xt, yB + HB, 'in');
      if (i < ts.length - 1) s += dot(xt, yBus, 'in');
    });
    s += label(xa + 14, yBus - 5, spec.bus.label, 'in', 'start');
  }
  return { svg: s, w: WH, h: H };
}

function vert(spec: Spec) {
  const X = 34, BW = WV - 2 * X, xc = X + BW / 2, GAP = 34, laneL = 11, laneR = WV - 10;
  // une rangée par colonne occupée (les colonnes vides sont sautées)
  const rows: SNode[][] = [];
  const used = new Set<number>();
  for (const n of [...spec.nodes].sort((a, b) => a.col - b.col)) {
    if (!used.has(n.col)) { rows.push([n]); for (let k = 0; k < (n.span ?? 1); k++) used.add(n.col + k); }
  }
  const P = new Map<string, Placed>();
  let s = '', y = 18;
  for (const [n] of rows) {
    const head = n.vHead ?? COLS[n.col].h;
    if (n.kind === 'note') {
      s += `<text x="${X}" y="${y - 5}" font-size="11" style="fill:var(--text-2)">${head}</text>`;
      n.lines.forEach((l, i) => (s += textLine(l, 'note', X, y + 10 + i * LH, 'start')));
      const h = n.lines.length * LH + 2;
      P.set(n.id, { n, x: X, y, w: BW, h });
      y += h + GAP; continue;
    }
    if (n.rep) y += 8; // place pour les cartes derrière le bloc
    const iw = n.icon ? n.icon.w + 12 : 0;
    const h = n.custom ? n.vH ?? 80 : Math.max(n.icon ? n.icon.h : 0, n.lines.length * LH) + 18;
    s += `<text x="${X}" y="${y - 5}" font-size="11" style="fill:var(--text-2)">${head}</text>`;
    if (n.rep) s += deck(X, y, BW - 8, h);
    s += box(n.kind, X, y, n.rep ? BW - 8 : BW, h, { optional: n.optional });
    if (n.custom) s += n.custom(X, y, BW, h, 'v');
    else {
      if (n.icon) s += n.icon.draw(X + 10, y + (h - n.icon.h) / 2);
      const y0 = y + (h - n.lines.length * LH) / 2 + 10;
      n.lines.forEach((l, i) => (s += textLine(l, n.kind, X + 10 + iw, y0 + i * LH, 'start')));
    }
    if (n.rep) s += braceV(X - 3, y + 3, y + h - 3, '×' + it('C'));
    P.set(n.id, { n, x: X, y, w: BW, h });
    y += h + GAP;
  }
  const H = y - GAP + 6;
  for (const e of spec.edges) {
    const a = P.get(e.from)!, b = P.get(e.to)!, tone = e.tone ?? a.n.kind;
    if (e.route === 'over') {
      const ya = a.y + a.h - 12, yb = b.y + 12;
      s += poly([[X, ya], [laneL, ya], [laneL, yb], [X, yb]], tone);
      if (e.label) s += label(laneL + 4, a.y + a.h + 14, e.label, tone, 'start');
    } else {
      s += arrow(xc, a.y + a.h, xc, b.y, tone);
      if (e.label) s += label(xc + 8, (a.y + a.h + b.y) / 2 + 4, e.label, tone, 'start');
    }
  }
  if (spec.bus) {
    const a = P.get(spec.bus.from)!, ts = spec.bus.to.map((id) => P.get(id)!), ya = a.y + a.h / 2, yEnd = Math.max(...ts.map((t) => t.y + t.h / 2));
    s += `<path d="M${X + BW},${ya} H${laneR} V${yEnd}" ${stroke('in')}/>`;
    ts.forEach((t, i) => {
      const yt = t.y + t.h / 2;
      s += arrow(laneR, yt, X + BW, yt, 'in');
      if (i < ts.length - 1) s += dot(laneR, yt, 'in');
    });
    s += label(laneR - 6, a.y + a.h + 14, spec.bus.label, 'in', 'end');
  }
  return { svg: s, w: WV, h: H };
}

// ---------- blocs communs (mêmes mots et mêmes icônes dans tous les schémas) ----------
export const NODES = {
  entree: (): SNode => ({ id: 'in', col: 0, kind: 'in', icon: icMics(), lines: [{ t: 'TFCT', g: true }] }),
  sortie: (): SNode => ({ id: 'out', col: 6, kind: 'in', icon: icWave('in', 36, 14, 8), lines: [{ t: 'TFCT⁻¹', g: true }] }),
  /** réseau monocanal appliqué à chaque micro : produit un masque (mask) ou la cible complexe (csm) */
  reseau: (prod: 'mask' | 'csm'): SNode => ({
    id: 'net', col: 1, kind: 'net', rep: `×${it('C')}, même réseau`,
    icon: prod === 'mask' ? icMask() : icSpec('net', 2), lines: [{ t: 'réseau F', b: true }, { t: 'monocanal', g: true }],
  }),
  /** d̂ : vecteur propre principal de R_s (oracle : sans chapeau sur R) */
  pointage: (oracle = false): SNode => ({
    id: 'point', col: 3, kind: 'calc', icon: icVec('calc', SY.dh), lines: [{ t: 'vecteur propre' }, { t: 'de ' + (oracle ? SY.Rs : SY.Rhs) }],
  }),
  mvdr: (tv = false): SNode => ({
    id: 'filtre', col: 4, kind: 'calc', icon: icVec('calc', tv ? `${SY.h}(${it('j')},${it('f')})` : SY.h),
    lines: [{ t: 'MVDR', b: true }, { t: `${SY.sh} = ${SY.hH}${SY.y}` }],
  }),
  postFiltre: (prod: 'mask' | 'csm'): SNode => ({
    id: 'pf', col: 5, kind: 'net', optional: true, icon: prod === 'mask' ? icMask(9) : icSpec('net', 2, 13),
    lines: [{ t: 'réseau F', b: true }, { t: 'facultatif', g: true }],
  }),
};
/** flèches communes à la fin des MVDR : R_s → pointage, R_v par-dessus le pointage, d̂ → filtre, puis post-filtre et sortie */
export const mvdrEdges = (oracle: boolean, pf: boolean): SEdge[] => [
  { from: 'stats', to: 'point', label: oracle ? SY.Rs : SY.Rhs },
  { from: 'stats', to: 'filtre', label: oracle ? SY.Rv : SY.Rhv, route: 'over' },
  { from: 'point', to: 'filtre', label: SY.dh },
  ...(pf ? [{ from: 'filtre', to: 'pf', label: SY.sh }, { from: 'pf', to: 'out', label: SY.sh }] : [{ from: 'filtre', to: 'out', label: SY.sh }]),
];

/** légende des blocs (une seule fois dans le chapitre) : [classe de style, texte] */
export const LEGENDE: [Kind, string][] = [
  ['in', 'signal reçu'],
  ['net', 'appris : réseau et ce qu\'il prédit'],
  ['calc', 'calculé : algèbre de la formation de voies'],
  ['oracle', 'oracle : vraie valeur, connue en simulation'],
];
export const legendSwatch = (k: Kind) =>
  `<svg class="bfsch-sw" viewBox="0 0 22 14" width="22" height="14" aria-hidden="true">${box(k, 1, 1, 20, 12)}</svg>`;
