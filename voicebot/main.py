# main.py — FIXED VERSION
import sys, os

# ── STARTUP CHECKS ──────────────────────────────────────────
missing = []
for pkg in ["fastapi", "uvicorn", "pydantic"]:
    try: __import__(pkg)
    except ImportError: missing.append(pkg)

if missing:
    print(f"\n❌ Missing: pip install {' '.join(missing)}\n")
    sys.exit(1)

for f in ["menu.csv", "dataset_with_confidence.csv", "voice_bot.py", "smart_suggestions.py"]:
    if not os.path.exists(f):
        print(f"\n❌ File not found: {f}")
        print(f"   Put all files in the SAME folder as main.py\n")
        sys.exit(1)

print("✅ All checks passed — starting ZAIKA Voice Bot...")
print("   Web UI  → http://localhost:8000")
print("   Mic bot → python mic_client.py  (in a 2nd terminal)")

import uvicorn, webbrowser, threading, time
from voice_bot import app
from fastapi.responses import HTMLResponse

HTML = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>ZAIKA Voice Bot</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet"/>
<style>
*{box-sizing:border-box;margin:0;padding:0}
:root{
  --s:#E85D04;--sl:#FB8500;--cr:#FFF8F0;--cd:#F5E6D0;
  --ch:#1A1A2E;--gr:#1B4332;--ok:#10B981;--er:#EF4444;
  --sw:0 4px 24px rgba(232,93,4,0.22);
}
body{font-family:'DM Sans',sans-serif;background:var(--cr);color:var(--ch);min-height:100vh}
header{background:#fff;border-bottom:1px solid var(--cd);height:64px;
  padding:0 24px;display:flex;align-items:center;justify-content:space-between;
  position:sticky;top:0;z-index:100;box-shadow:0 2px 12px rgba(0,0,0,0.05)}
.logo{font-family:'Playfair Display',serif;font-size:24px;font-weight:900}
.logo span{color:var(--s)}
#hbadge{background:var(--s);color:#fff;border-radius:50px;padding:8px 18px;
  font-weight:700;font-size:13px;cursor:pointer;box-shadow:var(--sw);
  display:flex;align-items:center;gap:8px;transition:all .2s}
#hbadge:hover{background:var(--sl);transform:scale(1.04)}

.app{max-width:1100px;margin:0 auto;padding:28px 20px 100px;
  display:grid;grid-template-columns:1fr 360px;gap:24px}
@media(max-width:860px){.app{grid-template-columns:1fr}}

.panel{background:#fff;border-radius:20px;border:1px solid var(--cd);
  overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.06)}
.phdr{padding:18px 24px;border-bottom:1px solid var(--cd);
  display:flex;align-items:center;justify-content:space-between}
.ptitle{font-family:'Playfair Display',serif;font-size:19px;font-weight:700}
.live{display:flex;align-items:center;gap:6px;font-size:12px;color:#999}
.dot{width:7px;height:7px;border-radius:50%;background:var(--ok);
  animation:blink 2s infinite}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}

/* MIC */
.mic-sec{padding:36px 24px 20px;text-align:center}
.mic-wrap{position:relative;display:inline-flex;align-items:center;
  justify-content:center;margin-bottom:28px}
.rpl{position:absolute;border-radius:50%;border:2px solid var(--er);
  opacity:0;display:none;animation:rout 1.6s ease-out infinite}
.rpl:nth-child(1){animation-delay:0s}
.rpl:nth-child(2){animation-delay:.5s}
.rpl:nth-child(3){animation-delay:1s}
@keyframes rout{0%{width:100px;height:100px;opacity:.5}100%{width:200px;height:200px;opacity:0}}
#mbtn{width:100px;height:100px;border-radius:50%;background:var(--s);
  border:none;cursor:pointer;transition:all .25s;box-shadow:var(--sw);
  position:relative;z-index:2;display:flex;align-items:center;justify-content:center}
#mbtn:hover{background:var(--sl);transform:scale(1.07)}
#mbtn.on{background:var(--er);animation:mglow 1.2s ease-in-out infinite}
@keyframes mglow{0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,.5)}
  50%{box-shadow:0 0 0 22px rgba(239,68,68,0)}}
#mbtn svg{width:38px;height:38px;stroke:#fff;stroke-width:2.2;fill:none;
  stroke-linecap:round;stroke-linejoin:round;pointer-events:none}

#wv{display:none;align-items:flex-end;justify-content:center;
  gap:4px;height:44px;margin:0 auto 16px;width:120px}
#wv.show{display:flex}
.wb{width:6px;border-radius:4px;background:var(--s);
  animation:wav .8s ease-in-out infinite}
.wb:nth-child(1){animation-delay:0s;height:10px}
.wb:nth-child(2){animation-delay:.1s;height:18px}
.wb:nth-child(3){animation-delay:.2s;height:28px}
.wb:nth-child(4){animation-delay:.3s;height:38px}
.wb:nth-child(5){animation-delay:.4s;height:28px}
.wb:nth-child(6){animation-delay:.3s;height:18px}
.wb:nth-child(7){animation-delay:.2s;height:10px}
@keyframes wav{0%,100%{transform:scaleY(.3)}50%{transform:scaleY(1)}}

#mst{font-family:'Playfair Display',serif;font-size:18px;font-weight:700;margin-bottom:4px}
#mhi{font-size:13px;color:#aaa}

/* DEBUG PANEL — shows exactly what bot heard */
#debug{margin:12px 24px 0;padding:10px 14px;background:#1a1a2e;border-radius:10px;
  font-size:12px;color:#aaa;display:none;font-family:monospace;line-height:1.8}
#debug.show{display:block}
#debug .dl{color:#888}
#debug .dv{color:#10B981}
#debug .dn{color:#f87171}

#tbox{margin:12px 24px 0;padding:13px 16px;background:var(--cr);
  border:1px solid var(--cd);border-radius:12px;font-style:italic;
  font-size:14px;color:#666;line-height:1.6;display:none;min-height:46px}
#tbox.show{display:block}
#rbox{margin:10px 24px 0;padding:13px 16px;border-radius:12px;
  font-size:14px;line-height:1.6;display:none}
#rbox.show{display:block}
#rbox.ok {background:#D1FAE5;color:#065F46;border:1px solid #6EE7B7}
#rbox.wrn{background:#FEF3C7;color:#92400E;border:1px solid #FCD34D}
#rbox.inf{background:#EDE9FE;color:#5B21B6;border:1px solid #C4B5FD}
#rbox.err{background:#FEE2E2;color:#991B1B;border:1px solid #FCA5A5}

/* SUGGESTIONS */
#sbox{margin:12px 24px 0;display:none}
#sbox.show{display:block}
.shdr{font-size:11px;font-weight:700;color:#888;letter-spacing:1.5px;
  text-transform:uppercase;margin-bottom:10px}
.sc{background:linear-gradient(135deg,#FFF7ED,#FFFBEB);border:1px solid var(--cd);
  border-radius:12px;padding:12px 14px;margin-bottom:8px;
  display:flex;align-items:center;justify-content:space-between;
  animation:slin .3s ease}
@keyframes slin{from{transform:translateY(8px);opacity:0}to{transform:translateY(0);opacity:1}}
.sn{font-weight:600;font-size:14px;color:var(--ch)}
.sr{font-size:11px;color:#999;margin-top:2px}
.sp{font-weight:700;color:var(--s);font-size:15px;margin-right:10px}
.sa{width:34px;height:34px;background:var(--s);color:#fff;border:none;
  border-radius:9px;cursor:pointer;font-size:20px;display:flex;
  align-items:center;justify-content:center;transition:all .2s}
.sa:hover{background:var(--sl);transform:scale(1.1)}

.chips{display:flex;gap:8px;flex-wrap:wrap;padding:14px 24px}
.chip{padding:7px 14px;border-radius:50px;border:1.5px solid var(--cd);
  background:#fff;font-family:'DM Sans';font-size:12px;font-weight:500;
  cursor:pointer;transition:all .2s;color:#666;white-space:nowrap}
.chip:hover{border-color:var(--s);color:var(--s)}
.irow{display:flex;gap:8px;padding:0 24px 20px}
#ti{flex:1;height:46px;border:1.5px solid var(--cd);border-radius:12px;
  padding:0 16px;font-family:'DM Sans';font-size:14px;outline:none;background:#fafafa}
#ti:focus{border-color:var(--s);box-shadow:0 0 0 3px rgba(232,93,4,.1)}
#sb{height:46px;padding:0 20px;background:var(--s);color:#fff;border:none;
  border-radius:12px;font-family:'DM Sans';font-weight:700;font-size:13px;
  cursor:pointer;transition:all .2s;box-shadow:var(--sw)}
#sb:hover{background:var(--sl);transform:translateY(-1px)}
.eg{padding:0 24px 24px;font-size:12px;color:#bbb;line-height:2}
.eg strong{color:#999;display:block;margin-bottom:4px}

/* CART */
.chdr{background:var(--ch);padding:18px 24px;display:flex;align-items:center;justify-content:space-between}
.chdr .ptitle{color:#fff}
#ccl{font-size:12px;color:rgba(255,255,255,.5)}
.ce{padding:52px 24px;text-align:center}
.ce .ei{font-size:52px;margin-bottom:12px}
.ce p{font-family:'Playfair Display',serif;font-size:17px;color:#bbb}
.ce small{font-size:12px;color:#ddd;display:block;margin-top:6px}
#clist{padding:0 20px;max-height:320px;overflow-y:auto}
::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:var(--cd);border-radius:2px}
.ci{display:flex;align-items:center;gap:12px;padding:11px 0;border-bottom:1px solid var(--cd)}
.ce2{font-size:26px;flex-shrink:0}
.cin{flex:1;min-width:0}
.cnm{font-weight:600;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cca{font-size:11px;color:#aaa;margin-top:1px}
.crh{text-align:right;flex-shrink:0}
.cpr{font-weight:700;color:var(--s);font-size:14px}
.cqt{font-size:11px;color:#aaa;margin-top:1px}
.cft{padding:18px 20px 20px;border-top:1px solid var(--cd)}
.cr2{display:flex;justify-content:space-between;font-size:13px;color:#888;margin-bottom:7px}
.ct{display:flex;justify-content:space-between;font-family:'Playfair Display',serif;
  font-size:20px;font-weight:700;margin:14px 0 16px}
.ct span:last-child{color:var(--s)}
#plc{width:100%;padding:14px;background:var(--s);color:#fff;border:none;
  border-radius:14px;font-family:'DM Sans';font-weight:700;font-size:15px;
  cursor:pointer;transition:all .2s;box-shadow:var(--sw)}
#plc:hover{background:var(--sl);transform:translateY(-2px);box-shadow:0 6px 28px rgba(232,93,4,.3)}
#clr{width:100%;padding:8px;background:none;border:none;cursor:pointer;
  color:#ccc;font-family:'DM Sans';font-size:12px;margin-top:8px}
#clr:hover{color:var(--er)}

/* MODAL */
#mod{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:999;
  display:none;align-items:center;justify-content:center;padding:20px}
#mod.show{display:flex}
.mc{background:#fff;border-radius:24px;padding:48px 40px;text-align:center;
  max-width:380px;width:100%;animation:pop .3s cubic-bezier(.34,1.56,.64,1)}
@keyframes pop{from{transform:scale(.88);opacity:0}to{transform:scale(1);opacity:1}}
.mi{font-size:68px;margin-bottom:16px}
.mt{font-family:'Playfair Display',serif;font-size:26px;font-weight:800;margin-bottom:8px}
.ms{color:#888;font-size:14px;margin-bottom:6px;line-height:1.6}
.mid{font-size:11px;color:#bbb;margin-bottom:20px;font-family:monospace}
.mv{font-family:'Playfair Display',serif;font-size:32px;font-weight:800;
  color:var(--s);margin-bottom:28px}
.mb{padding:13px 36px;background:var(--s);color:#fff;border:none;
  border-radius:12px;font-family:'DM Sans';font-weight:700;font-size:15px;
  cursor:pointer;box-shadow:var(--sw)}

#tst{position:fixed;bottom:28px;left:50%;
  transform:translateX(-50%) translateY(16px);background:var(--ch);
  color:#fff;padding:11px 24px;border-radius:50px;font-family:'DM Sans';
  font-weight:600;font-size:13px;z-index:1000;opacity:0;transition:all .3s;
  pointer-events:none;white-space:nowrap;box-shadow:0 4px 20px rgba(0,0,0,.3)}
#tst.show{opacity:1;transform:translateX(-50%) translateY(0)}

/* MENU OPTIONS PANEL */
#mbox{margin:12px 24px 0;display:none}
#mbox.show{display:block}
.mhdr{font-size:11px;font-weight:700;color:#888;letter-spacing:1.5px;
  text-transform:uppercase;margin-bottom:10px}
.mcategory{font-family:'Playfair Display',serif;font-size:13px;
  color:var(--s);font-weight:700;margin-bottom:8px}
.mopts{display:grid;grid-template-columns:1fr 1fr;gap:8px}
@media(max-width:500px){.mopts{grid-template-columns:1fr}}
.mopt{background:#fff;border:1.5px solid var(--cd);border-radius:12px;
  padding:10px 12px;display:flex;align-items:center;justify-content:space-between;
  cursor:pointer;transition:all .2s;animation:slin .25s ease}
.mopt:hover{border-color:var(--s);background:#FFF7ED;transform:translateY(-1px)}
.mopt-left{flex:1;min-width:0}
.mopt-num{font-size:10px;color:#aaa;font-weight:700;margin-bottom:1px}
.mopt-name{font-weight:600;font-size:13px;white-space:nowrap;
  overflow:hidden;text-overflow:ellipsis;color:var(--ch)}
.mopt-price{font-weight:700;color:var(--s);font-size:14px;
  flex-shrink:0;margin-left:8px}
</style>
</head>
<body>

<header>
  <div class="logo">🍽️ <span>ZAIKA</span></div>
  <div id="hbadge" onclick="document.getElementById('cpanel').scrollIntoView({behavior:'smooth'})">
    🛒 <span id="hn">0</span> items · <span id="ht">₹0</span>
  </div>
</header>

<div class="app">

  <!-- VOICE PANEL -->
  <div class="panel">
    <div class="phdr">
      <div class="ptitle">🎙️ Voice Order Bot</div>
      <div class="live"><div class="dot"></div>AI Active</div>
    </div>

    <div class="mic-sec">
      <div class="mic-wrap">
        <div class="rpl" id="r1"></div>
        <div class="rpl" id="r2"></div>
        <div class="rpl" id="r3"></div>
        <button id="mbtn" onclick="toggleMic()" aria-label="Tap to speak">
          <svg id="msv" viewBox="0 0 24 24">
            <rect x="9" y="2" width="6" height="12" rx="3"/>
            <path d="M5 10a7 7 0 0 0 14 0"/>
            <line x1="12" y1="17" x2="12" y2="22"/>
            <line x1="8" y1="22" x2="16" y2="22"/>
          </svg>
          <svg id="ssv" viewBox="0 0 24 24" style="display:none">
            <rect x="6" y="6" width="12" height="12" rx="2" fill="white" stroke="white"/>
          </svg>
        </button>
      </div>
      <div id="wv"><div class="wb"></div><div class="wb"></div><div class="wb"></div>
        <div class="wb"></div><div class="wb"></div><div class="wb"></div><div class="wb"></div></div>
      <div id="mst">Tap mic to speak</div>
      <div id="mhi">English ya Hinglish mein bolein</div>
    </div>

    <!-- DEBUG: shows raw STT + what backend matched -->
    <div id="debug">
      <span class="dl">🎤 Heard: </span><span id="d-raw" class="dv">—</span><br>
      <span class="dl">🔍 Matched: </span><span id="d-norm" class="dv">—</span>
    </div>

    <div id="tbox"></div>
    <div id="rbox"></div>

    <!-- MENU OPTIONS PANEL — shown when user says a category -->
    <div id="mbox">
      <div class="mhdr">📋 Choose an option</div>
      <div class="mcategory" id="mcatname"></div>
      <div class="mopts" id="mopts"></div>
    </div>
    <div id="sbox">
      <div class="shdr">🌟 Frequently ordered together</div>
      <div id="scards"></div>
    </div>

    <div class="chips">
      <div class="chip" onclick="go('Veg Biryani')">🍚 Veg Biryani</div>
      <div class="chip" onclick="go('Paneer Butter Masala')">🧆 Paneer Masala</div>
      <div class="chip" onclick="go('Mango Shake')">🥭 Mango Shake</div>
      <div class="chip" onclick="go('Hakka Noodles')">🍜 Hakka Noodles</div>
      <div class="chip" onclick="go('Dal Makhani')">🫘 Dal Makhani</div>
      <div class="chip" onclick="go('checkout')">✅ Checkout</div>
    </div>

    <div class="irow">
      <input id="ti" type="text"
        placeholder="Type item name here (Enter to send)..."
        onkeydown="if(event.key==='Enter')send()"/>
      <button id="sb" onclick="send()">Send →</button>
    </div>

    <div class="eg">
      <strong>Say or type:</strong>
      "Veg Biryani ek" &nbsp;·&nbsp; "Do Mango Shake" &nbsp;·&nbsp;
      "Paneer Butter Masala aur Coke" &nbsp;·&nbsp; "checkout"
    </div>
  </div>

  <!-- CART PANEL -->
  <div class="panel" id="cpanel">
    <div class="chdr">
      <div class="ptitle">🛒 Your Order</div>
      <div id="ccl">0 items</div>
    </div>
    <div id="cmt" class="ce">
      <div class="ei">🍽️</div>
      <p>Cart is empty</p>
      <small>Speak or type to add items</small>
    </div>
    <div id="clist" style="display:none"></div>
    <div id="cft" class="cft" style="display:none">
      <div class="cr2"><span>Subtotal</span><span id="csub">₹0</span></div>
      <div class="cr2"><span>GST (5%)</span><span id="cgst">₹0</span></div>
      <div class="ct"><span>Total</span><span id="ctot">₹0</span></div>
      <button id="plc" onclick="go('checkout')">Place Order 🎉</button>
      <button id="clr" onclick="clearCart()">Clear cart</button>
    </div>
  </div>
</div>

<!-- MODAL -->
<div id="mod">
  <div class="mc">
    <div class="mi">🎉</div>
    <div class="mt">Order Placed!</div>
    <div class="ms" id="mi2"></div>
    <div class="mid" id="moid"></div>
    <div class="mv" id="mvl">₹0</div>
    <button class="mb" onclick="closeModal()">Order More 🍽️</button>
  </div>
</div>
<div id="tst"></div>

<script>
const API = 'http://localhost:8000';
const SID = 'z_' + Math.random().toString(36).slice(2,10);
const EM  = {
  'Beverages':'🥤','Breads':'🫓','Burgers':'🍔','Desserts':'🍮',
  'Fries':'🍟','Light Course':'🥪','Main Course':'🍛',
  'Pasta & Italian':'🍝','Pizza':'🍕','Rice & Biryani':'🍚',
  'Soups':'🍲','Starters':'🥗','Wraps':'🌯'
};

let rec = null, isOn = false;

// ════════════════════════════════════════
// SPEECH RECOGNITION — KEY FIXES:
// 1. lang = 'en-IN'  → Chrome returns English text (not Devanagari)
// 2. continuous = true → doesn't stop mid-sentence  
// 3. Separate interim from final properly
// ════════════════════════════════════════
function initRec() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { toast('❌ Use Google Chrome for voice'); return null; }

  const r = new SR();

  // ★ FIX 1: en-IN gives English romanized text
  //   "Veg Biryani chahiye" instead of "वेज बिरयानी चाहिए"
  r.lang = 'en-IN';

  // ★ FIX 2: continuous = true so it doesn't stop after first pause
  r.continuous = true;

  // ★ FIX 3: interimResults so we show live transcript
  r.interimResults = true;

  r._final = '';   // accumulates confirmed text

  r.onstart = () => {
    isOn = true;
    setUI('on');
    showTrans('🎤 Listening...');
  };

  r.onresult = (e) => {
    let interim = '';
    // Only process new results from resultIndex onwards
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const txt = e.results[i][0].transcript;
      if (e.results[i].isFinal) {
        r._final += ' ' + txt;
      } else {
        interim = txt;
      }
    }
    // Show live in transcript box
    showTrans(r._final.trim() || interim);
    // Update debug: raw heard
    document.getElementById('d-raw').textContent = r._final.trim() || interim;
  };

  r.onerror = (e) => {
    isOn = false;
    setUI('off');
    const m = {
      'not-allowed': '❌ Mic blocked — browser mein mic allow karein',
      'no-speech':   '🔇 Kuch suna nahi — thoda loud bolein',
      'network':     '❌ Network error',
      'aborted':     '',   // intentional stop, ignore
    };
    if (m[e.error] !== undefined && m[e.error])
      toast(m[e.error]);
  };

  r.onend = async () => {
    isOn = false;
    setUI('off');
    const text = r._final.trim();
    r._final = '';   // ★ FIX: always reset after processing

    if (text && text.length > 1) {
      setUI('proc');
      await sendBot(text);
      setUI('off');
    } else {
      toast('Kuch suna nahi — phir try karein');
    }
  };

  return r;
}

function toggleMic() {
  if (!rec) rec = initRec();
  if (!rec) return;

  if (isOn) {
    rec.stop();   // triggers onend → sends to bot
  } else {
    rec._final = '';   // ★ FIX: clear stale text before new session
    try { rec.start(); }
    catch(e) {
      // If already started, stop and reinit
      try { rec.stop(); } catch(_) {}
      rec = initRec();
      setTimeout(() => { if(rec) rec.start(); }, 300);
    }
  }
}

function setUI(state) {
  const btn = document.getElementById('mbtn');
  const wv  = document.getElementById('wv');
  const ms  = document.getElementById('mst');
  const mh  = document.getElementById('mhi');
  const rs  = ['r1','r2','r3'].map(id => document.getElementById(id));
  const msv = document.getElementById('msv');
  const ssv = document.getElementById('ssv');

  btn.classList.remove('on');
  wv.classList.remove('show');
  rs.forEach(r => r.style.display = 'none');
  msv.style.display = '';
  ssv.style.display = 'none';

  if (state === 'on') {
    btn.classList.add('on');
    wv.classList.add('show');
    rs.forEach(r => r.style.display = 'block');
    msv.style.display = 'none';
    ssv.style.display = '';
    ms.textContent = '🔴 Listening — tap to stop';
    mh.textContent = 'Bol do! (stop ke liye phir tap karein)';
  } else if (state === 'proc') {
    ms.textContent = '⚙️ Processing...';
    mh.textContent = 'Ek second...';
  } else {
    ms.textContent = 'Tap mic to speak';
    mh.textContent = 'English ya Hinglish mein bolein';
  }
}

// ════════════════════════════════════════
// API CALLS
// ════════════════════════════════════════
async function sendBot(text) {
  try {
    const res  = await fetch(API + '/api/voice/process', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({session_id: SID, transcript: text})
    });
    const data = await res.json();
    handleResp(data, text);
  } catch(e) {
    showResp('❌ Backend se connect nahi hua. Terminal mein check karein.', 'err');
  }
}

function handleResp(data, rawText) {
  // Update debug panel
  const dbg = document.getElementById('debug');
  dbg.classList.add('show');
  document.getElementById('d-raw').textContent  = rawText || '—';
  document.getElementById('d-norm').textContent =
    data.debug_normalized
      ? data.debug_normalized + (data.cart?.length
          ? ' → [' + data.cart.map(i=>i.food_name).join(', ') + ']'
          : ' → no match')
      : (data.cart?.length
          ? data.cart.map(i=>i.food_name).join(', ')
          : 'no match');

  // Color debug based on success
  document.getElementById('d-norm').className =
    data.cart?.length ? 'dv' : 'dn';

  // Response box
  const style = {
    checkout_suggest: 'wrn', done: 'ok', ordering: 'ok', idle: 'inf'
  }[data.state] || 'ok';
  showResp(data.reply, style);

  // Cart
  renderCart(data.cart || [], data.cart_total || 0);

  // Menu options panel (category browse)
  if (data.state === 'disambiguate' && data.menu_options?.length)
    renderMenuOptions(data.menu_options, data.menu_category || 'Options');
  else
    hideMenuOptions();

  // Suggestions panel (checkout upsell)
  if (data.state === 'checkout_suggest' && data.suggestions?.length)
    renderSuggs(data.suggestions);
  else
    hideSuggs();

  // Done
  if (data.state === 'done')
    setTimeout(() => showModal(data.cart, data.cart_total), 700);

  // TTS
  speak(data.reply);
}

async function addSugg(food_name) {
  const res  = await fetch(API + '/api/voice/add-suggestion', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({session_id: SID, food_name, qty: 1})
  });
  const data = await res.json();
  handleResp(data, '');
  toast('✅ ' + food_name + ' added!');
}

async function clearCart() {
  await fetch(API + '/api/voice/reset', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({session_id: SID})
  }).catch(()=>{});
  renderCart([], 0);
  hideSuggs();
  hideMenuOptions();
  document.getElementById('rbox').style.display = 'none';
  document.getElementById('tbox').classList.remove('show');
  document.getElementById('debug').classList.remove('show');
  toast('🗑️ Cart cleared');
}

// ════════════════════════════════════════
// RENDER
// ════════════════════════════════════════
function showTrans(t) {
  const b = document.getElementById('tbox');
  b.textContent = t;
  b.classList.add('show');
}

function showResp(t, type='ok') {
  const b = document.getElementById('rbox');
  b.textContent = t;
  b.className = 'show ' + type;
}

function renderSuggs(suggs) {
  document.getElementById('scards').innerHTML = suggs.map(s => {
    const isHidden = s.category === 'Hidden Star';
    const badge = isHidden
      ? `<span style="font-size:10px;background:#7C3AED;color:#fff;padding:2px 8px;border-radius:20px;font-weight:700;margin-left:6px;">&#11088; Chef's Pick</span>`
      : '';
    const reason = isHidden ? "Chef's special — less known, loved by all" : (s.reason || 'Frequently ordered together');
    const border = isHidden ? 'border-color:#C4B5FD;background:linear-gradient(135deg,#F5F3FF,#EDE9FE);' : '';
    const btnBg  = isHidden ? 'background:#7C3AED;' : '';
    return `<div class="sc" style="${border}">
      <div>
        <div class="sn" style="display:flex;align-items:center;flex-wrap:wrap">${s.food_name}${badge}</div>
        <div class="sr">${reason}</div>
      </div>
      <div style="display:flex;align-items:center">
        <div class="sp">Rs.${s.price}</div>
        <button class="sa" onclick="addSugg('${s.food_name}')" style="${btnBg}">+</button>
      </div>
    </div>`;
  }).join('');
  document.getElementById('sbox').classList.add('show');
}

function hideSuggs() {
  document.getElementById('sbox').classList.remove('show');
  document.getElementById('scards').innerHTML = '';
}

function renderMenuOptions(options, category) {
  document.getElementById('mcatname').textContent = category;
  document.getElementById('mopts').innerHTML = options.map((o, i) => `
    <div class="mopt" onclick="pickMenuOption('${o.food_name}')">
      <div class="mopt-left">
        <div class="mopt-num">${i+1}</div>
        <div class="mopt-name">${o.food_name}</div>
      </div>
      <div class="mopt-price">Rs.${o.price}</div>
    </div>`).join('');
  document.getElementById('mbox').classList.add('show');
}

function hideMenuOptions() {
  document.getElementById('mbox').classList.remove('show');
  document.getElementById('mopts').innerHTML = '';
}

function pickMenuOption(food_name) {
  hideMenuOptions();
  go(food_name);
}

function renderCart(cart, total) {
  const qty  = cart.reduce((s,i) => s+i.qty, 0);
  document.getElementById('hn').textContent  = qty;
  document.getElementById('ht').textContent  = '₹'+total;
  document.getElementById('ccl').textContent = qty+' item'+(qty!==1?'s':'');

  const emp = document.getElementById('cmt');
  const lst = document.getElementById('clist');
  const ftr = document.getElementById('cft');

  if (!cart.length) {
    emp.style.display = 'block';
    lst.style.display = ftr.style.display = 'none';
    return;
  }
  emp.style.display = 'none';
  lst.style.display = ftr.style.display = 'block';

  lst.innerHTML = cart.map(it => `
    <div class="ci">
      <div class="ce2">${EM[it.category]||'🍽️'}</div>
      <div class="cin">
        <div class="cnm">${it.food_name}</div>
        <div class="cca">${it.category}</div>
      </div>
      <div class="crh">
        <div class="cpr">₹${it.price*it.qty}</div>
        <div class="cqt">×${it.qty} @ ₹${it.price}</div>
      </div>
    </div>`).join('');

  const gst = Math.round(total*.05);
  document.getElementById('csub').textContent = '₹'+total;
  document.getElementById('cgst').textContent = '₹'+gst;
  document.getElementById('ctot').textContent = '₹'+(total+gst);
}

function showModal(cart, total) {
  const gst = Math.round((total||0)*.05);
  const oid = 'ORD-'+Date.now().toString(36).toUpperCase();
  document.getElementById('mi2').textContent =
    (cart||[]).map(i=>i.food_name+' ×'+i.qty).join(', ') || 'Items confirmed';
  document.getElementById('moid').textContent = 'Order ID: '+oid;
  document.getElementById('mvl').textContent  = '₹'+((total||0)+gst);
  document.getElementById('mod').classList.add('show');
}

function closeModal() {
  document.getElementById('mod').classList.remove('show');
  clearCart();
}

function send() {
  const el = document.getElementById('ti');
  const v  = el.value.trim();
  if (!v) return;
  el.value = '';
  showTrans('"'+v+'"');
  sendBot(v);
}

function go(t) {
  document.getElementById('ti').value = t;
  send();
}

function speak(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(
    text.replace(/[🎉✅🗑️🍽️😊]/g,''));
  u.lang='hi-IN'; u.rate=.92; u.pitch=1.05;
  window.speechSynthesis.speak(u);
}

function toast(msg) {
  const t = document.getElementById('tst');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'), 3200);
}

// Startup check
window.addEventListener('load', async () => {
  try {
    const r = await fetch(API+'/health');
    const d = await r.json();
    toast('✅ '+d.menu_items+' items · '+d.associations+' associations loaded');
  } catch(e) {
    showResp('⚠️ Backend nahi mila. Terminal mein: python main.py', 'err');
  }
});
</script>
</body>
</html>"""

@app.get("/", response_class=HTMLResponse)
def ui(): return HTML

def open_browser():
    time.sleep(1.5)
    webbrowser.open("http://localhost:8000")

if __name__ == "__main__":
    threading.Thread(target=open_browser, daemon=True).start()
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)