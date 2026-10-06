/* Content collections (docs/IMPLEMENTATION_PLAN.md section 2). Every entry is validated at build time.
   Rules that hold for every collection:
   - every image is an object { src, alt } and alt is required (WCAG 1.1.1, finding M-06)
   - `draft: true` entries never build in production
   - `fixture: true` marks a stress-test entry (CLAUDE.md 2.3): shown on /_states, never in production
   - nothing is invented: unknown facts are written as [VERIFY] or [METRIC: ...], and the quality run fails a production page that still shows one */
import { defineCollection, reference, z } from 'astro:content';
import { glob } from 'astro/loaders';

/* Editors write empty strings, nulls and empty groups for fields left blank. They are removed before validation,
   so a blank optional field is simply absent and optional parts render cleanly when missing. */
const clean = (v: unknown): unknown => {
  if (Array.isArray(v)) return v.map(clean).filter(x => x !== undefined);
  if (v && typeof v === 'object' && !(v instanceof Date)) {
    const out: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(v)) { const c = clean(x); if (c !== undefined) out[k] = c; }
    return Object.keys(out).length ? out : undefined;
  }
  return v === '' || v === null ? undefined : v;
};
const S = <T extends z.ZodRawShape>(shape: T) => z.preprocess(v => clean(v) ?? {}, z.object(shape));

const flags = { draft: z.boolean().default(false), fixture: z.boolean().default(false) };
const alt = z.string().min(1, 'Alt text is required on every image');
const seo = z.object({ title: z.string().max(70).optional(), description: z.string().max(170).optional() }).default({});
const link = z.object({ label: z.string(), href: z.string().url() });
const metric = z.object({
  value: z.string(),
  label: z.string(),
  kind: z.enum(['outcome', 'output']).default('outcome'),
  source: z.string().optional(),
  verified: z.boolean().default(false),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/projects' }),
  schema: ({ image }) => S({
    title: z.string(),
    summary: z.string().max(220),
    status: z.enum(['in-progress', 'shipped', 'concept']),
    role: z.string().optional(),
    team: z.string().optional(),
    stack: z.array(z.string()).default([]),
    started: z.coerce.date().optional(),
    ended: z.coerce.date().optional(),
    cover: z.object({ src: image(), alt }).optional(),
    gallery: z.array(z.object({ src: image(), alt, caption: z.string().optional() })).default([]),
    links: z.object({ live: z.string().url().optional(), repo: z.string().url().optional() }).default({}),
    tags: z.array(z.string()).default([]),
    /* Slug of the related case study page under /case-studies/. */
    caseStudy: z.string().optional(),
    updates: z.array(z.object({ date: z.coerce.date(), title: z.string(), body: z.string(), link: link.optional() })).default([]),
    order: z.number().default(0),
    featured: z.boolean().default(false),
    seo, ...flags,
  }),
});

const caseStudies = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/case-studies' }),
  /* Every section is optional. The page shows only the sections that have content and still reads as complete. */
  schema: ({ image }) => {
    const img = z.object({ src: image(), alt, caption: z.string().optional() });
    const text = z.string().optional();
    const list = z.array(z.string()).default([]);
    return S({
      title: z.string(),
      index: z.string().optional(),
      category: z.string().optional(),
      /* Outcome-focused subtitle: what changed, not what was made. */
      lead: z.string(),
      cover: z.object({ src: image(), alt }).optional(),
      /* Meta strip */
      role: text, company: text, confidential: z.boolean().default(false), timeline: text, team: text, platform: text,
      stack: list,
      /* NDA notice: shown at the top of the page when on. */
      nda: z.boolean().default(false), ndaNote: text,
      /* TL;DR for readers who skim: three to five short lines. */
      tldr: list,
      context: z.object({ problem: text, business: text, constraints: list }).default({}),
      research: z.object({ summary: text, insights: list }).default({}),
      process: z.object({
        summary: text,
        steps: z.array(z.object({ title: z.string(), body: z.string() })).default([]),
        images: z.array(img).default([]),
        beforeAfter: z.object({ before: z.object({ src: image(), alt }), after: z.object({ src: image(), alt }), caption: text }).optional(),
      }).default({}),
      ai: z.object({ summary: text, behaviour: list, trust: list, humanInLoop: text, guardrails: list, failureStates: list, evaluation: text }).default({}),
      decisions: z.array(z.object({ decision: z.string(), tradeoff: z.string().optional() })).default([]),
      /* Outcomes: a metric is shown as a number only when verified is true. Until then the page shows the summary text alone. */
      outcomes: z.object({ summary: text, metrics: z.array(metric).max(4).default([]) }).default({}),
      quote: text,
      reflection: z.object({ summary: text, learnings: list }).default({}),
      project: z.string().optional(),
      order: z.number().default(0),
      /* Featured case studies are shown on the home page. */
      featured: z.boolean().default(false),
      seo, ...flags,
    });
  },
});

const posts = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/posts' }),
  schema: ({ image }) => S({
    title: z.string(),
    subtitle: z.string().optional(),
    /* One or two sentences shown on cards, in feeds and as the meta description. */
    excerpt: z.string(),
    category: z.string().optional(),
    published: z.coerce.date().optional(),
    updated: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    cover: z.object({ src: image(), alt }).optional(),
    download: z.object({ label: z.string(), file: z.string() }).optional(),
    /* The post body is still served by a page migrated from the legacy site; this entry only lists it. */
    legacyPage: z.boolean().default(false),
    /* Republished article: the canonical URL points at the original, and a note says where it first appeared. */
    canonical: z.string().url().optional(),
    originallyPublished: z.object({ on: z.string().default('LinkedIn'), url: z.string().url(), date: z.coerce.date().optional() }).optional(),
    seo, ...flags,
  }),
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

export const siteSchema = z.object({
  brand: z.string(),
  name: z.string(),
  positioning: z.string(),
  location: z.string(),
  availability: z.object({ open: z.boolean(), label: z.string() }),
  email: z.string().email(),
  calendarUrl: z.string().url(),
  resume: z.object({ path: z.string(), fallbackUrl: z.string().url().optional() }),
  socials: z.object({ linkedin: z.string().url(), behance: z.string().url().optional(), youtube: z.string().url().optional(), github: z.string().url().optional() }),
  copyright: z.string(),
});

const site = defineCollection({
  loader: glob({ pattern: 'config.json', base: './src/content/site' }),
  schema: siteSchema,
});

export const collections = { projects, caseStudies, posts, videos, linkedinPosts, linkedinArticles, certifications, testimonials, site };
