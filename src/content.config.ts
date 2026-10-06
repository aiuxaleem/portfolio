/* Content collections (docs/IMPLEMENTATION_PLAN.md section 2). Every entry is validated at build time.
   Rules that hold for every collection:
   - every image is an object { src, alt } and alt is required (WCAG 1.1.1, finding M-06)
   - `draft: true` entries never build in production
   - `fixture: true` marks a stress-test entry (CLAUDE.md 2.3): shown on /_states, never in production
   - nothing is invented: unknown facts are written as [VERIFY] or [METRIC: ...], and the quality run fails a production page that still shows one */
import { defineCollection, reference, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { S, alt, flags, link, seo, projectSchema, caseStudySchema, postSchema, siteSchema } from './lib/content-schemas';

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
  schema: ({ image }) => S({
    title: z.string(),
    /* An 11-character YouTube id, or [VERIFY] while the real id is unknown. A made-up id cannot pass. */
    youtubeId: z.string().regex(/^([\w-]{11}|\[VERIFY\])$/, 'Use the 11-character YouTube id, or [VERIFY]'),
    published: z.coerce.date().optional(),
    duration: z.string().optional(),
    poster: z.object({ src: image(), alt }).optional(),
    description: z.string().optional(),
    kind: z.enum(['long-form', 'short']).default('long-form'),
    tags: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    ...flags,
  }),
});

const linkedinPosts = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/linkedin-posts' }),
  schema: S({
    title: z.string(),
    excerpt: z.string().optional(),
    url: z.string().url(),
    published: z.coerce.date(),
    series: z.string().optional(),
    stats: z.string().optional(),
    tags: z.array(z.string()).default([]),
    ...flags,
  }),
});

const linkedinArticles = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/linkedin-articles' }),
  schema: S({
    title: z.string(),
    url: z.string().url(),
    published: z.coerce.date().optional(),
    readingTime: z.string().optional(),
    tags: z.array(z.string()).default([]),
    excerpt: z.string().optional(),
    ...flags,
  }),
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
