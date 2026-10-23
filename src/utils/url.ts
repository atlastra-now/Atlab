/** 站内路径统一在这里拼接 base，不写死以 / 开头的路径。 */
export function url(path = ''): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}/${path.replace(/^\//, '')}`;
}
