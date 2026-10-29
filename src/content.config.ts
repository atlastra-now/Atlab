import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob, file } from 'astro/loaders';
import { parse } from 'yaml';

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

// 照片：素材和 photos.yaml 都在 src/content/photos/。date 只显示到月，日用于排序。
// place、date 在本地预览时允许为空（页面里给警告）；GitHub Actions 上的构建遇到空的会报错，见 src/pages/photos/index.astro。
const photos = defineCollection({
  loader: file('src/content/photos/photos.yaml', {
    parser: (text) => (parse(text) as Array<{ file: string }>).map((p) => ({ id: p.file, ...p })),
  }),
  schema: z.object({
    file: z.string(),
    place: z.string().default(''),
    title: z.string().optional(),
    date: z.union([z.string().regex(/^(\d{4}-\d{2}-\d{2})?$/), z.date().transform((d) => d.toISOString().slice(0, 10))]).default(''),
    tags: z.array(z.string()).default([]),
    poster: z.string().optional(),
    order: z.number().int().optional(),
  }),
});

export const collections = { articles, photos };
