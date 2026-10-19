// Cours Reservoir computing : vue 3D minimale pour les widgets SVG. Rotation (lacet ψ autour de l'axe vertical, tangage φ),
// projection orthographique, et rotation à la souris ou au doigt. Le troisième axe (z) est vertical à l'écran.
export type View3D = {
  proj: (p: number[]) => [number, number];
  attach: (svg: Element, onChange: () => void) => void;
};

// map : l'ordre des coordonnées envoyées vers (x, y, z) de la vue, z vertical
export function makeView(o: { W: number; H: number; S: number; center: number[]; psi?: number; phi?: number; map?: [number, number, number] }): View3D {
  let psi = o.psi ?? 0.6, phi = o.phi ?? 0.5;
  const [ix, iy, iz] = o.map ?? [0, 1, 2];
  const proj = (p: number[]): [number, number] => {
    const x = p[ix] - o.center[ix], y = p[iy] - o.center[iy], z = p[iz] - o.center[iz];
    const x1 = x * Math.cos(psi) - y * Math.sin(psi), y1 = x * Math.sin(psi) + y * Math.cos(psi);
    const z2 = y1 * Math.sin(phi) + z * Math.cos(phi);
    return [o.W / 2 + o.S * x1, o.H / 2 - o.S * z2];
  };
  const attach = (svg: Element, onChange: () => void) => {
    let drag: [number, number] | null = null;
    svg.addEventListener('pointerdown', (e) => { const ev = e as PointerEvent; drag = [ev.clientX, ev.clientY]; (svg as SVGElement).setPointerCapture(ev.pointerId); });
    svg.addEventListener('pointermove', (e) => {
      const ev = e as PointerEvent;
      if (!drag) return;
      psi -= (ev.clientX - drag[0]) * 0.01;
      phi = Math.max(-1.45, Math.min(1.45, phi + (ev.clientY - drag[1]) * 0.01));
      drag = [ev.clientX, ev.clientY];
      onChange();
    });
    svg.addEventListener('pointerup', () => (drag = null));
  };
  return { proj, attach };
}
