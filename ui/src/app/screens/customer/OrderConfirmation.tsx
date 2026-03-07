import { useParams, Link } from "react-router";
import { motion } from "motion/react";
import { ZaikaButton } from "../../components/zaika/ZaikaButton";
import { ZaikaCard } from "../../components/zaika/ZaikaCard";
import { CheckCircle, Copy, Clock, MessageSquare } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function OrderConfirmation() {
  const { orderId } = useParams();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(orderId || "");
    setCopied(true);
    toast.success("Order ID copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Success Animation */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="inline-block mb-4"
        >
          <CheckCircle className="text-success" size={80} />
        </motion.div>
        <h2 className="mb-2">Order Confirmed!</h2>
        <p className="text-muted-foreground">
          Thank you for your order. We're preparing your delicious meal.
        </p>
      </div>

      {/* Order ID */}
      <ZaikaCard className="mb-6">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-2">Order ID</p>
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl font-mono font-medium text-saffron">
              {orderId}
            </span>
            <button
              onClick={handleCopy}
              className="p-2 hover:bg-cream rounded-lg transition-colors"
            >
              <Copy
                className={copied ? "text-success" : "text-muted-foreground"}
                size={20}
              />
            </button>
          </div>
        </div>
      </ZaikaCard>

      {/* Estimated Time */}
      <ZaikaCard className="mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-turmeric/20 flex items-center justify-center flex-shrink-0">
            <Clock className="text-saffron" size={24} />
          </div>
          <div>
            <p className="font-medium mb-1">Estimated Preparation Time</p>
            <p className="text-2xl font-mono text-saffron">25-30 mins</p>
          </div>
        </div>
      </ZaikaCard>

      {/* Order Summary */}
      <ZaikaCard className="mb-6">
        <h3 className="mb-4">Order Summary</h3>
        <div className="space-y-3">
          {[
            { name: "Butter Chicken", qty: 1, price: 450 },
            { name: "Tandoori Chicken", qty: 1, price: 380 },
            { name: "Garlic Naan", qty: 2, price: 160 },
          ].map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between pb-3 border-b border-cream-dark last:border-0"
            >
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-muted-foreground">Qty: {item.qty}</p>
              </div>
              <p className="font-mono text-saffron">₹{item.price}</p>
            </div>
          ))}

          <div className="pt-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span className="font-mono">₹990</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>GST (5%)</span>
              <span className="font-mono">₹49.50</span>
            </div>
            <div className="flex justify-between text-lg font-medium pt-2 border-t border-cream-dark">
              <span>Total</span>
              <span className="font-mono text-saffron">₹1039.50</span>
            </div>
          </div>
        </div>
      </ZaikaCard>

      {/* SMS Confirmation */}
      <ZaikaCard className="mb-6 bg-success/10">
        <div className="flex gap-3">
          <MessageSquare className="text-success flex-shrink-0" size={20} />
          <div>
            <p className="font-medium text-sm mb-1">SMS Confirmation Sent</p>
            <p className="text-sm text-muted-foreground">
              We've sent order details and updates to your registered mobile
              number ending in ****4567
            </p>
          </div>
        </div>
      </ZaikaCard>

      {/* Actions */}
      <div className="flex gap-3">
        <Link to="/customer" className="flex-1">
          <ZaikaButton variant="secondary" className="w-full">
            Continue Shopping
          </ZaikaButton>
        </Link>
        <ZaikaButton variant="primary" className="flex-1">
          Track Order
        </ZaikaButton>
      </div>

      {/* Support */}
      <div className="text-center mt-8 text-sm text-muted-foreground">
        Need help?{" "}
        <a href="#" className="text-saffron hover:text-saffron-dark">
          Contact Support
        </a>
      </div>
    </div>
  );
}
