import Link from 'next/link';
import LoginForm from '@/components/LoginForm';
import { teacherLogin } from '@/app/login/actions';
export default function Page() {
  return <LoginForm action={teacherLogin} title="Teacher Login / استاد لاگ اِن" idName="id" idLabel="Teacher ID or email" idType="text" pwLabel="Password" btn="Login"
    extra={<p className="text-center text-sm"><Link href="/forgot-password" className="underline">Forgot password?</Link></p>} />;
}
