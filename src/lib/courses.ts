import { getCollection } from 'astro:content';

// Les cours du site. La clé est le nom du dossier dans src/content/chapters/ et le premier segment de l'URL.
export const COURSES = {
  ouroboros: {
    title: 'Ouroboros',
    unit: 'Module',
    tagline: 'Récurrence en profondeur, récurrence dans le temps, et leur couplage.',
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
      "Ce qui coûte vraiment dans un calcul numérique (déplacer les données), et ce que JAX change par rapport à NumPy : compilation et fusion, exécution asynchrone sur l'appareil, transformations (vmap, scan, grad) et découpage sur plusieurs appareils. Chapitre 5 : un vrai code lu avec ces outils.",
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
