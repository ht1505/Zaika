import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';
import LoginScreen from '../components/shared/LoginScreen';
import Head from 'next/head';

export default function LoginPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.replace(user.role === 'admin' ? '/admin/dashboard' : '/customer/dashboard');
    }
  }, [user, router]);

  return (
    <>
      <Head>
        <title>Zaika — Sign In</title>
      </Head>
      <LoginScreen />
    </>
  );
}
