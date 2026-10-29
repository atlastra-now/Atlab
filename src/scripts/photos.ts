// 照片页：Order / Entropy 切换（FLIP）、搜索、短片播放、放大。逻辑取自 docs/photo/reference/photo.html，数据改读页面上的 data-*。
// 放大的外壳用站里的 .lbx（src/styles/lightbox.css），黑底。
const g = document.getElementById('g') as HTMLElement;
const q = document.getElementById('q') as HTMLInputElement;
const f = document.getElementById('f') as HTMLFormElement;
const count = document.getElementById('count') as HTMLElement;
const chips = document.getElementById('chips') as HTMLElement;
const bS = document.getElementById('bSheet') as HTMLButtonElement;
const bO = document.getElementById('bOpen') as HTMLButtonElement;
const items = Array.from(g.children) as HTMLAnchorElement[];
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const EX = Array.from(chips.children).map((b) => b.textContent ?? '');
const ALIAS: Record<string, string[]> = {
  安静: ['安静', '静', '独处', '空'], 夜晚: ['夜', '晚', '黑', '灯'], 下雨: ['雨', '湿', '伞'], 城市: ['城', '街', '楼', '路'],
  海边: ['海', '水', '岸', '浪', '船'], 早晨: ['晨', '早', '日出'], 人: ['人', '背影', '朋友'], 光: ['光', '影', '阳', '亮'],
};
const CN: Record<string, number> = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10, 十一: 11, 十二: 12 };
const SEASON: Record<string, number[]> = { 春天: [3, 4, 5], 夏天: [6, 7, 8], 秋天: [9, 10, 11], 冬天: [12, 1, 2] };
const NOW = [new Date().getFullYear(), new Date().getMonth() + 1];
let auto = true;

const d = (el: HTMLElement) => el.dataset;

/* 短片只在看得见时播放；系统开了「减少动态效果」时只显示 poster */
const videos = items.map((el) => el.querySelector('video')).filter(Boolean) as HTMLVideoElement[];
if ('IntersectionObserver' in window && !reduce) {
  const io = new IntersectionObserver(
    (es) => es.forEach((e) => { const v = e.target as HTMLVideoElement; if (e.isIntersecting) v.play().catch(() => {}); else v.pause(); }),
    { threshold: 0.2 },
  );
  videos.forEach((v) => io.observe(v));
}

/* 大图：Order 里每张只有几十像素宽，先加载小图（首屏更快）；页面空闲时把 Entropy 要用的大图悄悄预载进缓存，
   预载好了再换 sizes，换的时候是瞬间的，不会在切换动画里出现空白。 */
const LARGE_SIZES = '(min-width: 760px) 600px, 100vw';
const imgs = items.map((el) => el.querySelector('img')).filter(Boolean) as HTMLImageElement[];
let largeReady = false;
function useLarge() {
  if (largeReady) return;
  largeReady = true;
  imgs.forEach((im) => im.setAttribute('sizes', LARGE_SIZES));
}
function preloadLarge() {
  const pre = imgs.map(
    (im) =>
      new Promise<void>((done) => {
        const t = new Image();
        t.sizes = LARGE_SIZES;
        t.srcset = im.srcset;
        t.onload = t.onerror = () => done();
        t.src = im.src;
      }),
  );
  Promise.all(pre).then(useLarge);
}
const idle = (window as unknown as { requestIdleCallback?: (f: () => void) => void }).requestIdleCallback ?? ((f: () => void) => setTimeout(f, 1500));
window.addEventListener('load', () => idle(preloadLarge));

/* Order ⇄ Entropy：FLIP，每张延迟 28ms，总时长 0.7s。
   .p 只做位移 + 等比缩放 + clip-path 裁剪，图片不被拉伸：
   Order 里看到的是照片中间的方形裁切，Entropy 里是完整照片，裁切区域随动画平滑展开或收起。 */
type Box = { left: number; top: number; width: number; height: number };
const rects = (): Box[] => items.map((el) => (el.querySelector('.p') as HTMLElement).getBoundingClientRect());
function setMode(m: 'sheet' | 'open') {
  const isOpen = m === 'open';
  if (isOpen === g.classList.contains('open')) return;
  const first = rects();
  g.classList.toggle('open', isOpen);
  g.classList.toggle('sheet', !isOpen);
  bS.setAttribute('aria-pressed', String(!isOpen));
  bO.setAttribute('aria-pressed', String(isOpen));
  // Order 里每张只有几十像素宽，先加载小图；切到 Entropy 再换成大图（sizes 随排布变化）
  if (isOpen) useLarge();
  if (reduce) return;
  const last = rects();
  items.forEach((el, i) => {
    const p = el.querySelector('.p') as HTMLElement;
    const a = first[i], l = last[i];
    if (!l.width || !l.height) return;
    const r = Number(d(el).rn) || l.width / l.height;
    // 起点时「看得见的区域」在 .p 自己坐标里的大小：去 Entropy 时是中间的方块，回 Order 时是整张照片（比 .p 大，居中）
    let vw: number, vh: number;
    if (isOpen) { vw = vh = Math.min(l.width, l.height); }
    else { vw = Math.max(l.width, l.height * r); vh = vw / r; }
    const s = a.width / vw;
    const tx = a.left + a.width / 2 - l.left - (l.width * s) / 2;
    const ty = a.top + a.height / 2 - l.top - (l.height * s) / 2;
    const ix = (l.width - vw) / 2, iy = (l.height - vh) / 2;
    p.style.overflow = 'visible';
    const anim = p.animate(
      [
        { transform: `translate(${tx}px,${ty}px) scale(${s})`, clipPath: `inset(${iy}px ${ix}px)` },
        { transform: 'none', clipPath: 'inset(0px)' },
      ],
      { duration: 700, delay: i * 28, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'backwards' },
    );
    anim.onfinish = anim.oncancel = () => { p.style.overflow = ''; };
  });
}
bS.onclick = () => { auto = false; setMode('sheet'); };
bO.onclick = () => { auto = false; setMode('open'); };

/* 第一次向下滚动、点击任意方块、或搜索时，自动切到 Entropy */
function nudge(e: Event) {
  if (!auto || !g.classList.contains('sheet')) return;
  if (e.type === 'wheel' && (e as WheelEvent).deltaY <= 0) return;
  auto = false;
  setMode('open');
}
window.addEventListener('wheel', nudge, { passive: true });
window.addEventListener('touchmove', nudge, { passive: true });
window.addEventListener('keydown', (e) => {
  if (['ArrowDown', 'PageDown', ' '].includes(e.key) && document.activeElement !== q && lb.hidden) nudge(e);
});

/* 搜索：地点、标题、tags（同义词表）、日期。纯前端，不匹配的变淡，不删除、不重排 */
function parse(s: string) {
  let y: number | null = null, m: number | null = null;
  if (s.includes('去年')) { y = NOW[0] - 1; s = s.replace('去年', ''); }
  if (s.includes('今年')) { y = NOW[0]; s = s.replace('今年', ''); }
  const my = s.match(/(20\d\d)/);
  if (my) { y = +my[1]; s = s.replace(my[1], '').replace('年', ''); }
  const mm = s.match(/(十二|十一|十|[一二三四五六七八九]|\d{1,2})月/);
  if (mm) { m = CN[mm[1]] || +mm[1]; s = s.replace(mm[0], ''); }
  let season = '';
  for (const k of Object.keys(SEASON)) if (s.includes(k)) { season = k; s = s.replace(k, ''); }
  return { y, m, season, w: s.replace(/[的，,\s]/g, '') };
}
function textMatch(el: HTMLElement, w: string) {
  if (!w) return true;
  const place = (d(el).place ?? '').toLowerCase(), zh = d(el).placeZh ?? '', title = d(el).title ?? '';
  w = w.toLowerCase();
  const tags = (d(el).tags ?? '').split('|').filter(Boolean);
  if ((place && (w.includes(place) || (w.length > 1 && place.includes(w)))) || (zh && w.includes(zh))) return true;
  if (title && (title.includes(w) || w.includes(title))) return true;
  return tags.some((t) => (ALIAS[t] ?? [t]).some((a) => w.includes(a)) || w.includes(t.toLowerCase()) || (w.length > 1 && t.toLowerCase().includes(w)));
}
function match(el: HTMLElement, s: string) {
  const k = parse(s);
  if (k.y && Number(d(el).y) !== k.y) return false;
  if (k.m && Number(d(el).m) !== k.m) return false;
  // 「夏天」这类：拍摄月份在这个季节里，或标签/标题里写着它
  if (k.season && !SEASON[k.season].includes(Number(d(el).m)) && !textMatch(el, k.season)) return false;
  return textMatch(el, k.w);
}
function run(s: string) {
  s = (s || '').trim();
  let n = 0;
  items.forEach((el) => { const ok = !s || match(el, s); el.classList.toggle('dim', !ok); if (ok) n++; });
  count.textContent = s ? `${n} 张符合` : `${items.length} 张`;
  Array.from(chips.children).forEach((b) => b.setAttribute('aria-pressed', String(b.textContent === s)));
  if (s && g.classList.contains('sheet')) { auto = false; setMode('open'); }
}
Array.from(chips.children).forEach((b) => {
  (b as HTMLButtonElement).onclick = () => { q.value = b.textContent ?? ''; f.classList.add('has'); run(q.value); };
});
f.addEventListener('submit', (e) => { e.preventDefault(); run(q.value); });
let tm: number;
q.addEventListener('input', () => { clearTimeout(tm); f.classList.toggle('has', !!q.value.trim()); tm = window.setTimeout(() => run(q.value), 260); });

/* 输入框里自动打字的提示；有焦点或有内容时停止；减少动态效果时不动 */
if (!reduce && EX.length) {
  let i = 0, j = 0, del = false;
  const tick = () => {
    if (document.activeElement === q || q.value) { setTimeout(tick, 800); return; }
    const w = EX[i];
    q.placeholder = w.slice(0, j) || ' ';
    if (!del) { j++; if (j > w.length) { del = true; setTimeout(tick, 1600); return; } }
    else { j--; if (j < 0) { del = false; j = 0; i = (i + 1) % EX.length; } }
    setTimeout(tick, del ? 40 : 110);
  };
  tick();
}

/* 放大：黑底外壳；照片和短片一样，短片静音循环、没有控制条；只在没被筛掉的素材里切换 */
const lb = document.createElement('div');
lb.className = 'lbx lbx-photo';
lb.hidden = true;
lb.setAttribute('role', 'dialog');
lb.setAttribute('aria-modal', 'true');
lb.setAttribute('aria-label', '放大查看');
lb.innerHTML =
  '<button type="button" class="lbx-close" aria-label="关闭"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>' +
  '<button type="button" class="lbx-prev" aria-label="上一张"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 5l-7 7 7 7"/></svg></button>' +
  '<button type="button" class="lbx-next" aria-label="下一张"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.5 5l7 7-7 7"/></svg></button>' +
  '<div class="lbx-stage"></div><p class="lbx-cap"><span class="lbx-c"></span><span class="lbx-n"></span></p>';
document.body.appendChild(lb);
const lq = <T extends HTMLElement>(s: string) => lb.querySelector(s) as T;
const stage = lq('.lbx-stage'), capText = lq('.lbx-c'), num = lq('.lbx-n');
const prev = lq<HTMLButtonElement>('.lbx-prev'), next = lq<HTMLButtonElement>('.lbx-next'), closeBtn = lq<HTMLButtonElement>('.lbx-close');
let cur = -1;
let opener: HTMLElement | null = null;

const visible = () => items.map((_, i) => i).filter((i) => !items[i].classList.contains('dim'));
function show(i: number) {
  cur = i;
  const el = items[i];
  const x = d(el);
  stage.replaceChildren();
  if (x.w === 'v') {
    const v = document.createElement('video');
    v.muted = true; v.loop = true; v.playsInline = true; v.autoplay = !reduce;
    v.setAttribute('aria-label', [x.title, x.place].filter(Boolean).join('，'));
    if (x.webm) { const s = document.createElement('source'); s.src = x.webm; s.type = 'video/webm'; v.appendChild(s); }
    if (x.mp4) { const s = document.createElement('source'); s.src = x.mp4; s.type = 'video/mp4'; v.appendChild(s); }
    v.poster = el.querySelector('video')?.poster ?? '';
    stage.appendChild(v);
    if (!reduce) v.play().catch(() => {});
  } else {
    const im = document.createElement('img');
    im.alt = el.querySelector('img')?.alt ?? '';
    im.src = x.full ?? ''; // 放大时才请求大图
    stage.appendChild(im);
  }
  capText.textContent = ([x.title, x.place].filter(Boolean) as string[]).join('　');
  const v = visible();
  const k = v.indexOf(i);
  num.textContent = v.length > 1 && k >= 0 ? `${k + 1} / ${v.length}` : '';
  prev.hidden = next.hidden = v.length < 2;
}
function open(i: number) {
  opener = document.activeElement as HTMLElement | null;
  show(i);
  lb.hidden = false;
  document.documentElement.style.overflow = 'hidden';
  closeBtn.focus();
}
function shut() {
  lb.hidden = true;
  stage.replaceChildren();
  document.documentElement.style.overflow = '';
  (opener ?? items[cur])?.focus();
}
function step(dir: number) {
  const v = visible();
  if (!v.length) return;
  const k = v.indexOf(cur);
  show(v[((k < 0 ? (dir > 0 ? -1 : 0) : k) + dir + v.length) % v.length]);
}

items.forEach((el, i) => {
  el.addEventListener('click', (e) => {
    e.preventDefault();
    if (g.classList.contains('sheet')) { auto = false; setMode('open'); } else open(i);
  });
});
prev.addEventListener('click', () => step(-1));
next.addEventListener('click', () => step(1));
closeBtn.addEventListener('click', shut);
lb.addEventListener('click', (e) => { if (e.target === lb || e.target === stage) shut(); });
window.addEventListener('keydown', (e) => {
  if (lb.hidden) return;
  if (e.key === 'Escape') shut();
  else if (e.key === 'ArrowLeft') step(-1);
  else if (e.key === 'ArrowRight') step(1);
  else if (e.key === 'Tab') {
    const btns = [prev, next, closeBtn].filter((b) => !b.hidden && !b.disabled);
    const k = btns.indexOf(document.activeElement as HTMLButtonElement);
    e.preventDefault();
    btns[(k + (e.shiftKey ? -1 : 1) + btns.length) % btns.length].focus();
  }
});

export {};
