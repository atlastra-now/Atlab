// 生成 public/fonts/quote-serif.woff2：只含原话（--quote）实际用到的字。
// 源字体放在 scripts/fonts-src/（不提交）。失败不阻塞构建，页面回退到系统宋体。
import { readdir, readFile, writeFile, access } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const SRC_DIR = path.join(ROOT, 'src/content/articles');
const FONT_DIR = path.join(import.meta.dirname, 'fonts-src');
const OUT = path.join(ROOT, 'public/fonts/quote-serif.woff2');

async function collectText() {
  let text = '';
  for (const dir of await readdir(SRC_DIR)) {
    const file = path.join(SRC_DIR, dir, 'index.mdx');
    let src;
    try { src = await readFile(file, 'utf8'); } catch { continue; }
    // frontmatter 的 heroPrompt、Log 的 text（含 who: 的行）、正文里的「…」引用
    for (const m of src.matchAll(/^heroPrompt:\s*(.+)$/gm)) text += m[1];
    for (const m of src.matchAll(/who:\s*'(?:user|ai)'.*?text:\s*'([^']*)'/g)) text += m[1];
    for (const m of src.matchAll(/「[^」]*」/g)) text += m[0];
  }
  // 基础标点与数字，保证回退不出现缺字
  text += '0123456789「」『』，。、：；？！（）—·…“”‘’ ';
  return [...new Set(text)].join('');
}

async function findSource() {
  for (const name of ['NotoSerifSC[wght].ttf', 'NotoSerifSC-Medium.otf', 'NotoSerifSC-Medium.ttf', 'NotoSerifSC-Regular.otf']) {
    const p = path.join(FONT_DIR, name);
    try { await access(p); return p; } catch {}
  }
  return null;
}

try {
  const { default: subsetFont } = await import('subset-font');
  const source = await findSource();
  if (!source) throw new Error(`未找到源字体，请把 Noto Serif SC 放进 ${FONT_DIR}`);
  const text = await collectText();
  const buf = await subsetFont(await readFile(source), text, {
    targetFormat: 'woff2',
    ...(source.endsWith('.ttf') && source.includes('wght') ? { variationAxes: { wght: 500 } } : {}),
  });
  await writeFile(OUT, buf);
  console.log(`quote-serif.woff2: ${[...text].length} 个字符, ${(buf.length / 1024).toFixed(1)} KB`);
} catch (err) {
  console.warn(`[subset-quote-font] 跳过：${err.message}\n回退到系统宋体。`);
}
