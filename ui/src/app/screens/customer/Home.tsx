import { useState } from "react";
import { useNavigate } from "react-router";
import { ZaikaCard } from "../../components/zaika/ZaikaCard";
import { BCGBadge } from "../../components/zaika/BCGBadge";
import { ImageWithFallback } from "../../components/figma/ImageWithFallback";
import { Search } from "lucide-react";

const categories = [
  "All",
  "Appetizers",
  "Curries",
  "Tandoori",
  "Biryani",
  "Breads",
  "Desserts",
];

const bcgFilters = [
  { type: "star" as const, label: "Stars" },
  { type: "hidden-star" as const, label: "Hidden Stars" },
  { type: "workhorse" as const, label: "Workhorses" },
  { type: "dog" as const, label: "Dogs" },
];

const menuItems = [
  {
    id: 1,
    name: "Butter Chicken",
    category: "Curries",
    price: 450,
    bcg: "star" as const,
    image: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjBidXR0ZXIlMjBjaGlja2VuJTIwY3Vycnl8ZW58MXx8fHwxNzcyNzgwMTQ0fDA&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    id: 2,
    name: "Tandoori Chicken",
    category: "Tandoori",
    price: 380,
    bcg: "workhorse" as const,
    image: "https://images.unsplash.com/photo-1617692855027-33b14f061079?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0YW5kb29yaSUyMGNoaWNrZW4lMjBpbmRpYW4lMjBmb29kfGVufDF8fHx8MTc3Mjc5MzU0OXww&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    id: 3,
    name: "Chicken Biryani",
    category: "Biryani",
    price: 420,
    bcg: "hidden-star" as const,
    image: "https://images.unsplash.com/photo-1714611626323-5ba6204453be?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiaXJ5YW5pJTIwcmljZSUyMGluZGlhbiUyMGN1aXNpbmV8ZW58MXx8fHwxNzcyNzkzNTQ5fDA&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    id: 4,
    name: "Paneer Tikka",
    category: "Appetizers",
    price: 320,
    bcg: "workhorse" as const,
    image: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYW5lZXIlMjB0aWtrYSUyMGluZGlhbiUyMHZlZ2V0YXJpYW58ZW58MXx8fHwxNzcyNzkzNTUwfDA&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    id: 5,
    name: "Garlic Naan",
    category: "Breads",
    price: 80,
    bcg: "dog" as const,
    image: "https://images.unsplash.com/photo-1690915475901-6c08af925906?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuYWFuJTIwYnJlYWQlMjBpbmRpYW4lMjByZXN0YXVyYW50fGVufDF8fHx8MTc3MjcwMDk0OHww&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    id: 6,
    name: "Samosa",
    category: "Appetizers",
    price: 120,
    bcg: "workhorse" as const,
    image: "https://images.unsplash.com/photo-1697155836252-d7f969108b5a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjBzYW1vc2ElMjBhcHBldGl6ZXJ8ZW58MXx8fHwxNzcyNzg1ODk2fDA&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    id: 7,
    name: "Gulab Jamun",
    category: "Desserts",
    price: 140,
    bcg: "star" as const,
    image: "https://images.unsplash.com/photo-1666190092159-3171cf0fbb12?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxndWxhYiUyMGphbXVuJTIwaW5kaWFuJTIwZGVzc2VydHxlbnwxfHx8fDE3NzI3OTM1NTR8MA&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    id: 8,
    name: "Rogan Josh",
    category: "Curries",
    price: 480,
    bcg: "hidden-star" as const,
    image: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjBidXR0ZXIlMjBjaGlja2VuJTIwY3Vycnl8ZW58MXx8fHwxNzcyNzgwMTQ0fDA&ixlib=rb-4.1.0&q=80&w=1080",
  },
];

export default function CustomerHome() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedBCG, setSelectedBCG] = useState<string | null>(null);

  const filteredItems = menuItems.filter((item) => {
    const categoryMatch =
      selectedCategory === "All" || item.category === selectedCategory;
    const bcgMatch = !selectedBCG || item.bcg === selectedBCG;
    return categoryMatch && bcgMatch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-saffron to-saffron-light rounded-[var(--radius-xl)] p-12 mb-8 text-white">
        <h1 className="text-white mb-4">Aaj kya khayenge?</h1>
        <p className="text-xl text-white/90 mb-6">
          Discover authentic flavors crafted with love
        </p>

        {/* Search Bar */}
        <div className="max-w-2xl relative">
          <input
            type="text"
            placeholder="Search for dishes..."
            className="w-full h-14 pl-14 pr-4 rounded-lg text-charcoal"
          />
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={24}
          />
        </div>
      </div>

      {/* BCG Filter Pills */}
      <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedBCG(null)}
          className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition-all ${
            !selectedBCG
              ? "bg-saffron text-white"
              : "bg-white border border-cream-dark text-charcoal hover:border-saffron"
          }`}
        >
          All Items
        </button>
        {bcgFilters.map((filter) => (
          <button
            key={filter.type}
            onClick={() => setSelectedBCG(filter.type)}
            className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition-all ${
              selectedBCG === filter.type
                ? "bg-saffron text-white"
                : "bg-white border border-cream-dark text-charcoal hover:border-saffron"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Category Chips */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-6 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
              selectedCategory === category
                ? "bg-turmeric text-charcoal"
                : "bg-white text-charcoal hover:bg-cream"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Menu Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredItems.map((item) => (
          <ZaikaCard
            key={item.id}
            hover
            onClick={() => navigate(`/customer/item/${item.id}`)}
          >
            <div className="relative mb-4">
              <ImageWithFallback
                src={item.image}
                alt={item.name}
                className="w-full h-48 object-cover rounded-lg"
              />
              <div className="absolute top-2 right-2">
                <BCGBadge type={item.bcg} size="sm" />
              </div>
            </div>
            <h4 className="mb-2">{item.name}</h4>
            <p className="text-sm text-muted-foreground mb-3">
              {item.category}
            </p>
            <div className="flex items-center justify-between">
              <span className="font-mono text-lg text-saffron">
                ₹{item.price}
              </span>
              <button className="text-saffron hover:text-saffron-dark font-medium text-sm">
                Add +
              </button>
            </div>
          </ZaikaCard>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-16">
          <p className="text-muted-foreground">
            No items found. Try a different filter.
          </p>
        </div>
      )}
    </div>
  );
}
