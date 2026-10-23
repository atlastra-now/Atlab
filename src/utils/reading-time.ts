/** 中文按每分钟 400 字，向上取整。 */
export function readingMinutes(body: string): number {
  const text = body
    .replace(/^import .*$/gm, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, '');
  return Math.max(1, Math.ceil(text.length / 400));
}
