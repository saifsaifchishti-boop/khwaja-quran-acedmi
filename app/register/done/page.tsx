import Link from 'next/link';
import { getLang, t } from '@/lib/i18n';
import CopyButton from '@/components/CopyButton';
export default async function Done({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  const d = t(await getLang()); const { ref } = await searchParams;
  return (<main className="max-w-xl mx-auto px-4 py-16 text-center"><div className="card p-8">
    <h1 className="text-2xl font-bold text-emerald dark:text-gold">{d.doneTitle}</h1>
    <p className="mt-4">{d.doneText}</p><p className="text-3xl font-mono font-bold my-3" dir="ltr">{ref}</p>
    {ref && <CopyButton value={ref} />}<p className="mt-4 text-sm opacity-80">{d.doneKeep}</p>
    <Link href="/" className="btn mt-6">{d.home}</Link></div></main>);
}
