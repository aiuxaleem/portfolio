/* The rules for projects, case studies and posts, in one place. The build checks every content file against them
   (src/content.config.ts), and the admin editors check an entry against the same rules before it is saved or published,
   so nothing the editor accepts can fail the build. `image` is how an image path is checked: the build resolves the
   file; the editor only needs a path. */
import { z } from 'astro/zod';


/* Editors write empty strings, nulls and empty groups for fields left blank. They are removed before validation,
   so a blank optional field is simply absent and optional parts render cleanly when missing. */
export const clean = (v: unknown): unknown => {
  if (Array.isArray(v)) return v.map(clean).filter(x => x !== undefined);
  if (v && typeof v === 'object' && !(v instanceof Date)) {
    const out: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(v)) { const c = clean(x); if (c !== undefined) out[k] = c; }
    return Object.keys(out).length ? out : undefined;
  }
  return v === '' || v === null ? undefined : v;
};
export const S = <T extends z.ZodRawShape>(shape: T) => z.preprocess(v => clean(v) ?? {}, z.object(shape));

export const flags = { draft: z.boolean().default(false), fixture: z.boolean().default(false) };
export const alt = z.string().min(1, 'Alt text is required on every image');
export const seo = z.object({ title: z.string().max(70).optional(), description: z.string().max(170).optional() }).default({});
export const link = z.object({ label: z.string(), href: z.string().url() });
export const metric = z.object({
  value: z.string(),
  label: z.string(),
  kind: z.enum(['outcome', 'output']).default('outcome'),
  source: z.string().optional(),
  verified: z.boolean().default(false),
});

export const projectSchema = <I extends z.ZodTypeAny>(image: () => I) => S({
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
  });

export const caseStudySchema = <I extends z.ZodTypeAny>(image: () => I) => {
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
      }).default({} as never), // every part is optional; the cast is only needed because the image rule is generic
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
  };

export const postSchema = <I extends z.ZodTypeAny>(image: () => I) => S({
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
  });

/* Videos and the LinkedIn posts and articles listed on Writing: one small YAML file each. */
export const videoSchema = <I extends z.ZodTypeAny>(image: () => I) => S({
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
  });

/** The post's LinkedIn id, read from its link ("Copy link to post" gives one that ends in activity-<number>-xxxx).
    The embed address needs it. Null when the link carries no id. */
export const linkedinUrn = (url: string): string | null => {
  let text = url; try { text = decodeURIComponent(url); } catch { /* keep the link as written */ }
  const m = text.match(/urn:li:(activity|share|ugcPost):(\d{10,})/) || text.match(/\b(activity|share|ugcPost)[-:](\d{10,})/);
  return m ? `urn:li:${m[1]}:${m[2]}` : null;
};

export const linkedinPostSchema = S({
    title: z.string(),
    excerpt: z.string().optional(),
    url: z.string().url(),
    published: z.coerce.date().refine(d => d.getFullYear() >= 2003 && d.getTime() < Date.now() + 86400000, 'A LinkedIn post cannot be dated before LinkedIn existed or in the future. Check the year.'),
    series: z.string().optional(),
    stats: z.string().optional(),
    tags: z.array(z.string()).default([]),
    /* Offer the post itself on the Read page, loaded from LinkedIn when the visitor asks for it. */
    embed: z.boolean().default(false),
    ...flags,
  }).superRefine((d, ctx) => {
    const post = d as { embed?: boolean; url?: string };
    if (post.embed && post.url && !linkedinUrn(post.url)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['embed'], message: 'This link has no LinkedIn post number, so the post cannot be shown on the page. On LinkedIn, open the post\'s menu and choose "Copy link to post", or untick this box.' });
  });

export const linkedinArticleSchema = S({
    title: z.string(),
    url: z.string().url(),
    published: z.coerce.date().optional(),
    readingTime: z.string().optional(),
    tags: z.array(z.string()).default([]),
    excerpt: z.string().optional(),
    ...flags,
  });

/* UX resources (src/content/resources/*.yaml): a curated directory of tools, references and reading for AI product
   design, shown at /resources. Every entry links out; nothing is hosted here. The category, type and cost lists are the
   words the page filters by, so a value outside them cannot be saved. */
export const RESOURCE_CATEGORIES = {
  'ai-design-patterns': 'AI design patterns',
  'prompting-and-evaluation': 'Prompting and evaluation',
  'design-systems': 'Design systems',
  'design-tokens': 'Design tokens',
  accessibility: 'Accessibility',
  'research-and-testing': 'Research and testing',
  prototyping: 'Prototyping',
  typography: 'Typography',
  colour: 'Colour',
  'icons-and-illustration': 'Icons and illustration',
  motion: 'Motion',
  'handoff-and-documentation': 'Handoff and documentation',
  learning: 'Learning',
  inspiration: 'Inspiration',
  utilities: 'Utilities',
  communities: 'Communities',
} as const;
export const RESOURCE_TYPES = { tool: 'Tool', ai: 'AI tool', workflow: 'AI workflow', skill: 'Claude skill', artifact: 'Claude artifact', article: 'Article', library: 'Library', template: 'Template', course: 'Course', book: 'Book', plugin: 'Plugin', video: 'Video', community: 'Community' } as const;
export const RESOURCE_COSTS = { free: 'Free', freemium: 'Free tier', paid: 'Paid' } as const;
export type ResourceCategory = keyof typeof RESOURCE_CATEGORIES;
export type ResourceType = keyof typeof RESOURCE_TYPES;
export type ResourceCost = keyof typeof RESOURCE_COSTS;
const keys = <T extends Record<string, string>>(o: T) => Object.keys(o) as [keyof T & string, ...(keyof T & string)[]];

export const resourceSchema = S({
    title: z.string().max(120),
    url: z.string().url().max(300).refine(u => /^https?:\/\//.test(u), 'Use a full address starting with https://'),
    category: z.enum(keys(RESOURCE_CATEGORIES)),
    type: z.enum(keys(RESOURCE_TYPES)).default('tool'),
    cost: z.enum(keys(RESOURCE_COSTS)).default('free'),
    /* What it is and why it is worth a visit, in one or two sentences. Shown whole on the card. */
    description: z.string().max(220).optional(),
    added: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    /* Made by me: my own AI workflows, Claude skills and artifacts. Listed first, in their own section, and marked on the card. */
    mine: z.boolean().default(false),
    ...flags,
  });

/* AI tools (src/content/ai-tools/*.yaml): the directory at /ai-tools. One small YAML file per tool; every entry links out to
   the tool's own site. Categories are by what the tool helps a designer do. */
export const AI_TOOL_CATEGORIES = {
  assistants: 'Assistants and models',
  'ui-generation': 'UI generation and prototyping',
  code: 'Design to code',
  images: 'Images and illustration',
  'video-and-motion': 'Video, motion and 3D',
  'audio-and-voice': 'Audio and voice',
  research: 'User research',
  testing: 'Testing and attention',
  'diagrams-and-slides': 'Diagrams, whiteboards and slides',
  'colour-and-type': 'Colour and type',
  patterns: 'AI UX patterns',
  accessibility: 'Accessibility',
} as const;
export type AiToolCategory = keyof typeof AI_TOOL_CATEGORIES;
export const aiToolSchema = S({
    title: z.string().max(80),
    url: z.string().url().max(300).refine(u => /^https?:\/\//.test(u), 'Use a full address starting with https://'),
    category: z.enum(keys(AI_TOOL_CATEGORIES)),
    cost: z.enum(keys(RESOURCE_COSTS)).default('freemium'),
    /* What it does for a designer, in one or two sentences. Shown whole on the card. */
    description: z.string().max(220).optional(),
    added: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    /* Tools I use myself are marked on the card. */
    pick: z.boolean().default(false),
    ...flags,
  });

/* Site settings (src/content/site/config.json) and the profile data behind About, Resume, Now and the contact form
   (src/content/site/profile.json). Both are single files, checked by the build and by the admin editor. */
export const siteSchema = z.object({
  brand: z.string(),
  name: z.string(),
  positioning: z.string(),
  location: z.string(),
  availability: z.object({ open: z.boolean(), label: z.string() }),
  /* Two of the four facts under the Home hero's buttons (the other two come from the profile and the location). */
  hero: z.object({ openTo: z.string().max(60), focus: z.string().max(60) }),
  email: z.string().email(),
  calendarUrl: z.string().url(),
  resume: z.object({ path: z.string(), fallbackUrl: z.string().url().optional() }),
  socials: z.object({ linkedin: z.string().url(), behance: z.string().url().optional(), youtube: z.string().url().optional(), github: z.string().url().optional() }),
  copyright: z.string(),
});

const month = z.string().regex(/^(\d{4}-\d{2})?$/, 'Use YYYY-MM, or leave empty');
const item = z.object({ title: z.string(), body: z.string() });
export const profileSchema = z.object({
  headline: z.string(),
  positioning: z.string(),
  summary: z.array(z.string()),
  principles: z.array(item),
  career: z.array(z.object({ company: z.string(), role: z.string(), start: month, end: month, location: z.string(), summary: z.string(), highlights: z.array(z.string()), verify: z.string() })),
  expertise: z.array(item),
  aiWorkflow: z.array(item),
  tools: z.array(z.string()),
  education: z.array(z.object({ school: z.string(), qualification: z.string(), verify: z.string() })),
  now: z.object({ updated: month, building: z.array(item.extend({ status: z.string() })), verify: z.string() }),
  contactForm: z.object({ formspreeId: z.string().regex(/^[a-z0-9]*$/i, 'Only the id, not the whole address'), verify: z.string() }),
});
