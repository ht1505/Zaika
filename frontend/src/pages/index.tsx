import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.replace(user.role === 'admin' ? '/admin/dashboard' : '/customer/dashboard');
    } else {
      router.replace('/login');
    }
  }, [user, router]);

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl font-display font-bold text-saffron mb-2">Zaika</div>
        <div className="text-gray-400 font-body text-sm">Loading...</div>
      </div>
    </div>
  );
}
