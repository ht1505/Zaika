import { X, ShoppingBag, Trash2, Plus, Minus } from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import { useOrders } from '../../hooks/useOrders';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import { useState } from 'react';

export default function CartDrawer() {
  const { items, isOpen, toggleCart, updateQty, removeItem, clearCart, total } = useCart();
  const { placeOrder, loading } = useOrders();
  const { user } = useAuth();
  const [placing, setPlacing] = useState(false);

  const handleCheckout = async () => {
  if (!items.length) return;
  setPlacing(true);

  try {
    // Simulate order placement delay
    await new Promise(r => setTimeout(r, 800));

    // Generate a mock order ID
    const orderId = 'ORD_' + Date.now().toString(36).toUpperCase();

    clearCart();
    toggleCart();
    toast.success(`Order placed! #${orderId} ✅`);
  } catch (err: any) {
    toast.error(err.message || 'Failed to place order');
  } finally {
    setPlacing(false);
  }
};

  if (!isOpen) return null;

  const tax = Math.round(total() * 0.05);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 animate-fade-in"
        onClick={toggleCart}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-full max-w-sm bg-white z-50 shadow-2xl flex flex-col animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ShoppingBag size={20} className="text-saffron" />
            <h2 className="font-display text-xl font-bold text-charcoal">Your Cart</h2>
            {items.length > 0 && (
              <span className="bg-saffron/10 text-saffron text-xs font-body font-semibold px-2 py-0.5 rounded-full">
                {items.length} item{items.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <button onClick={toggleCart} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {items.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-3">🛒</div>
              <p className="font-body text-gray-400 text-sm">Your cart is empty</p>
              <p className="font-body text-gray-300 text-xs mt-1">Add items from the menu</p>
            </div>
          ) : (
            items.map(item => (
              <div key={item.item_id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                {item.image_url && (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-body font-semibold text-sm text-charcoal truncate">{item.name}</p>
                  <p className="font-body text-xs text-saffron font-medium">₹{item.price}</p>
                </div>
                {/* Quantity controls */}
                <div className="flex items-center gap-1 border border-gray-200 rounded-lg bg-white overflow-hidden">
                  <button
                    onClick={() => updateQty(item.item_id, item.qty - 1)}
                    className="p-1 hover:bg-gray-50 transition-colors"
                  >
                    <Minus size={12} className="text-gray-500" />
                  </button>
                  <span className="text-xs font-body font-bold text-charcoal w-5 text-center">{item.qty}</span>
                  <button
                    onClick={() => updateQty(item.item_id, item.qty + 1)}
                    className="p-1 hover:bg-gray-50 transition-colors"
                  >
                    <Plus size={12} className="text-gray-500" />
                  </button>
                </div>
                <button
                  onClick={() => removeItem(item.item_id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 px-6 py-5">
            {/* Price breakdown */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm font-body text-gray-600">
                <span>Subtotal</span>
                <span>₹{total()}</span>
              </div>
              <div className="flex justify-between text-sm font-body text-gray-600">
                <span>GST (5%)</span>
                <span>₹{tax}</span>
              </div>
              <div className="flex justify-between font-body font-bold text-charcoal border-t border-gray-100 pt-2">
                <span>Total</span>
                <span className="text-saffron">₹{total() + tax}</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={placing || loading}
              className="btn-primary w-full"
            >
              {placing ? 'Placing Order...' : `Place Order • ₹${total() + tax}`}
            </button>

            <button
              onClick={clearCart}
              className="w-full text-center text-xs font-body text-gray-400 hover:text-red-400 mt-3 transition-colors"
            >
              Clear cart
            </button>
          </div>
        )}
      </div>
    </>
  );
}
