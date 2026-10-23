// 所有截图点击 / 键盘放大。原图只在打开时加载（img 的 data-full）。
const SELECTOR = '.shot img';

const lb = document.getElementById('lb') as HTMLElement;
const im = document.getElementById('lb-img') as HTMLImageElement;
const sc = document.getElementById('lb-scroll') as HTMLElement;
const t = document.getElementById('lb-t') as HTMLElement;
const n = document.getElementById('lb-n') as HTMLElement;
const prev = document.getElementById('lb-prev') as HTMLButtonElement;
const next = document.getElementById('lb-next') as HTMLButtonElement;
const close = document.getElementById('lb-close') as HTMLButtonElement;

let group: HTMLImageElement[] = [];
let idx = 0;
let opener: HTMLElement | null = null;

document.querySelectorAll<HTMLImageElement>(SELECTOR).forEach((el) => {
  el.tabIndex = 0;
  el.setAttribute('role', 'button');
  el.setAttribute('aria-label', `查看原图：${el.alt || '截图'}`);
});

function title(el: HTMLImageElement): string {
  const f = el.closest('figure');
  const w = f?.querySelector('.what');
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
  if (im.complete && im.naturalWidth) im.onload?.(new Event("load"));
}

function open(el: HTMLImageElement) {
  opener = el;
  const f = el.closest('figure') ?? document.body;
  group = Array.from(f.querySelectorAll<HTMLImageElement>(SELECTOR));
  lb.hidden = false;
  document.documentElement.style.overflow = 'hidden';
  show(Math.max(0, group.indexOf(el)));
  close.focus();
}

function shut() {
  lb.hidden = true;
  im.removeAttribute('src');
  document.documentElement.style.overflow = '';
  opener?.focus();
}

document.addEventListener('click', (e) => {
  const el = (e.target as Element).closest?.(SELECTOR) as HTMLImageElement | null;
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
      const btns = [prev, next, close].filter((b) => !b.hidden && !b.disabled);
      const i = btns.indexOf(document.activeElement as HTMLButtonElement);
      e.preventDefault();
      btns[(i + (e.shiftKey ? -1 : 1) + btns.length) % btns.length].focus();
    }
    return;
  }
  const el = document.activeElement as HTMLElement | null;
  if (el?.matches?.(SELECTOR) && (e.key === 'Enter' || e.key === ' ')) {
    e.preventDefault();
    open(el as HTMLImageElement);
  }
});

prev.addEventListener('click', () => idx > 0 && show(idx - 1));
next.addEventListener('click', () => idx < group.length - 1 && show(idx + 1));
close.addEventListener('click', shut);
lb.addEventListener('click', (e) => {
  if (e.target === sc) shut();
});
export {};
