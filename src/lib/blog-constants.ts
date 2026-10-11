// Safe to import from client components (no server/database code).

export const BLOG_AUTHOR_NAME = "Mostafa Omar";
/** The blog is written in English only; other locales redirect to it. */
export const BLOG_LOCALE = "en";
/** Public blog URL (English is unprefixed). */
export const BLOG_PATH = "/blog";
export const blogPostPath = (slug: string) => `${BLOG_PATH}/${slug}`;
