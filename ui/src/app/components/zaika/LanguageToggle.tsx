import { useState } from "react";

type Language = "en" | "hi" | "hinglish";

interface LanguageToggleProps {
  onChange?: (lang: Language) => void;
}

export function LanguageToggle({ onChange }: LanguageToggleProps) {
  const [selected, setSelected] = useState<Language>("en");

  const handleChange = (lang: Language) => {
    setSelected(lang);
    onChange?.(lang);
  };

  const options: { value: Language; label: string }[] = [
    { value: "hi", label: "हि" },
    { value: "hinglish", label: "हिंदी" },
    { value: "en", label: "EN" },
  ];

  return (
    <div className="inline-flex bg-cream-dark rounded-full p-1">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => handleChange(option.value)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
            selected === option.value
              ? "bg-saffron text-white"
              : "text-charcoal hover:bg-cream"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
