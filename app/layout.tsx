import './globals.css';
import type { Metadata } from 'next';
import { Inter, Noto_Nastaliq_Urdu, Amiri } from 'next/font/google';
import { getLang } from '@/lib/i18n';
import Marquee from '@/components/Marquee';
import Header from '@/components/Header';
import GlobalLoader from '@/components/GlobalLoader';
import Footer from '@/components/Footer';
import PublicChrome from '@/components/PublicChrome';
import Runtime from '@/components/teams/Runtime';
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const urdu = Noto_Nastaliq_Urdu({ subsets: ['arabic'], variable: '--font-urdu' });
const arabic = Amiri({ subsets: ['arabic'], weight: ['400', '700'], variable: '--font-arabic' });
export const metadata: Metadata = { title: 'Khwaja Quran Majeed Academy', description: 'Online Quran teaching academy', icons: { icon: '/icon.svg' } };
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const l = await getLang();
  return (
    <html lang={l} dir={l === 'ur' ? 'rtl' : 'ltr'} suppressHydrationWarning className={`${inter.variable} ${urdu.variable} ${arabic.variable}`}>
      <head><script dangerouslySetInnerHTML={{ __html: "try{var m=localStorage.getItem('theme');if(m==='dark'||(!m&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}" }} /></head>
      <body className="font-sans min-h-screen"><GlobalLoader />
        <Runtime><PublicChrome top={<><Marquee /><Header /></>} bottom={<Footer />}>{children}</PublicChrome></Runtime></body>
    </html>);
}
