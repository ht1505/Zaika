import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ShoppingCart, LogOut, Globe, ChefHat, BarChart3, Menu, X, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../hooks/useCart';

function useDarkMode() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem('zaika-dark');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initial = saved !== null ? saved === 'true' : prefersDark;
    setDark(initial);
    document.documentElement.classList.toggle('dark', initial);
  }, []);
  const toggle = () => {
    setDark(d => {
      const next = !d;
      document.documentElement.classList.toggle('dark', next);
      localStorage.setItem('zaika-dark', String(next));
      return next;
    });
  };
  return { dark, toggle };
}

export default function Header() {
  const { user, logout } = useAuth();
  const { count, toggleCart } = useCart();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [lang, setLang] = useState<'hinglish' | 'english'>('hinglish');
  const { dark, toggle: toggleDark } = useDarkMode();
  const isAdmin = user?.role === 'admin';

  const navLinks = isAdmin
    ? [{ href: '/admin/dashboard', label: 'Dashboard', icon: <BarChart3 size={15} /> }]
    : [
        { href: '/customer/dashboard',   label: 'Menu',       icon: <ChefHat size={15} /> },
        { href: '/customer/chat-order',  label: 'Chat Order', icon: <ChefHat size={15} /> },
        { href: '/customer/voice-order', label: 'Voice',      icon: <ChefHat size={15} /> },
      ];

  return (
    <header className="sticky top-0 z-50 border-b shadow-sm"
      style={{ backgroundColor: 'var(--header-bg)', borderColor: 'var(--border)', backdropFilter: 'blur(12px)' }}>
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">

        <Link href={isAdmin ? '/admin/dashboard' : '/customer/dashboard'} className="flex items-center gap-2 flex-shrink-0">
          <span className="text-2xl font-bold text-saffron tracking-tight" style={{ fontFamily: "'Fraunces', serif" }}>
            Zaika
          </span>
          {isAdmin && <span className="text-xs bg-saffron text-white px-2 py-0.5 rounded-full font-semibold">Admin</span>}
        </Link>

        <nav className="hidden md:flex items-center gap-0.5">
          {navLinks.map(link => (
            <Link key={link.href} href={link.href}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
              style={{
                backgroundColor: router.pathname === link.href ? 'var(--bg-subtle)' : 'transparent',
                color: router.pathname === link.href ? 'var(--saffron)' : 'var(--text-muted)',
              }}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <button onClick={() => setLang(l => l === 'hinglish' ? 'english' : 'hinglish')}
            className="hidden sm:flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
            <Globe size={13} />
            {lang === 'hinglish' ? 'हि/EN' : 'EN'}
          </button>

          <button onClick={toggleDark}
            className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            title={dark ? 'Light mode' : 'Dark mode'}>
            {dark ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {!isAdmin && (
            <button onClick={toggleCart}
              className="relative w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
              <ShoppingCart size={19} />
              {count() > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-saffron text-white text-[10px] min-w-[18px] min-h-[18px] rounded-full flex items-center justify-center font-bold">
                  {count()}
                </span>
              )}
            </button>
          )}

          <div className="flex items-center gap-2 pl-2 border-l" style={{ borderColor: 'var(--border)' }}>
            <div className="hidden sm:block text-right">
              <p className="text-xs font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>{user?.name?.split(' ')[0]}</p>
              <p className="text-xs capitalize" style={{ color: 'var(--text-faint)' }}>{user?.role}</p>
            </div>
            <button onClick={logout}
              className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors hover:text-red-500"
              style={{ color: 'var(--text-faint)' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              title="Logout">
              <LogOut size={17} />
            </button>
          </div>

          <button className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onClick={() => setMenuOpen(m => !m)}>
            {menuOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t px-4 pb-4 pt-2 space-y-1 animate-fade-in"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          {navLinks.map(link => (
            <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-colors"
              style={{ color: 'var(--text-primary)' }}>
              {link.icon}{link.label}
            </Link>
          ))}
          <button onClick={toggleDark}
            className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold"
            style={{ color: 'var(--text-primary)' }}>
            {dark ? <Sun size={15} /> : <Moon size={15} />}
            {dark ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>
      )}
    </header>
  );
}