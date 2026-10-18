import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Un dossier par cours : src/content/chapters/<cours>/<fichier>. L'id d'une entrée est « <cours>/<fichier> ».
const chapters = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/chapters' }),
  schema: z.object({
    num: z.number(),
    title: z.string(),
    summary: z.string(),
    // état de l'écriture : plan (plan seulement), premier-jet (rédigé, pas encore relu), en-relecture (relu et retouché par l'utilisateur),
    // termine (validé par l'utilisateur ; lui seul met ce statut)
    status: z.enum(['plan', 'premier-jet', 'en-relecture', 'termine']).default('plan'),
    sidebar: z.enum(['transformer', 'loop', 'mfcc']).optional(),
  }),
});

export const collections = { chapters };
