import { create } from 'zustand';

export interface CartItem {
  item_id: string;
  name: string;
  price: number;
  qty: number;
  modifiers: { name: string; extra: number }[];
  image_url?: string;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  addItem: (item: CartItem) => void;
  removeItem: (item_id: string) => void;
  updateQty: (item_id: string, qty: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  total: () => number;
  count: () => number;
}

export const useCart = create<CartState>((set, get) => ({
  items: [],
  isOpen: false,

  addItem: (item) => {
    set((state) => {
      const existing = state.items.find(i => i.item_id === item.item_id);
      if (existing) {
        return {
          items: state.items.map(i =>
            i.item_id === item.item_id ? { ...i, qty: i.qty + item.qty } : i
          ),
        };
      }
      return { items: [...state.items, item] };
    });
  },

  removeItem: (item_id) => {
    set((state) => ({ items: state.items.filter(i => i.item_id !== item_id) }));
  },

  updateQty: (item_id, qty) => {
    if (qty <= 0) {
      get().removeItem(item_id);
      return;
    }
    set((state) => ({
      items: state.items.map(i => i.item_id === item_id ? { ...i, qty } : i),
    }));
  },

  clearCart: () => set({ items: [] }),

  toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

  total: () => {
    const { items } = get();
    return items.reduce((sum, item) => {
      const modifierTotal = item.modifiers.reduce((s, m) => s + (m.extra || 0), 0);
      return sum + (item.price + modifierTotal) * item.qty;
    }, 0);
  },

  count: () => get().items.reduce((sum, i) => sum + i.qty, 0),
}));
