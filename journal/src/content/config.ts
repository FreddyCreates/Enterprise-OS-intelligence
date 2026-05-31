import { defineCollection, z } from 'astro:content';

const papers = defineCollection({
  type: 'content',
  schema: z.object({
    id:       z.string(),
    roman:    z.string().nullable().optional(),
    arxiv:    z.boolean().optional().default(false),
    title:    z.string(),
    subtitle: z.string().optional().default(''),
    order:    z.number(),
    layer:    z.enum(['Laws', 'Architecture', 'Proposals', 'Live', 'ArXiv']),
    threads:  z.array(z.enum(['TRACE', 'VERIFY', 'REMEMBER'])).default([]),
    description: z.string().optional().default(''),
  }),
});

export const collections = { papers };
