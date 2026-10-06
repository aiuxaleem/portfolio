/* Content collections (docs/IMPLEMENTATION_PLAN.md section 2). Every entry is validated at build time.
   Rules that hold for every collection:
   - every image is an object { src, alt } and alt is required (WCAG 1.1.1, finding M-06)
   - `draft: true` entries never build in production
   - `fixture: true` marks a stress-test entry (CLAUDE.md 2.3): shown on /_states, never in production
   - nothing is invented: unknown facts are written as [VERIFY] or [METRIC: ...], and the quality run fails a production page that still shows one */
import { defineCollection, reference, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { S, alt, flags, link, seo, projectSchema, caseStudySchema, postSchema, siteSchema, videoSchema, linkedinPostSchema, linkedinArticleSchema } from './lib/content-schemas';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/projects' }),
  schema: ({ image }) => projectSchema(image),
});

const caseStudies = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/case-studies' }),
  /* Every section is optional. The page shows only the sections that have content and still reads as complete. */
  schema: ({ image }) => caseStudySchema(image),
});

const posts = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/posts' }),
  schema: ({ image }) => postSchema(image),
});

const videos = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/videos' }),
  schema: ({ image }) => videoSchema(image),
});

const linkedinPosts = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/linkedin-posts' }),
  schema: linkedinPostSchema,
});

const linkedinArticles = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/linkedin-articles' }),
  schema: linkedinArticleSchema,
});

const certifications = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/certifications' }),
  schema: ({ image }) => S({
    name: z.string(),
    issuer: z.string().optional(),
    status: z.enum(['verified', 'in-progress', 'completed']),
    issued: z.string().optional(),
    credentialId: z.string().optional(),
    verifyUrl: z.string().url().optional(),
    thumb: z.object({ src: image(), alt }).optional(),
    full: z.object({ src: image(), alt }).optional(),
    order: z.number().default(0),
    ...flags,
  }),
});

const testimonials = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/testimonials' }),
  schema: ({ image }) => S({
    quote: z.string(),
    name: z.string(),
    role: z.string(),
    company: z.string().optional(),
    relationship: z.string().optional(),
    source: z.string().url().optional(),
    /* A testimonial can only be published with the person's permission. */
    permission: z.boolean().default(false),
    date: z.coerce.date().optional(),
    photo: z.object({ src: image(), alt }).optional(),
    ...flags,
  }).refine((t: any) => t.permission || t.draft || t.fixture, { message: 'A testimonial without permission must stay a draft' }),
});

const site = defineCollection({
  loader: glob({ pattern: 'config.json', base: './src/content/site' }),
  schema: siteSchema,
});

export const collections = { projects, caseStudies, posts, videos, linkedinPosts, linkedinArticles, certifications, testimonials, site };
