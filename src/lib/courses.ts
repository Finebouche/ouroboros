import { getCollection } from 'astro:content';

// Les cours du site. La clé est le nom du dossier dans src/content/chapters/ et le premier segment de l'URL.
export const COURSES = {
  'post-transformer': {
    title: 'Post-Transformer',
    unit: 'Module',
    tagline: 'Le transformer, puis ce qui vient après : récurrence en profondeur, récurrence dans le temps, modèles linéaires, hybrides, et leur couplage (projet de recherche Ouroboros).',
    intro:
      "Un cours visuel pour comprendre comment une récurrence en profondeur (un bloc bouclé T fois) et une récurrence dans le temps (un état transporté d'un token au suivant) peuvent coexister, et pourquoi certains couplages gardent l'entraînement parallèle.",
  },
  preprocessing: {
    title: 'Preprocessing',
    unit: 'Chapitre',
    tagline: 'Préparer les données avant le modèle, en commençant par le son : les MFCC.',
    intro:
      "Un cours visuel sur le prétraitement des données avant qu'elles n'arrivent dans un modèle. Premier chapitre : du signal audio aux MFCC (Mel-Frequency Cepstral Coefficients).",
  },
  hpc: {
    title: 'HPC',
    unit: 'Chapitre',
    tagline: 'Calcul haute performance, vu par JAX contre NumPy : matériel, compilation, transformations, plusieurs appareils.',
    intro:
      "Ce qui coûte vraiment dans un calcul numérique (déplacer les données), et ce que JAX change par rapport à NumPy : compilation et fusion, exécution asynchrone sur l'appareil, transformations (vmap, scan, grad) et découpage sur plusieurs appareils. Chapitre 5 : un vrai code lu avec ces outils. Chapitre 6 (indépendant de JAX) : moindres carrés, Cholesky contre QR, SVD et LSQR.",
  },
  rl: {
    title: 'RL',
    unit: 'Chapitre',
    tagline: "L'apprentissage par renforcement par ses mécanismes mathématiques, puis les algorithmes (BC, FQI, LSPI, NAC, OpenAI-ES, PPO) et les benchmarks (POPGym, LunarLander).",
    intro:
      "Un cours visuel, centré sur les mécanismes : l'équation de Bellman comme système linéaire et comme contraction, puis comment chaque algorithme (clonage de comportement, FQI, LSPI, gradient naturel, stratégies d'évolution, PPO) en tire sa mise à jour, et enfin les benchmarks qui les comparent.",
  },
} as const;

export type CourseId = keyof typeof COURSES;
export const courseIds = Object.keys(COURSES) as CourseId[];

export const STATUS_LABELS = { 'a-venir': 'à venir', 'en-cours': 'en cours', termine: 'terminé' } as const;

export const courseOf = (id: string) => id.split('/')[0] as CourseId;
export const slugOf = (id: string) => id.split('/').slice(1).join('/');
export const chapterUrl = (id: string) => `/${courseOf(id)}/${slugOf(id)}/`;

export async function chaptersOf(course: CourseId) {
  const all = await getCollection('chapters', (e) => courseOf(e.id) === course);
  return all.sort((a, b) => a.data.num - b.data.num);
}
