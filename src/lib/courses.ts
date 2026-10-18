import { getCollection } from 'astro:content';

// Les cours du site. La clé est le nom du dossier dans src/content/chapters/ et le premier segment de l'URL.
export const COURSES = {
  'post-transformer': {
    title: 'Post-Transformer',
    unit: 'Chapitre',
    tagline: 'Le transformer et FlashAttention, puis ce qui vient après : récurrence dans le temps, modèles linéaires, hybrides, récurrence en profondeur, et leur couplage (projet de recherche Ouroboros).',
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
      "Ce qui coûte vraiment dans un calcul numérique (déplacer les données), et ce que JAX change par rapport à NumPy. Chapitre 2, en cinq parties : exécution asynchrone sur l'appareil, compilation et fusion, transformations (vmap, scan, grad), découpage sur plusieurs appareils, puis un vrai code lu avec ces outils. Chapitre 3 (indépendant de JAX) : moindres carrés, Cholesky contre QR, SVD et LSQR.",
  },
  rl: {
    title: 'RL',
    unit: 'Chapitre',
    tagline: "L'apprentissage par renforcement par ses mécanismes mathématiques, puis toutes les grandes familles d'algorithmes (méthodes de valeur, gradient de politique, stratégies d'évolution, méthodes avec modèle) et les benchmarks (POPGym, LunarLander).",
    intro:
      "Un cours visuel, centré sur les mécanismes : l'équation de Bellman comme système linéaire et comme contraction, puis comment chaque famille d'algorithmes (méthodes de valeur, gradient de politique, stratégies d'évolution, méthodes avec modèle) en tire sa mise à jour, et enfin les benchmarks qui les comparent.",
  },
} as const;

export type CourseId = keyof typeof COURSES;
export const courseIds = Object.keys(COURSES) as CourseId[];

// état de l'écriture d'un chapitre ; « terminé » n'est posé que par l'utilisateur
export const STATUS_LABELS = { plan: 'plan', 'premier-jet': 'premier jet', 'en-relecture': 'en relecture', termine: 'terminé' } as const;

export const courseOf = (id: string) => id.split('/')[0] as CourseId;
export const slugOf = (id: string) => id.split('/').slice(1).join('/');
export const chapterUrl = (id: string) => `/${courseOf(id)}/${slugOf(id)}/`;

export async function chaptersOf(course: CourseId) {
  const all = await getCollection('chapters', (e) => courseOf(e.id) === course);
  return all.sort((a, b) => a.data.num - b.data.num);
}
