import { useState } from "react";
import { ZaikaCard } from "../../components/zaika/ZaikaCard";
import { ZaikaButton } from "../../components/zaika/ZaikaButton";
import { ZaikaInput } from "../../components/zaika/ZaikaInput";
import { Sparkles, TrendingUp, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface ComboItem {
  id: number;
  name: string;
  items: string[];
  currentPrice: number;
  suggestedPrice: number;
  savings: number;
}

const combos: ComboItem[] = [
  {
    id: 1,
    name: "Butter Chicken Special",
    items: ["Butter Chicken", "Garlic Naan x2", "Raita"],
    currentPrice: 580,
    suggestedPrice: 620,
    savings: 90,
  },
  {
    id: 2,
    name: "Tandoori Feast",
    items: ["Tandoori Chicken", "Biryani", "Salad"],
    currentPrice: 720,
    suggestedPrice: 750,
    savings: 120,
  },
  {
    id: 3,
    name: "Vegetarian Delight",
    items: ["Paneer Tikka", "Dal Makhani", "Roti x3"],
    currentPrice: 520,
    suggestedPrice: 550,
    savings: 80,
  },
];

const aiSuggestions = [
  {
    item: "Butter Chicken",
    current: 450,
    suggested: 480,
    reason: "High demand + 68% margin allows 6% increase",
    confidence: 92,
  },
  {
    item: "Chicken Biryani",
    current: 420,
    suggested: 450,
    reason: "Hidden star with low visibility, premium positioning",
    confidence: 85,
  },
  {
    item: "Tandoori Chicken",
    current: 380,
    suggested: 395,
    reason: "Workhorse item, small increase to improve margin",
    confidence: 78,
  },
];

export default function PricingConfig() {
  const [editingCombo, setEditingCombo] = useState<number | null>(null);
  const [comboPrice, setComboPrice] = useState<string>("");

  const handleEditCombo = (id: number, currentPrice: number) => {
    setEditingCombo(id);
    setComboPrice(currentPrice.toString());
  };

  const handleSaveCombo = () => {
    toast.success("Combo price updated successfully");
    setEditingCombo(null);
  };

  const handleApplySuggestion = (item: string, price: number) => {
    toast.success(`Applied AI suggestion for ${item}`, {
      description: `New price: ₹${price}`,
    });
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="mb-2">Pricing Configuration</h2>
        <p className="text-muted-foreground">
          Manage combo deals and AI-powered pricing recommendations
        </p>
      </div>

      {/* Combo Editor */}
      <div className="mb-8">
        <h3 className="mb-6">Combo Meals</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {combos.map((combo) => (
            <ZaikaCard key={combo.id}>
              <h4 className="mb-4">{combo.name}</h4>

              <div className="mb-4">
                <p className="text-sm text-muted-foreground mb-2">Includes:</p>
                <ul className="space-y-1">
                  {combo.items.map((item, index) => (
                    <li key={index} className="text-sm flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-saffron" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mb-4 p-3 bg-success/10 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">
                  Customer Saves
                </p>
                <p className="font-mono font-medium text-success">
                  ₹{combo.savings}
                </p>
              </div>

              {editingCombo === combo.id ? (
                <div className="space-y-3">
                  <ZaikaInput
                    label="Price"
                    type="number"
                    value={comboPrice}
                    onChange={(e) => setComboPrice(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <ZaikaButton
                      variant="secondary"
                      size="sm"
                      className="flex-1"
                      onClick={() => setEditingCombo(null)}
                    >
                      Cancel
                    </ZaikaButton>
                    <ZaikaButton
                      variant="primary"
                      size="sm"
                      className="flex-1"
                      onClick={handleSaveCombo}
                    >
                      Save
                    </ZaikaButton>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Current Price
                    </p>
                    <p className="text-xl font-mono font-semibold text-saffron">
                      ₹{combo.currentPrice}
                    </p>
                  </div>
                  <ZaikaButton
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditCombo(combo.id, combo.currentPrice)}
                  >
                    Edit
                  </ZaikaButton>
                </div>
              )}

              {combo.suggestedPrice > combo.currentPrice && (
                <div className="mt-4 p-3 bg-turmeric/20 rounded-lg flex items-center gap-2">
                  <Sparkles className="text-saffron flex-shrink-0" size={16} />
                  <p className="text-xs">
                    AI suggests ₹{combo.suggestedPrice} based on demand
                  </p>
                </div>
              )}
            </ZaikaCard>
          ))}
        </div>
      </div>

      {/* AI Price Suggestions */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <Sparkles className="text-saffron" size={24} />
          <h3>AI Pricing Suggestions</h3>
        </div>

        <div className="space-y-4">
          {aiSuggestions.map((suggestion, index) => (
            <ZaikaCard key={index} className="border-2 border-saffron/20">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-base">{suggestion.item}</h4>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Confidence:</span>
                      <span className="font-mono font-medium text-success">
                        {suggestion.confidence}%
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mb-4">
                    {suggestion.reason}
                  </p>

                  <div className="flex items-center gap-6 mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Current Price
                      </p>
                      <p className="text-lg font-mono font-medium">
                        ₹{suggestion.current}
                      </p>
                    </div>
                    <ArrowRight className="text-saffron" size={24} />
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Suggested Price
                      </p>
                      <p className="text-lg font-mono font-medium text-saffron">
                        ₹{suggestion.suggested}
                      </p>
                    </div>
                    <div className="ml-auto">
                      <div className="flex items-center gap-2 text-success">
                        <TrendingUp size={16} />
                        <span className="font-medium">
                          +
                          {(
                            ((suggestion.suggested - suggestion.current) /
                              suggestion.current) *
                            100
                          ).toFixed(1)}
                          %
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <ZaikaButton
                      variant="primary"
                      size="sm"
                      onClick={() =>
                        handleApplySuggestion(
                          suggestion.item,
                          suggestion.suggested
                        )
                      }
                    >
                      Apply Suggestion
                    </ZaikaButton>
                    <ZaikaButton variant="ghost" size="sm">
                      View Analysis
                    </ZaikaButton>
                  </div>
                </div>

                {/* Confidence Meter */}
                <div className="w-24 flex flex-col items-center">
                  <div className="relative w-20 h-20">
                    <svg className="transform -rotate-90 w-20 h-20">
                      <circle
                        cx="40"
                        cy="40"
                        r="30"
                        stroke="#F5E6D3"
                        strokeWidth="8"
                        fill="none"
                      />
                      <circle
                        cx="40"
                        cy="40"
                        r="30"
                        stroke="#E85D04"
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={`${
                          (suggestion.confidence / 100) * 188.4
                        } 188.4`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-mono font-semibold">
                        {suggestion.confidence}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </ZaikaCard>
          ))}
        </div>
      </div>

      {/* Info Box */}
      <ZaikaCard className="mt-8 bg-turmeric/10">
        <div className="flex gap-3">
          <Sparkles className="text-saffron flex-shrink-0" size={20} />
          <div>
            <p className="font-medium mb-2">About AI Pricing</p>
            <p className="text-sm text-muted-foreground">
              Our AI analyzes demand patterns, profit margins, competitor
              pricing, and customer behavior to suggest optimal prices. Higher
              confidence scores indicate stronger data support for the
              recommendation.
            </p>
          </div>
        </div>
      </ZaikaCard>
    </div>
  );
}
