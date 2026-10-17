import { getLang, t } from '@/lib/i18n';
import LoginForm from '@/components/LoginForm';
import { adminLogin } from '@/app/login/actions';
export default async function Page() {
  const d = t(await getLang());
  return <LoginForm action={adminLogin} title={d.adminLogin} idName="email" idLabel={d.email} idType="email" pwLabel={d.password} btn={d.login} />;
}
