import { useState } from 'react';
import { Search, ArrowUpDown } from 'lucide-react';
import clsx from 'clsx';

const CLASS_BADGE: Record<string, string> = {
  star:        'badge-star',
  hidden_star: 'badge-hidden',
  workhorse:   'badge-workhorse',
  dog:         'badge-dog',
};

const CLASS_LABEL: Record<string, string> = {
  star:        '⭐ Star',
  hidden_star: '💎 Hidden Star',
  workhorse:   '💪 Workhorse',
  dog:         '🐶 Dog',
};

interface MenuAnalysisProps {
  items: {
    id: string;
    name: string;
    category: string;
    price: number;
    margin: number;
    item_class: string;
    total_orders?: number;
    total_revenue?: number;
    total_profit?: number;
  }[];
}

export default function MenuAnalysis({ items }: MenuAnalysisProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'revenue' | 'margin' | 'orders'>('revenue');

  const filtered = items
    .filter(item => {
      const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
                          item.category.toLowerCase().includes(search.toLowerCase());
      const matchFilter = filter === 'all' || item.item_class === filter;
      return matchSearch && matchFilter;
    })
    .sort((a, b) => {
      if (sortBy === 'revenue') return (Number(b.total_revenue) || 0) - (Number(a.total_revenue) || 0);
      if (sortBy === 'margin')  return Number(b.margin) - Number(a.margin);
      return (Number(b.total_orders) || 0) - (Number(a.total_orders) || 0);
    });

  return (
    <div className="card overflow-hidden">
      {/* Controls */}
      <div className="p-4 border-b border-gray-50 space-y-3">
        <div className="flex gap-2 flex-wrap">
          {['all','star','hidden_star','workhorse','dog'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={clsx(
                'text-xs font-body font-semibold px-3 py-1.5 rounded-full border transition-all capitalize',
                filter === f
                  ? 'bg-saffron text-white border-saffron'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-saffron hover:text-saffron'
              )}
            >
              {f === 'all' ? 'All Items' : CLASS_LABEL[f]}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="input pl-8 text-sm"
              placeholder="Search items..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="input w-auto text-sm pr-8"
          >
            <option value="revenue">Sort: Revenue</option>
            <option value="margin">Sort: Margin</option>
            <option value="orders">Sort: Orders</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm font-body">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Item</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Class</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Price</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Margin</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Orders</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400">No items found</td></tr>
            ) : (
              filtered.map((item, i) => (
                <tr key={item.id} className={clsx('border-b border-gray-50 hover:bg-gray-50 transition-colors', i % 2 === 0 ? '' : 'bg-gray-50/30')}>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-charcoal">{item.name}</p>
                    <p className="text-xs text-gray-400">{item.category}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={CLASS_BADGE[item.item_class]}>{CLASS_LABEL[item.item_class]}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-charcoal font-medium">₹{item.price}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={clsx(
                      'font-semibold',
                      Number(item.margin) >= 60 ? 'text-green-600' :
                      Number(item.margin) >= 40 ? 'text-amber-600' : 'text-red-500'
                    )}>
                      {Number(item.margin).toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">{item.total_orders || 0}</td>
                  <td className="px-4 py-3 text-right text-saffron font-semibold">
                    ₹{Number(item.total_revenue || 0).toLocaleString('en-IN')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
