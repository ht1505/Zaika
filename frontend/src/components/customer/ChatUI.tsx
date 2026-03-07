import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, ShoppingCart, Sparkles, Mic, MicOff, Volume2 } from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const VOICE_SESSION_ID = `web_${Math.random().toString(36).slice(2, 10)}`;

interface CartUpdate {
  action: 'add' | 'remove';
  item_id: string; item_name: string;
  qty: number; price: number; modifiers: any[];
}
interface Message {
  id: string; role: 'user' | 'assistant';
  content: string; cart_updates?: CartUpdate[];
  timestamp: Date; isVoice?: boolean;
}
type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking';

const STARTER_PROMPTS = [
  { label: "Today's bestsellers", emoji: '⭐' },
  { label: 'Kuch veg suggest karo', emoji: '🌿' },
  { label: 'Ek Paneer Butter Masala chahiye', emoji: '🍛' },
  { label: 'Budget mein kya milega?', emoji: '💰' },
  { label: 'Spicy items dikhao', emoji: '🌶️' },
  { label: 'Kuch meetha hai?', emoji: '🍮' },
];

const INITIAL_MESSAGE: Message = {
  id: '0', role: 'assistant',
  content: "Namaste! 🙏 Main Zaika ka AI assistant hoon!\n\nAap kya order karna chahenge? Main English ya Hinglish dono mein help kar sakta hoon. Neeche se koi option choose karein ya khud type karein — ya mic 🎤 dabake bolein! 😊",
  timestamp: new Date(),
};

// Renders **bold** *italic* and bullet lists properly
function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  lines.forEach((line, idx) => {
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ') || line.trim().startsWith('• ')) {
      elements.push(<li key={idx} className="ml-4 list-disc leading-relaxed">{inlineFormat(line.trim().slice(2))}</li>);
    } else if (/^\d+\.\s/.test(line.trim())) {
      elements.push(<li key={idx} className="ml-4 list-decimal leading-relaxed">{inlineFormat(line.trim().replace(/^\d+\.\s/, ''))}</li>);
    } else if (line.trim() === '') {
      elements.push(<div key={idx} className="h-1.5" />);
    } else {
      elements.push(<p key={idx} className="leading-relaxed">{inlineFormat(line)}</p>);
    }
  });
  return <>{elements}</>;
}

function inlineFormat(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**'))
      return <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>;
    if (part.startsWith('*') && part.endsWith('*'))
      return <em key={i}>{part.slice(1, -1)}</em>;
    return <span key={i}>{part}</span>;
  });
}

export default function ChatUI() {
  const [messages, setMessages]     = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [ordered, setOrdered]       = useState(false);
  const [language, setLanguage]     = useState<'hinglish' | 'english'>('hinglish');
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const synthRef       = useRef<SpeechSynthesis | null>(null);
  const { addItem, clearCart } = useCart();

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window)
      synthRef.current = window.speechSynthesis;
  }, []);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const speak = useCallback((text: string) => {
    if (!synthRef.current) return;
    synthRef.current.cancel();
    const clean = text.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1').replace(/[*_]/g, '');
    const utt = new SpeechSynthesisUtterance(clean);
    utt.lang  = language === 'hinglish' ? 'hi-IN' : 'en-IN';
    utt.rate  = 1.0;
    utt.onstart = () => setVoiceState('speaking');
    utt.onend   = () => setVoiceState('idle');
    utt.onerror = () => setVoiceState('idle');
    synthRef.current.speak(utt);
  }, [language]);

  const resetChat = () => {
    fetch('http://localhost:8000/cart/clear', { method: 'POST' }).catch(() => {});
    clearCart();
    setOrdered(false); setInput(''); setTranscript('');
    setVoiceState('idle'); synthRef.current?.cancel();
    setMessages([{ ...INITIAL_MESSAGE, id: Date.now().toString(), timestamp: new Date() }]);
  };

  const sendMessage = async (text?: string, silent = false, fromVoice = false) => {
    const msgText = (text || input).trim();
    if (!msgText || loading || ordered) return;
    if (!silent) setInput('');
    setTranscript('');

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: msgText, timestamp: new Date(), isVoice: fromVoice };
    if (!silent) setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      let aiData: any;
      if (fromVoice) {
        const res = await fetch('http://localhost:8001/api/voice/process', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: VOICE_SESSION_ID, transcript: msgText }),
        });
        const d = await res.json();
        aiData = { reply: d.reply, cart: (d.cart || []).map((i: any) => ({ name: i.food_name, price: i.price, qty: i.qty })), cart_total: d.cart_total };
        speak(d.reply);
      } else {
        const res = await fetch(`http://localhost:8000/chat?message=${encodeURIComponent(msgText)}`);
        aiData = await res.json();
      }

      const cartUpdates: CartUpdate[] = (aiData.cart || []).map((item: any) => ({
        action: 'add' as const, item_id: item.name, item_name: item.name, qty: item.qty, price: item.price, modifiers: [],
      }));

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(), role: 'assistant',
        content: aiData.reply || 'Yeh options try karein 👇',
        cart_updates: cartUpdates, timestamp: new Date(), isVoice: fromVoice,
      }]);

      const prevCartNames = messages.flatMap(m => m.cart_updates || []).map(u => u.item_name);
      const newItems = cartUpdates.filter(u => !prevCartNames.includes(u.item_name));
      if (newItems.length > 0) {
        for (const u of newItems) addItem({ item_id: u.item_id, name: u.item_name, price: u.price, qty: u.qty || 1, modifiers: [] });
        toast.success(`${newItems.map(u => u.item_name).join(', ')} added!`, { icon: '🛒' });
      }

      if (aiData.reply?.includes('Order Placed') || aiData.reply?.includes('Order confirmed')) {
        setOrdered(true);
        setTimeout(() => setMessages(prev => [...prev, { id: (Date.now()+2).toString(), role:'assistant', content:'🎉 Order confirmed! Fresh chat in 3s...', timestamp: new Date() }]), 500);
        setTimeout(resetChat, 3500);
      }
    } catch {
      setMessages(prev => [...prev, { id: (Date.now()+1).toString(), role:'assistant', content:'Sorry, kuch problem aayi. Dobara try karein. 🙏', timestamp: new Date() }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const startListening = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { toast.error('Voice not supported. Try Chrome.', { icon: '🎤' }); return; }
    synthRef.current?.cancel();
    const recognition = new SR();
    recognitionRef.current = recognition;
    recognition.lang = language === 'hinglish' ? 'hi-IN' : 'en-IN';
    recognition.interimResults = true; recognition.continuous = false; recognition.maxAlternatives = 1;
    recognition.onstart = () => { setVoiceState('listening'); setTranscript(''); };
    recognition.onresult = (e: any) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) recognitionRef.current._finalText = t;
        else interim += t;
      }
      setTranscript(recognitionRef.current._finalText || interim);
    };
    recognition.onend = () => {
      setVoiceState('processing');
      const ft = recognitionRef.current?._finalText;
      if (ft) sendMessage(ft, false, true);
      else { setVoiceState('idle'); setTranscript(''); }
    };
    recognition.onerror = (e: any) => {
      setVoiceState('idle'); setTranscript('');
      if (e.error !== 'aborted') toast.error(`Voice error: ${e.error}`, { icon: '🎤' });
    };
    recognition.start();
  }, [language, sendMessage]);

  const stopListening = useCallback(() => { recognitionRef.current?.stop(); }, []);
  const handleMicClick = () => {
    if (voiceState === 'listening') stopListening();
    else if (voiceState === 'idle') startListening();
    else if (voiceState === 'speaking') { synthRef.current?.cancel(); setVoiceState('idle'); }
  };

  const micButtonClass = clsx(
    'flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200',
    voiceState === 'listening'  ? 'bg-red-500 text-white animate-pulse shadow-lg' :
    voiceState === 'processing' ? 'bg-yellow-100 text-yellow-600' :
    voiceState === 'speaking'   ? 'bg-green-100 text-green-600' :
                                  'bg-orange-100 text-saffron',
    (loading || ordered) && 'opacity-50 cursor-not-allowed'
  );

  return (
    <div className="flex flex-col h-full rounded-2xl border overflow-hidden shadow-card"
      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>

      {/* Header */}
      <div className="px-5 py-3.5 border-b flex items-center justify-between"
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-subtle)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-saffron to-orange-400 rounded-xl flex items-center justify-center">
            <Sparkles size={17} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-sm" style={{ fontFamily: "'Fraunces', serif", color: 'var(--text-primary)' }}>
              Zaika AI Assistant
            </h3>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs font-medium" style={{ color: 'var(--text-faint)' }}>Smart ordering • Hinglish • Voice 🎤</span>
            </div>
          </div>
        </div>
        <div className="flex gap-1 border p-1 rounded-lg" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)' }}>
          {(['hinglish', 'english'] as const).map(l => (
            <button key={l} onClick={() => setLanguage(l)}
              className={clsx('text-xs font-semibold px-2.5 py-1 rounded-md transition-all', language === l ? 'bg-saffron text-white' : '')}
              style={language !== l ? { color: 'var(--text-faint)' } : {}}>
              {l === 'hinglish' ? 'हि/EN' : 'EN'}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map(msg => (
          <div key={msg.id} className={clsx('flex gap-2.5 animate-fade-in', msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}>
            <div className={clsx('w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5',
              msg.role === 'user' ? 'bg-saffron' : '')}
              style={msg.role !== 'user' ? { backgroundColor: 'var(--bg-subtle)' } : {}}>
              {msg.role === 'user'
                ? (msg.isVoice ? <Mic size={13} className="text-white" /> : <User size={13} className="text-white" />)
                : <Bot size={13} className="text-saffron" />}
            </div>
            <div className={clsx('space-y-2 max-w-[80%]', msg.role === 'user' ? 'items-end flex flex-col' : '')}>
              <div className={msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}>
                {msg.isVoice && msg.role === 'assistant' && (
                  <div className="flex items-center gap-1 mb-1 opacity-60">
                    <Volume2 size={10} className="text-saffron" />
                    <span className="text-xs" style={{ color: 'var(--text-faint)' }}>voice reply</span>
                  </div>
                )}
                {msg.role === 'assistant'
                  ? <div className="text-sm space-y-0.5">{renderMarkdown(msg.content)}</div>
                  : <p className="text-sm leading-relaxed">{msg.content}</p>}
              </div>
              {msg.cart_updates && msg.cart_updates.filter(u => u.action === 'add').length > 0 && (
                <div className="flex items-center gap-2 bg-green-50 dark:bg-green-950/30 border border-green-100 dark:border-green-900 rounded-xl px-3 py-2">
                  <ShoppingCart size={13} className="text-green-600 flex-shrink-0" />
                  <p className="text-xs text-green-700 dark:text-green-400 font-semibold">
                    {msg.cart_updates.filter(u => u.action === 'add').map(u => `${u.item_name} ×${u.qty}`).join(', ')} added!
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-2.5 animate-fade-in">
            <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--bg-subtle)' }}>
              <Bot size={13} className="text-saffron" />
            </div>
            <div className="chat-bubble-ai">
              <div className="flex gap-1 py-0.5">
                {[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-orange-300 rounded-full animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Starter prompts */}
      {messages.length <= 1 && (
        <div className="px-4 pb-3">
          <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-faint)' }}>Quick start</p>
          <div className="flex flex-wrap gap-2">
            {STARTER_PROMPTS.map((p, i) => (
              <button key={i} onClick={() => sendMessage(p.label)}
                className="text-xs font-semibold border px-3 py-1.5 rounded-full transition-colors flex items-center gap-1"
                style={{ color: 'var(--saffron)', borderColor: 'var(--border)', backgroundColor: 'var(--bg-subtle)' }}>
                <span>{p.emoji}</span> {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Voice bar */}
      {(voiceState !== 'idle' || transcript) && (
        <div className={clsx('mx-4 mb-2 px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs font-medium transition-all',
          voiceState === 'listening'  ? 'bg-red-50 border border-red-200 text-red-600 dark:bg-red-950/30 dark:border-red-900' :
          voiceState === 'processing' ? 'bg-yellow-50 border border-yellow-200 text-yellow-700 dark:bg-yellow-950/30 dark:border-yellow-900' :
          'bg-green-50 border border-green-200 text-green-700 dark:bg-green-950/30 dark:border-green-900'
        )}>
          {voiceState === 'listening'  && <Mic size={13} className="animate-pulse flex-shrink-0" />}
          {voiceState === 'processing' && <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin flex-shrink-0" />}
          {voiceState === 'speaking'   && <Volume2 size={13} className="flex-shrink-0" />}
          <span className="flex-1 truncate">{transcript || (voiceState === 'listening' ? 'Listening...' : voiceState === 'processing' ? 'Processing...' : 'Speaking...')}</span>
          {voiceState === 'listening' && <span className="opacity-60">Tap mic to stop</span>}
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3 border-t" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-subtle)' }}>
        {ordered ? (
          <div className="text-center py-2">
            <p className="text-xs text-saffron font-semibold animate-pulse">✅ Order placed! Starting fresh chat...</p>
          </div>
        ) : (
          <div className="flex gap-2">
            <button onClick={handleMicClick} disabled={loading || ordered || voiceState === 'processing'} className={micButtonClass}
              title={voiceState === 'listening' ? 'Stop' : voiceState === 'speaking' ? 'Stop speaking' : 'Voice input'}>
              {voiceState === 'listening' ? <MicOff size={15} /> : voiceState === 'speaking' ? <Volume2 size={15} /> : <Mic size={15} />}
            </button>
            <input ref={inputRef} className="input text-sm flex-1"
              placeholder={voiceState === 'listening' ? '🎤 Listening...' : language === 'hinglish' ? 'Kya order karna hai?' : 'What would you like?'}
              value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              disabled={loading || ordered || voiceState === 'listening'} />
            <button onClick={() => sendMessage()} disabled={loading || !input.trim() || ordered} className="btn-primary px-4 py-2.5 flex-shrink-0">
              <Send size={15} />
            </button>
          </div>
        )}
        {!ordered && voiceState === 'idle' && (
          <p className="text-xs mt-1.5 text-center font-medium" style={{ color: 'var(--text-faint)' }}>
            Try: "2 Paneer Butter Masala" • "kuch veg suggest karo" • or tap 🎤
          </p>
        )}
      </div>
    </div>
  );
}