import { useState, useRef, useEffect } from "react";
import { ZaikaButton } from "../../components/zaika/ZaikaButton";
import { ZaikaCard } from "../../components/zaika/ZaikaCard";
import { Send, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Message {
  id: number;
  type: "user" | "ai";
  text: string;
  timestamp: Date;
  suggestions?: { name: string; price: number; id: number }[];
}

const quickStarts = [
  "Show me popular items",
  "What's good for vegetarians?",
  "I want something spicy",
  "Suggest a combo meal",
];

export default function ChatOrder() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      type: "ai",
      text: "Namaste! Main aapki madad ke liye yahaan hoon. Aaj aap kya order karna chahenge?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: messages.length + 1,
      type: "user",
      text: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: messages.length + 2,
        type: "ai",
        text: "Great choice! Here are some items I'd recommend:",
        timestamp: new Date(),
        suggestions: [
          { id: 1, name: "Butter Chicken", price: 450 },
          { id: 2, name: "Tandoori Chicken", price: 380 },
          { id: 3, name: "Garlic Naan", price: 80 },
        ],
      };
      setMessages((prev) => [...prev, aiMessage]);
    }, 1000);
  };

  const handleQuickStart = (text: string) => {
    setInput(text);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 h-[calc(100vh-8rem)]">
      <div className="flex flex-col h-full bg-white rounded-[var(--radius-xl)] [box-shadow:var(--shadow-card)]">
        {/* Header */}
        <div className="p-6 border-b border-cream-dark">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-saffron to-saffron-light flex items-center justify-center">
              <Sparkles className="text-white" size={20} />
            </div>
            <div>
              <h3>Zaika AI Assistant</h3>
              <p className="text-sm text-muted-foreground">
                Hinglish Support • Always Online
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex ${
                  message.type === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] ${
                    message.type === "user"
                      ? "bg-saffron text-white rounded-[18px_18px_4px_18px]"
                      : "bg-white border border-cream-dark rounded-[18px_18px_18px_4px]"
                  } px-4 py-3`}
                >
                  <p className="mb-1">{message.text}</p>

                  {/* Suggestion Cards */}
                  {message.suggestions && (
                    <div className="mt-3 space-y-2">
                      {message.suggestions.map((item) => (
                        <div
                          key={item.id}
                          className="bg-cream rounded-lg p-3 flex items-center justify-between gap-3"
                        >
                          <div className="text-charcoal">
                            <p className="font-medium text-sm">{item.name}</p>
                            <p className="text-xs font-mono text-saffron">
                              ₹{item.price}
                            </p>
                          </div>
                          <button className="px-3 py-1 bg-saffron text-white text-xs rounded-lg hover:bg-saffron-dark">
                            Add
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <p className="text-xs opacity-70 mt-2">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Start Chips */}
        {messages.length === 1 && (
          <div className="px-6 pb-4">
            <p className="text-sm text-muted-foreground mb-3">Quick starts:</p>
            <div className="flex flex-wrap gap-2">
              {quickStarts.map((chip) => (
                <button
                  key={chip}
                  onClick={() => handleQuickStart(chip)}
                  className="px-4 py-2 bg-cream text-charcoal rounded-full text-sm hover:bg-cream-dark transition-colors"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-6 border-t border-cream-dark">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              placeholder="Type your message... (English/Hindi/Hinglish)"
              className="flex-1 h-12 px-4 bg-cream border border-cream-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-saffron"
            />
            <button
              onClick={handleSend}
              className="w-12 h-12 bg-saffron text-white rounded-lg flex items-center justify-center hover:bg-saffron-light transition-colors"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
