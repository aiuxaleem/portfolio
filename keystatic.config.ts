/* Browser editor for the content collections (Keystatic). Local mode: it reads and writes the files in src/content,
   so it runs with `npm run dev` at /keystatic (and /admin redirects there). Editing on the live site needs GitHub mode
   and a server adapter; that is set up with hosting. Fields mirror src/content.config.ts. Alt text is required on every image. */
import { config, collection, singleton, fields } from '@keystatic/core';
import { block, wrapper } from '@keystatic/core/content-components';

const flags = {
  draft: fields.checkbox({ label: 'Draft', description: 'Drafts are never published.' }),
  fixture: fields.checkbox({ label: 'Stress fixture', description: 'Test content. Never published.' }),
};
const img = (label: string, dir: string) => fields.object({
  src: fields.image({ label: `${label}: image`, directory: `src/assets/${dir}`, publicPath: `../../assets/${dir}/` }),
  alt: fields.text({ label: `${label}: alt text`, description: 'Required when an image is set: describe it for someone who cannot see it. The build fails if it is empty.' }),
}, { label });
const long = (label: string) => fields.text({ label, multiline: true });
const lines = (label: string) => fields.array(fields.text({ label: 'Line' }), { label, itemLabel: p => p.value });
const tags = fields.array(fields.text({ label: 'Tag' }), { label: 'Tags', itemLabel: p => p.value });

/* Blocks offered in every MDX body. The names match src/components/content/mdx-components.ts. */
const body = (label: string, dir: string) => fields.mdx({
  label,
  options: { image: { directory: `src/assets/${dir}`, publicPath: `../../assets/${dir}/` } },
  components: {
    YouTube: block({ label: 'YouTube video', description: 'Loads only when the visitor presses play.', schema: {
      id: fields.text({ label: 'YouTube id', description: 'The 11 characters after v= in the video link', validation: { isRequired: true } }),
      title: fields.text({ label: 'Title', description: 'Read out by screen readers and shown under the video', validation: { isRequired: true } }),
      poster: fields.text({ label: 'Poster image path (optional)', description: 'A file in public/, for example /assets/video-poster.jpg' }),
    } }),
    LinkedInPost: block({ label: 'LinkedIn post', description: 'A card with a button that loads the post from LinkedIn.', schema: {
      urn: fields.text({ label: 'Post URN', description: 'From the post menu, Embed this post: urn:li:share:… or urn:li:activity:…', validation: { isRequired: true } }),
      url: fields.url({ label: 'Link to the post', validation: { isRequired: true } }),
      title: fields.text({ label: 'Title', validation: { isRequired: true } }),
      excerpt: fields.text({ label: 'Excerpt', multiline: true }),
    } }),
    LinkedInArticle: block({ label: 'LinkedIn article (link card)', schema: {
      url: fields.url({ label: 'Link to the article', validation: { isRequired: true } }),
      title: fields.text({ label: 'Title', validation: { isRequired: true } }),
      excerpt: fields.text({ label: 'Excerpt', multiline: true }),
      date: fields.date({ label: 'Published' }),
      cover: fields.text({ label: 'Cover image path (optional)', description: 'A file in public/' }),
      coverAlt: fields.text({ label: 'Cover alt text' }),
    } }),
    Callout: wrapper({ label: 'Callout', schema: {
      tone: fields.select({ label: 'Tone', defaultValue: 'note', options: [{ label: 'Note', value: 'note' }, { label: 'Warning', value: 'warning' }] }),
      title: fields.text({ label: 'Title' }),
    } }),
    Figure: wrapper({ label: 'Image with caption', description: 'Put one image inside.', schema: { caption: fields.text({ label: 'Caption' }) } }),
    Gallery: wrapper({ label: 'Gallery', description: 'Put two or more images inside.', schema: { caption: fields.text({ label: 'Caption' }) } }),
  },
});

export default config({
  storage: { kind: 'local' },
  ui: { brand: { name: 'AIUXAleem content' } },
  singletons: {
    site: singleton({
      label: 'Site settings', path: 'src/content/site/config', format: { data: 'json' },
      schema: {
        brand: fields.text({ label: 'Brand' }),
        name: fields.text({ label: 'Full name' }),
        positioning: fields.text({ label: 'Positioning line', multiline: true }),
        location: fields.text({ label: 'Location' }),
        availability: fields.object({ open: fields.checkbox({ label: 'Open to roles' }), label: fields.text({ label: 'Availability line' }) }, { label: 'Availability' }),
        email: fields.text({ label: 'Email' }),
        calendarUrl: fields.url({ label: 'Calendar link' }),
        resume: fields.object({ path: fields.text({ label: 'Resume PDF path', description: 'A file in public/, for example /resume.pdf' }), fallbackUrl: fields.url({ label: 'Fallback link while the PDF is missing' }) }, { label: 'Resume' }),
        socials: fields.object({ linkedin: fields.url({ label: 'LinkedIn' }), behance: fields.url({ label: 'Behance' }), youtube: fields.url({ label: 'YouTube' }), github: fields.url({ label: 'GitHub' }) }, { label: 'Socials' }),
        copyright: fields.text({ label: 'Copyright line' }),
      },
    }),
    profile: singleton({
      label: 'Profile (About, Resume, Now, contact form)', path: 'src/content/site/profile', format: { data: 'json' },
      schema: {
        headline: fields.text({ label: 'Headline' }),
        positioning: fields.text({ label: 'Positioning statement', multiline: true }),
        summary: fields.array(fields.text({ label: 'Paragraph', multiline: true }), { label: 'Summary paragraphs', itemLabel: p => p.value.slice(0, 50) }),
        principles: fields.array(fields.object({ title: fields.text({ label: 'Title' }), body: fields.text({ label: 'Text', multiline: true }) }), { label: 'Principles', itemLabel: p => p.fields.title.value }),
        career: fields.array(fields.object({
          company: fields.text({ label: 'Company' }), role: fields.text({ label: 'Role' }),
          start: fields.text({ label: 'Start (YYYY-MM)' }), end: fields.text({ label: 'End (YYYY-MM, empty for present)' }), location: fields.text({ label: 'Location' }),
          summary: fields.text({ label: 'Summary', multiline: true }), highlights: lines('Highlights (shown on the resume)'),
          verify: fields.text({ label: 'Note to self: what still needs checking', description: 'Never shown on the site.', multiline: true }),
        }), { label: 'Career, newest first', itemLabel: p => `${p.fields.company.value}: ${p.fields.role.value}` }),
        expertise: fields.array(fields.object({ title: fields.text({ label: 'Title' }), body: fields.text({ label: 'Text', multiline: true }) }), { label: 'Expertise areas', itemLabel: p => p.fields.title.value }),
        aiWorkflow: fields.array(fields.object({ title: fields.text({ label: 'Title' }), body: fields.text({ label: 'Text', multiline: true }) }), { label: 'How I work with AI (steps)', itemLabel: p => p.fields.title.value }),
        tools: lines('Tools'),
        education: fields.array(fields.object({ school: fields.text({ label: 'School' }), qualification: fields.text({ label: 'Qualification' }), verify: fields.text({ label: 'Note to self', multiline: true }) }), { label: 'Education', itemLabel: p => p.fields.school.value }),
        now: fields.object({
          updated: fields.text({ label: 'Last updated (YYYY-MM)' }),
          building: fields.array(fields.object({ title: fields.text({ label: 'Title' }), status: fields.text({ label: 'Status', description: 'For example In production, Ongoing, Shipped' }), body: fields.text({ label: 'Text', multiline: true }) }), { label: 'Building', itemLabel: p => p.fields.title.value }),
          verify: fields.text({ label: 'Note to self', multiline: true }),
        }, { label: 'Now page' }),
        contactForm: fields.object({ formspreeId: fields.text({ label: 'Formspree form id', description: 'The part after formspree.io/f/. The contact form is hidden until this is set.' }), verify: fields.text({ label: 'Note to self', multiline: true }) }, { label: 'Contact form' }),
      },
    }),
  },
  collections: {
    projects: collection({
      label: 'Projects', slugField: 'title', path: 'src/content/projects/*', format: { contentField: 'content' }, entryLayout: 'content',
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        summary: fields.text({ label: 'Summary', multiline: true, validation: { length: { max: 220 } } }),
        status: fields.select({ label: 'Status', defaultValue: 'in-progress', options: [{ label: 'In progress', value: 'in-progress' }, { label: 'Shipped', value: 'shipped' }, { label: 'Concept', value: 'concept' }] }),
        role: fields.text({ label: 'Role' }), team: fields.text({ label: 'Team' }),
        stack: fields.array(fields.text({ label: 'Tool' }), { label: 'Stack', itemLabel: p => p.value }),
        started: fields.date({ label: 'Started' }), ended: fields.date({ label: 'Ended' }),
        cover: img('Cover', 'projects'),
        gallery: fields.array(fields.object({ src: fields.image({ label: 'Image', directory: 'src/assets/projects', publicPath: '../../assets/projects/' }), alt: fields.text({ label: 'Alt text' }), caption: fields.text({ label: 'Caption' }) }), { label: 'Gallery', itemLabel: p => p.fields.alt.value }),
        links: fields.object({ live: fields.url({ label: 'Live site' }), repo: fields.url({ label: 'Repository' }) }, { label: 'Links' }),
        tags,
        caseStudy: fields.text({ label: 'Related case study', description: 'The slug of the page under /case-studies/, for example colaberry-design-system' }),
        updates: fields.array(fields.object({ date: fields.date({ label: 'Date', validation: { isRequired: true } }), title: fields.text({ label: 'Title' }), body: fields.text({ label: 'Note', multiline: true }) }), { label: 'Updates log', itemLabel: p => `${p.fields.date.value || ''} ${p.fields.title.value}` }),
        order: fields.integer({ label: 'Order', defaultValue: 0 }), featured: fields.checkbox({ label: 'Featured' }), ...flags,
        content: body('Body', 'projects'),
      },
    }),
    caseStudies: collection({
      label: 'Case studies', slugField: 'title', path: 'src/content/case-studies/*', format: { contentField: 'content' }, entryLayout: 'content',
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        index: fields.text({ label: 'Index', description: 'Two digits, for example 01' }), category: fields.text({ label: 'Category' }),
        lead: fields.text({ label: 'Subtitle', description: 'The outcome in one sentence: what changed.', multiline: true }),
        cover: img('Cover', 'cases'),
        role: fields.text({ label: 'Role' }), company: fields.text({ label: 'Company' }), confidential: fields.checkbox({ label: 'Show the company as "Confidential"' }),
        timeline: fields.text({ label: 'Timeline' }), team: fields.text({ label: 'Team' }), platform: fields.text({ label: 'Platform' }), stack: lines('Tools'),
        nda: fields.checkbox({ label: 'Show the NDA notice' }), ndaNote: fields.text({ label: 'NDA note', multiline: true }),
        tldr: lines('In short (3 to 5 lines for readers who skim)'),
        context: fields.object({ problem: long('Problem'), business: long('Business context'), constraints: lines('Constraints') }, { label: 'Problem and context' }),
        research: fields.object({ summary: long('Summary'), insights: lines('Insights') }, { label: 'Research and insights' }),
        process: fields.object({
          summary: long('Summary'),
          steps: fields.array(fields.object({ title: fields.text({ label: 'Title' }), body: long('Body') }), { label: 'Steps', itemLabel: p => p.fields.title.value }),
          images: fields.array(fields.object({ src: fields.image({ label: 'Image', directory: 'src/assets/cases', publicPath: '../../assets/cases/' }), alt: fields.text({ label: 'Alt text' }), caption: fields.text({ label: 'Caption' }) }), { label: 'Images (flows, wireframes, iterations)', itemLabel: p => p.fields.alt.value }),
          beforeAfter: fields.object({ before: img('Before', 'cases'), after: img('After', 'cases'), caption: fields.text({ label: 'Caption' }) }, { label: 'Before and after comparison' }),
        }, { label: 'Process' }),
        ai: fields.object({ summary: long('Summary'), behaviour: lines('Agent and model behaviour'), trust: lines('Trust and transparency patterns'), humanInLoop: long('Human in the loop'), guardrails: lines('Guardrails'), failureStates: lines('Failure and edge states'), evaluation: long('Evaluation') }, { label: 'AI section (optional)' }),
        decisions: fields.array(fields.object({ decision: fields.text({ label: 'Decision' }), tradeoff: long('Trade-off') }), { label: 'Key decisions and trade-offs', itemLabel: p => p.fields.decision.value }),
        outcomes: fields.object({
          summary: long('Summary'),
          metrics: fields.array(fields.object({ value: fields.text({ label: 'Value' }), label: fields.text({ label: 'Label' }), kind: fields.select({ label: 'Kind', defaultValue: 'outcome', options: [{ label: 'Outcome (what changed)', value: 'outcome' }, { label: 'Output (what was made)', value: 'output' }] }), source: fields.text({ label: 'Source', description: 'How and when it was measured' }), verified: fields.checkbox({ label: 'Verified', description: 'A metric is only shown as a figure when this is ticked.' }) }), { label: 'Metrics (up to 4)', itemLabel: p => p.fields.value.value, validation: { length: { max: 4 } } }),
        }, { label: 'Outcomes and impact' }),
        quote: fields.text({ label: 'Pull quote' }),
        reflection: fields.object({ summary: long('Summary'), learnings: lines('Learnings') }, { label: 'Reflection' }),
        project: fields.text({ label: 'Related project', description: 'The slug of the page under /work/' }),
        order: fields.integer({ label: 'Order', defaultValue: 0 }), featured: fields.checkbox({ label: 'Featured on the home page' }), ...flags,
        content: body('Notes (optional extra text)', 'cases'),
      },
    }),
    posts: collection({
      label: 'Blog posts', slugField: 'title', path: 'src/content/posts/*', format: { contentField: 'content' }, entryLayout: 'content',
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        subtitle: fields.text({ label: 'Subtitle' }),
        excerpt: fields.text({ label: 'Excerpt', description: 'One or two sentences for cards, the feed and search results.', multiline: true, validation: { isRequired: true } }),
        category: fields.text({ label: 'Category' }),
        published: fields.date({ label: 'Published' }), updated: fields.date({ label: 'Updated' }),
        cover: img('Cover', 'posts'),
        download: fields.object({ label: fields.text({ label: 'Label' }), file: fields.text({ label: 'File path' }) }, { label: 'Download' }),
        tags,
        canonical: fields.url({ label: 'Canonical URL', description: 'Only for a post republished from another site: the address of the original.' }),
        originallyPublished: fields.object({ on: fields.text({ label: 'Site name', defaultValue: 'LinkedIn' }), url: fields.url({ label: 'Link to the original' }), date: fields.date({ label: 'Original date' }) }, { label: 'Originally published elsewhere' }),
        legacyPage: fields.checkbox({ label: 'Body is served by a migrated legacy page', description: 'Leave off for new posts.' }),
        ...flags,
        content: body('Body', 'posts'),
      },
    }),
    videos: collection({
      label: 'YouTube videos', slugField: 'title', path: 'src/content/videos/*', format: { data: 'yaml' },
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        youtubeId: fields.text({ label: 'YouTube id', description: 'The 11 characters after v= in the video link', validation: { isRequired: true } }),
        published: fields.date({ label: 'Published' }), duration: fields.text({ label: 'Duration' }),
        poster: img('Poster', 'media'),
        description: fields.text({ label: 'Description', multiline: true }),
        kind: fields.select({ label: 'Kind', defaultValue: 'long-form', options: [{ label: 'Long-form', value: 'long-form' }, { label: 'Short', value: 'short' }] }),
        tags, featured: fields.checkbox({ label: 'Featured' }), ...flags,
      },
    }),
    linkedinPosts: collection({
      label: 'LinkedIn posts', slugField: 'title', path: 'src/content/linkedin-posts/*', format: { data: 'yaml' },
      schema: { title: fields.slug({ name: { label: 'Title' } }), excerpt: fields.text({ label: 'Excerpt', multiline: true }), url: fields.url({ label: 'Link to the post', validation: { isRequired: true } }), published: fields.date({ label: 'Published', validation: { isRequired: true } }), series: fields.text({ label: 'Series' }), stats: fields.text({ label: 'Stats' }), tags, ...flags },
    }),
    linkedinArticles: collection({
      label: 'LinkedIn articles', slugField: 'title', path: 'src/content/linkedin-articles/*', format: { data: 'yaml' },
      schema: { title: fields.slug({ name: { label: 'Title' } }), url: fields.url({ label: 'Link to the article', validation: { isRequired: true } }), published: fields.date({ label: 'Published' }), readingTime: fields.text({ label: 'Reading time' }), excerpt: fields.text({ label: 'Excerpt', multiline: true }), tags, ...flags },
    }),
    certifications: collection({
      label: 'Certifications', slugField: 'name', path: 'src/content/certifications/*', format: { data: 'yaml' },
      schema: {
        name: fields.slug({ name: { label: 'Name' } }), issuer: fields.text({ label: 'Issuer' }),
        status: fields.select({ label: 'Status', defaultValue: 'verified', options: [{ label: 'Verified', value: 'verified' }, { label: 'In progress', value: 'in-progress' }, { label: 'Completed', value: 'completed' }] }),
        issued: fields.text({ label: 'Issued', description: 'For example Sep 2025' }), credentialId: fields.text({ label: 'Credential id' }), verifyUrl: fields.url({ label: 'Verify link' }),
        thumb: img('Thumbnail', 'certs'), full: img('Full certificate', 'certs'),
        order: fields.integer({ label: 'Order', defaultValue: 0 }), ...flags,
      },
    }),
    testimonials: collection({
      label: 'Testimonials', slugField: 'name', path: 'src/content/testimonials/*', format: { data: 'yaml' },
      schema: {
        name: fields.slug({ name: { label: 'Name' } }), quote: fields.text({ label: 'Quote', multiline: true }), role: fields.text({ label: 'Role' }), company: fields.text({ label: 'Company' }),
        relationship: fields.text({ label: 'Relationship' }), source: fields.url({ label: 'Source link' }),
        permission: fields.checkbox({ label: 'I have this person\'s permission to publish the quote' }),
        date: fields.date({ label: 'Date' }), photo: img('Photo', 'people'), ...flags,
      },
    }),
  },
});
