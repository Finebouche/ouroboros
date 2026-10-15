import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Un dossier par cours : src/content/chapters/<cours>/<fichier>. L'id d'une entrée est « <cours>/<fichier> ».
const chapters = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/chapters' }),
  schema: z.object({
    num: z.number(),
    title: z.string(),
    summary: z.string(),
    status: z.enum(['a-venir', 'en-cours', 'termine']).default('a-venir'),
    sidebar: z.enum(['transformer', 'loop', 'mfcc']).optional(),
  }),
});

export const collections = { chapters };
