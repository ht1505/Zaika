import { Outlet, Link, useNavigate } from "react-router";
import { Logo } from "../components/zaika/Logo";
import { ShoppingCart, User, MessageSquare, Mic } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ZaikaButton } from "../components/zaika/ZaikaButton";

export default function CustomerLayout() {
  const [cartCount, setCartCount] = useState(3);
  const [showCart, setShowCart] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-cream-dark [box-shadow:var(--shadow-card)]">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/customer">
            <Logo size="md" />
          </Link>

          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/customer/chat")}
              className="p-2 hover:bg-cream rounded-lg transition-colors"
              aria-label="Chat Order"
            >
              <MessageSquare className="text-charcoal" size={24} />
            </button>

            <button
              onClick={() => navigate("/customer/voice")}
              className="p-2 hover:bg-cream rounded-lg transition-colors"
              aria-label="Voice Order"
            >
              <Mic className="text-charcoal" size={24} />
            </button>

            <button
              onClick={() => setShowCart(true)}
              className="relative p-2 hover:bg-cream rounded-lg transition-colors"
              aria-label="Shopping Cart"
            >
              <ShoppingCart className="text-charcoal" size={24} />
              {cartCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 bg-saffron text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium"
                >
                  {cartCount}
                </motion.span>
              )}
            </button>

            <button
              onClick={() => navigate("/customer/profile")}
              className="p-2 hover:bg-cream rounded-lg transition-colors"
              aria-label="Profile"
            >
              <User className="text-charcoal" size={24} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        <Outlet />
      </main>

      {/* Cart Drawer */}
      <AnimatePresence>
        {showCart && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setShowCart(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-50 p-6 overflow-y-auto [box-shadow:var(--shadow-warm)]"
            >
              <h2 className="mb-6">Your Cart</h2>

              <div className="space-y-4 mb-6">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="flex gap-4 pb-4 border-b border-cream-dark"
                  >
                    <div className="w-20 h-20 bg-cream rounded-lg" />
                    <div className="flex-1">
                      <h4 className="font-medium">Butter Chicken</h4>
                      <p className="text-sm text-muted-foreground">
                        Medium spice
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <button className="w-6 h-6 rounded border border-cream-dark flex items-center justify-center">
                          -
                        </button>
                        <span className="font-mono">1</span>
                        <button className="w-6 h-6 rounded border border-cream-dark flex items-center justify-center">
                          +
                        </button>
                      </div>
                    </div>
                    <div className="font-mono text-right">₹450</div>
                  </div>
                ))}
              </div>

              <div className="space-y-2 mb-6 pb-6 border-b border-cream-dark">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-mono">₹1350</span>
                </div>
                <div className="flex justify-between">
                  <span>GST (5%)</span>
                  <span className="font-mono">₹67.50</span>
                </div>
                <div className="flex justify-between font-medium text-lg">
                  <span>Total</span>
                  <span className="font-mono">₹1417.50</span>
                </div>
              </div>

              <ZaikaButton
                variant="primary"
                className="w-full"
                onClick={() => {
                  setShowCart(false);
                  navigate("/customer/order-confirmation/ORD-12345");
                }}
              >
                Place Order
              </ZaikaButton>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
