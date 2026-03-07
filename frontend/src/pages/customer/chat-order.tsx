import Head from 'next/head';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { MessageSquare, ShoppingBag } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Header from '../../components/shared/Header';
import CartDrawer from '../../components/customer/CartDrawer';
import ChatUI from '../../components/customer/ChatUI';
import { useCart } from '../../hooks/useCart';
import Link from 'next/link';

export default function ChatOrderPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { count } = useCart();

  useEffect(() => {
    if (!user) router.replace('/login');
    if (user?.role === 'admin') router.replace('/admin/dashboard');
  }, [user]);

  if (!user) return null;

  return (
    <>
      <Head><title>Zaika — Chat Order</title></Head>
      <div className="min-h-screen bg-cream flex flex-col">
        <Header />
        <CartDrawer />

        <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
          {/* Page title */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="font-display text-2xl font-bold text-charcoal flex items-center gap-2">
                <MessageSquare className="text-saffron" size={24} />
                Chat to Order
              </h1>
              <p className="font-body text-sm text-gray-500 mt-1">
                Tell our AI what you want — in Hinglish, Hindi, or English
              </p>
            </div>
            <Link href="/customer/dashboard" className="btn-secondary text-sm px-4 py-2 flex items-center gap-2">
              Browse Menu
            </Link>
          </div>

          {/* Chat UI */}
          <div style={{ height: 'calc(100vh - 240px)', minHeight: '500px' }}>
            <ChatUI />
          </div>

          {/* Cart CTA */}
          {count() > 0 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30">
              <button
                onClick={() => useCart.getState().toggleCart()}
                className="btn-primary flex items-center gap-2 shadow-warm px-6 py-3"
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
