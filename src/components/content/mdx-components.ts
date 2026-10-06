/* Components available inside every MDX body (posts, case studies, projects). The same names are offered as blocks in
   the editor (keystatic.config.ts). */
import YouTube from '../embeds/youtube.astro';
import LinkedInPost from '../embeds/linkedin-post.astro';
import LinkedInArticle from '../embeds/linkedin-article.astro';
import Callout from './callout.astro';
import Figure from './figure.astro';
import Gallery from './gallery.astro';
import TableWrap from './table-wrap.astro';
import CodeBlock from './code-block.astro';

export const mdxComponents = { YouTube, LinkedInPost, LinkedInArticle, Callout, Figure, Gallery, table: TableWrap, pre: CodeBlock };
