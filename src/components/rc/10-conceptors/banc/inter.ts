// Cours Reservoir computing, chapitre 10 : scénarios « intermédiaires » du widget Banc. Chaque scénario enchaîne des cibles
// (un mode seul, ou un mélange a + b avec la part mu de b). Le réservoir est placé directement sur la première, qui doit être
// un mode seul ; puis, après 40 pas sur place, transition de 60 pas vers chacune des suivantes, et 40 pas sur place.
// Les notes disent quoi regarder ; ce qu'elles décrivent a été vérifié par simulation (banc/model.ts, mêmes poids). Les sources sont dans le chapitre.
export type Target = { a: string; b?: string; mu?: number };

export const SCENARIOS: { label: string; steps: Target[]; note: string }[] = [
  {
    label: 'essaim → tourbillon → polarisé',
    steps: [{ a: 'swarm' }, { a: 'mill' }, { a: 'school' }],
    note: "Deux transitions à la suite : la trace monte vers le coin du tourbillon, puis redescend vers le banc polarisé, comme le chemin du modèle de Couzin et al. (2002).",
  },
  {
    label: 'essaim → polarisé, direct',
    steps: [{ a: 'swarm' }, { a: 'school' }],
    note: "Une seule transition : la trace longe le bas de la carte, loin du coin du tourbillon.",
  },
  {
    label: 'cordon → tourbillon → polarisé',
    steps: [{ a: 'line' }, { a: 'mill' }, { a: 'school' }],
    note: "Deux transitions à la suite, sur le chemin du modèle de Calovi et al. (2014). Dans le bassin, la ligne se raccourcit et se brouille avant de former l'anneau ; l'anneau se resserre, puis part en banc.",
  },
  {
    label: 'tourbillon + polarisé, μ = 0,5',
    steps: [{ a: 'mill' }, { a: 'mill', b: 'school', mu: 0.5 }],
    note: "Du tourbillon, la trace descend au milieu de la zone transitionnelle, et le disque y reste.",
  },
  {
    label: "tourbillon → boule d'appât",
    steps: [{ a: 'mill' }, { a: 'ball' }],
    note: "La trace ne bouge presque pas : seul le disque rétrécit. Dans le bassin, l'anneau se resserre en boule pleine et le prédateur apparaît.",
  },
  {
    label: 'expansion éclair → vacuole',
    steps: [{ a: 'flash' }, { a: 'vacuole' }],
    note: "Les deux modes ont presque les mêmes P et M : regarder le bassin, où l'éclair laisse place à un vide autour du prédateur.",
  },
];
