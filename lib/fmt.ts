// Show a UTC instant in a given IANA time zone (students see their own zone).
export const fmtDT = (iso: string, tz = 'UTC') => { try { return new Intl.DateTimeFormat('en-GB', { timeZone: tz, dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso)); } catch { return new Date(iso).toUTCString(); } };
export const fmtT = (iso: string, tz = 'UTC') => { try { return new Intl.DateTimeFormat('en-GB', { timeZone: tz, timeStyle: 'short' }).format(new Date(iso)); } catch { return iso; } };
export const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const s = (fd: FormData, k: string) => { const v = String(fd.get(k) ?? '').trim(); return v === '' ? null : v; };
export const num = (fd: FormData, k: string, def = 0) => { const n = Number(fd.get(k)); return Number.isFinite(n) && n >= 0 ? n : def; };
export const csvCell = (v: unknown) => { const t = v == null ? '' : String(v); const safe = /^[=+\-@]/.test(t) ? `'${t}` : t; return `"${safe.replace(/"/g, '""')}"`; };
