import { supabaseAdmin } from '@/lib/supabase/admin';
export const dynamic = 'force-dynamic';
export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params; const c = code.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 30);
  const { data } = await supabaseAdmin().from('certificates').select('title,issued_on,revoked,students(full_name)').eq('code', c).maybeSingle();
  return (<main className="max-w-xl mx-auto px-4 py-12 text-center"><h1 className="text-2xl font-bold mb-4">Certificate verification</h1>
    {data && !data.revoked ? <div className="card p-6"><p className="text-green-700 font-bold">✔ Valid certificate</p><p className="mt-2">{(data.students as any)?.full_name}</p><p>{data.title}</p><p className="text-sm opacity-70">Issued {data.issued_on} · Code {c}</p></div>
      : <p className="card p-6 text-red-700">{data?.revoked ? 'This certificate has been revoked.' : 'No certificate found for this code.'}</p>}</main>);
}
