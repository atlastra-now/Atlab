import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const articles = defineCollection({
  loader: glob({ pattern: '*/index.mdx', base: './src/content/articles', generateId: ({ entry }) => entry.split('/')[0] }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      titleLines: z.array(z.string()).optional(),
      kind: z.string(),
      issue: z.number(),
      topic: z.string(),
      dek: z.string(),
      byline: z.string(),
      date: z.string().regex(/^\d{4}-\d{2}$/),
      cover: image(),
      coverAlt: z.string(),
      draft: z.boolean().default(false),
      findings: z.array(z.object({ n: z.string(), href: z.string(), icon: z.string(), text: z.string() })),
    }),
});

export const collections = { articles };
