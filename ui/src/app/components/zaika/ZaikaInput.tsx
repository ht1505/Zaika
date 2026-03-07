import { InputHTMLAttributes, forwardRef } from "react";

interface ZaikaInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const ZaikaInput = forwardRef<HTMLInputElement, ZaikaInputProps>(
  ({ label, error, className = "", ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block mb-2 text-charcoal font-medium">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full h-12 px-4 bg-white border-[1.5px] border-cream-dark rounded-lg 
            focus:outline-none focus:ring-3 focus:ring-saffron focus:border-saffron
            transition-all duration-200 ${error ? "border-error" : ""} ${className}`}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-error">{error}</p>}
      </div>
    );
  }
);

ZaikaInput.displayName = "ZaikaInput";
