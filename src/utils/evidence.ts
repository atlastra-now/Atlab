const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** 证据前缀（观察｜判断｜…）加粗为 --ink-2；输入为作者撰写的纯文本。 */
export function evidence(text: string): string {
  return escape(text).replace(/(补充观察|观察|判断|待验证|示意|比较范围)｜/g, '<b>$1｜</b>');
}
