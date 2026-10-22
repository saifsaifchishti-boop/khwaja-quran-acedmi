// Shown by Next.js while a page is being prepared: a spinning ring in the middle of the screen.
export default function Loading() {
  return (<div role="status" aria-live="polite" className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
    <div style={{ width: 60, height: 60, borderRadius: '50%', border: '6px solid var(--line)', borderTopColor: 'var(--brand)', animation: 'kqspin .9s linear infinite' }} />
    <p className="text-lg font-semibold" style={{ color: 'var(--brand)' }}>Loading…</p></div>);
}
