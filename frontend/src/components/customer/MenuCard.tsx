import { useState } from 'react';
import { Plus, Minus, Star, Flame } from 'lucide-react';
import { MenuItem, ItemClass, CLASS_LABELS } from '../../data/mockData';
import { useCart } from '../../hooks/useCart';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const CLASS_COLORS: Record<ItemClass, string> = {
  star:        'badge-star',
  hidden_star: 'badge-hidden',
  workhorse:   'badge-workhorse',
  dog:         'badge-dog',
};

interface MenuCardProps {
  item: MenuItem;
  showClass?: boolean;
}

export default function MenuCard({ item, showClass = true }: MenuCardProps) {
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const { addItem } = useCart();

  const handleAdd = () => {
    setAdding(true);
    addItem({
      item_id: item.id,
      name: item.name,
      price: item.price,
      qty,
      modifiers: [],
      image_url: item.image_url,
    });
    toast.success(`${item.name} added to cart!`, {
      icon: '🍽️',
      style: { fontFamily: 'DM Sans, sans-serif', fontSize: '14px' },
    });
    setTimeout(() => setAdding(false), 600);
    setQty(1);
  };

  return (
    <div className={clsx(
      'card group transition-all duration-300 hover:-translate-y-1 hover:shadow-warm',
      adding && 'scale-95'
    )}>
      {/* Image */}
      <div className="relative h-44 overflow-hidden bg-gray-100">
        <img
          src={item.image_url}
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={e => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x200?text=🍽️'; }}
        />
        {/* BCG badge */}
        {showClass && (
          <div className={clsx('absolute top-2 left-2', CLASS_COLORS[item.item_class])}>
            {CLASS_LABELS[item.item_class]}
          </div>
        )}
        {/* Veg/Non-veg indicator */}
        <div className={clsx(
          'absolute top-2 right-2 w-5 h-5 rounded border-2 flex items-center justify-center',
          item.tags?.includes('veg')
            ? 'border-green-600 bg-white'
            : 'border-red-500 bg-white'
        )}>
          <div className={clsx(
            'w-2.5 h-2.5 rounded-full',
            item.tags?.includes('veg') ? 'bg-green-600' : 'bg-red-500'
          )} />
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-1">
          <h3 className="font-display text-base font-semibold text-charcoal leading-tight pr-2">
            {item.name}
          </h3>
          <span className="font-body font-bold text-saffron text-sm whitespace-nowrap">₹{item.price}</span>
        </div>

        <p className="font-body text-xs text-gray-500 line-clamp-2 mb-3">{item.description}</p>

        {/* Rating & category */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-1">
            <Star size={12} className="text-amber-400 fill-amber-400" />
            <span className="text-xs font-body text-gray-600">{item.rating}</span>
          </div>
          <div className="flex items-center gap-1">
            <Flame size={12} className="text-orange-400" />
            <span className="text-xs font-body text-gray-600">{item.popularity_score}/10</span>
          </div>
          <span className="text-xs font-body text-gray-400">{item.cuisine}</span>
        </div>

        {/* Add to cart controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setQty(q => Math.max(1, q - 1))}
              className="px-2.5 py-1.5 text-gray-500 hover:bg-gray-50 transition-colors"
            >
              <Minus size={14} />
            </button>
            <span className="px-3 text-sm font-body font-semibold text-charcoal">{qty}</span>
            <button
              onClick={() => setQty(q => q + 1)}
              className="px-2.5 py-1.5 text-gray-500 hover:bg-gray-50 transition-colors"
            >
              <Plus size={14} />
            </button>
          </div>
          <button
            onClick={handleAdd}
            className="flex-1 btn-primary py-2 text-sm"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
