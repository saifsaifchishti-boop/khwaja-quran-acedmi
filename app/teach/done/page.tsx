export default async function Page({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  const { ref } = await searchParams;
  return (<main className="max-w-xl mx-auto px-4 py-12 text-center"><h1 className="text-2xl font-bold">Application received / درخواست موصول ہو گئی</h1>
    <p className="mt-4">Reference: <b className="font-mono">{String(ref ?? '').replace(/[^A-Z0-9-]/gi, '')}</b></p><p className="mt-2 opacity-80">The academy will review your application and contact you by email.</p></main>);
}
