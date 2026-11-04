// Cours Reservoir computing, chapitre 11 : dessin du bassin (canvas). Les positions viennent du réservoir, un pas sur 8 par seconde ;
// entre deux pas, la position est interpolée (spline de Catmull-Rom sur quatre pas) et la direction du poisson est celle de la tangente.
// Le battement de queue est un détail du dessin, non appris.

export const VIEW = { x0: -1.05, x1: 1.05, y0: -0.65, y1: 0.65 }; // bassin x ∈ [-1, 1], y ∈ [-0,6, 0,6], plus une marge

// position et tangente d'une spline de Catmull-Rom passant par p1 (t = 0) et p2 (t = 1)
export function catmull(p0: number, p1: number, p2: number, p3: number, t: number) {
  const t2 = t * t, t3 = t2 * t;
  const pos = 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
  const der = 0.5 * (-p0 + p2 + 2 * (2 * p0 - 5 * p1 + 4 * p2 - p3) * t + 3 * (-p0 + 3 * p1 - 3 * p2 + p3) * t2);
  return [pos, der];
}

export type Colors = { fish: string; pred: string; water: string; border: string; text: string };

// un poisson vu de dessus, pointe vers +x, longueur len (pixels) ; wag : angle de la queue (radians)
export function fish(ctx: CanvasRenderingContext2D, x: number, y: number, ang: number, len: number, wag: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.beginPath();
  ctx.moveTo(0.5 * len, 0);
  ctx.bezierCurveTo(0.3 * len, -0.2 * len, -0.2 * len, -0.16 * len, -0.32 * len, 0);
  ctx.bezierCurveTo(-0.2 * len, 0.16 * len, 0.3 * len, 0.2 * len, 0.5 * len, 0);
  ctx.fill();
  ctx.translate(-0.3 * len, 0);
  ctx.rotate(wag);
  ctx.beginPath();
  ctx.moveTo(0.04 * len, 0);
  ctx.lineTo(-0.24 * len, -0.15 * len);
  ctx.lineTo(-0.18 * len, 0);
  ctx.lineTo(-0.24 * len, 0.15 * len);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// contour du bassin (rectangle arrondi), pour le dessiner ou y découper le dessin
export function tankPath(ctx: CanvasRenderingContext2D, X: (v: number) => number, Y: (v: number) => number) {
  const x = X(-1), y = Y(0.6), w = X(1) - x, h = Y(-0.6) - y, r = 10;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// le bassin : fond d'eau, bord arrondi
export function tank(ctx: CanvasRenderingContext2D, X: (v: number) => number, Y: (v: number) => number, c: Colors) {
  tankPath(ctx, X, Y);
  ctx.fillStyle = c.water;
  ctx.fill();
  ctx.strokeStyle = c.border;
  ctx.lineWidth = 1;
  ctx.stroke();
}
