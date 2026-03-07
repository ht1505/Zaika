import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Search } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Header from '../../components/shared/Header';
import MenuCard from '../../components/customer/MenuCard';
import CartDrawer from '../../components/customer/CartDrawer';
import { mockMenuItems, mockCategories, type MenuItem } from '../../data/mockData';
import clsx from 'clsx';

// Customer-friendly filter labels — no BCG jargon, only 3 shown
const CLASS_FILTERS = [
  { value: 'all',         label: 'All Items',   emoji: '🍽️' },
  { value: 'star',        label: 'Hot Selling', emoji: '🔥' },
  { value: 'hidden_star', label: "Chef's Pick", emoji: '👨‍🍳' },
];

export default function CustomerDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');
  const [vegOnly, setVegOnly] = useState(false);

  useEffect(() => {
    if (!user) { router.replace('/login'); return; }
    if (user.role === 'admin') { router.replace('/admin/dashboard'); return; }
  }, [user]);

  const displayItems = mockMenuItems.filter(item => {
    const matchCat    = categoryFilter === 'all' || item.category === categoryFilter;
    const matchClass  = classFilter === 'all'    || item.item_class === classFilter;
    const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase());
    const matchVeg    = !vegOnly || item.tags?.includes('veg');
    return matchCat && matchClass && matchSearch && matchVeg;
  });

  const grouped = displayItems.reduce((acc: Record<string, MenuItem[]>, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  if (!user) return null;

  return (
    <>
      <Head><title>Zaika – Menu</title></Head>
      <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>
        <Header />
        <CartDrawer />

        {/* Hero */}
        <div className="bg-gradient-to-r from-saffron to-orange-400 text-white py-8 px-4">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold mb-1 tracking-tight"
              style={{ fontFamily: "'Fraunces', serif" }}>
              {user.preferred_language === 'hinglish'
                ? `Aaj kya khayenge, ${user.name.split(' ')[0]}?`
                : `What are you craving, ${user.name.split(' ')[0]}?`}
            </h1>
            <p className="text-orange-100 text-sm font-medium">{displayItems.length} items available</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
          {/* Filters */}
          <div className="card p-4 space-y-3">
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-faint)' }} />
              <input className="input pl-10" placeholder="Search dishes..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            <div className="flex flex-wrap gap-2">
              {CLASS_FILTERS.map(f => (
                <button key={f.value} onClick={() => setClassFilter(f.value)}
                  className={clsx('text-xs font-semibold px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5',
                    classFilter === f.value ? 'bg-saffron text-white border-saffron' : 'hover:border-saffron/50'
                  )}
                  style={classFilter !== f.value ? { color: 'var(--text-muted)', backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' } : {}}>
                  <span>{f.emoji}</span> {f.label}
                </button>
              ))}
              {/* <button onClick={() => setVegOnly(v => !v)}
                className={clsx('text-xs font-semibold px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5',
                  vegOnly ? 'bg-green-600 text-white border-green-600' : 'hover:border-green-400'
                )}
                style={!vegOnly ? { color: 'var(--text-muted)', backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' } : {}}>
                🟢 Veg Only
              </button> */}
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {['all', ...mockCategories].map(cat => (
                <button key={cat} onClick={() => setCategoryFilter(cat)}
                  className={clsx('text-xs font-semibold px-4 py-1.5 rounded-full whitespace-nowrap border transition-all')}
                  style={{
                    backgroundColor: categoryFilter === cat ? 'var(--charcoal)' : 'var(--bg-card)',
                    color: categoryFilter === cat ? 'var(--bg)' : 'var(--text-muted)',
                    borderColor: categoryFilter === cat ? 'transparent' : 'var(--border)',
                  }}>
                  {cat === 'all' ? 'All Categories' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Menu */}
          {Object.entries(grouped).map(([category, catItems]) => (
            <section key={category}>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-xl font-bold tracking-tight"
                  style={{ fontFamily: "'Fraunces', serif", color: 'var(--text-primary)' }}>
                  {category}
                </h2>
                <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }} />
                <span className="text-xs font-medium" style={{ color: 'var(--text-faint)' }}>{catItems.length} items</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {catItems.map(item => <MenuCard key={item.id} item={item} />)}
              </div>
            </section>
          ))}

          {displayItems.length === 0 && (
            <div className="text-center py-16">
              <div className="text-5xl mb-3">🍽️</div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-faint)' }}>No items match your filters</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}