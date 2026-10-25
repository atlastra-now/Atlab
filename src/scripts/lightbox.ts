// 截图点击 / 键盘放大。实现照 docs/reference/lab.html 的 Lightbox 脚本；只在页面里有 Figure 时才会被加载。
// 放大用的原图写在 img 的 data-full 上，只在打开时才请求。
const SEL = '.shot img[data-full]';

const lb = document.createElement('div');
lb.className = 'lbx';
lb.hidden = true;
lb.setAttribute('role', 'dialog');
lb.setAttribute('aria-modal', 'true');
lb.setAttribute('aria-label', '查看原图');
lb.innerHTML =
  '<div class="lbx-bar"><span class="lbx-t"></span><span class="lbx-n"></span>' +
  '<button type="button" class="lbx-prev" aria-label="上一张">上一张</button>' +
  '<button type="button" class="lbx-next" aria-label="下一张">下一张</button>' +
  '<button type="button" class="lbx-close">关闭</button></div>' +
  '<div class="lbx-scroll"><img class="lbx-img" alt=""><p class="lbx-hint">原图 · 上下滚动查看完整截图 · Esc 关闭</p></div>';
document.body.appendChild(lb);

const q = <T extends HTMLElement>(s: string) => lb.querySelector(s) as T;
const im = q<HTMLImageElement>('.lbx-img');
const sc = q<HTMLElement>('.lbx-scroll');
const t = q<HTMLElement>('.lbx-t');
const n = q<HTMLElement>('.lbx-n');
const prev = q<HTMLButtonElement>('.lbx-prev');
const next = q<HTMLButtonElement>('.lbx-next');
const closeBtn = q<HTMLButtonElement>('.lbx-close');

let group: HTMLImageElement[] = [];
let idx = 0;
let opener: HTMLElement | null = null;

document.querySelectorAll<HTMLImageElement>(SEL).forEach((el) => {
  el.tabIndex = 0;
  el.setAttribute('role', 'button');
  el.setAttribute('aria-label', `查看原图：${el.alt || '截图'}`);
});

function title(el: HTMLImageElement): string {
  const w = el.closest('figure')?.querySelector('.cap .w');
  return w?.textContent?.trim() ?? el.alt ?? '';
}

function show(i: number) {
  idx = i;
  const el = group[i];
  t.textContent = title(el);
  n.textContent = group.length > 1 ? `${i + 1} / ${group.length}` : '';
  prev.disabled = i === 0;
  next.disabled = i === group.length - 1;
  prev.hidden = next.hidden = group.length < 2;
  const f = parseFloat(el.dataset.focus ?? '0') || 0;
  im.alt = el.alt || '';
  sc.scrollTop = 0;
  im.onload = () => {
    sc.scrollTop = Math.max(0, f * im.offsetHeight - 120);
  };
  im.src = el.dataset.full || el.currentSrc || el.src;
  if (im.complete && im.naturalWidth) im.onload(new Event('load'));
}

function open(el: HTMLImageElement) {
  opener = el;
  const f = el.closest('figure') ?? document.body;
  group = Array.from(f.querySelectorAll<HTMLImageElement>(SEL));
  lb.hidden = false;
  document.documentElement.style.overflow = 'hidden';
  show(Math.max(0, group.indexOf(el)));
  closeBtn.focus();
}

function shut() {
  lb.hidden = true;
  im.removeAttribute('src');
  document.documentElement.style.overflow = '';
  opener?.focus();
}

document.addEventListener('click', (e) => {
  const el = (e.target as Element).closest?.(SEL) as HTMLImageElement | null;
  if (el) {
    e.preventDefault();
    open(el);
  }
});

document.addEventListener('keydown', (e) => {
  if (!lb.hidden) {
    if (e.key === 'Escape') shut();
    else if (e.key === 'ArrowLeft' && idx > 0) show(idx - 1);
    else if (e.key === 'ArrowRight' && idx < group.length - 1) show(idx + 1);
    else if (e.key === 'Tab') {
      // 焦点留在对话框内
      const btns = [prev, next, closeBtn].filter((b) => !b.hidden && !b.disabled);
      const i = btns.indexOf(document.activeElement as HTMLButtonElement);
      e.preventDefault();
      btns[(i + (e.shiftKey ? -1 : 1) + btns.length) % btns.length].focus();
    }
    return;
  }
  const el = document.activeElement as HTMLElement | null;
  if (el?.matches?.(SEL) && (e.key === 'Enter' || e.key === ' ')) {
    e.preventDefault();
    open(el as HTMLImageElement);
  }
});

prev.addEventListener('click', () => idx > 0 && show(idx - 1));
next.addEventListener('click', () => idx < group.length - 1 && show(idx + 1));
closeBtn.addEventListener('click', shut);
lb.addEventListener('click', (e) => {
  if (e.target === sc) shut();
});

export {};
