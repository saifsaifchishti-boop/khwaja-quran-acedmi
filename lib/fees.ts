export type Fee = { id: string; amount: number; discount: number };
export type Pay = { fee_id: string; amount: number; status: string };
export const money = (n: number, cur = 'PKR') => `${cur} ${Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
export function feeSummary(f: Fee, pays: Pay[]) {
  const total = Number(f.amount) - Number(f.discount);
  const paid = pays.filter(p => p.fee_id === f.id && p.status === 'approved').reduce((s, p) => s + Number(p.amount), 0);
  const pending = pays.filter(p => p.fee_id === f.id && p.status === 'pending').reduce((s, p) => s + Number(p.amount), 0);
  return { total, paid, pending, balance: Math.max(total - paid, 0) };
}
