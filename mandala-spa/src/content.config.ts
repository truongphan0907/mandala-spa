import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Bài blog: mỗi bài là một file .md trong src/content/blog/
const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      date: z.coerce.date(),
      category: z.string().default('Sống khỏe'),
      image: image().optional(),
      imageAlt: z.string().default(''),
      draft: z.boolean().default(false),
    }),
});

export const collections = { blog };
