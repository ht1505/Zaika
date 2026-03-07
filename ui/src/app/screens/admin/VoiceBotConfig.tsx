import { useState } from "react";
import { ZaikaCard } from "../../components/zaika/ZaikaCard";
import { ZaikaButton } from "../../components/zaika/ZaikaButton";
import { ZaikaInput } from "../../components/zaika/ZaikaInput";
import { Play, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Language = "en" | "hi" | "hinglish";

interface Intent {
  id: number;
  phrase: string;
  action: string;
  examples: string[];
}

const intentsByLanguage: Record<Language, Intent[]> = {
  en: [
    {
      id: 1,
      phrase: "I want butter chicken",
      action: "add_item: butter_chicken",
      examples: [
        "Get me butter chicken",
        "Add butter chicken to cart",
        "One butter chicken please",
      ],
    },
    {
      id: 2,
      phrase: "Show popular items",
      action: "filter_bcg: star",
      examples: [
        "What's popular?",
        "Show me bestsellers",
        "Most ordered items",
      ],
    },
    {
      id: 3,
      phrase: "Make it spicy",
      action: "modifier: extra_spicy",
      examples: ["Extra spicy", "Hot and spicy", "Add more spice"],
    },
  ],
  hi: [
    {
      id: 1,
      phrase: "मुझे बटर चिकन चाहिए",
      action: "add_item: butter_chicken",
      examples: [
        "बटर चिकन दो",
        "एक बटर चिकन",
        "बटर चिकन कार्ट में डालो",
      ],
    },
    {
      id: 2,
      phrase: "लोकप्रिय आइटम दिखाओ",
      action: "filter_bcg: star",
      examples: ["क्या लोकप्रिय है?", "बेस्ट सेलर दिखाओ", "सबसे ज्यादा ऑर्डर"],
    },
    {
      id: 3,
      phrase: "तीखा बनाओ",
      action: "modifier: extra_spicy",
      examples: ["ज्यादा तीखा", "एक्स्ट्रा स्पाइसी", "मसाला ज्यादा"],
    },
  ],
  hinglish: [
    {
      id: 1,
      phrase: "Mujhe butter chicken chahiye",
      action: "add_item: butter_chicken",
      examples: [
        "Ek butter chicken do",
        "Butter chicken add karo",
        "I want butter chicken",
      ],
    },
    {
      id: 2,
      phrase: "Popular items dikhaao",
      action: "filter_bcg: star",
      examples: ["Kya popular hai?", "Bestseller batao", "Most ordered kya hai"],
    },
    {
      id: 3,
      phrase: "Spicy banaao",
      action: "modifier: extra_spicy",
      examples: ["Extra spicy karo", "Teekha chahiye", "More masala"],
    },
  ],
};

const fuzzyRules = [
  {
    pattern: "chicken.*curry",
    maps_to: "butter_chicken",
    confidence: 85,
  },
  {
    pattern: "bread|roti",
    maps_to: "garlic_naan",
    confidence: 75,
  },
  {
    pattern: "rice|biryani",
    maps_to: "chicken_biryani",
    confidence: 90,
  },
];

export default function VoiceBotConfig() {
  const [selectedLanguage, setSelectedLanguage] = useState<Language>("en");
  const [testInput, setTestInput] = useState("");
  const [testResult, setTestResult] = useState<string | null>(null);

  const handleTest = () => {
    setTestResult(
      `Detected: "add_item: butter_chicken" (Confidence: 92%)`
    );
    toast.success("Test completed");
  };

  const handleSave = () => {
    toast.success("Voice bot configuration saved");
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="mb-2">Voice Bot Configuration</h2>
        <p className="text-muted-foreground">
          Manage voice intents and fuzzy matching rules
        </p>
      </div>

      {/* Language Tabs */}
      <div className="flex gap-2 mb-8">
        {(["en", "hi", "hinglish"] as Language[]).map((lang) => (
          <button
            key={lang}
            onClick={() => setSelectedLanguage(lang)}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              selectedLanguage === lang
                ? "bg-saffron text-white"
                : "bg-white border border-cream-dark text-charcoal hover:border-saffron"
            }`}
          >
            {lang === "en" && "English"}
            {lang === "hi" && "हिंदी"}
            {lang === "hinglish" && "Hinglish"}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Intent Editor */}
        <div className="lg:col-span-2">
          <h3 className="mb-6">Intent Patterns</h3>
          <div className="space-y-4">
            {intentsByLanguage[selectedLanguage].map((intent) => (
              <ZaikaCard key={intent.id}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="mb-3">
                      <label className="block text-sm text-muted-foreground mb-2">
                        Trigger Phrase
                      </label>
                      <input
                        type="text"
                        value={intent.phrase}
                        className="w-full h-10 px-3 bg-cream border border-cream-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-saffron"
                        readOnly
                      />
                    </div>

                    <div className="mb-3">
                      <label className="block text-sm text-muted-foreground mb-2">
                        Action
                      </label>
                      <input
                        type="text"
                        value={intent.action}
                        className="w-full h-10 px-3 bg-cream border border-cream-dark rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-saffron"
                        readOnly
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-muted-foreground mb-2">
                        Example Variations
                      </label>
                      <div className="space-y-1">
                        {intent.examples.map((example, idx) => (
                          <div
                            key={idx}
                            className="text-sm bg-cream px-3 py-2 rounded"
                          >
                            "{example}"
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button className="p-2 hover:bg-cream rounded-lg transition-colors ml-3">
                    <Trash2 className="text-error" size={18} />
                  </button>
                </div>
              </ZaikaCard>
            ))}

            <ZaikaButton variant="secondary" className="w-full">
              + Add New Intent
            </ZaikaButton>
          </div>
        </div>

        {/* Test Panel */}
        <div>
          <h3 className="mb-6">Test Voice Input</h3>
          <ZaikaCard className="sticky top-8">
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-2">
                  Test Phrase
                </label>
                <textarea
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  placeholder="Enter a test phrase..."
                  className="w-full h-24 px-3 py-2 bg-cream border border-cream-dark rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-saffron"
                />
              </div>

              <ZaikaButton
                variant="primary"
                className="w-full"
                onClick={handleTest}
              >
                <Play size={16} className="mr-2" />
                Run Test
              </ZaikaButton>

              {testResult && (
                <div className="p-4 bg-success/10 rounded-lg">
                  <p className="text-sm font-medium text-success mb-1">
                    ✓ Match Found
                  </p>
                  <p className="text-sm text-muted-foreground">{testResult}</p>
                </div>
              )}

              <div className="p-4 bg-turmeric/10 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  Test your voice intents to ensure they're correctly
                  recognized before deploying to production.
                </p>
              </div>
            </div>
          </ZaikaCard>
        </div>
      </div>

      {/* Fuzzy Match Rules */}
      <div className="mb-8">
        <h3 className="mb-6">Fuzzy Matching Rules</h3>
        <ZaikaCard>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-cream-dark">
                <tr className="text-left">
                  <th className="pb-3 pr-4 font-medium text-sm text-muted-foreground">
                    Pattern (Regex)
                  </th>
                  <th className="pb-3 pr-4 font-medium text-sm text-muted-foreground">
                    Maps To
                  </th>
                  <th className="pb-3 pr-4 font-medium text-sm text-muted-foreground">
                    Confidence
                  </th>
                  <th className="pb-3 font-medium text-sm text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {fuzzyRules.map((rule, index) => (
                  <tr
                    key={index}
                    className="border-b border-cream-dark last:border-0"
                  >
                    <td className="py-4 pr-4">
                      <code className="bg-cream px-2 py-1 rounded text-sm font-mono">
                        {rule.pattern}
                      </code>
                    </td>
                    <td className="py-4 pr-4">
                      <span className="text-sm">{rule.maps_to}</span>
                    </td>
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-cream-dark rounded-full overflow-hidden max-w-[100px]">
                          <div
                            className="h-full bg-success"
                            style={{ width: `${rule.confidence}%` }}
                          />
                        </div>
                        <span className="font-mono text-xs text-muted-foreground">
                          {rule.confidence}%
                        </span>
                      </div>
                    </td>
                    <td className="py-4">
                      <button className="text-saffron hover:text-saffron-dark text-sm">
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ZaikaButton variant="secondary" size="sm" className="mt-4">
            + Add Fuzzy Rule
          </ZaikaButton>
        </ZaikaCard>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <ZaikaButton variant="primary" size="lg" onClick={handleSave}>
          <Save size={20} className="mr-2" />
          Save Configuration
        </ZaikaButton>
      </div>

      {/* Info */}
      <ZaikaCard className="mt-6 bg-turmeric/10">
        <h4 className="mb-3">Configuration Guide</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>
            • <strong>Intents:</strong> Define trigger phrases and their
            corresponding actions
          </li>
          <li>
            • <strong>Examples:</strong> Add variations to improve recognition
            accuracy
          </li>
          <li>
            • <strong>Fuzzy Rules:</strong> Handle misspellings and variations
            using regex patterns
          </li>
          <li>
            • <strong>Testing:</strong> Always test new intents before saving
          </li>
        </ul>
      </ZaikaCard>
    </div>
  );
}
