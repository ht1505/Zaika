import { Link } from "react-router";
import { Logo } from "../components/zaika/Logo";
import { ZaikaButton } from "../components/zaika/ZaikaButton";
import { ZaikaInput } from "../components/zaika/ZaikaInput";
import { ZaikaCard } from "../components/zaika/ZaikaCard";
import { BCGBadge } from "../components/zaika/BCGBadge";
import { LanguageToggle } from "../components/zaika/LanguageToggle";
import { Flame, ShoppingCart } from "lucide-react";

export default function DesignSystem() {
  return (
    <div className="min-h-screen bg-cream">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-saffron to-saffron-dark text-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-4 mb-4">
            <Flame size={48} />
            <h1 className="text-white">ZAIKA Design System</h1>
          </div>
          <p className="text-xl text-white/90 mb-8">
            Premium, warm, modern Indian hospitality
          </p>
          <div className="flex gap-4">
            <Link to="/customer/login">
              <ZaikaButton variant="secondary">Customer Portal</ZaikaButton>
            </Link>
            <Link to="/admin/login">
              <ZaikaButton variant="secondary">Admin Portal</ZaikaButton>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Brand */}
        <section className="mb-16">
          <h2 className="mb-6">Brand Identity</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <ZaikaCard>
              <h3 className="mb-4">Logo</h3>
              <Logo size="lg" />
              <p className="text-sm text-muted-foreground mt-4">
                "Zaika" in Playfair Display + minimal flame icon in saffron
              </p>
            </ZaikaCard>
            <ZaikaCard>
              <h3 className="mb-4">Personality</h3>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-saffron" />
                  Premium quality
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-saffron" />
                  Warm hospitality
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-saffron" />
                  Modern Indian cuisine
                </li>
              </ul>
            </ZaikaCard>
          </div>
        </section>

        {/* Colors */}
        <section className="mb-16">
          <h2 className="mb-6">Color Tokens</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              { name: "Saffron", color: "bg-saffron", hex: "#E85D04" },
              { name: "Saffron Light", color: "bg-saffron-light", hex: "#FB8500" },
              { name: "Saffron Dark", color: "bg-saffron-dark", hex: "#C04B00" },
              { name: "Turmeric", color: "bg-turmeric", hex: "#FFD166" },
              { name: "Forest", color: "bg-forest", hex: "#1B4332" },
              { name: "Cream", color: "bg-cream", hex: "#FFF8F0" },
              { name: "Charcoal", color: "bg-charcoal", hex: "#1A1A2E" },
              { name: "Star", color: "bg-bcg-star", hex: "#F59E0B" },
              {
                name: "Hidden Star",
                color: "bg-bcg-hidden-star",
                hex: "#8B5CF6",
              },
              { name: "Workhorse", color: "bg-bcg-workhorse", hex: "#3B82F6" },
              { name: "Dog", color: "bg-bcg-dog", hex: "#9CA3AF" },
              { name: "Success", color: "bg-success", hex: "#10B981" },
            ].map((colorItem) => (
              <ZaikaCard key={colorItem.name} className="p-4">
                <div
                  className={`${colorItem.color} h-16 rounded-lg mb-2 border border-cream-dark`}
                />
                <p className="text-sm font-medium">{colorItem.name}</p>
                <p className="text-xs text-muted-foreground font-mono">
                  {colorItem.hex}
                </p>
              </ZaikaCard>
            ))}
          </div>
        </section>

        {/* Typography */}
        <section className="mb-16">
          <h2 className="mb-6">Typography</h2>
          <ZaikaCard>
            <div className="space-y-6">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Playfair Display (Headings)
                </p>
                <h1 className="mb-2">Heading 1 - The finest flavors</h1>
                <h2 className="mb-2">Heading 2 - Authentic cuisine</h2>
                <h3 className="mb-2">Heading 3 - Fresh ingredients</h3>
                <h4>Heading 4 - Daily specials</h4>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  DM Sans (Body)
                </p>
                <p className="mb-2">
                  Body text - Experience the rich and authentic flavors of
                  Indian cuisine, crafted with care and passion.
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  JetBrains Mono (IDs/Prices)
                </p>
                <p className="font-mono">ORD-12345 | ₹450.00</p>
              </div>
            </div>
          </ZaikaCard>
        </section>

        {/* Spacing */}
        <section className="mb-16">
          <h2 className="mb-6">Spacing Scale (4px base)</h2>
          <ZaikaCard>
            <div className="space-y-2">
              {[
                { name: "space-1", value: "4px" },
                { name: "space-2", value: "8px" },
                { name: "space-3", value: "12px" },
                { name: "space-4", value: "16px" },
                { name: "space-5", value: "20px" },
                { name: "space-6", value: "24px" },
                { name: "space-8", value: "32px" },
                { name: "space-10", value: "40px" },
                { name: "space-12", value: "48px" },
                { name: "space-16", value: "64px" },
              ].map((space) => (
                <div key={space.name} className="flex items-center gap-4">
                  <span className="w-32 font-mono text-sm">{space.name}</span>
                  <div
                    className="bg-saffron h-4"
                    style={{ width: space.value }}
                  />
                  <span className="text-sm text-muted-foreground">
                    {space.value}
                  </span>
                </div>
              ))}
            </div>
          </ZaikaCard>
        </section>

        {/* Border Radius */}
        <section className="mb-16">
          <h2 className="mb-6">Border Radius</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { name: "sm", value: "6px" },
              { name: "md", value: "10px" },
              { name: "lg", value: "14px" },
              { name: "xl", value: "20px" },
              { name: "full", value: "9999px" },
            ].map((radius) => (
              <ZaikaCard key={radius.name} className="p-4">
                <div
                  className="bg-saffron h-20 w-20 mb-2"
                  style={{
                    borderRadius:
                      radius.name === "full" ? radius.value : `var(--radius-${radius.name})`,
                  }}
                />
                <p className="text-sm font-medium">{radius.name}</p>
                <p className="text-xs text-muted-foreground">{radius.value}</p>
              </ZaikaCard>
            ))}
          </div>
        </section>

        {/* Buttons */}
        <section className="mb-16">
          <h2 className="mb-6">Buttons</h2>
          <ZaikaCard>
            <div className="space-y-6">
              <div>
                <p className="text-sm text-muted-foreground mb-3">Primary</p>
                <div className="flex gap-4 flex-wrap">
                  <ZaikaButton variant="primary" size="sm">
                    Small
                  </ZaikaButton>
                  <ZaikaButton variant="primary" size="md">
                    Medium
                  </ZaikaButton>
                  <ZaikaButton variant="primary" size="lg">
                    Large
                  </ZaikaButton>
                  <ZaikaButton variant="primary" disabled>
                    Disabled
                  </ZaikaButton>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-3">Secondary</p>
                <div className="flex gap-4 flex-wrap">
                  <ZaikaButton variant="secondary" size="sm">
                    Small
                  </ZaikaButton>
                  <ZaikaButton variant="secondary" size="md">
                    Medium
                  </ZaikaButton>
                  <ZaikaButton variant="secondary" size="lg">
                    Large
                  </ZaikaButton>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-3">Ghost</p>
                <div className="flex gap-4 flex-wrap">
                  <ZaikaButton variant="ghost" size="sm">
                    Small
                  </ZaikaButton>
                  <ZaikaButton variant="ghost" size="md">
                    Medium
                  </ZaikaButton>
                  <ZaikaButton variant="ghost" size="lg">
                    Large
                  </ZaikaButton>
                </div>
              </div>
            </div>
          </ZaikaCard>
        </section>

        {/* Inputs */}
        <section className="mb-16">
          <h2 className="mb-6">Input Fields</h2>
          <ZaikaCard>
            <div className="space-y-4 max-w-md">
              <ZaikaInput label="Email" placeholder="Enter your email" />
              <ZaikaInput
                label="Password"
                type="password"
                placeholder="Enter password"
              />
              <ZaikaInput
                label="With Error"
                placeholder="Invalid input"
                error="This field is required"
              />
            </div>
          </ZaikaCard>
        </section>

        {/* Cards */}
        <section className="mb-16">
          <h2 className="mb-6">Cards</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <ZaikaCard>
              <h3 className="mb-2">Static Card</h3>
              <p className="text-muted-foreground">
                Default card with shadow and border
              </p>
            </ZaikaCard>
            <ZaikaCard hover>
              <h3 className="mb-2">Hover Card</h3>
              <p className="text-muted-foreground">
                Hover me to see the animation!
              </p>
            </ZaikaCard>
          </div>
        </section>

        {/* BCG Badges */}
        <section className="mb-16">
          <h2 className="mb-6">BCG Badges</h2>
          <ZaikaCard>
            <div className="flex flex-wrap gap-4">
              <BCGBadge type="star" size="sm" />
              <BCGBadge type="hidden-star" size="sm" />
              <BCGBadge type="workhorse" size="sm" />
              <BCGBadge type="dog" size="sm" />
            </div>
            <div className="flex flex-wrap gap-4 mt-4">
              <BCGBadge type="star" size="md" />
              <BCGBadge type="hidden-star" size="md" />
              <BCGBadge type="workhorse" size="md" />
              <BCGBadge type="dog" size="md" />
            </div>
            <div className="flex flex-wrap gap-4 mt-4">
              <BCGBadge type="star" size="lg" />
              <BCGBadge type="hidden-star" size="lg" />
              <BCGBadge type="workhorse" size="lg" />
              <BCGBadge type="dog" size="lg" />
            </div>
          </ZaikaCard>
        </section>

        {/* Language Toggle */}
        <section className="mb-16">
          <h2 className="mb-6">Language Toggle</h2>
          <ZaikaCard>
            <LanguageToggle />
          </ZaikaCard>
        </section>

        {/* Shadows */}
        <section className="mb-16">
          <h2 className="mb-6">Shadows</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-8 [box-shadow:var(--shadow-card)]">
              <h4 className="mb-2">Card Shadow</h4>
              <p className="text-sm text-muted-foreground">
                0 2px 16px rgba(0,0,0,0.06)
              </p>
            </div>
            <div className="bg-white rounded-xl p-8 [box-shadow:var(--shadow-warm)]">
              <h4 className="mb-2">Warm Shadow</h4>
              <p className="text-sm text-muted-foreground">
                0 4px 24px rgba(232,93,4,0.18)
              </p>
            </div>
          </div>
        </section>

        {/* Interactive States */}
        <section className="mb-16">
          <h2 className="mb-6">Interactive States</h2>
          <ZaikaCard>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="w-32 text-sm">Button Press:</span>
                <ZaikaButton variant="primary">Click Me</ZaikaButton>
                <span className="text-xs text-muted-foreground">
                  scale(0.96) 120ms
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="w-32 text-sm">Card Hover:</span>
                <ZaikaCard hover className="px-4 py-2">
                  <span>Hover me</span>
                </ZaikaCard>
                <span className="text-xs text-muted-foreground">
                  translateY(-4px) 200ms
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="w-32 text-sm">Focus Ring:</span>
                <input className="px-4 py-2 border border-cream-dark rounded-lg focus:outline-none focus:ring-3 focus:ring-saffron" />
                <span className="text-xs text-muted-foreground">
                  3px saffron ring
                </span>
              </div>
            </div>
          </ZaikaCard>
        </section>
      </div>
    </div>
  );
}
