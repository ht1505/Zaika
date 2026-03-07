import { useState } from "react";
import { motion } from "motion/react";
import { ZaikaButton } from "../../components/zaika/ZaikaButton";
import { ZaikaCard } from "../../components/zaika/ZaikaCard";
import { Mic, MicOff } from "lucide-react";

type VoiceState = "idle" | "listening" | "processing" | "result";

export default function VoiceOrder() {
  const [state, setState] = useState<VoiceState>("idle");
  const [transcript, setTranscript] = useState("");
  const [confidence, setConfidence] = useState(0);

  const handleMicToggle = () => {
    if (state === "idle") {
      setState("listening");
      setTranscript("");
      setConfidence(0);

      // Simulate voice recognition
      setTimeout(() => {
        setTranscript("Mujhe ek butter chicken aur do garlic naan chahiye");
      }, 1500);

      setTimeout(() => {
        setState("processing");
      }, 3000);

      setTimeout(() => {
        setState("result");
        setConfidence(95);
      }, 4000);
    } else {
      setState("idle");
      setTranscript("");
      setConfidence(0);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h2 className="mb-2">Voice Order</h2>
        <p className="text-muted-foreground">
          Speak naturally in English, Hindi, or Hinglish
        </p>
      </div>

      <div className="space-y-8">
        {/* Microphone Button */}
        <div className="flex justify-center">
          <div className="relative">
            {/* Ripple Rings */}
            {state === "listening" && (
              <>
                {[0, 0.5, 1].map((delay) => (
                  <motion.div
                    key={delay}
                    className="absolute inset-0 rounded-full border-4 border-error"
                    initial={{ scale: 1, opacity: 0.8 }}
                    animate={{ scale: 2, opacity: 0 }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: delay * 0.5,
                    }}
                    style={{ width: "80px", height: "80px" }}
                  />
                ))}
              </>
            )}

            {/* Main Button */}
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={handleMicToggle}
              className={`w-20 h-20 rounded-full flex items-center justify-center [box-shadow:var(--shadow-warm)] transition-colors ${
                state === "listening"
                  ? "bg-error"
                  : "bg-saffron hover:bg-saffron-light"
              }`}
            >
              {state === "listening" ? (
                <MicOff className="text-white" size={32} />
              ) : (
                <Mic className="text-white" size={32} />
              )}
            </motion.button>
          </div>
        </div>

        {/* State Indicator */}
        <div className="text-center">
          {state === "idle" && (
            <p className="text-lg text-muted-foreground">
              Tap the microphone to start
            </p>
          )}
          {state === "listening" && (
            <p className="text-lg text-error font-medium">Listening...</p>
          )}
          {state === "processing" && (
            <p className="text-lg text-saffron font-medium">Processing...</p>
          )}
          {state === "result" && (
            <p className="text-lg text-success font-medium">Order recognized!</p>
          )}
        </div>

        {/* Waveform Animation */}
        {state === "listening" && (
          <div className="flex items-center justify-center gap-1 h-16">
            {Array.from({ length: 12 }).map((_, i) => (
              <motion.div
                key={i}
                className="w-1 bg-saffron rounded-full"
                animate={{
                  height: ["20%", "100%", "20%"],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.05,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
        )}

        {/* Live Transcript */}
        {transcript && (
          <ZaikaCard>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Transcript:
                </p>
                <p className="text-lg">{transcript}</p>
              </div>

              {state === "result" && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Confidence:
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-cream-dark rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-success"
                        initial={{ width: 0 }}
                        animate={{ width: `${confidence}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                    <span className="font-mono text-sm">{confidence}%</span>
                  </div>
                </div>
              )}
            </div>
          </ZaikaCard>
        )}

        {/* Recognized Items */}
        {state === "result" && (
          <ZaikaCard>
            <h3 className="mb-4">Recognized Items</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-cream-dark">
                <div>
                  <p className="font-medium">Butter Chicken</p>
                  <p className="text-sm text-muted-foreground">Quantity: 1</p>
                </div>
                <p className="font-mono text-saffron">₹450</p>
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-cream-dark">
                <div>
                  <p className="font-medium">Garlic Naan</p>
                  <p className="text-sm text-muted-foreground">Quantity: 2</p>
                </div>
                <p className="font-mono text-saffron">₹160</p>
              </div>
              <div className="flex items-center justify-between pt-3">
                <p className="font-medium">Total</p>
                <p className="font-mono text-xl text-saffron">₹610</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <ZaikaButton variant="secondary" className="flex-1">
                Edit Order
              </ZaikaButton>
              <ZaikaButton variant="primary" className="flex-1">
                Add to Cart
              </ZaikaButton>
            </div>
          </ZaikaCard>
        )}

        {/* Instructions */}
        <ZaikaCard className="bg-turmeric/10">
          <h4 className="mb-3">Voice Tips</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Speak clearly and naturally</li>
            <li>• Mention quantity and item names</li>
            <li>• You can use English, Hindi, or Hinglish</li>
            <li>
              • Example: "I want two butter chicken and three garlic naan"
            </li>
          </ul>
        </ZaikaCard>
      </div>
    </div>
  );
}
