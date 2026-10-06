/* Reading collections. Drafts and stress fixtures never reach a production build;
   fixtures are shown in dev and in quality builds (QUALITY_BUILD=1), where /_states renders them. */
import { getCollection, type CollectionKey } from 'astro:content';

const showFixtures = import.meta.env.DEV || process.env.QUALITY_BUILD === '1';

/** Entries that may be published: not drafts, not fixtures. */
export async function published<K extends CollectionKey>(name: K) {
  return getCollection(name, ({ data }: any) => !data.draft && !data.fixture);
}

/** Everything a developer should see on /_states: published entries, drafts and fixtures. Empty in production. */
export async function forStates<K extends CollectionKey>(name: K) {
  return showFixtures ? getCollection(name) : [];
}

/** True while a value still carries a placeholder that must be resolved before launch. */
export const isPlaceholder = (value: unknown) => typeof value === 'string' && /\[VERIFY\]|\[METRIC:/.test(value);
