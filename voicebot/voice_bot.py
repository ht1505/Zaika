# voice_bot.py  ──  ZAIKA Voice Bot  ·  FastAPI server
# ─────────────────────────────────────────────────────────────────────────────
# Web UI endpoints:
#   POST /api/voice/process        – NLU + full state machine
#   POST /api/voice/add-suggestion – add suggested item
#   POST /api/voice/reset          – clear session
#   GET  /health
#
# Mic-client endpoints:
#   GET  /order  /select  /remove  /cart  /pre_checkout  /checkout
# ─────────────────────────────────────────────────────────────────────────────

import re, uuid, difflib
from typing import Dict, List, Optional

import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from smart_suggestions import get_engine as _get_suggestion_engine

app = FastAPI(title="ZAIKA Voice Bot")
app.add_middleware(CORSMiddleware, allow_origins=["*"],
                   allow_methods=["*"], allow_headers=["*"])

# ── Menu ──────────────────────────────────────────────────────────────────────
_menu_df = pd.read_csv("menu.csv")
MENU: Dict[str, Dict] = {
    row["food_name"]: {"price": int(row["price"]), "category": row["category"]}
    for _, row in _menu_df.iterrows()
}
MENU_NAMES: List[str] = list(MENU.keys())

# ── Category → items ──────────────────────────────────────────────────────────
CATEGORY_ITEMS: Dict[str, List[Dict]] = {}
for _n, _info in MENU.items():
    CATEGORY_ITEMS.setdefault(_info["category"], []).append(
        {"food_name": _n, "price": _info["price"]}
    )

# ── Keyword → category aliases ────────────────────────────────────────────────
_ALIASES = {
    "Pizza":           ["pizza", "piza", "pizaa", "पिज़्ज़ा", "पिज्जा"],
    "Burgers":         ["burger", "burgers", "बर्गर"],
    "Beverages":       ["beverage", "beverages", "drink", "drinks",
                        "cold drink", "cold drinks", "shake", "shakes",
                        "coffee", "soda", "juice", "पेय", "ड्रिंक", "शेक", "कॉफी", "काफी"],
    "Desserts":        ["dessert", "desserts", "sweet", "sweets",
                        "ice cream", "icecream", "mithai", "मिठाई", "आइसक्रीम", "मीठा"],
    "Pasta & Italian": ["pasta", "italian", "पास्ता"],
    "Breads":          ["bread", "breads", "naan", "roti", "paratha",
                        "नान", "रोटी", "पराठा", "ब्रेड"],
    "Rice & Biryani":  ["rice", "biryani", "chawal", "बिरयानी", "चावल"],
    "Main Course":     ["main course", "main", "curry", "sabzi", "सब्ज़ी", "करी"],
    "Soups":           ["soup", "soups", "सूप"],
    "Starters":        ["starter", "starters", "appetizer", "appetizers",
                        "snack", "snacks", "स्नैक्स", "नाश्ता"],
    "Wraps":           ["wrap", "wraps", "roll", "rolls", "frankie",
                        "रैप", "रोल", "फ्रैंकी"],
    "Light Course":    ["noodles", "momos", "sandwich", "sandwiches",
                        "light course", "light", "नूडल्स", "मोमो", "मोमोज़", "सैंडविच"],
    "Fries":           ["fries", "fry", "फ्राइज़", "फ्राइज"],
}
CATEGORY_KEYWORDS: Dict[str, str] = {}
for _cat, _kws in _ALIASES.items():
    if _cat in CATEGORY_ITEMS:
        for _kw in _kws:
            CATEGORY_KEYWORDS[_kw] = _cat
_SORTED_KW = sorted(CATEGORY_KEYWORDS.keys(), key=len, reverse=True)

# ── Engine ────────────────────────────────────────────────────────────────────
_engine = _get_suggestion_engine("dataset_with_confidence.csv", "menu.csv")

# ── Sessions ──────────────────────────────────────────────────────────────────
_sessions: Dict[str, Dict] = {}

def _get_session(sid: str) -> Dict:
    if sid not in _sessions:
        _sessions[sid] = {"cart": [], "state": "idle"}
    return _sessions[sid]


# ═════════════════════════════════════════════════════════════════════════════
# HINDI MAP
# ─────────────────────────────────────────────────────────────────────────────
# RULE: If a Hindi phrase is SPECIFIC (e.g. "मसाला डोसा"), map it directly
#       to the exact menu item name — no disambiguation needed.
#
#       If a Hindi word is GENERIC (e.g. "पिज़्ज़ा", "बर्गर", "डोसा"),
#       map it to the CATEGORY KEYWORD (e.g. "pizza", "burger", "dosa")
#       so _category_from_query triggers disambiguation and shows all options.
#
# FIX SUMMARY vs previous version:
#   • "पिज़्ज़ा"  was "veg pizza"  → now "pizza"   (shows all 6 pizza options)
#   • "डोसा"/"दोसा" was "dosa"   → kept as "dosa" (triggers Main Course disambig)
#   • "पनीर"     was "paneer"    → kept as "paneer" (ingredient, not item)
#   • Duplicate "बिरयानी" entry removed from _ALIASES
#   • All specific full-name phrases (e.g. "कॉर्न पिज़्ज़ा") kept as direct
#     item names — these are unambiguous and should go straight to cart.
# ═════════════════════════════════════════════════════════════════════════════

HINDI_MAP = {
    # ── Beverages ─────────────────────────────────────────────────────────────
    # Specific items → map directly (unambiguous)
    "कैपुचिनो":       "cappuccino",
    "कैपचीनो":        "cappuccino",
    "कपुचिनो":        "cappuccino",
    "कोक":            "coke",
    "कोला":           "coke",
    "कोल्ड कॉफी":    "cold coffee",
    "ठंडी कॉफी":     "cold coffee",
    "कोल्ड काफी":    "cold coffee",
    "हॉट चॉकलेट":    "hot chocolate",
    "गर्म चॉकलेट":   "hot chocolate",
    "लट्टे":          "latte",
    "लाटे":           "latte",
    "लेमन सोडा":     "lemon soda",
    "नींबू सोडा":    "lemon soda",
    "निम्बू सोडा":   "lemon soda",
    "मैंगो शेक":     "mango shake",
    "आम शेक":        "mango shake",
    "मिंट मोजितो":   "mint mojito",
    "पुदीना मोजितो": "mint mojito",
    "मिंट मोजिटो":   "mint mojito",
    "पेप्सी":         "pepsi",
    "स्ट्रॉबेरी शेक": "strawberry shake",

    # ── Breads ────────────────────────────────────────────────────────────────
    "आलू पराठा":      "aloo paratha",
    "आलु पराठा":      "aloo paratha",
    "आलू का पराठा":  "aloo paratha",
    "बटर नान":        "butter naan",
    "बटर नाँन":       "butter naan",
    "मक्खन नान":      "butter naan",
    "पनीर पराठा":     "paneer paratha",
    "पनीर का पराठा": "paneer paratha",
    "तंदूरी रोटी":   "tandoori roti",
    "तंदूरी रोटि":   "tandoori roti",
    "तंदूर रोटी":    "tandoori roti",

    # ── Burgers ───────────────────────────────────────────────────────────────
    # Specific variants → direct item
    "चीज़ बर्गर":     "cheese burger",
    "चीज बर्गर":      "cheese burger",
    "चीज़बर्गर":      "cheese burger",
    "वेज बर्गर":      "veg burger",
    "वेजिटेबल बर्गर": "veg burger",
    "सब्जी बर्गर":    "veg burger",

    # ── Desserts ──────────────────────────────────────────────────────────────
    "ब्राउनी":           "brownie",
    "ब्राउनि":           "brownie",
    "चॉकलेट लावा केक":  "chocolate lava cake",
    "चॉकलेट केक":       "chocolate lava cake",
    "फालूदा":            "falooda",
    "चॉकलेट आइसक्रीम": "ice cream chocolate",
    "चॉकलेट आइस क्रीम": "ice cream chocolate",
    "वेनिला आइसक्रीम":  "ice cream vanilla",
    "वनीला आइसक्रीम":   "ice cream vanilla",
    "वेनिला आइस क्रीम": "ice cream vanilla",

    # ── Fries ─────────────────────────────────────────────────────────────────
    # Only one fries item → direct is fine
    "पेरी पेरी फ्राइज़": "peri peri fries",
    "पेरी पेरी फ्राइज":  "peri peri fries",
    "मसाला फ्राइज़":     "peri peri fries",

    # ── Light Course ──────────────────────────────────────────────────────────
    "क्लब सैंडविच":    "club sandwich",
    "हक्का नूडल्स":   "hakka noodles",
    "हक्का नूडल":     "hakka noodles",
    "पनीर मोमोज़":    "paneer momos",
    "पनीर मोमो":      "paneer momos",
    "शेज़वान नूडल्स": "schezwan noodles",
    "सेज़वान नूडल्स": "schezwan noodles",
    "वड़ा पाव":        "vada pav",
    "वडा पाव":         "vada pav",
    "बड़ा पाव":        "vada pav",
    "वेज कटलेट":      "veg cutlet",
    "सब्जी कटलेट":    "veg cutlet",
    "वेज मंचूरियन":   "veg manchurian",
    "मंचूरियन":        "veg manchurian",
    "वेज मोमोज़":     "veg momos",
    "वेज मोमो":       "veg momos",
    "सब्जी मोमो":     "veg momos",
    "वेज सैंडविच":    "veg sandwich",
    "सब्जी सैंडविच":  "veg sandwich",
    "समोसा":           "samosa",
    "समोसे":           "samosa",

    # ── Main Course ───────────────────────────────────────────────────────────
    "छोले भटूरे":      "chole bhature",
    "छोले भतूरे":      "chole bhature",
    "छोले भठूरे":      "chole bhature",
    "दाल मखनी":       "dal makhani",
    "दाल मक्खनी":     "dal makhani",
    "मखनी दाल":       "dal makhani",
    "इडली सांभर":     "idli sambar",
    "इडली साम्भर":    "idli sambar",
    "इडली सांबर":     "idli sambar",
    "मसाला डोसा":     "masala dosa",
    "मसाला दोसा":     "masala dosa",
    "पनीर बटर मसाला": "paneer butter masala",
    "पनीर मक्खन मसाला": "paneer butter masala",
    "पनीर बटर":       "paneer butter masala",
    "पाव भाजी":       "pav bhaji",
    "पाव भाजि":       "pav bhaji",
    "सादा डोसा":      "plain dosa",
    "प्लेन डोसा":     "plain dosa",
    "सादा दोसा":      "plain dosa",

    # ── Pasta & Italian ───────────────────────────────────────────────────────
    # Only 2 pasta items — specific names go direct, generic "पास्ता" → disambig
    "पास्ता अल्फ्रेडो": "pasta alfredo",
    "अल्फ्रेडो पास्ता": "pasta alfredo",
    "पास्ता अरेबियाटा": "pasta arrabiata",
    "अरेबियाटा पास्ता": "pasta arrabiata",

    # ── Pizza ─────────────────────────────────────────────────────────────────
    # Specific pizza names → direct item (user already specified which one)
    "कॉर्न पिज़्ज़ा":      "corn pizza",
    "मकई पिज़्ज़ा":        "corn pizza",
    "फार्महाउस पिज़्ज़ा":  "farmhouse pizza",
    "मार्गरीटा पिज़्ज़ा":  "margherita pizza",
    "मार्गेरिटा पिज़्ज़ा": "margherita pizza",
    "मशरूम पिज़्ज़ा":      "mushroom pizza",
    "पनीर पिज़्ज़ा":       "paneer pizza",
    "वेज पिज़्ज़ा":        "veg pizza",
    "सब्जी पिज़्ज़ा":      "veg pizza",

    # ── Rice & Biryani ────────────────────────────────────────────────────────
    "कढ़ी चावल":      "kadhi chawal",
    "कड़ी चावल":      "kadhi chawal",
    "राजमा चावल":     "rajma chawal",
    "फ्राइड राइस":    "fried rice",
    "तला हुआ चावल":  "fried rice",
    "पनीर बिरयानी":  "paneer biryani",
    "पनीर बिर्यानी": "paneer biryani",
    "वेज बिरयानी":   "veg biryani",
    "सब्जी बिरयानी": "veg biryani",
    "वेज बिर्यानी":  "veg biryani",

    # ── Soups ─────────────────────────────────────────────────────────────────
    "स्वीट कॉर्न सूप": "sweet corn soup",
    "मीठा मकई सूप":   "sweet corn soup",
    "टमाटर सूप":      "tomato soup",
    "टोमेटो सूप":     "tomato soup",
    "वेज सूप":         "veg soup",
    "सब्जी सूप":       "veg soup",

    # ── Starters ──────────────────────────────────────────────────────────────
    "चीज़ बॉल्स":    "cheese balls",
    "चीज बॉल्स":     "cheese balls",
    "चिल्ली पनीर":   "chilli paneer",
    "चिली पनीर":     "chilli paneer",
    "तीखा पनीर":     "chilli paneer",
    "गार्लिक ब्रेड": "garlic bread",
    "लहसुन ब्रेड":   "garlic bread",
    "ग्रीक सलाद":    "greek salad",
    "कचौरी":          "kachori",
    "कचौड़ी":         "kachori",
    "नाचोज़":         "nachos",
    "नाचोस":          "nachos",
    "अनियन रिंग्स":  "onion rings",
    "प्याज के छल्ले": "onion rings",
    "स्प्रिंग रोल्स": "spring rolls",
    "स्प्रिंग रोल":   "spring rolls",

    # ── Wraps ─────────────────────────────────────────────────────────────────
    "फलाफेल रैप":    "falafel wrap",
    "फलाफल रैप":     "falafel wrap",
    "पनीर रैप":      "paneer wrap",
    "पनीर का रैप":   "paneer wrap",
    "वेज रैप":        "veg wrap",
    "सब्जी रैप":      "veg wrap",

    # ── Generic category words → map to CATEGORY KEYWORD (triggers disambiguation) ──
    # ⚠️ These must never map to a specific item name.
    "पिज़्ज़ा":    "pizza",      # → shows all 6 pizza options
    "पिज्जा":     "pizza",      # alternate spelling
    "बर्गर":       "burger",     # → shows Cheese Burger + Veg Burger
    "नूडल्स":     "noodles",    # → shows Hakka + Schezwan
    "नूडल":       "noodles",
    "बिरयानी":    "biryani",    # → shows all biryani options
    "बिर्यानी":   "biryani",
    "पास्ता":     "pasta",      # → shows Alfredo + Arrabiata
    "सूप":         "soup",       # → shows all 3 soups
    "मोमो":        "momos",      # → shows Veg + Paneer momos
    "मोमोज":      "momos",
    "मोमोज़":     "momos",
    "नान":         "naan",       # → shows Butter Naan (only 1, goes direct)
    "नाँन":        "naan",
    "रोटी":        "roti",       # → Tandoori Roti
    "पराठा":      "paratha",    # → shows Aloo + Paneer paratha
    "पराठे":      "paratha",
    "चावल":       "rice",       # → shows all rice options
    "राइस":       "rice",
    "डोसा":        "dosa",       # → shows Masala + Plain dosa
    "दोसा":        "dosa",
    "आइसक्रीम":   "ice cream",  # → shows Chocolate + Vanilla
    "आइस क्रीम":  "ice cream",
    "केक":         "cake",       # → goes to desserts
    "चॉकलेट":     "chocolate",  # → ingredient, hits desserts
    "कॉफी":       "coffee",     # → shows coffee options
    "काफी":       "coffee",
    "शेक":         "shake",      # → shows all shakes
    "सोडा":        "soda",       # → hits beverages
    "जूस":         "juice",
    "फ्राइज़":    "fries",      # → only Peri Peri (goes direct)
    "फ्राइज":     "fries",
    "सैंडविच":    "sandwich",   # → shows sandwich options
    "रैप":         "wrap",       # → shows all wraps
    "सलाद":       "salad",      # → Greek Salad
    "ब्रेड":       "bread",      # → shows bread options
    "मिठाई":      "dessert",    # → shows all desserts
    "मीठा":       "dessert",
    "पेय":         "beverages",  # → shows all beverages
    "ड्रिंक":     "drink",

    # ── Ingredients (used in compound phrases, also category hints) ───────────
    "तंदूरी":     "tandoori",
    "बटर":         "butter",
    "मक्खन":      "butter",
    "मसाला":      "masala",
    "आलू":         "aloo",
    "आलु":         "aloo",
    "वेज":         "veg",
    "सब्जी":      "veg",
    "चीज़":       "cheese",
    "चीज":         "cheese",
    "मशरूम":      "mushroom",
    "मिंट":        "mint",
    "पुदीना":     "mint",
    "लहसुन":      "garlic",
    "प्याज":      "onion",
    "टमाटर":      "tomato",
    "मकई":         "corn",
    "स्ट्रॉबेरी": "strawberry",
    "मैंगो":      "mango",
    "आम":          "mango",
    # ⚠️ "पनीर" kept as ingredient — alone it's too ambiguous
    # (Paneer Pizza, Paneer Paratha, Paneer Momos, Paneer Wrap, etc.)
    "पनीर":        "paneer",

    # ── Quantities ────────────────────────────────────────────────────────────
    "एक":   "one",
    "दो":   "two",
    "तीन":  "three",
    "चार":  "four",
    "पाँच": "five",

    # ── Actions / Yes / No ────────────────────────────────────────────────────
    "हाँ":     "yes",
    "हां":     "yes",
    "हा":      "yes",
    "नहीं":   "no",
    "नही":    "no",
    "ना":      "no",
    "ठीक":    "ok",
    "ओके":    "ok",
    "बिल्कुल": "yes",
    "हटाओ":   "remove",
    "निकालो": "remove",
    "हटा":    "remove",
    "बिल":    "bill",
    "पेमेंट": "checkout",
    "पे":     "pay",
    "चेकआउट": "checkout",
    "खत्म":   "done",
    "बस":     "done",
    "कन्फर्म": "confirm",
    "स्किप":  "skip",
}

# Hindi/Hinglish filler words to strip before matching
HINDI_FILLERS = {
    "खाना", "है", "हैं", "मुझे",
    "चाहिए", "दीजिए", "करो",
    "लाओ", "मैं", "का", "की", "के",
    "और", "भी", "एक", "वो", "यह", "जो",
    "please", "mujhe", "chahiye", "dena", "dijiye", "lao",
    "main", "ka", "ki", "ke", "aur", "bhi", "yeh", "jo",
    "khana", "khao", "order", "karna", "karo", "hai", "hain",
    "de", "na", "toh", "bhai", "yaar", "kar", "lena",
}

def _normalize_transcript(text: str) -> str:
    """
    1. Try full-phrase Devanagari matches first (longest match wins).
    2. Then word-by-word transliteration.
    3. Strip Hindi filler words.
    4. Lowercase everything.
    """
    sorted_keys = sorted(HINDI_MAP.keys(), key=len, reverse=True)
    result = text.strip()
    for phrase in sorted_keys:
        if phrase in result:
            result = result.replace(phrase, HINDI_MAP[phrase])

    words = result.split()
    final = []
    for w in words:
        w_lower = w.lower()
        if w in HINDI_MAP:
            final.append(HINDI_MAP[w])
        elif w_lower not in HINDI_FILLERS:
            final.append(w_lower)

    normalized = " ".join(final).strip()
    return normalized if normalized else text.lower().strip()


# ═════════════════════════════════════════════════════════════════════════════
# MULTILINGUAL RESPONSES
# ═════════════════════════════════════════════════════════════════════════════

def _t(key: str, lang: str = "hinglish", **kwargs) -> str:
    msgs = {
        "not_found": {
            "english":  "Sorry, I couldn't find that on the menu. Try saying a category like 'pizza' or 'burger'.",
            "hindi":    "माफ करें, यह menu में नहीं मिला। 'pizza' या 'burger' जैसी category बोलें।",
            "hinglish": "Sorry yaar, menu mein nahi mila. 'pizza' ya 'burger' jaisi category bolein.",
        },
        "cart_empty_order": {
            "english":  "Your cart is empty! What would you like to order?",
            "hindi":    "आपका cart खाली है! क्या order करना है?",
            "hinglish": "Cart khali hai! Kya order karna hai?",
        },
        "what_else": {
            "english":  "No problem! What else would you like?",
            "hindi":    "कोई बात नहीं! और क्या चाहिए?",
            "hinglish": "No problem! Aur kuch chahiye?",
        },
        "yes_or_no": {
            "english":  "Please say yes to confirm or no to make changes.",
            "hindi":    "हाँ बोलें confirm के लिए, या नहीं बोलें changes के लिए।",
            "hinglish": "Yes bolo confirm karne ke liye, ya no bolo changes ke liye.",
        },
        "order_confirmed": {
            "english":  "Order confirmed! Total is ₹{total} including GST. Thank you, visit again! 🎉",
            "hindi":    "Order confirm हो गया! कुल ₹{total} GST सहित। धन्यवाद, फिर आइए! 🎉",
            "hinglish": "Order confirm ho gaya! Total ₹{total} GST ke saath. Shukriya, phir aana! 🎉",
        },
        "back_cancel": {
            "english":  "No problem, what else would you like?",
            "hindi":    "कोई बात नहीं, और क्या चाहिए?",
            "hinglish": "Koi baat nahi, aur kuch chahiye?",
        },
        "didnt_get": {
            "english":  "Sorry, please say yes to add {item} or no to skip.",
            "hindi":    "माफ करें, {item} add करने के लिए हाँ बोलें या skip करने के लिए नहीं।",
            "hinglish": "Sorry, {item} add karne ke liye yes bolo ya skip karne ke liye no bolo.",
        },
        "change_what": {
            "english":  "Sure, what would you like to change?",
            "hindi":    "ठीक है, क्या बदलना है?",
            "hinglish": "Theek hai, kya badalna hai?",
        },
        "disambiguate_prompt": {
            "english":  "Sorry, I didn't get that. ",
            "hindi":    "माफ करें, समझ नहीं आया। ",
            "hinglish": "Sorry, samajh nahi aaya. ",
        },
        "cart_show": {
            "english":  "You have: {parts}. Total ₹{total}.",
            "hindi":    "आपके cart में है: {parts}। कुल ₹{total}।",
            "hinglish": "Aapke cart mein hai: {parts}. Total ₹{total}.",
        },
        "removed": {
            "english":  "{item} removed from your order.",
            "hindi":    "{item} आपके order से हटा दिया।",
            "hinglish": "{item} order se hata diya.",
        },
        "not_in_cart": {
            "english":  "Sorry, I couldn't find that item in your cart.",
            "hindi":    "माफ करें, यह item cart में नहीं मिला।",
            "hinglish": "Sorry, yeh item cart mein nahi mila.",
        },
        "suggest_hidden": {
            "english":  "Before we wrap up - {item} is one of our chef's special items, not widely known but everyone who tries it loves it. Would you like to add it?",
            "hindi":    "Order complete करने से पहले - {item} हमारे chef का special item है। Add करें?",
            "hinglish": "Order se pehle - {item} hamare chef ka special item hai. Add karein?",
        },
        "suggest_popular": {
            "english":  "People who ordered {anchor} also love {item}. Would you like to add it?",
            "hindi":    "जो log {anchor} order करते हैं वो {item} भी लेते हैं। Add करें?",
            "hinglish": "Jo log {anchor} order karte hain wo {item} bhi lete hain. Add karein?",
        },
        "suggest_next_hidden": {
            "english":  "No problem. By the way, {item} is one of our chef's specials - would you like to try it?",
            "hindi":    "कोई बात नहीं। {item} हमारे chef का special है - try करेंगे?",
            "hinglish": "Koi baat nahi. {item} hamare chef ka special hai - try karein?",
        },
        "suggest_next_popular": {
            "english":  "Sure. Would you also like to add {item}?",
            "hindi":    "ठीक है। क्या {item} भी add करें?",
            "hinglish": "Theek hai. {item} bhi add karein?",
        },
        "suggest_followup_hidden": {
            "english":  "Also, {item} is one of our chef's special picks - would you like to add that too?",
            "hindi":    "साथ में {item} भी है, chef का special - वो भी add करें?",
            "hinglish": "Saath mein {item} bhi hai, chef ka special - wo bhi add karein?",
        },
        "suggest_followup_popular": {
            "english":  "Would you also like to add {item}?",
            "hindi":    "क्या {item} भी add करें?",
            "hinglish": "{item} bhi add karein?",
        },
        "options_header": {
            "english":  "We have {count} {category} options: {numbered}. Which one would you like?",
            "hindi":    "हमारे पास {count} {category} options हैं: {numbered}। कौन सा चाहिए?",
            "hinglish": "Hamare paas {count} {category} options hain: {numbered}. Kaunsa chahiye?",
        },
    }
    template = msgs.get(key, {}).get(lang, msgs.get(key, {}).get("hinglish", key))
    if kwargs:
        try:
            return template.format(**kwargs)
        except KeyError:
            return template
    return template


# ═════════════════════════════════════════════════════════════════════════════
# HELPERS
# ═════════════════════════════════════════════════════════════════════════════

QTY_MAP = {
    "ek": 1, "one": 1, "1": 1,
    "do": 2, "two": 2, "2": 2,
    "teen": 3, "tin": 3, "three": 3, "3": 3,
    "char": 4, "four": 4, "4": 4,
    "paanch": 5, "five": 5, "5": 5,
}
_QTY_WORDS = set(QTY_MAP.keys())


def _extract_qty(text: str) -> int:
    for word in text.lower().split():
        if word in QTY_MAP:
            return QTY_MAP[word]
    m = re.search(r"\b([2-9]|[1-9][0-9])\b", text)
    return int(m.group(1)) if m else 1


def _category_from_query(query: str) -> Optional[str]:
    """
    FIX: Previously this would bail out to _fuzzy_match_strict whenever the
    query contained more words than just the keyword. This caused "pizza" alone
    to correctly hit Pizza category, but "veg pizza" or "paneer pizza" to skip
    category and go straight to fuzzy match — risking wrong item selection.

    New logic: if the normalized query matches a category keyword AND also
    matches a specific item exactly via _fuzzy_match_strict, prefer the specific
    item (return None so the caller uses fuzzy). But if it's only a category
    keyword with no confident specific match, return the category for disambiguation.
    """
    q = query.lower().strip()
    # Strip qty words for category matching
    content = " ".join(w for w in q.split() if w not in _QTY_WORDS).strip()

    for kw in _SORTED_KW:
        if re.search(r"\b" + re.escape(kw) + r"\b", q):
            cat = CATEGORY_KEYWORDS[kw]
            # If the entire content IS just the keyword → definitely category
            if content == kw:
                return cat
            # If there's a high-confidence specific item match → skip category
            specific = _fuzzy_match_strict(query)
            if specific:
                return None   # caller will use fuzzy → adds specific item directly
            # Otherwise → show category options
            return cat
    return None


def _fuzzy_match_strict(query: str) -> Optional[str]:
    q = query.lower().strip()
    qw = {w for w in q.split() if w not in _QTY_WORDS}
    for name in MENU_NAMES:
        if q == name.lower():
            return name
        if qw and all(w in name.lower() for w in qw if len(w) > 2):
            return name
    best, bs = None, 0.0
    for name in MENU_NAMES:
        s = difflib.SequenceMatcher(None, q, name.lower()).ratio()
        if s > bs:
            best, bs = name, s
    return best if bs >= 0.62 else None


def _fuzzy_match(query: str) -> Optional[str]:
    q = query.lower().strip()
    qw = set(q.split())
    for name in MENU_NAMES:
        if q in name.lower():
            return name
    for name in MENU_NAMES:
        if all(w in name.lower() for w in qw if len(w) > 2):
            return name
    best, bs = None, 0.0
    for name in MENU_NAMES:
        s = difflib.SequenceMatcher(None, q, name.lower()).ratio()
        if s > bs:
            best, bs = name, s
    return best if bs >= 0.55 else None


def _match_from_options(text: str, options: List[Dict]) -> Optional[Dict]:
    t = text.lower().strip()
    num_map = {
        "1": 0, "one": 0, "ek": 0, "pehla": 0, "first": 0,
        "2": 1, "two": 1, "do": 1, "doosra": 1, "second": 1,
        "3": 2, "three": 2, "teen": 2, "teesra": 2, "third": 2,
        "4": 3, "four": 3, "char": 3, "fourth": 3,
        "5": 4, "five": 4, "paanch": 4, "fifth": 4,
        "6": 5, "six": 5, "sixth": 5,
        "7": 6, "seven": 6, "seventh": 6,
        "8": 7, "eight": 7, "eighth": 7,
        "9": 8, "nine": 8, "ninth": 8,
        "10": 9, "ten": 9, "tenth": 9,
    }
    for word in t.split():
        if word in num_map and num_map[word] < len(options):
            return options[num_map[word]]
    bs, best_opt = 0.0, None
    for opt in options:
        s = difflib.SequenceMatcher(None, t, opt["food_name"].lower()).ratio()
        if s > bs:
            bs, best_opt = s, opt
    return best_opt if bs >= 0.40 else None


def _build_menu_options(category: str) -> List[Dict]:
    return sorted(CATEGORY_ITEMS.get(category, []), key=lambda x: x["price"])


def _options_reply(category: str, options: List[Dict], lang: str = "hinglish") -> str:
    numbered = ",  ".join(
        f"{i+1}. {o['food_name']} ₹{o['price']}"
        for i, o in enumerate(options)
    )
    return _t("options_header", lang, count=len(options), category=category, numbered=numbered)


def _cart_total(cart: List[Dict]) -> int:
    return sum(i["price"] * i["qty"] for i in cart)


def _cart_summary(cart: List[Dict], lang: str = "hinglish") -> str:
    if not cart:
        if lang == "hindi":   return "आपका cart खाली है।"
        if lang == "english": return "Your cart is empty."
        return "Aapka cart khali hai."
    parts = [f"{i['qty']} {i['food_name']}" for i in cart]
    total = _cart_total(cart)
    if lang == "hindi":
        return f"आपका order: {', '.join(parts)}। कुल ₹{total}। क्या सही है?"
    if lang == "english":
        return f"Your order: {', '.join(parts)}. Total ₹{total}. Is that correct?"
    return f"Aapka order: {', '.join(parts)}. Total ₹{total}. Kya sahi hai?"


def _add_to_cart(cart: List[Dict], food_name: str, qty: int = 1, lang: str = "hinglish") -> str:
    price = MENU[food_name]["price"]
    cat   = MENU[food_name]["category"]
    for item in cart:
        if item["food_name"] == food_name:
            item["qty"] += qty
            if lang == "hindi":
                return f"{food_name} पहले से cart में है। अब {item['qty']} हो गए।"
            if lang == "english":
                return f"Added {qty} more {food_name}. You now have {item['qty']}."
            return f"{food_name} already hai cart mein. Ab {item['qty']} ho gaye."
    cart.append({"food_name": food_name, "price": price, "category": cat, "qty": qty})
    if lang == "hindi":
        return f"{qty} {food_name} आपके order में add हो गया। कीमत ₹{price * qty}।"
    if lang == "english":
        return f"{qty} {food_name} added to your order. That is ₹{price * qty}."
    return f"{qty} {food_name} add ho gaya order mein. ₹{price * qty} ka hai."


def _remove_from_cart(cart: List[Dict], query: str, lang: str = "hinglish") -> str:
    match = _fuzzy_match(query)
    if not match:
        return _t("not_in_cart", lang)
    for i, item in enumerate(cart):
        if item["food_name"] == match:
            cart.pop(i)
            return _t("removed", lang, item=match)
    return _t("not_in_cart", lang)


def _clear_disambiguate(sess: Dict):
    for k in ("disambiguate_options", "disambiguate_qty", "disambiguate_category"):
        sess.pop(k, None)


# ═════════════════════════════════════════════════════════════════════════════
# NLU TOKENS
# ═════════════════════════════════════════════════════════════════════════════

CHECKOUT_TOKENS = {"checkout", "check out", "bill", "done", "finish", "stop",
                   "exit", "pay", "bas", "ho gaya", "puru",
                   "that's all", "thats all", "order place", "place order"}
REMOVE_TOKENS   = {"remove", "delete", "hatao", "nikalo", "kadho", "cancel",
                   "hata do", "nikaal do"}
CART_TOKENS     = {"cart", "my order", "order so far", "mera order",
                   "show order", "what did i order", "show cart"}
YES_TOKENS      = {"yes", "yeah", "yep", "sure", "ok", "okay", "haan", "ha",
                   "correct", "right", "confirm", "place", "go ahead", "bilkul",
                   "theek hai", "haan ji", "zaroor"}
NO_TOKENS       = {"no", "nope", "nahi", "naa", "skip", "nothing", "bas",
                   "nai", "don't", "dont", "not really", "no thank",
                   "no thanks", "nothing else", "no need",
                   "nai joiye", "nahi chahiye", "mat do", "rehne do"}

def _intent(text: str, tokens: set) -> bool:
    t = text.lower()
    return any(tok in t for tok in tokens)


# ═════════════════════════════════════════════════════════════════════════════
# MODELS
# ═════════════════════════════════════════════════════════════════════════════

class ProcessRequest(BaseModel):
    session_id: str
    transcript: str
    language: str = "hinglish"

class AddSuggRequest(BaseModel):
    session_id: str
    food_name: str
    qty: int = 1

class ResetRequest(BaseModel):
    session_id: str


# ═════════════════════════════════════════════════════════════════════════════
# ENDPOINTS
# ═════════════════════════════════════════════════════════════════════════════

@app.get("/health")
def health():
    return {"status": "ok", "menu_items": len(MENU),
            "associations": sum(len(v) for v in _engine.association_map.values())}


@app.post("/api/voice/process")
def process(req: ProcessRequest):
    sess  = _get_session(req.session_id)
    cart  = sess["cart"]
    state = sess["state"]
    lang  = req.language
    text  = _normalize_transcript(req.transcript.strip())
    t     = text.lower()

    if state == "disambiguate":
        options  = sess.get("disambiguate_options", [])
        qty      = sess.get("disambiguate_qty", 1)
        category = sess.get("disambiguate_category", "")
        if _intent(t, {"back", "cancel", "wapas", "kuch nahi", "nevermind"}):
            _clear_disambiguate(sess)
            return _resp(sess, _t("back_cancel", lang), "ordering")
        if _intent(t, CHECKOUT_TOKENS):
            _clear_disambiguate(sess)
            sess["state"] = "ordering"
        else:
            matched = _match_from_options(text, options)
            if matched:
                _clear_disambiguate(sess)
                msg = _add_to_cart(cart, matched["food_name"], qty, lang)
                return _resp(sess, msg, "ordering", debug_normalized=matched["food_name"])
            else:
                reply = _t("disambiguate_prompt", lang) + _options_reply(category, options, lang)
                return _resp(sess, reply, "disambiguate", menu_options=options, menu_category=category)

    if state == "checkout_suggest":
        pending = sess.get("pending_suggestions", [])
        if _intent(t, YES_TOKENS) and pending:
            item_to_add = pending.pop(0)
            sess["pending_suggestions"] = pending
            msg = _add_to_cart(cart, item_to_add, lang=lang)
            if pending:
                nc = _engine.item_meta.get(pending[0], {}).get("category", "Star")
                if nc == "Hidden Star":
                    followup = msg + " " + _t("suggest_followup_hidden", lang, item=pending[0])
                else:
                    followup = msg + " " + _t("suggest_followup_popular", lang, item=pending[0])
                return _resp(sess, followup, "checkout_suggest")
            sess["state"] = "checkout_confirm"
            return _resp(sess, _cart_summary(cart, lang), "checkout_confirm")
        elif _intent(t, NO_TOKENS):
            if len(pending) > 1:
                pending.pop(0)
                sess["pending_suggestions"] = pending
                nc = _engine.item_meta.get(pending[0], {}).get("category", "Star")
                if nc == "Hidden Star":
                    followup = _t("suggest_next_hidden", lang, item=pending[0])
                else:
                    followup = _t("suggest_next_popular", lang, item=pending[0])
                return _resp(sess, followup, "checkout_suggest")
            else:
                sess["pending_suggestions"] = []
                sess["state"] = "checkout_confirm"
                return _resp(sess, _cart_summary(cart, lang), "checkout_confirm")
        else:
            item = pending[0] if pending else "that item"
            return _resp(sess, _t("didnt_get", lang, item=item), "checkout_suggest")

    if state == "checkout_confirm":
        if _intent(t, YES_TOKENS):
            total = _cart_total(cart)
            gst   = round(total * 0.05)
            grand = total + gst
            reply = _t("order_confirmed", lang, total=grand)
            final_cart, final_total = list(cart), total
            cart.clear()
            sess["state"] = "idle"
            return _resp(sess, reply, "done", override_cart=final_cart, override_total=final_total)
        elif _intent(t, NO_TOKENS):
            sess["state"] = "ordering"
            return _resp(sess, _t("change_what", lang), "ordering")
        else:
            return _resp(sess, _t("yes_or_no", lang), "checkout_confirm")

    if _intent(t, CHECKOUT_TOKENS):
        if not cart:
            return _resp(sess, _t("cart_empty_order", lang), "idle")
        cart_names  = [i["food_name"] for i in cart]
        suggestions = _engine.get_suggestions(cart_names, max_suggestions=2)
        if suggestions:
            sess["pending_suggestions"] = [s["food_name"] for s in suggestions]
            sess["state"] = "checkout_suggest"
            first  = suggestions[0]
            anchor = cart_names[0] if len(cart_names) == 1 else "your order"
            if first.get("category") == "Hidden Star":
                reply = _t("suggest_hidden", lang, item=first["food_name"])
            else:
                reply = _t("suggest_popular", lang, item=first["food_name"], anchor=anchor)
            return _resp(sess, reply, "checkout_suggest",
                         suggestions=[{**s, "price": MENU.get(s["food_name"], {}).get("price", 0)}
                                      for s in suggestions])
        else:
            sess["state"] = "checkout_confirm"
            return _resp(sess, _cart_summary(cart, lang), "checkout_confirm")

    if _intent(t, CART_TOKENS):
        if not cart:
            return _resp(sess, _t("cart_empty_order", lang), "idle")
        parts = [f"{i['qty']} {i['food_name']}" for i in cart]
        return _resp(sess, _t("cart_show", lang, parts=", ".join(parts), total=_cart_total(cart)), "ordering")

    if _intent(t, REMOVE_TOKENS):
        msg = _remove_from_cart(cart, text, lang)
        sess["state"] = "ordering"
        return _resp(sess, msg, "ordering")

    qty      = _extract_qty(text)
    category = _category_from_query(text)
    if category:
        options = _build_menu_options(category)
        if len(options) == 1:
            sess["state"] = "ordering"
            msg = _add_to_cart(cart, options[0]["food_name"], qty, lang)
            return _resp(sess, msg, "ordering", debug_normalized=options[0]["food_name"])
        sess["state"]                 = "disambiguate"
        sess["disambiguate_options"]  = options
        sess["disambiguate_qty"]      = qty
        sess["disambiguate_category"] = category
        return _resp(sess, _options_reply(category, options, lang), "disambiguate",
                     menu_options=options, menu_category=category)

    sess["state"] = "ordering"
    match = _fuzzy_match(text)
    if not match:
        return _resp(sess, _t("not_found", lang), "ordering", debug_normalized="no match")
    msg = _add_to_cart(cart, match, qty, lang)
    return _resp(sess, msg, "ordering", debug_normalized=match)


@app.post("/api/voice/add-suggestion")
def add_suggestion(req: AddSuggRequest):
    sess = _get_session(req.session_id)
    cart = sess["cart"]
    if req.food_name not in MENU:
        return _resp(sess, f"Sorry, {req.food_name} is not on the menu.", "ordering")
    msg = _add_to_cart(cart, req.food_name, req.qty)
    if sess["state"] == "checkout_suggest":
        pending = sess.get("pending_suggestions", [])
        sess["pending_suggestions"] = [p for p in pending if p != req.food_name]
    sess["state"] = "ordering"
    return _resp(sess, msg, "ordering")


@app.post("/api/voice/reset")
def reset(req: ResetRequest):
    if req.session_id in _sessions:
        del _sessions[req.session_id]
    return {"status": "reset"}


# ── Mic-client endpoints ──────────────────────────────────────────────────────
_MIC_SID = "mic_session"

@app.get("/order")
def order(query: str):
    sess = _get_session(_MIC_SID)
    cart = sess["cart"]
    qty  = _extract_qty(query)
    cat  = _category_from_query(query)
    if cat:
        options = _build_menu_options(cat)
        sess["state"]                 = "disambiguate"
        sess["disambiguate_options"]  = options
        sess["disambiguate_qty"]      = qty
        sess["disambiguate_category"] = cat
        return {"status": "disambiguate", "category": cat,
                "options": options, "message": _options_reply(cat, options)}
    match = _fuzzy_match(query)
    if not match:
        return {"status": "error", "message": "Sorry, I couldn't find that on the menu."}
    msg = _add_to_cart(cart, match, qty)
    return {"status": "ok", "message": msg, "cart": cart, "cart_total": _cart_total(cart)}

@app.get("/select")
def select(query: str):
    sess    = _get_session(_MIC_SID)
    cart    = sess["cart"]
    options = sess.get("disambiguate_options", [])
    qty     = sess.get("disambiguate_qty", 1)
    matched = _match_from_options(query, options)
    if not matched:
        return {"status": "error", "message": "Sorry, I didn't catch that. Say the item name or number."}
    _clear_disambiguate(sess)
    sess["state"] = "ordering"
    msg = _add_to_cart(cart, matched["food_name"], qty)
    return {"status": "ok", "message": msg, "cart": cart, "cart_total": _cart_total(cart)}

@app.get("/remove")
def remove(query: str):
    sess = _get_session(_MIC_SID)
    cart = sess["cart"]
    return {"status": "ok", "message": _remove_from_cart(cart, query),
            "cart": cart, "cart_total": _cart_total(cart)}

@app.get("/cart")
def get_cart():
    sess = _get_session(_MIC_SID)
    c    = sess["cart"]
    if not c:
        return {"status": "ok", "order": [], "message": "Your cart is empty.", "cart_total": 0}
    return {"status": "ok", "order": c, "message": _cart_summary(c), "cart_total": _cart_total(c)}

@app.get("/pre_checkout")
def pre_checkout():
    sess = _get_session(_MIC_SID)
    cart = sess["cart"]
    if not cart:
        return {"has_suggestions": False, "suggestions": [], "suggestion_message": ""}
    cart_names  = [i["food_name"] for i in cart]
    suggestions = _engine.get_suggestions(cart_names, max_suggestions=2)
    if not suggestions:
        return {"has_suggestions": False, "suggestions": [], "suggestion_message": ""}
    return {
        "has_suggestions": True,
        "suggestions": [
            {"name": s["food_name"], "food_name": s["food_name"],
             "price": MENU.get(s["food_name"], {}).get("price", 0),
             "category": s.get("category", ""),
             "revenue_score": s.get("revenue_score", 0),
             "reason": s.get("reason", "")}
            for s in suggestions
        ],
        "suggestion_message": _engine.get_suggestion_message(cart_names, suggestions),
    }

@app.get("/checkout")
def checkout():
    sess = _get_session(_MIC_SID)
    cart = sess["cart"]
    if not cart:
        return {"status": "error", "message": "Cart is empty."}
    total    = _cart_total(cart)
    grand    = total + round(total * 0.05)
    order_id = uuid.uuid4().hex[:8].upper()
    msg = (f"Order confirmed! Your total is ₹{grand} including GST. "
           f"Order ID: {order_id}. Thank you for dining with ZAIKA. Visit again!")
    cart.clear()
    sess["state"] = "idle"
    return {"status": "ok", "message": msg, "order_id": order_id, "total": grand}


# ═════════════════════════════════════════════════════════════════════════════
# RESPONSE BUILDER
# ═════════════════════════════════════════════════════════════════════════════

def _resp(
    sess: Dict, reply: str, state: str,
    suggestions: Optional[List[Dict]] = None,
    menu_options: Optional[List[Dict]] = None,
    menu_category: str = "",
    debug_normalized: str = "",
    override_cart: Optional[List[Dict]] = None,
    override_total: Optional[int] = None,
) -> Dict:
    sess["state"] = state
    cart  = override_cart  if override_cart  is not None else sess["cart"]
    total = override_total if override_total is not None else _cart_total(cart)
    return {
        "reply": reply, "state": state,
        "cart": cart, "cart_total": total,
        "suggestions": suggestions or [],
        "menu_options": menu_options or [],
        "menu_category": menu_category,
        "debug_normalized": debug_normalized,
    }   