import { useState, useRef, useEffect } from 'react';
import {
  Mic, MicOff, Phone, PhoneOff, ShoppingCart,
  CheckCircle, AlertCircle, Volume2, RefreshCw
} from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import toast from 'react-hot-toast';
import clsx from 'clsx';

// ─── Constants ────────────────────────────────────────────────────────────────
const BRIDGE_URL = 'http://localhost:8000';
const SESSION_ID = `web_${Math.random().toString(36).slice(2, 10)}`;

const LANG_CODES: Record<string, string> = {
  hinglish: 'hi-IN',
  hindi:    'hi-IN',
  english:  'en-IN',
};

const EXAMPLE_PHRASES = [
  { lang: 'Hinglish', text: '"Ek Butter Chicken aur do Garlic Naan"' },
  { lang: 'Hindi',    text: '"Mujhe ek chicken biryani chahiye"' },
  { lang: 'English',  text: '"One paneer tikka and two mango lassi"' },
];

// ─── Types ────────────────────────────────────────────────────────────────────
type VoiceState = 'idle' | 'listening' | 'processing' | 'result' | 'error';
type VoiceMode  = 'browser' | 'phone';

interface VoiceCartItem {
  food_name: string;
  price: number;
  qty: number;
}

interface BotResponse {
  reply: string;
  state: string;
  cart: VoiceCartItem[];
  cart_total: number;
  suggestions: { food_name: string; price: number }[];
  menu_options: { food_name: string; price: number }[];
  menu_category: string;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function VoiceUI() {
  const [voiceState, setVoiceState]   = useState<VoiceState>('idle');
  const [voiceMode, setVoiceMode]     = useState<VoiceMode>('browser');
  const [transcript, setTranscript]   = useState('');
  const [liveText, setLiveText]       = useState('');
  const [botResponse, setBotResponse] = useState<BotResponse | null>(null);
  const [language, setLanguage]       = useState<'hinglish' | 'hindi' | 'english'>('hinglish');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [callActive, setCallActive]   = useState(false);
  const [isSpeaking, setIsSpeaking]   = useState(false);

  const recognitionRef = useRef<any>(null);
  const synthRef       = useRef<SpeechSynthesis | null>(null);
  const finalTextRef   = useRef<string>('');
  const lastCartRef    = useRef<string>('');
  const keepAliveRef   = useRef<any>(null);

  const { addItem, clearCart } = useCart();

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
    return () => {
      recognitionRef.current?.stop();
      synthRef.current?.cancel();
      if (keepAliveRef.current) clearInterval(keepAliveRef.current);
    };
  }, []);

  // ── TTS — chunked into sentences to fix Chrome's ~15s cutoff bug ─────────────
  const speak = (text: string) => {
    if (!synthRef.current) return;
    synthRef.current.cancel();
    if (keepAliveRef.current) clearInterval(keepAliveRef.current);

    const clean = text
      .replace(/[*_₹]/g, '')
      .replace(/Rs\./g, 'Rupees')
      .trim();

    if (!clean) return;

    const sentences = clean
      .split(/(?<=[.!?])\s+|,\s+(?=\w{4,})/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    setIsSpeaking(true);
    let index = 0;

    const speakNext = () => {
      if (index >= sentences.length) {
        setIsSpeaking(false);
        if (keepAliveRef.current) clearInterval(keepAliveRef.current);
        return;
      }

      const utt  = new SpeechSynthesisUtterance(sentences[index]);
      utt.lang   = LANG_CODES[language];
      utt.rate   = 1.0;
      utt.pitch  = 1.0;
      utt.volume = 1.0;

      utt.onend = () => { index++; speakNext(); };
      utt.onerror = (e) => {
        if ((e as any).error === 'interrupted') return;
        index++;
        speakNext();
      };

      synthRef.current!.speak(utt);
    };

    keepAliveRef.current = setInterval(() => {
      if (synthRef.current?.speaking) {
        synthRef.current.pause();
        synthRef.current.resume();
      } else {
        clearInterval(keepAliveRef.current);
      }
    }, 10000);

    speakNext();
  };

  const cancelSpeech = () => {
    if (keepAliveRef.current) clearInterval(keepAliveRef.current);
    synthRef.current?.cancel();
    setIsSpeaking(false);
  };

  // ── Sync voice bot cart → Zustand cart ───────────────────────────────────────
  // Only sync when the bot has a confirmed cart (not during disambiguation or suggestions)
  const CONFIRMED_STATES = new Set(['collecting', 'checkout_suggest', 'checkout_confirm', 'done']);

  const syncCart = (voiceCart: VoiceCartItem[]) => {
    const cartKey = JSON.stringify(voiceCart.map(i => `${i.food_name}:${i.qty}`));
    if (cartKey === lastCartRef.current) return;
    lastCartRef.current = cartKey;
    clearCart();
    for (const item of voiceCart) {
      addItem({ item_id: item.food_name, name: item.food_name, price: item.price, qty: item.qty, modifiers: [] });
    }
  };

  // ── Call the bridge ───────────────────────────────────────────────────────────
  const processTranscript = async (text: string) => {
    setVoiceState('processing');
    try {
      const res = await fetch(`${BRIDGE_URL}/api/voice/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: SESSION_ID, transcript: text, language }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: BotResponse = await res.json();

      setBotResponse(data);
      setVoiceState('result');
      speak(data.reply);

      // ✅ FIX: Only sync cart when the bot state is confirmed, not during
      // disambiguation — otherwise unconfirmed items bleed into the cart.
      if (data.cart && data.cart.length > 0 && CONFIRMED_STATES.has(data.state)) {
        syncCart(data.cart);
      }

      if (data.state === 'done') {
        toast.success('Order placed! 🎉', { duration: 3000 });
        setTimeout(() => resetSession(), 3500);
      }
    } catch (err) {
      console.error('Voice bridge error:', err);
      setVoiceState('error');
      toast.error('Could not reach backend. Make sure backend(1).py is running on port 8000.', { duration: 5000 });
    }
  };

  const continueConversation = (text: string) => {
    cancelSpeech();
    setTranscript(text);
    processTranscript(text);
  };

  // ── Browser speech recognition ───────────────────────────────────────────────
  const startListening = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      toast.error('Speech recognition not supported. Please use Chrome or Edge.');
      setVoiceState('error');
      return;
    }
    cancelSpeech();

    const recognition          = new SR();
    recognitionRef.current     = recognition;
    finalTextRef.current       = '';
    recognition.lang           = LANG_CODES[language];
    recognition.continuous     = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setVoiceState('listening');
      setLiveText('');
      setTranscript('');
      setBotResponse(null);
      finalTextRef.current = '';
    };

    recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalTextRef.current += t + ' ';
        else interim = t;
      }
      setLiveText(finalTextRef.current + interim);
    };

    recognition.onerror = (e: any) => {
      if (e.error === 'network') {
        toast.error(
          'Chrome blocks mic on HTTP. Go to chrome://flags → search "insecure origins" → add http://localhost:3000 → Relaunch.',
          { duration: 8000 }
        );
      } else if (e.error !== 'no-speech' && e.error !== 'aborted') {
        toast.error(`Mic error: ${e.error}. Try again.`);
      }
      setVoiceState('idle');
      setLiveText('');
    };

    recognition.onend = () => {
      const final = finalTextRef.current.trim();
      if (final) { setTranscript(final); processTranscript(final); }
      else { setVoiceState('idle'); setLiveText(''); }
    };

    try { recognition.start(); }
    catch { toast.error('Could not start mic. Please allow microphone access.'); setVoiceState('idle'); }
  };

  const stopListening = () => { recognitionRef.current?.stop(); };

  // ── Reset ────────────────────────────────────────────────────────────────────
  const resetSession = async () => {
    cancelSpeech();
    setVoiceState('idle');
    setTranscript('');
    setLiveText('');
    setBotResponse(null);
    finalTextRef.current = '';
    lastCartRef.current  = '';
    try {
      await fetch(`${BRIDGE_URL}/api/voice/reset`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: SESSION_ID }),
      });
    } catch {}
  };

  // ── Phone call (demo) ────────────────────────────────────────────────────────
  const initiatePhoneCall = () => {
    if (!phoneNumber.trim()) { toast.error('Please enter your phone number'); return; }
    setCallActive(true);
    toast.success(`Calling ${phoneNumber}... (Demo mode)`, { duration: 4000 });
    setTimeout(() => {
      toast('Voice bot: "Namaste! Zaika mein aapka swagat hai. Kya order karna hai?"',
        { icon: '🤖', duration: 5000 });
    }, 2000);
  };
  const endCall = () => { setCallActive(false); toast('Call ended', { icon: '📵' }); };

  // ── Derived ───────────────────────────────────────────────────────────────────
  const botState             = botResponse?.state ?? 'idle';
  const needsDisambiguation  = botState === 'disambiguate' && (botResponse?.menu_options?.length ?? 0) > 0;
  const needsSuggestionReply = botState === 'checkout_suggest';
  const needsCheckoutConfirm = botState === 'checkout_confirm';

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-lg mx-auto space-y-5">

      {/* Mode selector */}
      <div className="flex gap-2 bg-white border border-orange-100 rounded-xl p-1.5 shadow-sm">
        {(['browser', 'phone'] as VoiceMode[]).map(mode => (
          <button key={mode} onClick={() => setVoiceMode(mode)}
            className={clsx(
              'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-body font-semibold transition-all',
              voiceMode === mode ? 'bg-saffron text-white shadow-warm' : 'text-gray-500 hover:text-charcoal'
            )}>
            {mode === 'browser' ? <><Mic size={16} /> Browser Mic</> : <><Phone size={16} /> Phone Call</>}
          </button>
        ))}
      </div>

      {/* Language selector */}
      <div className="card p-4 flex items-center justify-between">
        <div>
          <p className="font-body font-semibold text-sm text-charcoal">Language</p>
          <p className="font-body text-xs text-gray-400">Bolo kisi bhi language mein</p>
        </div>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {(['hinglish', 'hindi', 'english'] as const).map(l => (
            <button key={l} onClick={() => setLanguage(l)}
              className={clsx(
                'text-xs font-body font-semibold px-3 py-1.5 rounded-lg transition-all',
                language === l ? 'bg-white text-saffron shadow-sm' : 'text-gray-400'
              )}>
              {l === 'hinglish' ? 'हि/EN' : l === 'hindi' ? 'हिंदी' : 'EN'}
            </button>
          ))}
        </div>
      </div>

      {/* ── BROWSER MIC PANEL ── */}
      {voiceMode === 'browser' && (
        <div className="card p-7 text-center space-y-5">
          <div className="relative inline-flex items-center justify-center">
            {voiceState === 'listening' && (
              <>
                <div className="absolute w-36 h-36 rounded-full border-2 border-saffron/20 animate-ping" />
                <div className="absolute w-28 h-28 rounded-full border-2 border-saffron/30 animate-ping" style={{ animationDelay: '0.3s' }} />
                <div className="absolute w-24 h-24 rounded-full bg-saffron/10 animate-pulse" />
              </>
            )}
            {isSpeaking && <div className="absolute w-28 h-28 rounded-full border-2 border-green-400/40 animate-ping" />}
            <button
              onClick={voiceState === 'listening' ? stopListening : startListening}
              disabled={voiceState === 'processing'}
              className={clsx(
                'relative w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-200 shadow-lg',
                voiceState === 'listening'  ? 'bg-red-500 hover:bg-red-600 scale-110' :
                voiceState === 'processing' ? 'bg-gray-200 cursor-not-allowed' :
                voiceState === 'error'      ? 'bg-red-100' :
                isSpeaking                  ? 'bg-green-500 hover:bg-green-600' :
                                              'bg-saffron hover:bg-orange-600 hover:scale-105'
              )}>
              {voiceState === 'listening'  ? <MicOff size={32} className="text-white" /> :
               voiceState === 'processing' ? <div className="w-7 h-7 border-2 border-saffron border-t-transparent rounded-full animate-spin" /> :
               isSpeaking                  ? <Volume2 size={32} className="text-white animate-pulse" /> :
                                             <Mic size={32} className="text-white" />}
            </button>
          </div>

          {voiceState === 'listening' && (
            <div className="flex justify-center items-end gap-1 h-8">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="w-1.5 bg-saffron rounded-full animate-bounce"
                  style={{ height: `${8 + (i % 3) * 8}px`, animationDelay: `${i * 0.08}s` }} />
              ))}
            </div>
          )}

          <div>
            <h3 className="font-display text-lg font-bold text-charcoal">
              {isSpeaking              ? 'Bot bol raha hai... 🔊' :
               voiceState === 'idle'       ? 'Tap to Speak' :
               voiceState === 'listening'  ? 'Sun raha hoon... 👂' :
               voiceState === 'processing' ? 'Order samajh raha hoon...' :
               voiceState === 'result'     ? 'Got it!' : 'Kuch problem aayi'}
            </h3>
            <p className="font-body text-sm text-gray-400 mt-1">
              {isSpeaking              ? 'Mic tap karein jawab dene ke liye' :
               voiceState === 'idle'       ? 'Speak in Hinglish, Hindi or English' :
               voiceState === 'listening'  ? 'Tap the mic again when done' :
               voiceState === 'processing' ? 'Matching to menu items...' :
               voiceState === 'result'     ? 'Tap mic to continue ordering' : 'Please try again'}
            </p>
          </div>

          {liveText && voiceState === 'listening' && (
            <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 text-left">
              <div className="flex items-center gap-2 mb-1">
                <Volume2 size={13} className="text-saffron" />
                <span className="text-xs font-body font-semibold text-gray-500">Live transcript</span>
              </div>
              <p className="font-body text-sm text-charcoal italic">"{liveText}"</p>
            </div>
          )}
        </div>
      )}

      {/* ── BOT REPLY CARD ── */}
      {voiceState === 'result' && botResponse && voiceMode === 'browser' && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gray-50 flex gap-3 items-start">
            <CheckCircle size={18} className="text-green-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-body font-semibold text-xs text-gray-400 uppercase tracking-wide mb-1">Bot says</p>
              <p className="font-body text-sm text-charcoal leading-relaxed">{botResponse.reply}</p>
            </div>
            {isSpeaking && (
              <button onClick={cancelSpeech} title="Stop speaking">
                <Volume2 size={16} className="text-green-500 animate-pulse flex-shrink-0 mt-0.5" />
              </button>
            )}
          </div>

          {transcript && (
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
              <p className="text-xs font-body text-gray-400 italic">You said: "{transcript}"</p>
            </div>
          )}

          {botResponse.cart && botResponse.cart.length > 0 && (
            <div className="p-4 border-b border-gray-50">
              <p className="text-xs font-body font-semibold text-gray-400 uppercase tracking-wide mb-2">Your order so far</p>
              {botResponse.cart.map((item, i) => (
                <div key={i} className="flex justify-between items-center py-1.5">
                  <p className="font-body text-sm font-semibold text-charcoal">{item.food_name}</p>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">×{item.qty}</span>
                    <span className="font-body font-bold text-sm text-saffron">₹{item.price * item.qty}</span>
                  </div>
                </div>
              ))}
              <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between">
                <span className="text-xs font-body font-semibold text-gray-500">Total</span>
                <span className="font-body font-bold text-saffron">₹{botResponse.cart_total}</span>
              </div>
            </div>
          )}

          {needsDisambiguation && (
            <div className="p-4 border-b border-gray-50">
              <p className="text-xs font-body font-semibold text-gray-400 uppercase tracking-wide mb-2">Choose one</p>
              <div className="flex flex-wrap gap-2">
                {botResponse.menu_options.map((opt, i) => (
                  <button key={i} onClick={() => continueConversation(opt.food_name)}
                    className="text-sm font-body bg-orange-50 text-saffron border border-orange-100 px-3 py-1.5 rounded-full hover:bg-orange-100 transition-colors">
                    {opt.food_name} — ₹{opt.price}
                  </button>
                ))}
              </div>
            </div>
          )}

          {needsSuggestionReply && (
            <div className="p-4 border-b border-gray-50 flex gap-2">
              <button onClick={() => continueConversation('yes')}
                className="flex-1 bg-green-50 text-green-700 border border-green-200 font-body font-semibold text-sm py-2 rounded-xl hover:bg-green-100 transition-colors">
                Yes, add it!
              </button>
              <button onClick={() => continueConversation('no')}
                className="flex-1 bg-gray-50 text-gray-600 border border-gray-200 font-body font-semibold text-sm py-2 rounded-xl hover:bg-gray-100 transition-colors">
                Skip
              </button>
            </div>
          )}

          {needsCheckoutConfirm && (
            <div className="p-4 border-b border-gray-50 flex gap-2">
              <button onClick={() => continueConversation('yes')}
                className="flex-1 bg-saffron text-white font-body font-semibold text-sm py-2 rounded-xl hover:bg-orange-600 transition-colors flex items-center justify-center gap-2">
                <ShoppingCart size={15} /> Confirm Order
              </button>
              <button onClick={() => continueConversation('no')}
                className="flex-1 bg-gray-50 text-gray-600 border border-gray-200 font-body font-semibold text-sm py-2 rounded-xl hover:bg-gray-100 transition-colors">
                Make Changes
              </button>
            </div>
          )}

          <div className="px-4 py-3 flex gap-2">
            <button onClick={startListening} disabled={isSpeaking || voiceState !== 'result'}
              className="flex-1 flex items-center justify-center gap-2 bg-saffron text-white font-body font-semibold text-sm py-2.5 rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50">
              <Mic size={15} /> Continue Speaking
            </button>
            <button onClick={resetSession}
              className="px-4 flex items-center gap-1.5 bg-gray-100 text-gray-600 font-body font-semibold text-sm py-2.5 rounded-xl hover:bg-gray-200 transition-colors">
              <RefreshCw size={14} /> Reset
            </button>
          </div>
        </div>
      )}

      {/* ── PHONE CALL MODE ── */}
      {voiceMode === 'phone' && (
        <div className="card p-6 space-y-4">
          <div className="text-center">
            <div className={clsx('w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-3',
              callActive ? 'bg-green-500 animate-pulse' : 'bg-saffron')}>
              <Phone size={28} className="text-white" />
            </div>
            <h3 className="font-display font-bold text-charcoal">
              {callActive ? 'Call in Progress...' : 'Order via Phone Call'}
            </h3>
            <p className="font-body text-sm text-gray-400 mt-1">
              {callActive ? 'Our voice bot is taking your order' : 'Enter your number — our AI bot will call you!'}
            </p>
          </div>
          {!callActive ? (
            <>
              <div>
                <label className="text-xs font-body font-semibold text-gray-600 mb-1.5 block">Your Phone Number</label>
                <input className="input" placeholder="+91 98765 43210"
                  value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} type="tel" />
              </div>
              <button onClick={initiatePhoneCall} className="btn-primary w-full flex items-center justify-center gap-2">
                <Phone size={18} /> Call Me to Order
              </button>
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                <p className="text-xs font-body text-amber-800 font-semibold mb-1">How it works</p>
                <p className="text-xs text-amber-700">1. Enter your number and tap "Call Me"</p>
                <p className="text-xs text-amber-700">2. Our AI bot calls you in {language}</p>
                <p className="text-xs text-amber-700">3. Say your order — bot confirms and places it!</p>
                <p className="text-xs text-amber-600 mt-1 italic">* Requires Twilio setup in production</p>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-center">
                <div className="flex justify-center items-end gap-1 h-8 mb-2">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="w-2 bg-green-400 rounded-full animate-bounce"
                      style={{ height: `${8 + (i % 4) * 6}px`, animationDelay: `${i * 0.1}s` }} />
                  ))}
                </div>
                <p className="font-body text-sm font-semibold text-green-700">Bot speaking...</p>
                <p className="font-body text-xs text-green-600 mt-1 italic">"Namaste! Kya order karna hai aaj?"</p>
              </div>
              <button onClick={endCall}
                className="w-full flex items-center justify-center gap-2 bg-red-500 text-white font-body font-semibold py-3 rounded-xl hover:bg-red-600 transition-colors">
                <PhoneOff size={18} /> End Call
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── EXAMPLE PHRASES ── */}
      <div className="card p-4">
        <p className="font-body text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide">Try saying</p>
        <div className="space-y-2">
          {EXAMPLE_PHRASES.map((ex, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-xs font-body font-semibold text-saffron w-14 flex-shrink-0">{ex.lang}</span>
              <p className="font-body text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg flex-1">{ex.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── ERROR HELP ── */}
      {voiceState === 'error' && (
        <div className="card p-4 bg-red-50 border border-red-100">
          <div className="flex gap-3 items-start">
            <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-body font-semibold text-sm text-red-700 mb-1">Something went wrong</p>
              <p className="font-body text-xs text-red-600 mb-2">Make sure both backends are running:</p>
              <code className="text-xs text-red-700 block bg-red-100 px-2 py-1 rounded mb-1">python "backend (1).py"   # port 8000</code>
              <code className="text-xs text-red-700 block bg-red-100 px-2 py-1 rounded">python run_voice_bot.py   # port 8001</code>
              <button onClick={resetSession}
                className="mt-3 text-xs font-body font-semibold text-red-500 flex items-center gap-1 hover:text-red-700">
                <RefreshCw size={12} /> Try again
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}