// 把原图导入 src/content/photos/：先按 EXIF 方向转正，长边缩到 3000px，再去掉全部 EXIF（含 GPS），输出 jpg。
// 原图不进仓库。用法：node scripts/import-photos.mjs <原图文件夹>
// 同时读出拍摄日期（只取 DateTimeOriginal 的年月日，不碰位置），写成 src/content/photos/photos.yaml 里 date 的预填值；已有的 photos.yaml 不会被覆盖。
import { readdir, writeFile, mkdir, access } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const src = process.argv[2];
if (!src) throw new Error('用法：node scripts/import-photos.mjs <原图文件夹>');
const dest = path.resolve(import.meta.dirname, '../src/content/photos');
await mkdir(dest, { recursive: true });

/** 从 EXIF 里取 DateTimeOriginal（0x9003），返回 YYYY-MM-DD 或空串。只读日期，不读别的标签。 */
function shotDate(exif) {
  if (!exif) return '';
  const b = exif.subarray(0, 6).toString('latin1') === 'Exif\0\0' ? exif.subarray(6) : exif;
  const le = b.toString('latin1', 0, 2) === 'II';
  const u16 = (o) => (le ? b.readUInt16LE(o) : b.readUInt16BE(o));
  const u32 = (o) => (le ? b.readUInt32LE(o) : b.readUInt32BE(o));
  const find = (ifd, tag) => {
    const n = u16(ifd);
    for (let i = 0; i < n; i++) {
      const e = ifd + 2 + i * 12;
      if (u16(e) === tag) return e;
    }
    return -1;
  };
  try {
    const exifPtr = find(u32(4), 0x8769);
    if (exifPtr < 0) return '';
    const dt = find(u32(exifPtr + 8), 0x9003);
    if (dt < 0) return '';
    const s = b.toString('latin1', u32(dt + 8), u32(dt + 8) + 10); // "YYYY:MM:DD"
    return /^\d{4}:\d{2}:\d{2}$/.test(s) ? s.replaceAll(':', '-') : '';
  } catch {
    return '';
  }
}

const files = (await readdir(src)).filter((f) => /\.jpe?g$/i.test(f)).sort();
const rows = [];
for (const f of files) {
  const input = path.join(src, f);
  const meta = await sharp(input).metadata();
  const out = f.replace(/\.jpe?g$/i, '.jpg');
  const info = await sharp(input)
    .rotate() // 按 EXIF 方向转正；不调用 withMetadata，所以输出不带任何 EXIF
    .resize({ width: 3000, height: 3000, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 88, mozjpeg: true })
    .toFile(path.join(dest, out));
  rows.push({ file: out, date: shotDate(meta.exif) });
  console.log(`${out}  ${info.width}x${info.height}  ${(info.size / 1e6).toFixed(2)} MB  ${rows.at(-1).date}`);
}

const yaml = path.join(dest, 'photos.yaml');
try {
  await access(yaml);
  console.log('photos.yaml 已存在，没有覆盖。');
} catch {
  const body =
    '# 每张照片或短片一条。页面上显示地点和年月（date 的年和月），日只用于排序。\n' +
    '# place 和 date 必填：本地预览允许空着（只给警告），GitHub 上的正式构建遇到空的会报错。\n' +
    '# date 已按拍摄时间预填（只取日期），和你想显示的月份不一致就直接改。\n' +
    '# 可选：title（图下方一句话）、tags（搜索用的主题词，如 下雨、夜晚、海边）、order（数字小的靠前）。\n' +
    rows.map((r) => `- file: ${r.file}\n  place: ""\n  date: ${r.date ? r.date : '""'}\n  tags: []\n`).join('');
  await writeFile(yaml, body);
  console.log('已生成 photos.yaml');
}
