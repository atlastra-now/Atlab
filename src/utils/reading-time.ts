/** 一个源文件里可见文字的字数（去掉 frontmatter、import、样式、脚本和标签）。 */
function visibleChars(raw: string): number {
  return raw
    .replace(/^---[\s\S]*?---/, '')
    .replace(/^import .*$/gm, '')
    .replace(/<style[\s\S]*?<\/style>/g, '')
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&[a-z]+;/g, '')
    .replace(/\s+/g, '').length;
}

/** 中文按每分钟 400 字，向上取整。 */
export function readingMinutes(chars: number): number {
  return Math.max(1, Math.ceil(chars / 400));
}

const sources = import.meta.glob('../content/articles/*/{index.mdx,diagrams/*.astro}', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

/** 某篇文章（按文件夹名）的阅读分钟数。 */
export function articleMinutes(slug: string): number {
  const chars = Object.entries(sources)
    .filter(([path]) => path.includes(`/articles/${slug}/`))
    .reduce((sum, [, src]) => sum + visibleChars(src), 0);
  return readingMinutes(chars);
}
