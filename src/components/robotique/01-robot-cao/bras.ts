// Cours Robotique : le bras plan de l'exemple, partagé par ArbreURDF.astro et Propagation.astro.
// Trois articulations rotoïdes d'axe z (epaule, coude, poignet) et un repère outil relié par un joint fixed.
// Même robot que les exemples Python du chapitre (Pinocchio, MuJoCo) : le texte URDF ci-dessous est celui du fichier bras.urdf.
// Dans le plan, une pose est une matrice homogène 3×3 de SE(2).

export type M3 = number[][];

// corps : indice 0 = base (racine, fixée au monde) ; un seul parent par corps, parent(i) < i
export const BODIES = ['base', 'bras', 'avant_bras', 'main', 'outil'];
export const PARENT = [-1, 0, 1, 2, 3];
export const LEN = [0, 0.4, 0.3, 0.2, 0];
export const MASS = [0, 1, 0.6, 0.3, 0];
export const SECTION = 0.04;

export type Joint = { name: string; type: 'revolute' | 'fixed'; parent: number; child: number; x: number };
// x : <origin xyz="x 0 0"> du joint, position du repère enfant dans le repère parent quand q = 0
export const JOINTS: Joint[] = [
  { name: 'epaule', type: 'revolute', parent: 0, child: 1, x: 0 },
  { name: 'coude', type: 'revolute', parent: 1, child: 2, x: 0.4 },
  { name: 'poignet', type: 'revolute', parent: 2, child: 3, x: 0.3 },
  { name: 'outil_fixe', type: 'fixed', parent: 3, child: 4, x: 0.2 },
];
export const LIMIT = 2.6;
export const Q0 = [30, 45, -60];
export const RAD = Math.PI / 180;

export const mul = (A: M3, B: M3): M3 => A.map((r) => B[0].map((_, j) => r.reduce((s, a, k) => s + a * B[k][j], 0)));
export const I3: M3 = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];

// ^{parent}T_{enfant}(q) = T_origin · R_z(q) : translation de <origin>, puis rotation d'angle q autour de <axis> = z
export function local(j: Joint, q: number): M3 {
  const a = j.type === 'revolute' ? q : 0, c = Math.cos(a), s = Math.sin(a);
  return [[c, -s, j.x], [s, c, 0], [0, 0, 1]];
}

// ^0T_k pour chaque corps k, en descendant l'arbre : ^0T_k = ^0T_parent(k) · ^parent(k)T_k(q_k)
export function fk(qRad: number[]): { T: M3[]; L: M3[] } {
  const T: M3[] = [I3], L: M3[] = [I3];
  let k = 0;
  for (const j of JOINTS) {
    L[j.child] = local(j, j.type === 'revolute' ? qRad[k++] : 0);
    T[j.child] = mul(T[j.parent], L[j.child]);
  }
  return { T, L };
}

// corps qui bougent quand l'articulation dont l'enfant est c tourne : c et tous ses descendants
export function subtree(c: number): number[] {
  const out: number[] = [];
  BODIES.forEach((_, i) => { let k = i; while (k >= 0 && k !== c) k = PARENT[k]; if (k === c) out.push(i); });
  return out;
}

// nombre en français : virgule décimale, signe moins typographique
export const fr = (v: number, d = 3) => {
  const t = (Math.abs(v) < 0.5 * 10 ** -d ? 0 : v).toFixed(d);
  return t.replace('.', ',').replace('-', '−');
};
// nombre pour le fichier XML : point décimal, au plus 6 décimales, sans zéros inutiles
export const xn = (v: number) => {
  const t = v.toFixed(6).replace(/0+$/, '').replace(/\.$/, '');
  return t === '-0' ? '0' : t;
};

// inertie d'une barre pleine L × 0,04 × 0,04 au centre de masse, axes du corps (x le long de la barre)
export function barInertia(m: number, L: number) {
  const a = SECTION;
  return { ixx: (m * (a * a + a * a)) / 12, iyy: (m * (L * L + a * a)) / 12, izz: (m * (L * L + a * a)) / 12 };
}

// lignes du fichier URDF ; el : élément décrit (b:<corps>, j:<joint>) ; part : 'col' ligne repliée d'un lien,
// 'exp' ligne du lien déplié, 'org' / 'axe' lignes <origin> et <axis> d'un joint
export type Line = { t: string; el?: string; part?: 'col' | 'exp' | 'org' | 'axe' };
export function urdfLines(): Line[] {
  const out: Line[] = [{ t: '<robot name="bras3">' }];
  BODIES.forEach((b, i) => {
    const el = `b:${b}`;
    if (!MASS[i]) { out.push({ t: `  <link name="${b}"/>`, el }); return; }
    const L = LEN[i], I = barInertia(MASS[i], L);
    out.push({ t: `  <link name="${b}"> … </link>`, el, part: 'col' });
    [
      `  <link name="${b}">`,
      `    <inertial>`,
      `      <origin xyz="${xn(L / 2)} 0 0"/> <mass value="${xn(MASS[i])}"/>`,
      `      <inertia ixx="${xn(I.ixx)}" ixy="0" ixz="0" iyy="${xn(I.iyy)}" iyz="0" izz="${xn(I.izz)}"/>`,
      `    </inertial>`,
      `    <visual><geometry><mesh filename="meshes/${b}.stl"/></geometry></visual>`,
      `    <collision>`,
      `      <origin xyz="${xn(L / 2)} 0 0"/> <geometry><box size="${xn(L)} ${xn(SECTION)} ${xn(SECTION)}"/></geometry>`,
      `    </collision>`,
      `  </link>`,
    ].forEach((t) => out.push({ t, el, part: 'exp' }));
  });
  JOINTS.forEach((j) => {
    const el = `j:${j.name}`;
    out.push({ t: `  <joint name="${j.name}" type="${j.type}">`, el });
    out.push({ t: `    <parent link="${BODIES[j.parent]}"/> <child link="${BODIES[j.child]}"/>`, el });
    out.push({ t: `    <origin xyz="${xn(j.x)} 0 0"/>`, el, part: 'org' });
    if (j.type === 'revolute') {
      out.push({ t: `    <axis xyz="0 0 1"/>`, el, part: 'axe' });
      out.push({ t: `    <limit lower="-${LIMIT}" upper="${LIMIT}" effort="5" velocity="3"/>`, el });
    }
    out.push({ t: `  </joint>`, el });
  });
  out.push({ t: '</robot>' });
  return out;
}
// le fichier complet (liens dépliés), tel que lu par les exemples Python
export const urdfText = () => urdfLines().filter((l) => l.part !== 'col').map((l) => l.t).join('\n') + '\n';
