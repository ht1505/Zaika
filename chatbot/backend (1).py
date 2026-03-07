"""
Smart Food Chat Assistant — Fully Integrated
- Serves chat UI at http://localhost:8000
- Dataset-driven menu, fuzzy matching, upsell via confidence associations
- Multilingual (EN / HI / GU) from main__1_.py
- Cart with qty tracking, checkout, remove
Run: python backend.py
"""

from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from rapidfuzz import process, fuzz
import os, re

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# ═══════════════════════════════════════════════════════════════════════════════
# DATA LAYER
# ═══════════════════════════════════════════════════════════════════════════════

CSV = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dataset_with_confidence.csv")
df = pd.read_csv(CSV)

# ── Menu ──────────────────────────────────────────────────────────────────────
menu_df = df[['food_name','price','rating','cuisine','category']].drop_duplicates('food_name').copy()
menu_df['food_lower'] = menu_df['food_name'].str.lower()
menu_items_lower = menu_df['food_lower'].tolist()
menu_lookup  = dict(zip(menu_df['food_lower'], menu_df['food_name']))
price_lookup = dict(zip(menu_df['food_lower'], menu_df['price'].astype(int)))
rating_lookup = dict(zip(menu_df['food_lower'], menu_df['rating']))
cat_lookup   = dict(zip(menu_df['food_lower'], menu_df['category']))
cuisine_lookup = dict(zip(menu_df['food_lower'], menu_df['cuisine']))

# ── Associations (high-confidence co-occurrence from dataset) ─────────────────
def _build_associations():
    high  = df[df['confidence'] > 0.6][['order_id','food_name','confidence']]
    grp   = df.groupby('order_id')['food_name'].apply(list)
    pm    = dict(zip(menu_df['food_name'], menu_df['price'].astype(int)))
    rm    = dict(zip(menu_df['food_name'], menu_df['rating']))
    raw   = {}
    for _, row in high.iterrows():
        item, conf = row['food_name'], row['confidence']
        others = [x for x in grp.get(row['order_id'], []) if x != item]
        raw.setdefault(item, {})
        for o in others:
            raw[item].setdefault(o, []).append(conf)
    # Fallback: co-occurrence counts for items with no confidence pairs
    cocount = {}
    for items in grp:
        for i in items:
            for j in items:
                if i != j:
                    cocount.setdefault(i, {})
                    cocount[i][j] = cocount[i].get(j, 0) + 1
    assoc = {}
    for item_name in menu_df['food_name']:
        key = item_name.lower()
        if item_name in raw:
            top = sorted(
                [{'name': k, 'confidence': round(sum(v)/len(v), 3), 'price': pm.get(k,0), 'rating': rm.get(k,0)}
                 for k, v in raw[item_name].items()],
                key=lambda x: -x['confidence']
            )[:3]
        elif item_name in cocount:
            # fallback: top co-ordered items, confidence shown as 0.5 (moderate)
            top = sorted(
                [{'name': k, 'confidence': 0.5, 'price': pm.get(k,0), 'rating': rm.get(k,0)}
                 for k in list(cocount[item_name].keys())[:6]],
                key=lambda x: -x['rating']
            )[:3]
        else:
            top = []
        assoc[key] = top
    return assoc

ASSOCIATIONS = _build_associations()

# ═══════════════════════════════════════════════════════════════════════════════
# SESSION STATE
# ═══════════════════════════════════════════════════════════════════════════════

cart: list           = []   # {name, price, qty}
pending_options: list = []  # disambiguation queue
pending_qty: int     = 1
awaiting_upsell      = None  # item name we just upsold, waiting yes/no

def get_cart_summary():
    return [{**i, "subtotal": i["price"] * i["qty"]} for i in cart]

def cart_total():
    return sum(i["price"] * i["qty"] for i in cart)

def cart_count():
    return sum(i["qty"] for i in cart)

def add_to_cart(name: str, price: int, qty: int = 1):
    for item in cart:
        if item["name"].lower() == name.lower():
            item["qty"] += qty
            return
    cart.append({"name": name, "price": price, "qty": qty})

def remove_from_cart_by_name(name: str) -> bool:
    global cart
    before = len(cart)
    cart = [i for i in cart if i["name"].lower() != name.lower()]
    return len(cart) < before

def get_suggestions(item_name: str):
    return ASSOCIATIONS.get(item_name.lower(), [])

# ═══════════════════════════════════════════════════════════════════════════════
# NLP HELPERS  (ported & extended from main__1_.py)
# ═══════════════════════════════════════════════════════════════════════════════

NUM_MAP = {
    "a":1,"an":1,"one":1,"two":2,"three":3,"four":4,"five":5,
    "six":6,"seven":7,"eight":8,"nine":9,"ten":10,
    "ek":1,"do":2,"teen":3,"char":4,"paanch":5,
    "chhe":6,"saat":7,"aath":8,"nau":9,"das":10,
    "be":2,"tran":3,"panch":5,"chha":6,"nav":9,
    "1":1,"2":2,"3":3,"4":4,"5":5,"6":6,"7":7,"8":8,"9":9,"10":10,
}

FILLER = {
    "i","want","would","like","give","me","a","an","the","please","can",
    "could","order","get","have","some","need","add","also","and","too",
    "mujhe","chahiye","dena","de","lao","dijiye","aur","bhi",
    "mane","joiye","aap","pan","ane",
}

REMOVE_TRIGGERS = ["remove","delete","hatao","nikalo","kadho","cancel item","nahi chahiye","take off"]
YES_WORDS  = {"yes","yeah","sure","ok","okay","yep","yup","haan","ha","haa","bilkul","add it","add that"}
NO_WORDS   = {"no","nope","nah","na","nahi","skip","don't","dont","not now","maybe later"}
CART_WORDS = {"cart","my order","what i ordered","show cart","bag","my items"}
CHECKOUT_WORDS = {"checkout","check out","place order","done","finish","pay","bill","total","confirm"}
CLEAR_WORDS = {"clear","empty cart","start over","reset","start fresh"}
GREETING_WORDS = {"hi","hello","hey","hii","namaste","namaskar","kem cho","sat sri akal"}

def detect_lang(text: str) -> str:
    tokens = set(text.lower().split())
    if tokens & {"mane","joiye","chhe","tamaro","nathi","tran","nav","be","kem","cho"}:
        return "gu"
    if tokens & {"mujhe","chahiye","dena","dijiye","kya","nahi","teen","paanch","haan","namaste"}:
        return "hi"
    return "en"

def extract_qty(text: str) -> int:
    for word in text.lower().split():
        c = word.strip(".,!?")
        if c in NUM_MAP:
            return NUM_MAP[c]
    return 1

def strip_qty_words(text: str) -> str:
    tokens = text.lower().split()
    return " ".join(t for t in tokens if t.strip(".,!?") not in NUM_MAP)

def match_items(text: str):
    cleaned = " ".join(w for w in text.lower().split() if w not in FILLER)
    if not cleaned:
        cleaned = text.lower()
    matches = process.extract(cleaned, menu_items_lower, limit=5, scorer=fuzz.WRatio)
    if not matches:
        return []
    top_score = matches[0][1]
    results = []
    for name_lower, score, _ in matches:
        if score >= 85 and (top_score - score) < 3:
            results.append({
                "name":    menu_lookup[name_lower],
                "price":   price_lookup[name_lower],
                "rating":  rating_lookup[name_lower],
                "category": cat_lookup[name_lower],
            })
    return results

# ═══════════════════════════════════════════════════════════════════════════════
# RESPONSE BUILDERS
# ═══════════════════════════════════════════════════════════════════════════════

MSGS = {
    "greeting": {
        "en": "👋 Welcome! I'm your food assistant. What would you like to order today?",
        "hi": "👋 Namaste! Main aapka food assistant hoon. Aaj kya order karenge?",
        "gu": "👋 Kem cho! Hoon tamaro food assistant chhu. Aaj shu order karso?",
    },
    "not_found": {
        "en": "Hmm, I couldn't find that on our menu. Could you try rephrasing, or I can show you popular items?",
        "hi": "Hmm, yeh item menu mein nahi mila. Kya aap dobara bol sakte hain?",
        "gu": "Hmm, aa item menu ma nathi. Fari kaho?",
    },
    "clarify": {
        "en": "I found a few matches — which one did you mean?",
        "hi": "Mujhe kuch options mile — kaunsa chahiye?",
        "gu": "Mane keta vikalpo malyaa — kyon joiye chhe?",
    },
    "choose_or_cancel": {
        "en": "Please pick one of the options above, or say **cancel** to go back.",
        "hi": "Upar diye options mein se chunein, ya **cancel** bolein.",
        "gu": "Upar na options manthee ekk pasand karo, ya **cancel** kaho.",
    },
    "cart_empty": {
        "en": "Your cart is empty. Start by telling me what you'd like!",
        "hi": "Aapka cart khali hai. Kuch order karo!",
        "gu": "Tamaro cart khali chhe. Koi item order karo!",
    },
    "cleared": {
        "en": "🗑️ Cart cleared! What would you like to start with?",
        "hi": "🗑️ Cart saaf kar di. Ab kya order karna hai?",
        "gu": "🗑️ Cart saaf karyu! Hve shu order karso?",
    },
    "upsell_decline": {
        "en": "No problem! What else would you like?",
        "hi": "Koi baat nahi! Aur kuch chahiye?",
        "gu": "Koi vat nahi! Biju shu joiye?",
    },
}

def t(key, lang="en"):
    return MSGS[key].get(lang, MSGS[key]["en"])

def added_msg(qty, name, price, lang):
    if lang == "hi":
        return f"✅ {qty}× **{name}** (₹{price} each) aapke cart mein add ho gaya!"
    if lang == "gu":
        return f"✅ {qty}× **{name}** (₹{price} each) tamara cart ma umerayu!"
    return f"✅ {qty}× **{name}** (₹{price} each) added to your cart!"

def upsell_msg(item_name, suggestions, lang):
    names = [s["name"] for s in suggestions[:3]]
    prices = [f"₹{s['price']}" for s in suggestions[:3]]
    conf_pct = int(suggestions[0]["confidence"] * 100) if suggestions else 0
    if lang == "hi":
        return (f"🔥 **{item_name}** ke saath, {conf_pct}% customers yeh bhi order karte hain:\n"
                + "\n".join(f"  • **{n}** — {p}" for n, p in zip(names, prices))
                + "\n\nKya aap inhe bhi add karna chahenge? Koi naam bolein ya **skip** karein.")
    if lang == "gu":
        return (f"🔥 **{item_name}** sathe, {conf_pct}% customers aa pan order kare chhe:\n"
                + "\n".join(f"  • **{n}** — {p}" for n, p in zip(names, prices))
                + "\n\nShu tame aa paN umerso? Naam kaho ya **skip** kaho.")
    return (f"🔥 **{conf_pct}% of customers** who order **{item_name}** also love:\n"
            + "\n".join(f"  • **{n}** — {p}" for n, p in zip(names, prices))
            + "\n\nWant to add any of these? Just say the name or **skip**!")

def removed_msg(name, lang):
    if lang == "hi": return f"🗑️ **{name}** aapke order se hata diya gaya."
    if lang == "gu": return f"🗑️ **{name}** tamara order mathi kadyu."
    return f"🗑️ **{name}** removed from your cart."

def not_in_cart_msg(lang):
    if lang == "hi": return "Yeh item aapke cart mein nahi hai."
    if lang == "gu": return "Aa item tamara cart ma nathi."
    return "That item isn't in your cart."

def cart_msg(lang):
    if not cart:
        return t("cart_empty", lang)
    lines = "\n".join(f"  • {i['qty']}× **{i['name']}** — ₹{i['price']*i['qty']}" for i in cart)
    total = cart_total()
    if lang == "hi":
        return f"🛒 **Aapka cart:**\n{lines}\n\n**Total: ₹{total}**\nCheckout ke liye 'checkout' bolein."
    if lang == "gu":
        return f"🛒 **Tamaro cart:**\n{lines}\n\n**Total: ₹{total}**\nCheckout mate 'checkout' kaho."
    return f"🛒 **Your cart:**\n{lines}\n\n**Total: ₹{total}**\nSay **checkout** to place your order!"

def checkout_msg(lang):
    if not cart:
        return t("cart_empty", lang)
    lines = "\n".join(f"  • {i['qty']}× {i['name']} — ₹{i['price']*i['qty']}" for i in cart)
    total = cart_total()
    return (f"🎉 **Order Placed!**\n\n{lines}\n\n"
            f"**Grand Total: ₹{total}**\n\nThank you! Your food will be ready soon. 🍽️")

# ═══════════════════════════════════════════════════════════════════════════════
# CHAT ENDPOINT
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/chat")
def chat(message: str):
    global pending_options, pending_qty, awaiting_upsell, cart

    raw   = message.strip()
    query = raw.lower().strip()
    lang  = detect_lang(query)

    # ── Greeting ──────────────────────────────────────────────────────────────
    if query in GREETING_WORDS or (len(query) <= 5 and any(g in query for g in GREETING_WORDS)):
        return _reply(t("greeting", lang), lang)

    # ── Cart view ─────────────────────────────────────────────────────────────
    if any(w in query for w in CART_WORDS):
        return _reply(cart_msg(lang), lang, include_cart=True)

    # ── Clear cart ────────────────────────────────────────────────────────────
    if any(w in query for w in CLEAR_WORDS):
        cart.clear(); pending_options.clear(); awaiting_upsell = None; pending_qty = 1
        return _reply(t("cleared", lang), lang)

    # ── Checkout ──────────────────────────────────────────────────────────────
    if any(w in query for w in CHECKOUT_WORDS):
        msg = checkout_msg(lang)
        receipt = get_cart_summary()
        total   = cart_total()
        cart.clear(); pending_options.clear(); awaiting_upsell = None
        return _reply(msg, lang, action="checkout", receipt=receipt, total=total)

    # ── Remove item ───────────────────────────────────────────────────────────
    if any(t_ in query for t_ in REMOVE_TRIGGERS):
        matches = match_items(query)
        if matches:
            name = matches[0]["name"]
            if remove_from_cart_by_name(name):
                return _reply(removed_msg(name, lang), lang, include_cart=True)
        return _reply(not_in_cart_msg(lang), lang)

    # ── Upsell yes/no response ────────────────────────────────────────────────
    if awaiting_upsell:
        upsell_item = awaiting_upsell
        awaiting_upsell = None

        if query in NO_WORDS or "skip" in query:
            return _reply(t("upsell_decline", lang), lang)

        # Check if user said a specific item name (from suggestions or new)
        matches = match_items(query)
        if matches:
            item = matches[0]
            qty  = extract_qty(query)
            add_to_cart(item["name"], item["price"], qty)
            msg  = added_msg(qty, item["name"], item["price"], lang)
            sugg = get_suggestions(item["name"])
            if sugg:
                awaiting_upsell = item["name"]
                msg += "\n\n" + upsell_msg(item["name"], sugg, lang)
            return _reply(msg, lang, include_cart=True)

        # Generic yes → add top suggestion
        if query in YES_WORDS:
            suggs = get_suggestions(upsell_item)
            if suggs:
                top = suggs[0]
                add_to_cart(top["name"], top["price"], 1)
                msg = added_msg(1, top["name"], top["price"], lang)
                return _reply(msg, lang, include_cart=True)
        return _reply(t("upsell_decline", lang), lang)

    # ── Pending disambiguation ────────────────────────────────────────────────
    if pending_options:
        option_names = [o["name"] for o in pending_options]
        best = process.extractOne(query, [n.lower() for n in option_names], scorer=fuzz.WRatio)

        if best and best[1] >= 58:
            idx  = [n.lower() for n in option_names].index(best[0])
            item = pending_options[idx]
            add_to_cart(item["name"], item["price"], pending_qty)
            msg  = added_msg(pending_qty, item["name"], item["price"], lang)
            sugg = get_suggestions(item["name"])
            pending_options.clear(); pending_qty = 1
            if sugg:
                awaiting_upsell = item["name"]
                msg += "\n\n" + upsell_msg(item["name"], sugg, lang)
            return _reply(msg, lang, include_cart=True)

        if any(w in query for w in ["cancel","nevermind","nahi","na","no"]):
            pending_options.clear(); pending_qty = 1
            return _reply("Okay, cancelled. What else would you like?", lang)

        return _reply(t("choose_or_cancel", lang), lang, options=pending_options)

    # ── Normal order processing ───────────────────────────────────────────────
    qty_raw  = extract_qty(query)
    clean_q  = strip_qty_words(query)
    matches  = match_items(clean_q) or match_items(query)

    if not matches:
        # Try to find similar items as suggestions
        partial = process.extract(query, menu_items_lower, limit=3, scorer=fuzz.partial_ratio)
        similar = [menu_lookup[m[0]] for m in partial if m[1] > 50]
        hint = ""
        if similar:
            hint = f"\n\nDid you mean: **{' / '.join(similar)}**?"
        return _reply(t("not_found", lang) + hint, lang)

    if len(matches) == 1:
        item = matches[0]
        add_to_cart(item["name"], item["price"], qty_raw)
        msg  = added_msg(qty_raw, item["name"], item["price"], lang)
        # rating badge
        stars = "⭐" * round(item["rating"])
        msg  += f"\n_{item['name']} is rated {item['rating']} {stars}_"
        sugg = get_suggestions(item["name"])
        if sugg:
            awaiting_upsell = item["name"]
            msg += "\n\n" + upsell_msg(item["name"], sugg, lang)
        return _reply(msg, lang, include_cart=True)

    # Multiple matches → disambiguate
    pending_options.clear()
    pending_options.extend(matches)
    pending_qty = qty_raw
    opts_text = "\n".join(f"  {i+1}. **{m['name']}** — ₹{m['price']}" for i, m in enumerate(matches))
    msg = t("clarify", lang) + "\n\n" + opts_text
    return _reply(msg, lang, options=matches)


def _reply(text: str, lang: str, action: str = "message",
           options=None, include_cart=False, receipt=None, total=None):
    resp = {
        "reply":   text,
        "lang":    lang,
        "action":  action,
        "cart":    get_cart_summary(),
        "cart_total": cart_total(),
        "cart_count": cart_count(),
    }
    if options:
        resp["options"] = options
    if receipt is not None:
        resp["receipt"] = receipt
        resp["total"]   = total
    return resp


# ── Utility endpoints ─────────────────────────────────────────────────────────

@app.get("/menu")
def get_menu():
    items = [{"name": r["food_name"], "price": int(r["price"]), "rating": r["rating"],
              "category": r["category"], "cuisine": r["cuisine"]}
             for _, r in menu_df.iterrows()]
    return {"items": sorted(items, key=lambda x: x["name"])}

@app.post("/cart/clear")
def api_clear_cart():
    global cart, pending_options, awaiting_upsell, pending_qty
    cart.clear(); pending_options.clear(); awaiting_upsell = None; pending_qty = 1
    return {"message": "Cart cleared."}

@app.post("/cart/remove")
def api_remove_item(item_name: str):
    if remove_from_cart_by_name(item_name):
        return {"message": f"Removed {item_name}.", "cart": get_cart_summary(), "cart_total": cart_total()}
    return {"message": "Item not found in cart."}

@app.get("/cart")
def api_cart():
    return {"cart": get_cart_summary(), "cart_total": cart_total(), "cart_count": cart_count()}


# ═══════════════════════════════════════════════════════════════════════════════
# FRONTEND  (served at /)
# ═══════════════════════════════════════════════════════════════════════════════

FRONTEND = """
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Bite — Smart Food Assistant</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>
<style>
/* ─── Reset ──────────────────────────────────────────────────────────────── */
*{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#F7F3EE;
  --surface:#FFFFFF;
  --surface2:#F2EDE6;
  --surface3:#EAE3D8;
  --border:#E0D8CC;
  --border2:#D4C9B8;
  --accent:#D4561A;
  --accent2:#B8431A;
  --accent3:#F07040;
  --accent-soft:rgba(212,86,26,0.10);
  --gold:#C8901A;
  --gold-soft:rgba(200,144,26,0.12);
  --green:#1E7A4A;
  --green-soft:rgba(30,122,74,0.10);
  --ink:#1C1410;
  --ink2:#4A3728;
  --ink3:#8A7060;
  --shadow-sm:0 2px 8px rgba(28,20,16,0.08);
  --shadow:0 6px 24px rgba(28,20,16,0.12);
  --shadow-lg:0 16px 48px rgba(28,20,16,0.18);
  --r:20px;--r2:14px;--r3:10px;--r4:6px;
}
html,body{height:100%;font-family:'Plus Jakarta Sans',sans-serif;background:var(--bg);color:var(--ink);overflow:hidden}
button{font-family:'Plus Jakarta Sans',sans-serif;cursor:pointer;border:none;outline:none;background:none}
input{font-family:'Plus Jakarta Sans',sans-serif;outline:none;border:none;background:none}
::-webkit-scrollbar{width:4px;height:4px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:var(--border2);border-radius:4px}

/* ─── App shell ───────────────────────────────────────────────────────────── */
.app{
  display:grid;
  grid-template-columns:280px 1fr 340px;
  grid-template-rows:100vh;
  height:100vh;
  overflow:hidden;
}

/* ─── LEFT — Menu Panel ───────────────────────────────────────────────────── */
.menu-panel{
  background:var(--ink);
  display:flex;flex-direction:column;
  overflow:hidden;
  position:relative;
}
.menu-panel::before{
  content:'';position:absolute;top:0;left:0;right:0;height:200px;
  background:linear-gradient(160deg,rgba(212,86,26,.35) 0%,transparent 100%);
  pointer-events:none;
}
.brand{
  padding:1.5rem 1.25rem 1rem;
  display:flex;align-items:center;gap:.6rem;
  flex-shrink:0;position:relative;z-index:1;
}
.brand-icon{
  width:36px;height:36px;border-radius:10px;
  background:var(--accent);
  display:flex;align-items:center;justify-content:center;
  font-size:1.1rem;flex-shrink:0;
}
.brand-name{
  font-family:'Playfair Display',serif;
  font-size:1.4rem;font-weight:900;
  color:#FFF;letter-spacing:-.02em;
}
.brand-name span{color:var(--accent3);font-style:italic}

.menu-search-wrap{padding:0 1rem .75rem;position:relative;z-index:1;flex-shrink:0}
.menu-search{
  width:100%;padding:.55rem .85rem .55rem 2.2rem;
  background:rgba(255,255,255,.08);
  border:1px solid rgba(255,255,255,.12);
  border-radius:999px;
  color:#fff;font-size:.8rem;
}
.menu-search::placeholder{color:rgba(255,255,255,.35)}
.menu-search-icon{
  position:absolute;left:1.7rem;top:50%;transform:translateY(-50%);
  font-size:.8rem;opacity:.4;pointer-events:none;
}

.menu-cats{
  display:flex;gap:.4rem;padding:0 1rem .75rem;
  overflow-x:auto;flex-shrink:0;
}
.menu-cats::-webkit-scrollbar{display:none}
.cat-pill{
  padding:.28rem .7rem;border-radius:999px;
  font-size:.68rem;font-weight:700;
  color:rgba(255,255,255,.5);
  border:1px solid rgba(255,255,255,.12);
  white-space:nowrap;transition:all .15s;
}
.cat-pill:hover,.cat-pill.active{
  background:var(--accent);color:#fff;border-color:var(--accent);
}

.menu-list{flex:1;overflow-y:auto;padding:0 .75rem 1rem}
.menu-item{
  display:flex;align-items:center;gap:.65rem;
  padding:.65rem .5rem;
  border-radius:var(--r3);
  cursor:pointer;transition:all .15s;
  border:1px solid transparent;
  margin-bottom:.2rem;
}
.menu-item:hover{background:rgba(255,255,255,.07);border-color:rgba(255,255,255,.1)}
.menu-item-emoji{
  width:36px;height:36px;border-radius:9px;
  background:rgba(255,255,255,.08);
  display:flex;align-items:center;justify-content:center;
  font-size:1.1rem;flex-shrink:0;
}
.menu-item-info{flex:1;min-width:0}
.menu-item-name{font-size:.8rem;font-weight:600;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.menu-item-meta{font-size:.68rem;color:rgba(255,255,255,.4);margin-top:1px}
.menu-item-price{font-size:.82rem;font-weight:700;color:var(--accent3);flex-shrink:0}
.menu-item-add{
  width:22px;height:22px;border-radius:6px;
  background:var(--accent);
  color:#fff;font-size:.9rem;font-weight:700;
  display:flex;align-items:center;justify-content:center;
  opacity:0;transform:scale(.7);transition:all .15s;flex-shrink:0;
}
.menu-item:hover .menu-item-add{opacity:1;transform:scale(1)}

/* ─── CENTER — Chat Panel ─────────────────────────────────────────────────── */
.chat-panel{
  display:flex;flex-direction:column;
  background:var(--bg);
  border-left:1px solid var(--border);
  border-right:1px solid var(--border);
  overflow:hidden;
}

.chat-topbar{
  padding:.9rem 1.5rem;
  background:var(--surface);
  border-bottom:1px solid var(--border);
  display:flex;align-items:center;justify-content:space-between;
  flex-shrink:0;
}
.chat-topbar-left{display:flex;align-items:center;gap:.75rem}
.bot-avatar-wrap{position:relative}
.bot-avatar{
  width:40px;height:40px;border-radius:12px;
  background:linear-gradient(135deg,var(--accent),var(--accent2));
  display:flex;align-items:center;justify-content:center;
  font-size:1.3rem;
}
.online-dot{
  position:absolute;bottom:-1px;right:-1px;
  width:10px;height:10px;border-radius:50%;
  background:var(--green);border:2px solid var(--surface);
}
.bot-info-name{font-size:.9rem;font-weight:700;color:var(--ink)}
.bot-info-status{font-size:.72rem;color:var(--green);font-weight:600;display:flex;align-items:center;gap:.3rem}
.bot-info-status::before{content:'';width:5px;height:5px;border-radius:50%;background:var(--green);animation:pulse-green 2s infinite}
@keyframes pulse-green{0%,100%{opacity:1}50%{opacity:.4}}

.chat-topbar-actions{display:flex;gap:.5rem}
.topbar-btn{
  padding:.4rem .85rem;border-radius:999px;
  font-size:.72rem;font-weight:700;
  color:var(--ink3);border:1.5px solid var(--border2);
  transition:all .15s;
}
.topbar-btn:hover{background:var(--accent);color:#fff;border-color:var(--accent)}
.topbar-btn.danger:hover{background:#ef4444;color:#fff;border-color:#ef4444}

/* Messages */
.messages-wrap{
  flex:1;overflow-y:auto;
  padding:1.5rem;
  display:flex;flex-direction:column;gap:1.25rem;
}

.msg-group{display:flex;gap:.75rem;animation:msg-in .3s cubic-bezier(.34,1.3,.64,1)}
@keyframes msg-in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
.msg-group.user{flex-direction:row-reverse}

.avatar{
  width:32px;height:32px;border-radius:10px;
  display:flex;align-items:center;justify-content:center;
  font-size:.78rem;font-weight:800;flex-shrink:0;margin-top:2px;
}
.avatar.bot{background:linear-gradient(135deg,var(--accent),var(--accent2));color:#fff;font-size:1rem}
.avatar.user{background:var(--surface3);color:var(--ink2)}

.bubble{
  max-width:72%;
  padding:.85rem 1.1rem;
  border-radius:18px 18px 18px 4px;
  background:var(--surface);
  border:1px solid var(--border);
  font-size:.875rem;line-height:1.65;
  color:var(--ink);
  box-shadow:var(--shadow-sm);
}
.msg-group.user .bubble{
  border-radius:18px 18px 4px 18px;
  background:var(--accent);
  color:#fff;border-color:var(--accent2);
  font-weight:500;
}
.bubble strong{font-weight:700}
.bubble em{color:var(--ink3);font-style:normal;font-size:.82rem}
.msg-group.user .bubble em{color:rgba(255,255,255,.7)}

/* Typing */
.typing-bubble{display:flex;align-items:center;gap:.35rem;padding:.9rem 1.2rem}
.t-dot{width:7px;height:7px;border-radius:50%;background:var(--border2);animation:tdot 1.2s infinite}
.t-dot:nth-child(2){animation-delay:.2s}
.t-dot:nth-child(3){animation-delay:.4s}
@keyframes tdot{0%,60%,100%{transform:translateY(0);opacity:.5}30%{transform:translateY(-5px);opacity:1}}

/* Option chips */
.chips-row{display:flex;flex-wrap:wrap;gap:.4rem;margin-top:.75rem}
.opt-chip{
  padding:.35rem .85rem;
  background:var(--surface2);border:1.5px solid var(--border2);
  border-radius:999px;font-size:.78rem;font-weight:600;color:var(--ink2);
  transition:all .15s;cursor:pointer;
}
.opt-chip:hover{background:var(--accent);color:#fff;border-color:var(--accent);transform:translateY(-1px)}

/* Upsell card */
.upsell-card{
  margin-top:.85rem;
  background:linear-gradient(135deg,var(--gold-soft),rgba(212,86,26,.06));
  border:1.5px solid rgba(200,144,26,.25);
  border-radius:var(--r3);padding:.85rem;
}
.upsell-label{
  font-size:.65rem;font-weight:800;text-transform:uppercase;letter-spacing:.1em;
  color:var(--gold);margin-bottom:.5rem;display:flex;align-items:center;gap:.3rem;
}
.upsell-items{display:flex;flex-direction:column;gap:.35rem;margin-bottom:.65rem}
.upsell-item-row{
  display:flex;align-items:center;justify-content:space-between;gap:.5rem;
}
.upsell-item-name{font-size:.8rem;font-weight:600;color:var(--ink)}
.upsell-item-price{font-size:.75rem;color:var(--ink3)}
.upsell-item-conf{
  font-size:.65rem;font-weight:700;
  background:var(--gold-soft);color:var(--gold);
  padding:.1rem .4rem;border-radius:4px;
}
.upsell-add-btn{
  padding:.25rem .65rem;border-radius:6px;
  background:var(--accent-soft);color:var(--accent);
  font-size:.72rem;font-weight:700;border:1px solid rgba(212,86,26,.2);
  transition:all .15s;
}
.upsell-add-btn:hover{background:var(--accent);color:#fff;border-color:var(--accent)}
.upsell-actions{display:flex;gap:.4rem;flex-wrap:wrap}
.upsell-skip{
  padding:.32rem .75rem;border-radius:999px;
  font-size:.72rem;font-weight:600;color:var(--ink3);
  border:1px solid var(--border2);transition:all .15s;
}
.upsell-skip:hover{color:var(--ink);background:var(--surface2)}

/* Receipt card */
.receipt-card{
  margin-top:.85rem;
  background:var(--surface2);border-radius:var(--r3);
  border:1px solid var(--border2);overflow:hidden;
}
.receipt-head{
  background:var(--green-soft);padding:.55rem .85rem;
  font-size:.7rem;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--green);
  border-bottom:1px solid rgba(30,122,74,.15);
}
.receipt-rows{padding:.5rem .85rem}
.receipt-row-item{
  display:flex;justify-content:space-between;
  font-size:.8rem;padding:.3rem 0;
  border-bottom:1px dashed var(--border);color:var(--ink2);
}
.receipt-row-item:last-child{border:none}
.receipt-total-row{
  display:flex;justify-content:space-between;
  padding:.55rem .85rem;
  background:var(--surface3);
  font-size:.88rem;font-weight:800;color:var(--ink);
  border-top:1.5px solid var(--border2);
}

/* Quick actions */
.quick-row{
  display:flex;gap:.4rem;flex-wrap:wrap;
  padding:.75rem 1.5rem .5rem;
  border-top:1px solid var(--border);
  flex-shrink:0;
}
.quick-btn{
  padding:.32rem .75rem;border-radius:999px;
  background:var(--surface);border:1.5px solid var(--border2);
  font-size:.72rem;font-weight:600;color:var(--ink2);
  transition:all .15s;white-space:nowrap;
}
.quick-btn:hover{background:var(--ink);color:#fff;border-color:var(--ink)}
.quick-btn.accent{
  background:var(--accent-soft);color:var(--accent);border-color:rgba(212,86,26,.25);
}
.quick-btn.accent:hover{background:var(--accent);color:#fff;border-color:var(--accent)}

/* Input bar */
.input-bar{
  padding:1rem 1.5rem 1.25rem;
  background:var(--surface);
  border-top:1px solid var(--border);
  flex-shrink:0;
}
.input-inner{
  display:flex;align-items:center;gap:.6rem;
  background:var(--surface2);
  border:1.5px solid var(--border2);
  border-radius:16px;padding:.6rem .6rem .6rem 1rem;
  transition:border-color .2s;
}
.input-inner:focus-within{border-color:var(--accent);background:var(--surface)}
.msg-input{
  flex:1;font-size:.9rem;color:var(--ink);background:none;
  min-width:0;
}
.msg-input::placeholder{color:var(--ink3)}
.send-btn{
  width:38px;height:38px;border-radius:11px;
  background:var(--accent);color:#fff;
  display:flex;align-items:center;justify-content:center;
  transition:all .2s;flex-shrink:0;
}
.send-btn:hover{background:var(--accent2);transform:scale(1.05)}
.send-btn:active{transform:scale(.96)}
.send-btn svg{width:17px;height:17px}

/* ─── RIGHT — Cart Panel ──────────────────────────────────────────────────── */
.cart-panel{
  background:var(--surface);
  display:flex;flex-direction:column;
  overflow:hidden;
  border-left:1px solid var(--border);
}

.cart-topbar{
  padding:1.1rem 1.25rem .9rem;
  border-bottom:1px solid var(--border);
  display:flex;align-items:center;justify-content:space-between;
  flex-shrink:0;
}
.cart-topbar-title{
  display:flex;align-items:center;gap:.6rem;
  font-size:1rem;font-weight:800;color:var(--ink);
}
.cart-badge{
  min-width:22px;height:22px;padding:0 5px;
  border-radius:999px;background:var(--accent);color:#fff;
  font-size:.65rem;font-weight:800;
  display:flex;align-items:center;justify-content:center;
}
.cart-clear-btn{
  font-size:.72rem;font-weight:700;color:var(--ink3);
  padding:.25rem .6rem;border-radius:6px;
  border:1px solid var(--border2);transition:all .15s;
}
.cart-clear-btn:hover{color:#ef4444;border-color:#ef4444;background:rgba(239,68,68,.06)}

/* Cart items */
.cart-body{flex:1;overflow-y:auto;padding:.75rem 1.25rem;display:flex;flex-direction:column;gap:.5rem}

.cart-empty-state{
  flex:1;display:flex;flex-direction:column;
  align-items:center;justify-content:center;
  gap:.75rem;text-align:center;padding:2.5rem 1rem;
}
.cart-empty-art{
  width:72px;height:72px;border-radius:20px;
  background:var(--surface2);border:2px dashed var(--border2);
  display:flex;align-items:center;justify-content:center;
  font-size:2rem;
}
.cart-empty-title{font-size:.9rem;font-weight:700;color:var(--ink)}
.cart-empty-sub{font-size:.78rem;color:var(--ink3);line-height:1.5}

.cart-item{
  background:var(--bg);border:1px solid var(--border);
  border-radius:var(--r2);padding:.75rem;
  display:flex;align-items:center;gap:.6rem;
  animation:msg-in .2s ease;
  transition:border-color .15s;
}
.cart-item:hover{border-color:var(--border2)}
.cart-item-emoji{
  width:36px;height:36px;border-radius:9px;
  background:var(--surface);border:1px solid var(--border);
  display:flex;align-items:center;justify-content:center;
  font-size:1.1rem;flex-shrink:0;
}
.cart-item-details{flex:1;min-width:0}
.cart-item-name{font-size:.82rem;font-weight:700;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cart-item-unit-price{font-size:.7rem;color:var(--ink3);margin-top:1px}
.cart-item-controls{display:flex;align-items:center;gap:.35rem;flex-shrink:0}
.qty-dec,.qty-inc{
  width:24px;height:24px;border-radius:7px;
  background:var(--surface2);border:1px solid var(--border2);
  font-size:.95rem;font-weight:800;color:var(--ink);
  display:flex;align-items:center;justify-content:center;
  transition:all .15s;
}
.qty-dec:hover,.qty-inc:hover{background:var(--accent);color:#fff;border-color:var(--accent)}
.qty-val{font-size:.82rem;font-weight:800;min-width:20px;text-align:center;color:var(--ink)}
.cart-item-sub{font-size:.82rem;font-weight:800;color:var(--accent);min-width:46px;text-align:right;flex-shrink:0}
.cart-item-del{
  color:var(--border2);font-size:.85rem;
  padding:.2rem;transition:color .15s;flex-shrink:0;
}
.cart-item-del:hover{color:#ef4444}

/* Order summary */
.order-summary{
  border-top:1px solid var(--border);
  padding:1rem 1.25rem;flex-shrink:0;
}
.summary-rows{margin-bottom:.9rem}
.summary-row{
  display:flex;justify-content:space-between;
  font-size:.8rem;color:var(--ink3);padding:.2rem 0;
}
.summary-row.total{
  font-size:1rem;font-weight:800;color:var(--ink);
  padding-top:.5rem;margin-top:.3rem;
  border-top:1.5px solid var(--border2);
}
.summary-row.total .sum-val{
  font-family:'Playfair Display',serif;font-size:1.25rem;color:var(--accent);
}

.checkout-btn{
  width:100%;padding:.9rem;border-radius:var(--r2);
  background:var(--accent);color:#fff;
  font-size:.9rem;font-weight:800;
  transition:all .2s;
  box-shadow:0 4px 16px rgba(212,86,26,.3);
  display:flex;align-items:center;justify-content:center;gap:.5rem;
}
.checkout-btn:hover{background:var(--accent2);transform:translateY(-2px);box-shadow:0 8px 24px rgba(212,86,26,.4)}
.checkout-btn:active{transform:translateY(0)}
.checkout-btn:disabled{opacity:.4;cursor:not-allowed;transform:none;box-shadow:none}

/* ─── Toast ───────────────────────────────────────────────────────────────── */
#toast{
  position:fixed;bottom:1.5rem;left:50%;
  transform:translateX(-50%) translateY(80px);
  background:var(--ink);color:#fff;
  padding:.65rem 1.25rem;border-radius:999px;
  font-size:.8rem;font-weight:600;
  box-shadow:var(--shadow-lg);z-index:999;
  transition:transform .35s cubic-bezier(.34,1.4,.64,1);
  pointer-events:none;white-space:nowrap;
}
#toast.show{transform:translateX(-50%) translateY(0)}

/* ─── Success overlay ─────────────────────────────────────────────────────── */
.overlay{
  position:fixed;inset:0;z-index:200;
  background:rgba(28,20,16,.6);backdrop-filter:blur(6px);
  display:flex;align-items:center;justify-content:center;
  opacity:0;pointer-events:none;transition:opacity .3s;
}
.overlay.show{opacity:1;pointer-events:all}
.success-modal{
  background:var(--surface);border-radius:24px;
  padding:2.5rem;max-width:400px;width:90%;
  text-align:center;box-shadow:var(--shadow-lg);
  transform:scale(.85) translateY(20px);
  transition:transform .4s cubic-bezier(.34,1.3,.64,1);
}
.overlay.show .success-modal{transform:scale(1) translateY(0)}
.success-icon{font-size:3.5rem;margin-bottom:1rem;display:block;animation:pop .5s cubic-bezier(.34,1.8,.64,1) .1s both}
@keyframes pop{from{transform:scale(0)}to{transform:scale(1)}}
.success-title{font-family:'Playfair Display',serif;font-size:1.7rem;font-weight:900;color:var(--ink);margin-bottom:.35rem}
.success-sub{font-size:.85rem;color:var(--ink3);margin-bottom:1.5rem;line-height:1.5}
.success-receipt{
  background:var(--bg);border-radius:var(--r2);padding:1rem;
  margin-bottom:1.5rem;text-align:left;max-height:180px;overflow-y:auto;
}
.sreceipt-row{
  display:flex;justify-content:space-between;
  font-size:.8rem;color:var(--ink2);padding:.3rem 0;
  border-bottom:1px dashed var(--border);
}
.sreceipt-row:last-child{border:none}
.sreceipt-total{
  display:flex;justify-content:space-between;
  font-size:.92rem;font-weight:800;color:var(--ink);
  padding:.5rem 0 0;border-top:1.5px solid var(--border2);margin-top:.25rem;
}
.new-order-btn{
  width:100%;padding:.85rem;border-radius:12px;
  background:var(--accent);color:#fff;
  font-size:.88rem;font-weight:800;
  transition:background .2s;
}
.new-order-btn:hover{background:var(--accent2)}

/* ─── Responsive ──────────────────────────────────────────────────────────── */
@media(max-width:1100px){
  .app{grid-template-columns:0 1fr 300px}
  .menu-panel{display:none}
}
@media(max-width:720px){
  .app{grid-template-columns:1fr}
  .cart-panel{
    position:fixed;right:0;top:0;bottom:0;width:300px;
    transform:translateX(100%);transition:transform .3s;z-index:50;
  }
  .cart-panel.open{transform:translateX(0)}
  .mobile-cart-btn{
    display:flex!important;position:fixed;bottom:1.5rem;right:1.5rem;
    width:52px;height:52px;border-radius:50%;
    background:var(--accent);color:#fff;
    font-size:1.3rem;align-items:center;justify-content:center;
    box-shadow:var(--shadow-lg);z-index:49;
  }
}
.mobile-cart-btn{display:none}
</style>
</head>
<body>
<div class="app" id="app">

  <!-- ══════════════════ LEFT — MENU ══════════════════ -->
  <aside class="menu-panel">
    <div class="brand">
      <div class="brand-icon">🍽</div>
      <div class="brand-name">Bite<span>bot</span></div>
    </div>

    <div class="menu-search-wrap">
      <span class="menu-search-icon">🔍</span>
      <input class="menu-search" id="menuSearch" placeholder="Search menu…" oninput="filterMenu()"/>
    </div>

    <div class="menu-cats" id="menuCats">
      <button class="cat-pill active" onclick="filterCat('all',this)">All</button>
    </div>

    <div class="menu-list" id="menuList">
      <div style="padding:2rem 1rem;text-align:center;color:rgba(255,255,255,.3);font-size:.8rem">Loading menu…</div>
    </div>
  </aside>

  <!-- ══════════════════ CENTER — CHAT ══════════════════ -->
  <main class="chat-panel">
    <div class="chat-topbar">
      <div class="chat-topbar-left">
        <div class="bot-avatar-wrap">
          <div class="bot-avatar">🤖</div>
          <div class="online-dot"></div>
        </div>
        <div>
          <div class="bot-info-name">Bite Assistant</div>
          <div class="bot-info-status">Online · Ready to take your order</div>
        </div>
      </div>
      <div class="chat-topbar-actions">
        <button class="topbar-btn" onclick="sendMsg('show my cart')">🛒 Cart</button>
        <button class="topbar-btn accent danger" onclick="clearCartUI()">Clear</button>
      </div>
    </div>

    <div class="messages-wrap" id="messagesWrap"></div>

    <div class="quick-row" id="quickRow">
      <button class="quick-btn accent" onclick="sendMsg('Hi!')">👋 Say hi</button>
      <button class="quick-btn" onclick="sendMsg('Veg Burger')">🍔 Burger</button>
      <button class="quick-btn" onclick="sendMsg('Pizza')">🍕 Pizza</button>
      <button class="quick-btn" onclick="sendMsg('Hakka Noodles')">🍜 Noodles</button>
      <button class="quick-btn" onclick="sendMsg('Veg Biryani')">🍛 Biryani</button>
      <button class="quick-btn" onclick="sendMsg('Fries')">🍟 Fries</button>
      <button class="quick-btn" onclick="sendMsg('checkout')">✅ Checkout</button>
    </div>

    <div class="input-bar">
      <div class="input-inner">
        <input class="msg-input" id="msgInput"
          placeholder="Type your order… (e.g. 2 veg burgers, add fries)"
          onkeydown="if(event.key==='Enter')submitInput()"/>
        <button class="send-btn" onclick="submitInput()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
    </div>
  </main>

  <!-- ══════════════════ RIGHT — CART ══════════════════ -->
  <aside class="cart-panel" id="cartPanel">
    <div class="cart-topbar">
      <div class="cart-topbar-title">
        Your Order
        <div class="cart-badge" id="cartBadge">0</div>
      </div>
      <button class="cart-clear-btn" onclick="clearCartUI()">Clear all</button>
    </div>

    <div class="cart-body" id="cartBody">
      <div class="cart-empty-state" id="cartEmptyState">
        <div class="cart-empty-art">🛒</div>
        <div class="cart-empty-title">Cart is empty</div>
        <div class="cart-empty-sub">Browse the menu or chat with me to add items!</div>
      </div>
      <div id="cartItemsList" style="display:none;display:flex;flex-direction:column;gap:.5rem"></div>
    </div>

    <div class="order-summary">
      <div class="summary-rows">
        <div class="summary-row"><span>Subtotal</span><span id="subtotalVal">₹0</span></div>
        <div class="summary-row"><span>Tax (5%)</span><span id="taxVal">₹0</span></div>
        <div class="summary-row total">
          <span>Total</span>
          <span class="sum-val" id="totalVal">₹0</span>
        </div>
      </div>
      <button class="checkout-btn" id="checkoutBtn" onclick="sendMsg('checkout')" disabled>
        Place Order →
      </button>
    </div>
  </aside>
</div>

<!-- Mobile cart fab -->
<button class="mobile-cart-btn" onclick="document.getElementById('cartPanel').classList.toggle('open')">🛒</button>

<!-- Toast -->
<div id="toast"></div>

<!-- Success overlay -->
<div class="overlay" id="successOverlay">
  <div class="success-modal">
    <span class="success-icon">🎉</span>
    <div class="success-title">Order Placed!</div>
    <div class="success-sub" id="successSub">Your food is being prepared.</div>
    <div class="success-receipt" id="successReceipt"></div>
    <button class="new-order-btn" onclick="closeSuccess()">Start New Order</button>
  </div>
</div>

<script>
// ══════════════════════════════════════════════════════
//  STATE
// ══════════════════════════════════════════════════════
let cartState   = [];
let allMenuItems = [];
let activeCategory = 'all';

// ══════════════════════════════════════════════════════
//  BOOT
// ══════════════════════════════════════════════════════
window.addEventListener('load', async () => {
  await loadMenu();
  refreshCart();
  setTimeout(() => sendMsg('Hi!', true), 600);
});

// ══════════════════════════════════════════════════════
//  MENU
// ══════════════════════════════════════════════════════
const FOOD_EMOJI = {
  'burger':'🍔','pizza':'🍕','noodles':'🍜','biryani':'🍛','rice':'🍚',
  'dosa':'🥞','sandwich':'🥪','wrap':'🌯','fries':'🍟','soup':'🥣',
  'salad':'🥗','pasta':'🍝','momos':'🥟','samosa':'🥟','paratha':'🫓',
  'roti':'🫓','naan':'🫓','coffee':'☕','latte':'☕','cappuccino':'☕',
  'shake':'🥤','soda':'🥤','juice':'🥤','coke':'🥤','pepsi':'🥤',
  'mojito':'🍹','falooda':'🍧','ice cream':'🍨','brownie':'🍫',
  'cake':'🎂','chocolate':'🍫','paneer':'🧀','veg':'🥦',
  'chilli':'🌶','garlic':'🧄','onion':'🧅','spring':'🥬',
  'nachos':'🌮','kachori':'🧆','vada':'🧆','bhaji':'🥘',
  'chawal':'🍚','makhani':'🍲','biryani':'🍛','dal':'🫘',
  'idli':'🥞','chole':'🥘','rajma':'🫘','kadhi':'🍲',
};
function getEmoji(name) {
  const n = name.toLowerCase();
  for (const [k, v] of Object.entries(FOOD_EMOJI)) {
    if (n.includes(k)) return v;
  }
  return '🍽';
}

async function loadMenu() {
  try {
    const r = await fetch('/menu');
    const d = await r.json();
    allMenuItems = d.items || [];
    buildCategoryPills();
    renderMenuList(allMenuItems);
  } catch(e) {
    document.getElementById('menuList').innerHTML =
      '<div style="padding:1rem;text-align:center;color:rgba(255,255,255,.3);font-size:.78rem">⚠️ Backend offline</div>';
  }
}

function buildCategoryPills() {
  const cats = ['all', ...new Set(allMenuItems.map(i => i.category))];
  const wrap = document.getElementById('menuCats');
  wrap.innerHTML = cats.map(c =>
    `<button class="cat-pill${c==='all'?' active':''}" onclick="filterCat('${c}',this)">${c==='all'?'All':c}</button>`
  ).join('');
}

function filterCat(cat, btn) {
  activeCategory = cat;
  document.querySelectorAll('.cat-pill').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  filterMenu();
}

function filterMenu() {
  const q = document.getElementById('menuSearch').value.toLowerCase();
  const filtered = allMenuItems.filter(i => {
    const matchCat = activeCategory === 'all' || i.category === activeCategory;
    const matchQ   = !q || i.name.toLowerCase().includes(q);
    return matchCat && matchQ;
  });
  renderMenuList(filtered);
}

function renderMenuList(items) {
  const list = document.getElementById('menuList');
  if (!items.length) {
    list.innerHTML = '<div style="padding:1rem;text-align:center;color:rgba(255,255,255,.3);font-size:.78rem">No items found</div>';
    return;
  }
  list.innerHTML = items.map(item => `
    <div class="menu-item" onclick="sendMsg('${item.name.replace(/'/g,"\\\\'")}')">
      <div class="menu-item-emoji">${getEmoji(item.name)}</div>
      <div class="menu-item-info">
        <div class="menu-item-name">${item.name}</div>
        <div class="menu-item-meta">⭐ ${item.rating} · ${item.category}</div>
      </div>
      <div class="menu-item-price">₹${item.price}</div>
      <div class="menu-item-add">+</div>
    </div>`).join('');
}

// ══════════════════════════════════════════════════════
//  CHAT
// ══════════════════════════════════════════════════════
function submitInput() {
  const inp = document.getElementById('msgInput');
  const v = inp.value.trim();
  if (!v) return;
  inp.value = '';
  sendMsg(v);
}

async function sendMsg(text, silent = false) {
  if (!silent) appendUserBubble(text);
  const typingEl = appendTyping();

  try {
    const r   = await fetch(`/chat?message=${encodeURIComponent(text)}`);
    const data = await r.json();
    typingEl.remove();
    renderBotMsg(data);
    if (data.cart !== undefined) updateCart(data.cart, data.cart_total, data.cart_count);
    if (data.action === 'checkout' && data.receipt) showSuccess(data);
  } catch(err) {
    typingEl.remove();
    appendBotBubble('⚠️ Could not reach the server. Please start the backend with <strong>python backend.py</strong>');
  }
}

// ── Bubble helpers ────────────────────────────────────────────────────────────
function appendUserBubble(text) {
  const wrap = document.getElementById('messagesWrap');
  const g = document.createElement('div');
  g.className = 'msg-group user';
  g.innerHTML = `
    <div class="avatar user">YOU</div>
    <div class="bubble">${escHtml(text)}</div>`;
  wrap.appendChild(g);
  wrap.scrollTop = wrap.scrollHeight;
}

function appendBotBubble(html) {
  const wrap = document.getElementById('messagesWrap');
  const g = document.createElement('div');
  g.className = 'msg-group bot';
  g.innerHTML = `
    <div class="avatar bot">🍽</div>
    <div class="bubble">${html}</div>`;
  wrap.appendChild(g);
  wrap.scrollTop = wrap.scrollHeight;
  return g;
}

function appendTyping() {
  const wrap = document.getElementById('messagesWrap');
  const g = document.createElement('div');
  g.className = 'msg-group bot';
  g.innerHTML = `
    <div class="avatar bot">🍽</div>
    <div class="bubble"><div class="typing-bubble">
      <span class="t-dot"></span><span class="t-dot"></span><span class="t-dot"></span>
    </div></div>`;
  wrap.appendChild(g);
  wrap.scrollTop = wrap.scrollHeight;
  return g;
}

function renderBotMsg(data) {
  const wrap = document.getElementById('messagesWrap');
  const g    = document.createElement('div');
  g.className = 'msg-group bot';

  const av  = document.createElement('div');
  av.className = 'avatar bot'; av.textContent = '🍽';

  const bub = document.createElement('div');
  bub.className = 'bubble';

  // Main text
  const txt = document.createElement('div');
  txt.innerHTML = mdToHtml(data.reply);
  bub.appendChild(txt);

  // ── Disambiguation options ──
  if (data.options && data.options.length) {
    const row = document.createElement('div');
    row.className = 'chips-row';
    data.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'opt-chip';
      btn.textContent = `${opt.name} — ₹${opt.price}`;
      btn.onclick = () => { sendMsg(opt.name); row.querySelectorAll('.opt-chip').forEach(b=>b.disabled=true); };
      row.appendChild(btn);
    });
    bub.appendChild(row);
  }

  // ── Upsell card ──
  // Parse upsell items from the structured reply text
  if (data.action !== 'checkout') {
    const upsellItems = parseUpsellItems(data.reply);
    if (upsellItems.length) {
      const card = buildUpsellCard(upsellItems);
      bub.appendChild(card);
    }
  }

  g.appendChild(av);
  g.appendChild(bub);
  wrap.appendChild(g);
  wrap.scrollTop = wrap.scrollHeight;
}

function parseUpsellItems(reply) {
  // Extract bold item names and prices from upsell message
  if (!reply.includes('also love') && !reply.includes('bhi order') && !reply.includes('paN order')) return [];
  const matches = [...reply.matchAll(/\\*\\*([^*]+)\\*\\* — ₹(\\d+)/g)];
  return matches.map(m => ({ name: m[1], price: parseInt(m[2]) }));
}

function buildUpsellCard(items) {
  const card = document.createElement('div');
  card.className = 'upsell-card';

  const label = document.createElement('div');
  label.className = 'upsell-label';
  label.innerHTML = '🔥 Popular Combos';
  card.appendChild(label);

  const list = document.createElement('div');
  list.className = 'upsell-items';

  items.forEach(item => {
    const row = document.createElement('div');
    row.className = 'upsell-item-row';
    row.innerHTML = `
      <div style="display:flex;align-items:center;gap:.4rem;min-width:0">
        <span style="font-size:.95rem">${getEmoji(item.name)}</span>
        <span class="upsell-item-name">${item.name}</span>
      </div>
      <div style="display:flex;align-items:center;gap:.4rem;flex-shrink:0">
        <span class="upsell-item-price">₹${item.price}</span>
        <button class="upsell-add-btn" onclick="addUpsellItem('${item.name.replace(/'/g,"\\\\'")}',${item.price},this)">Add +</button>
      </div>`;
    list.appendChild(row);
  });
  card.appendChild(list);

  const actions = document.createElement('div');
  actions.className = 'upsell-actions';
  const skip = document.createElement('button');
  skip.className = 'upsell-skip';
  skip.textContent = 'No thanks, skip →';
  skip.onclick = () => { sendMsg('skip'); card.remove(); };
  actions.appendChild(skip);
  card.appendChild(actions);

  return card;
}

async function addUpsellItem(name, price, btn) {
  btn.disabled = true; btn.textContent = '✓';
  btn.style.background = 'var(--green-soft)'; btn.style.color = 'var(--green)';
  await sendMsg(name, true);
}

// ── Cart rendering ────────────────────────────────────────────────────────────
function updateCart(items, total, count) {
  cartState = items || [];
  const subtotal  = total || 0;
  const tax       = Math.round(subtotal * 0.05);
  const grandTotal = subtotal + tax;
  const itemCount  = count || cartState.reduce((s,i)=>s+i.qty,0);

  document.getElementById('cartBadge').textContent     = itemCount;
  document.getElementById('subtotalVal').textContent   = `₹${subtotal}`;
  document.getElementById('taxVal').textContent        = `₹${tax}`;
  document.getElementById('totalVal').textContent      = `₹${grandTotal}`;
  document.getElementById('checkoutBtn').disabled      = cartState.length === 0;

  const emptyEl = document.getElementById('cartEmptyState');
  const listEl  = document.getElementById('cartItemsList');

  if (!cartState.length) {
    emptyEl.style.display = 'flex'; listEl.style.display = 'none'; return;
  }
  emptyEl.style.display = 'none'; listEl.style.display = 'flex';

  listEl.innerHTML = cartState.map(item => `
    <div class="cart-item">
      <div class="cart-item-emoji">${getEmoji(item.name)}</div>
      <div class="cart-item-details">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-unit-price">₹${item.price} each</div>
      </div>
      <div class="cart-item-controls">
        <button class="qty-dec" onclick="changeQty(${JSON.stringify(item.name)}, -1)">−</button>
        <span class="qty-val">${item.qty}</span>
        <button class="qty-inc" onclick="changeQty(${JSON.stringify(item.name)}, 1)">+</button>
      </div>
      <div class="cart-item-sub">₹${item.subtotal}</div>
      <button class="cart-item-del" onclick="removeCartItem(${JSON.stringify(item.name)})">✕</button>
    </div>`).join('');
}

async function refreshCart() {
  try {
    const r = await fetch('/cart'); const d = await r.json();
    updateCart(d.cart, d.cart_total, d.cart_count);
  } catch(e) {}
}

async function changeQty(name, delta) {
  const item = cartState.find(i => i.name === name);
  if (!item) return;
  if (delta > 0) {
    const r = await fetch(`/chat?message=${encodeURIComponent('add 1 ' + name)}`);
    const d = await r.json();
    if (d.cart !== undefined) updateCart(d.cart, d.cart_total, d.cart_count);
  } else {
    if (item.qty <= 1) { await removeCartItem(name); return; }
    await fetch(`/cart/remove?item_name=${encodeURIComponent(name)}`, {method:'POST'});
    for (let i = 0; i < item.qty - 1; i++) {
      await fetch(`/chat?message=${encodeURIComponent('1 ' + name)}`);
    }
    await refreshCart();
  }
  showToast(`Updated cart`);
}

async function removeCartItem(name) {
  await fetch(`/cart/remove?item_name=${encodeURIComponent(name)}`, {method:'POST'});
  await refreshCart();
  showToast(`Removed ${name}`);
}

async function clearCartUI() {
  await fetch('/cart/clear', {method:'POST'});
  updateCart([], 0, 0);
  appendBotBubble('🗑️ Cart cleared! What would you like to order?');
  showToast('Cart cleared');
}

// ── Success modal ─────────────────────────────────────────────────────────────
function showSuccess(data) {
  const sub = document.getElementById('successSub');
  sub.textContent = `Grand Total: ₹${(data.total||0) + Math.round((data.total||0)*0.05)} (incl. taxes)`;

  const rec = document.getElementById('successReceipt');
  rec.innerHTML = (data.receipt || []).map(i =>
    `<div class="sreceipt-row"><span>${i.qty}× ${i.name}</span><span>₹${i.subtotal}</span></div>`
  ).join('') + `<div class="sreceipt-total"><span>Grand Total</span><span>₹${data.total}</span></div>`;

  document.getElementById('successOverlay').classList.add('show');
}
function closeSuccess() {
  document.getElementById('successOverlay').classList.remove('show');
  updateCart([], 0, 0);
  appendBotBubble('🎉 Thank you for your order! Ready to take your next one whenever you are 😊');
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function mdToHtml(text) {
  return text
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/\\*\\*(.+?)\\*\\*/g,'<strong>$1</strong>')
    .replace(/_(.+?)_/g,'<em>$1</em>')
    .replace(/\\n/g,'<br/>');
}
function escHtml(t) {
  return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

let toastTimer;
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg; el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
}
</script>
</body>
</html>

"""


@app.get("/", response_class=HTMLResponse)
def serve_frontend():
    return HTMLResponse(content=FRONTEND)
# ═══════════════════════════════════════════════════════════════════════════════
# VOICE BOT BRIDGE  — add these imports + endpoints to backend (1).py
# ═══════════════════════════════════════════════════════════════════════════════
#
# HOW TO USE:
#   1. Copy everything below and paste at the BOTTOM of your backend (1).py
#      (just before the `if __name__ == "__main__":` block)
#   2. Make sure voice_bot.py is running on port 8001:
#        cd chatbot && python voice_bot.py   (uvicorn will use port 8001)
#      Or change VOICE_BOT_URL below if you run it on a different port.
#
# ═══════════════════════════════════════════════════════════════════════════════

import httpx
from pydantic import BaseModel as _BaseModel

VOICE_BOT_URL = "http://localhost:8001"   # ← voice_bot.py address


# ── Pydantic models for voice bridge ─────────────────────────────────────────

class VoiceProcessRequest(_BaseModel):
    session_id: str
    transcript: str

class VoiceAddSuggRequest(_BaseModel):
    session_id: str
    food_name: str
    qty: int = 1

class VoiceResetRequest(_BaseModel):
    session_id: str


# ── Bridge: POST /api/voice/process ──────────────────────────────────────────
# ChatUI sends voice transcripts here; this backend proxies to voice_bot.py
# and also syncs the shared cart so the cart panel stays up to date.

@app.post("/api/voice/process")
async def voice_process(req: VoiceProcessRequest):
    """
    Forward voice transcript to voice_bot NLU, then sync the returned cart
    into this backend's shared cart state so the UI cart panel reflects it.
    """
    global cart

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            r = await client.post(
                f"{VOICE_BOT_URL}/api/voice/process",
                json={"session_id": req.session_id, "transcript": req.transcript},
            )
            data = r.json()
        except httpx.ConnectError:
            return {
                "reply": "Voice bot is offline. Please start voice_bot.py on port 8001. 🎤",
                "state": "error",
                "cart": [],
                "cart_total": 0,
                "suggestions": [],
                "menu_options": [],
            }

    # ── Sync voice bot cart → shared backend cart ─────────────────────────
    # The voice bot tracks its own session cart; we mirror it here so the
    # React cart panel (which reads /cart) stays in sync.
    voice_cart = data.get("cart", [])

    # Rebuild shared cart from voice bot state (replace, don't merge)
    cart.clear()
    for item in voice_cart:
        cart.append({
            "name":  item.get("food_name", item.get("name", "")),
            "price": item.get("price", 0),
            "qty":   item.get("qty", 1),
        })

    return data


# ── Bridge: POST /api/voice/add-suggestion ───────────────────────────────────

@app.post("/api/voice/add-suggestion")
async def voice_add_suggestion(req: VoiceAddSuggRequest):
    global cart
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            r = await client.post(
                f"{VOICE_BOT_URL}/api/voice/add-suggestion",
                json={"session_id": req.session_id, "food_name": req.food_name, "qty": req.qty},
            )
            data = r.json()
        except httpx.ConnectError:
            return {"reply": "Voice bot offline.", "cart": [], "cart_total": 0}

    voice_cart = data.get("cart", [])
    cart.clear()
    for item in voice_cart:
        cart.append({
            "name":  item.get("food_name", item.get("name", "")),
            "price": item.get("price", 0),
            "qty":   item.get("qty", 1),
        })
    return data


# ── Bridge: POST /api/voice/reset ────────────────────────────────────────────

@app.post("/api/voice/reset")
async def voice_reset(req: VoiceResetRequest):
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            r = await client.post(
                f"{VOICE_BOT_URL}/api/voice/reset",
                json={"session_id": req.session_id},
            )
            return r.json()
        except httpx.ConnectError:
            return {"status": "voice bot offline"}


# ── Bridge: GET /api/voice/health ─────────────────────────────────────────────

@app.get("/api/voice/health")
async def voice_health():
    async with httpx.AsyncClient(timeout=5.0) as client:
        try:
            r = await client.get(f"{VOICE_BOT_URL}/health")
            return {"main_backend": "ok", "voice_bot": r.json()}
        except httpx.ConnectError:
            return {"main_backend": "ok", "voice_bot": "offline — start voice_bot.py on port 8001"}

if __name__ == "__main__":
    import uvicorn
    print("\n🍽️  Bite Chat Server starting...")
    print("🌐  Open browser at: http://localhost:8000\n")
    uvicorn.run(app, host="0.0.0.0", port=8000)
