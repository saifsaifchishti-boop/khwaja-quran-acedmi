const MAP: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s: string) => s.replace(/[&<>"']/g, (c: string) => MAP[c] ?? c);
export const render = (tpl: string, vars: Record<string, string | number | null | undefined>, escape = false) =>
  tpl.replace(/\{\{(\w+)\}\}/g, (_m: string, k: string) => { const v = String(vars[k] ?? ''); return escape ? esc(v) : v; });
