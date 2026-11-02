// Cours Robotique : bras plan 2R et ses C-obstacles, recherche sur grille (Dijkstra, A*), RRT et RRT-Connect.
// Module sans import, partagé par les widgets (frontmatter et navigateur) et par les simulations Node du chapitre.

export type Q = [number, number];
export type Disc = { x: number; y: number; r: number };

// ---------------------------------------------------------------- bras 2R
// q = (q1, q2) ∈ [−π, π]² : butées à ±π, pas de raccord torique. Les disques sont hors de portée du premier segment
// (distance au socle > L1 + r) : seul le second segment peut les toucher.
export const L1 = 1, L2 = 0.8;
export const DISQUES: Disc[] = [{ x: 1.4, y: 0.7, r: 0.3 }, { x: -0.6, y: 1.4, r: 0.3 }, { x: 0.3, y: -1.5, r: 0.3 }];
export const QD: Q = [-0.6, 1.2], QB: Q = [1.9, -1.0];
export const QCOL: Q = [0.9, -1.2]; // préréglage « en collision » du widget 1

export function fk(q: Q) {
  const ex = L1 * Math.cos(q[0]), ey = L1 * Math.sin(q[0]);
  return { ex, ey, px: ex + L2 * Math.cos(q[0] + q[1]), py: ey + L2 * Math.sin(q[0] + q[1]) };
}
function segDist(ax: number, ay: number, bx: number, by: number, cx: number, cy: number) {
  const dx = bx - ax, dy = by - ay;
  const t = Math.max(0, Math.min(1, ((cx - ax) * dx + (cy - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(ax + t * dx - cx, ay + t * dy - cy);
}
export function collides(q: Q, obs: Disc[] = DISQUES) {
  const { ex, ey, px, py } = fk(q);
  for (const o of obs) if (segDist(0, 0, ex, ey, o.x, o.y) < o.r || segDist(ex, ey, px, py, o.x, o.y) < o.r) return true;
  return false;
}
// segment de C testé tous les RES radians
export const RES = 0.02;
export function segFree(a: Q, b: Q, obs: Disc[] = DISQUES) {
  const d = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.ceil(d / RES));
  for (let k = 1; k <= n; k++) { const t = k / n; if (collides([a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])], obs)) return false; }
  return true;
}
// C-obstacles sur une bitmap N × N (centre de chaque case), en chemin SVG : une case = une unité, ligne 0 en haut (q2 = π)
export function cobsPath(N = 120, obs: Disc[] = DISQUES) {
  let d = '';
  for (let i = 0; i < N; i++) {
    const q2 = Math.PI - ((i + 0.5) * 2 * Math.PI) / N;
    let j0 = -1;
    for (let j = 0; j <= N; j++) {
      const c = j < N && collides([-Math.PI + ((j + 0.5) * 2 * Math.PI) / N, q2], obs);
      if (c && j0 < 0) j0 = j;
      if (!c && j0 >= 0) { d += `M${j0} ${i}h${j - j0}v1h${j0 - j}z`; j0 = -1; }
    }
  }
  return d;
}

// ---------------------------------------------------------------- recherche sur grille
// 4-connexe, coût 1. Priorité f = g + w·h (h = Manhattan ; w = 0 : Dijkstra). Départage : à f égal, plus petit h, puis le plus récent.
// Sans réouverture des nœuds fermés.
export const CARTES: Record<string, string[]> = {
  vide: Array.from({ length: 16 }, (_, i) => (i === 7 ? '..S..................G..' : '........................')),
  murs: [
    '........................',
    '........................',
    '........................',
    '.........#........#.....',
    '.........#........#.....',
    '.........#........#.....',
    '.........#........#.....',
    '..S......#........#..G..',
    '.........#........#.....',
    '..................#.....',
    '..................#.....',
    '..................#.....',
    '..................#.....',
    '........................',
    '........................',
    '........................',
  ],
};
export type GStep = { n: number; g: number; h: number; upd: [number, number, number][] }; // nœud développé ; voisins (v, g, h) mis à jour
export type GSearch = { H: number; W: number; S: number; G: number; walls: number[]; steps: GStep[]; cost: number; path: number[] };

class Heap {
  a: number[][] = [];
  less(x: number[], y: number[]) { for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] < y[i]; return false; }
  push(e: number[]) { const a = this.a; a.push(e); let i = a.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (this.less(a[i], a[p])) { [a[i], a[p]] = [a[p], a[i]]; i = p; } else break; } }
  pop() {
    const a = this.a, top = a[0], last = a.pop()!;
    if (a.length) { a[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < a.length && this.less(a[l], a[m])) m = l; if (r < a.length && this.less(a[r], a[m])) m = r; if (m === i) break; [a[i], a[m]] = [a[m], a[i]]; i = m; } }
    return top;
  }
  get size() { return this.a.length; }
}

export function gridSearch(map: string[], w: number): GSearch {
  const H = map.length, W = map[0].length, walls: number[] = [];
  let S = -1, G = -1;
  map.forEach((row, i) => [...row].forEach((ch, j) => { if (ch === 'S') S = i * W + j; if (ch === 'G') G = i * W + j; if (ch === '#') walls.push(i * W + j); }));
  const gi = Math.floor(G / W), gj = G % W;
  const h = (n: number) => Math.abs(Math.floor(n / W) - gi) + Math.abs((n % W) - gj);
  const g = new Map<number, number>([[S, 0]]), par = new Map<number, number>(), closed = new Set<number>(), steps: GStep[] = [];
  const heap = new Heap();
  let k = 0;
  const push = (n: number, gn: number) => heap.push([gn + w * h(n), w * h(n), -k++, n]);
  push(S, 0);
  while (heap.size) {
    const n = heap.pop()[3];
    if (closed.has(n)) continue; // entrée périmée
    closed.add(n);
    const st: GStep = { n, g: g.get(n)!, h: w * h(n), upd: [] };
    steps.push(st);
    if (n === G) { const path = [n]; while (par.has(path[path.length - 1])) path.push(par.get(path[path.length - 1])!); return { H, W, S, G, walls, steps, cost: g.get(n)!, path: path.reverse() }; }
    const i = Math.floor(n / W), j = n % W;
    for (const [di, dj] of [[-1, 0], [0, 1], [1, 0], [0, -1]]) {
      const a = i + di, b = j + dj;
      if (a < 0 || b < 0 || a >= H || b >= W || map[a][b] === '#') continue;
      const v = a * W + b, gv = g.get(n)! + 1;
      if (closed.has(v)) continue; // sans réouverture : un nœud fermé n'est plus modifié (ne change que w = 3, h non cohérente)
      if (gv < (g.get(v) ?? Infinity)) { g.set(v, gv); par.set(v, n); push(v, gv); st.upd.push([v, gv, w * h(v)]); }
    }
  }
  return { H, W, S, G, walls, steps, cost: Infinity, path: [] };
}

// ---------------------------------------------------------------- RRT et RRT-Connect
export const mulberry32 = (a: number) => () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
export type Tree = { q: Q[]; par: number[] };
export const dist = (a: Q, b: Q) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const nearest = (T: Tree, q: Q) => { let bi = 0, bd = Infinity; T.q.forEach((p, i) => { const d = dist(p, q); if (d < bd) { bd = d; bi = i; } }); return bi; };
const steer = (a: Q, b: Q, d: number): Q => { const l = dist(a, b); return l <= d ? [b[0], b[1]] : [a[0] + (d * (b[0] - a[0])) / l, a[1] + (d * (b[1] - a[1])) / l]; };
const sample = (rnd: () => number): Q => [-Math.PI + 2 * Math.PI * rnd(), -Math.PI + 2 * Math.PI * rnd()];
const branch = (T: Tree, i: number) => { const out: Q[] = []; while (i >= 0) { out.push(T.q[i]); i = T.par[i]; } return out; };
export const pathLen = (p: Q[]) => p.slice(1).reduce((s, q, i) => s + dist(p[i], q), 0);
export const DELTA = 0.2, P_GOAL = 0.05;

// RRT : un arbre depuis le départ. Biais vers le but (P_GOAL) et test d'arrivée (q_new à moins de δ du but, segment libre) :
// choix d'implémentation. Deux flux aléatoires : tirages (le même que RRT-Connect à graine égale) et biais.
export type RrtEv = { qrand: Q; goal: boolean; near: number; qnew: Q; d: number; ok: boolean; dGoal: number; done: boolean };
export class Rrt {
  T: Tree; it = 0; seg = 0; path: Q[] | null = null; ev: RrtEv | null = null;
  qs: Q; qg: Q; delta: number; pGoal: number; rnd: () => number; rndG: () => number;
  constructor(qs: Q, qg: Q, seed: number, delta = DELTA, pGoal = P_GOAL) {
    this.qs = qs; this.qg = qg; this.delta = delta; this.pGoal = pGoal;
    this.rnd = mulberry32(seed); this.rndG = mulberry32(seed ^ 0x9e3779b9);
    this.T = { q: [qs], par: [-1] };
  }
  step() {
    if (this.path) return;
    this.it++;
    const s = sample(this.rnd), goal = this.rndG() < this.pGoal, qrand: Q = goal ? this.qg : s;
    const near = nearest(this.T, qrand), d = dist(this.T.q[near], qrand), qnew = steer(this.T.q[near], qrand, this.delta);
    this.seg++;
    const ok = segFree(this.T.q[near], qnew);
    const ev: RrtEv = { qrand, goal, near, qnew, d, ok, dGoal: dist(qnew, this.qg), done: false };
    if (ok) {
      this.T.q.push(qnew); this.T.par.push(near);
      if (ev.dGoal < 1e-12) ev.done = true;
      else if (ev.dGoal <= this.delta) { this.seg++; if (segFree(qnew, this.qg)) { this.T.q.push(this.qg); this.T.par.push(this.T.q.length - 2); ev.done = true; } }
      if (ev.done) this.path = branch(this.T, this.T.q.length - 1).reverse();
    }
    this.ev = ev;
  }
}

// RRT-Connect (Kuffner & LaValle 2000, fig. 5) : EXTEND(Ta, q_rand) ; s'il n'est pas piégé, CONNECT(Tb, q_new) répète EXTEND
// tant qu'il avance ; atteint : arbres reliés. Sinon SWAP(Ta, Tb), à chaque itération. Arbre 0 : départ ; arbre 1 : but.
export type Ext = 'R' | 'A' | 'T';
export type ExtRes = { res: Ext; near: number; qnew: Q };
export type RcEv = { qrand: Q; a: number; ext: ExtRes; con: { steps: number; res: Ext; first: number; last: ExtRes } | null; done: boolean };
export class RrtConnect {
  T: [Tree, Tree]; a = 0; it = 0; seg = 0; path: Q[] | null = null; ev: RcEv | null = null;
  delta: number; rnd: () => number;
  constructor(qs: Q, qg: Q, seed: number, delta = DELTA) {
    this.delta = delta; this.rnd = mulberry32(seed);
    this.T = [{ q: [qs], par: [-1] }, { q: [qg], par: [-1] }];
  }
  extend(T: Tree, q: Q): ExtRes {
    const near = nearest(T, q), qnew = steer(T.q[near], q, this.delta);
    this.seg++;
    if (!segFree(T.q[near], qnew)) return { res: 'T', near, qnew };
    T.q.push(qnew); T.par.push(near);
    return { res: dist(qnew, q) < 1e-12 ? 'R' : 'A', near, qnew };
  }
  step() {
    if (this.path) return;
    this.it++;
    const qrand = sample(this.rnd), Ta = this.T[this.a], Tb = this.T[1 - this.a];
    const ext = this.extend(Ta, qrand);
    const ev: RcEv = { qrand, a: this.a, ext, con: null, done: false };
    if (ext.res !== 'T') {
      const first = Tb.q.length;
      let steps = 0, last: ExtRes;
      do { last = this.extend(Tb, ext.qnew); steps++; } while (last.res === 'A');
      ev.con = { steps, res: last.res, first, last };
      if (last.res === 'R') {
        ev.done = true;
        this.path = [...branch(this.T[0], this.T[0].q.length - 1).reverse(), ...branch(this.T[1], this.T[1].q.length - 1).slice(1)];
      }
    }
    if (!ev.done) this.a = 1 - this.a;
    this.ev = ev;
  }
}
