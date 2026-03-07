import Head from 'next/head';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Mic, ShoppingBag } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Header from '../../components/shared/Header';
import CartDrawer from '../../components/customer/CartDrawer';
import VoiceUI from '../../components/customer/VoiceUI';
import { useCart } from '../../hooks/useCart';

export default function VoiceOrderPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { count, toggleCart } = useCart();

  useEffect(() => {
    if (!user) router.replace('/login');
    if (user?.role === 'admin') router.replace('/admin/dashboard');
  }, [user]);

  if (!user) return null;

  return (
    <>
      <Head><title>Zaika — Voice Order</title></Head>
      <div className="min-h-screen bg-cream">
        <Header />
        <CartDrawer />

        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="font-display text-2xl font-bold text-charcoal flex items-center justify-center gap-2">
              <Mic className="text-saffron" size={24} />
              Voice Order
            </h1>
            <p className="font-body text-sm text-gray-500 mt-1">
              Speak your order aloud — supports Hinglish, Hindi & English
            </p>
          </div>

          <VoiceUI />

          {/* Cart CTA */}
          {count() > 0 && (
            <div className="mt-8 text-center">
              <button
                onClick={toggleCart}
                className="btn-primary flex items-center gap-2 mx-auto"
              >
                <ShoppingBag size={18} />
                View Cart ({count()} items)
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
