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

// Bài blog tiếng nước ngoài: src/content/blog-intl/<mã ngôn ngữ>/<đường-dẫn>.md
// translationOf = tên file bài tiếng Việt tương ứng (nếu có) để nối các bản dịch với nhau
const blogIntl = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog-intl' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      date: z.coerce.date(),
      category: z.string(),
      image: image().optional(),
      imageAlt: z.string().default(''),
      translationOf: z.string().optional(),
      draft: z.boolean().default(false),
    }),
});

export const collections = { blog, blogIntl };
