const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** 证据前缀（观察｜比较范围｜判断｜待验证｜补充观察｜示意｜）加粗，与参考页 `.cap .n b` 一致。输入为作者撰写的纯文本。 */
export function evidence(text: string): string {
  return escape(text).replace(/(补充观察|观察|比较范围|判断|待验证|示意)｜/g, '<b>$1｜</b>');
}
