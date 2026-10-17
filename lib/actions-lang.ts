'use server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
export async function toggleLang() {
  const c = await cookies();
  c.set('lang', c.get('lang')?.value === 'en' ? 'ur' : 'en', { path: '/', maxAge: 31536000, sameSite: 'lax' });
  revalidatePath('/', 'layout');
}
