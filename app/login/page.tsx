import Link from 'next/link';
import { getLang, t } from '@/lib/i18n';
import LoginForm from '@/components/LoginForm';
import { studentLogin } from './actions';
export default async function Page() {
  const d = t(await getLang());
  return <LoginForm action={studentLogin} title={d.studentLogin} idName="id" idLabel={d.idOrEmail} idType="text" pwLabel={d.password} btn={d.login}
    extra={<p className="text-center text-sm"><Link href="/forgot-password" className="underline">{d.forgot}</Link></p>} />;
}
