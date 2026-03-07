import { useState } from 'react';
import { useRouter } from 'next/router';
import { Eye, EyeOff, ChefHat } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

export default function LoginScreen() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const { login, register, loading } = useAuth();
  const router = useRouter();

  const handleSubmit = async () => {
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        await register({ name: form.name, email: form.email, password: form.password, phone: form.phone });
      }
      const user = JSON.parse(localStorage.getItem('zaika_user') || '{}');
      router.push(user.role === 'admin' ? '/admin/dashboard' : '/customer/dashboard');
      toast.success(`Welcome to Zaika, ${user.name?.split(' ')[0]}! 🍽️`);
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong');
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-saffron/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-turmeric/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-saffron rounded-2xl mb-4 shadow-warm">
            <ChefHat size={32} className="text-white" />
          </div>
          <h1 className="font-display text-3xl font-bold text-charcoal">Zaika</h1>
          <p className="font-body text-gray-500 text-sm mt-1">AI-powered restaurant platform</p>
        </div>

        {/* Card */}
        <div className="card p-8">
          {/* Tab switcher */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
            {(['login','register'] as const).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-2 rounded-lg text-sm font-body font-semibold transition-all ${
                  mode === m ? 'bg-white text-saffron shadow-sm' : 'text-gray-500'
                }`}
              >
                {m === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          {/* Form fields */}
          <div className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="text-xs font-body font-semibold text-gray-600 mb-1.5 block">Full Name</label>
                <input
                  className="input"
                  placeholder="Arjun Mehta"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
            )}

            <div>
              <label className="text-xs font-body font-semibold text-gray-600 mb-1.5 block">Email</label>
              <input
                className="input"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-xs font-body font-semibold text-gray-600 mb-1.5 block">Password</label>
              <div className="relative">
                <input
                  className="input pr-10"
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                />
                <button
                  onClick={() => setShowPass(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label className="text-xs font-body font-semibold text-gray-600 mb-1.5 block">Phone (optional)</label>
                <input
                  className="input"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                />
              </div>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn-primary w-full mt-6"
          >
            {loading ? '...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>

          {/* Demo credentials */}
          <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-100">
            <p className="text-xs font-body text-amber-800 font-semibold mb-1">Demo Accounts</p>
            <p className="text-xs text-amber-700">Customer: customer@zaika.com / demo123</p>
            <p className="text-xs text-amber-700">Admin: admin@zaika.com / admin123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
