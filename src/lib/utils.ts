/** 合并 className（极简 clsx） */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

/** 本地时区的「今天」，格式 YYYY-MM-DD。
 *  不要用 toISOString()——那是 UTC，东八区每天 0-8 点会算成昨天。 */
export function todayLocal(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
