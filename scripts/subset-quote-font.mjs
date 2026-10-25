// 生成 public/fonts/quote-serif.woff2：只含「原话」实际用到的字。
// 哪些元素用 --quote：.say、.body .lead、.c4-q（见 src/styles/base.css、prose.css），其后代继承。
// 源字体 scripts/fonts-src/NotoSerifSC[wght].ttf 不提交；找不到源字体或生成失败时只给警告，沿用已提交的 quote-serif.woff2，不阻塞构建。
import { readdir, readFile, writeFile, access } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'public/fonts/quote-serif.woff2');
const SRC_FONT = path.join(import.meta.dirname, 'fonts-src', 'NotoSerifSC[wght].ttf');

async function* walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (/\.(mdx|astro)$/.test(e.name)) yield p;
  }
}

const VOID = new Set(['br', 'hr', 'img', 'use', 'path', 'line', 'rect', 'circle', 'input', 'meta', 'link', 'source']);
const entities = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&nbsp;': ' ' };
const decode = (s) => s.replace(/&(?:amp|lt|gt|quot|nbsp|#39);/g, (m) => entities[m]);

/** 扫描一个文件，返回处于「原话」元素内的文字。 */
function quoteText(src) {
  src = src.replace(/^---[\s\S]*?---/, '').replace(/<style[\s\S]*?<\/style>/g, '').replace(/<script[\s\S]*?<\/script>/g, '');
  const re = /<(\/?)([A-Za-z][A-Za-z0-9]*)((?:[^<>"'{}]|"[^"]*"|'[^']*'|\{[^}]*\})*?)(\/?)>|([^<]+)/g;
  const stack = [];
  let out = '';
  let m;
  while ((m = re.exec(src))) {
    const [, close, name, attrs, selfClose, text] = m;
    if (text !== undefined) {
      if (stack.some((e) => e.quote)) out += decode(text);
      continue;
    }
    const tag = name.toLowerCase();
    if (close) {
      while (stack.length && stack.at(-1).tag !== tag) stack.pop();
      stack.pop();
      continue;
    }
    if (VOID.has(tag) || selfClose) continue;
    const cls = ((attrs.match(/\bclass="([^"]*)"/) ?? [])[1] ?? '').split(/\s+/);
    const inBody = stack.some((e) => e.cls.includes('body'));
    const quote = cls.includes('say') || cls.includes('c4-q') || (cls.includes('lead') && inBody);
    stack.push({ tag, cls, quote });
  }
  return out;
}

try {
  let text = '「」『』，。、：；？！（）—·…“”‘’ ';
  for (const dir of ['src/content/articles', 'src/components']) {
    for await (const f of walk(path.join(ROOT, dir))) text += quoteText(await readFile(f, 'utf8'));
  }
  const chars = [...new Set(text.replace(/\s/g, ' '))].join('');
  try {
    await access(SRC_FONT);
  } catch {
    console.warn(`[subset-quote-font] 未找到源字体 ${SRC_FONT}；沿用已提交的 quote-serif.woff2（需要 ${[...chars].length} 个字符）。`);
    process.exit(0);
  }
  const { default: subsetFont } = await import('subset-font');
  const buf = await subsetFont(await readFile(SRC_FONT), chars, { targetFormat: 'woff2', variationAxes: { wght: 500 }, layoutFeatures: ['*'] });
  await writeFile(OUT, buf);
  await writeFile(path.join(ROOT, 'scripts/quote-chars.txt'), [...chars].sort().join('') + '\n');
  console.log(`quote-serif.woff2: ${[...chars].length} 个字符, ${(buf.length / 1024).toFixed(1)} KB`);
} catch (err) {
  console.warn(`[subset-quote-font] 跳过：${err.message}。沿用已提交的 quote-serif.woff2。`);
}
