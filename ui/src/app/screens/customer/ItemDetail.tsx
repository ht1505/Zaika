import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { ZaikaButton } from "../../components/zaika/ZaikaButton";
import { ZaikaCard } from "../../components/zaika/ZaikaCard";
import { BCGBadge } from "../../components/zaika/BCGBadge";
import { ImageWithFallback } from "../../components/figma/ImageWithFallback";
import { ChevronLeft, Minus, Plus } from "lucide-react";
import { toast } from "sonner";

const itemDetails = {
  1: {
    name: "Butter Chicken",
    price: 450,
    bcg: "star" as const,
    description:
      "Tender chicken pieces in a rich, creamy tomato-based gravy with aromatic spices",
    image: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjBidXR0ZXIlMjBjaGlja2VuJTIwY3Vycnl8ZW58MXx8fHwxNzcyNzgwMTQ0fDA&ixlib=rb-4.1.0&q=80&w=1080",
    modifiers: [
      { id: 1, name: "Mild Spice", price: 0 },
      { id: 2, name: "Medium Spice", price: 0 },
      { id: 3, name: "Extra Spicy", price: 20 },
      { id: 4, name: "Extra Cream", price: 30 },
    ],
  },
};

export default function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [selectedModifiers, setSelectedModifiers] = useState<number[]>([]);

  const item = itemDetails[id as keyof typeof itemDetails] || itemDetails[1];

  const toggleModifier = (modifierId: number) => {
    setSelectedModifiers((prev) =>
      prev.includes(modifierId)
        ? prev.filter((id) => id !== modifierId)
        : [...prev, modifierId]
    );
  };

  const totalPrice =
    item.price * quantity +
    selectedModifiers.reduce((sum, modId) => {
      const modifier = item.modifiers.find((m) => m.id === modId);
      return sum + (modifier?.price || 0);
    }, 0) *
      quantity;

  const handleAddToCart = () => {
    toast.success(`Added ${quantity}x ${item.name} to cart`, {
      description: `Total: ₹${totalPrice}`,
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-saffron hover:text-saffron-dark mb-6"
      >
        <ChevronLeft size={20} />
        <span>Back to Menu</span>
      </button>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Image */}
        <div className="relative">
          <ImageWithFallback
            src={item.image}
            alt={item.name}
            className="w-full h-96 md:h-full object-cover rounded-[var(--radius-xl)]"
          />
          <div className="absolute top-4 right-4">
            <BCGBadge type={item.bcg} size="md" />
          </div>
        </div>

        {/* Details */}
        <div className="space-y-6">
          <div>
            <h1 className="mb-4">{item.name}</h1>
            <p className="text-muted-foreground mb-4">{item.description}</p>
            <div className="text-3xl font-mono text-saffron">₹{item.price}</div>
          </div>

          {/* Modifiers */}
          <ZaikaCard>
            <h3 className="mb-4">Customize Your Order</h3>
            <div className="space-y-3">
              {item.modifiers.map((modifier) => (
                <label
                  key={modifier.id}
                  className="flex items-center gap-3 cursor-pointer group"
                >
                  <input
                    type="checkbox"
                    checked={selectedModifiers.includes(modifier.id)}
                    onChange={() => toggleModifier(modifier.id)}
                    className="w-5 h-5 rounded border-2 border-cream-dark checked:bg-saffron checked:border-saffron"
                  />
                  <span className="flex-1 group-hover:text-saffron">
                    {modifier.name}
                  </span>
                  {modifier.price > 0 && (
                    <span className="font-mono text-sm text-muted-foreground">
                      +₹{modifier.price}
                    </span>
                  )}
                </label>
              ))}
            </div>
          </ZaikaCard>

          {/* Quantity */}
          <div>
            <label className="block mb-3">Quantity</label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-12 h-12 rounded-lg border-2 border-cream-dark flex items-center justify-center hover:border-saffron hover:text-saffron transition-colors"
              >
                <Minus size={20} />
              </button>
              <span className="text-2xl font-mono w-12 text-center">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-12 h-12 rounded-lg border-2 border-cream-dark flex items-center justify-center hover:border-saffron hover:text-saffron transition-colors"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>

          {/* Add to Cart */}
          <div className="sticky bottom-0 bg-cream pt-6 pb-2">
            <ZaikaButton
              variant="primary"
              size="lg"
              className="w-full"
              onClick={handleAddToCart}
            >
              Add to Cart • ₹{totalPrice}
            </ZaikaButton>
          </div>
        </div>
      </div>
    </div>
  );
}
