# ─── Menu Language Mappings (Python) ──────────────────────────────────────────
# All 67 items with Hindi, English, Hinglish aliases for voice recognition.
# Import this in your backend and use match_spoken_to_item() to resolve input.

MENU_ALIASES = [

    # ── Beverages ──────────────────────────────────────────────────────────────
    {"food_name": "Cappuccino", "category": "Beverages", "price": 281, "aliases": [
        "cappuccino", "कैपुचीनो", "कैपचीनो", "capuchino", "cappuchino",
        "coffee", "कॉफी", "hot coffee",
    ]},
    {"food_name": "Coke", "category": "Beverages", "price": 335, "aliases": [
        "coke", "कोक", "cola", "कोला", "coca cola", "cold drink", "ठंडा",
        "thanda", "cold drinks",
    ]},
    {"food_name": "Cold Coffee", "category": "Beverages", "price": 320, "aliases": [
        "cold coffee", "कोल्ड कॉफी", "ठंडी कॉफी", "thandi coffee",
        "iced coffee", "cold kaafi",
    ]},
    {"food_name": "Hot Chocolate", "category": "Beverages", "price": 94, "aliases": [
        "hot chocolate", "हॉट चॉकलेट", "garam chocolate", "चॉकलेट ड्रिंक",
        "chocolate drink", "hot choco", "choco drink",
    ]},
    {"food_name": "Latte", "category": "Beverages", "price": 125, "aliases": [
        "latte", "लाटे", "लट्टे", "cafe latte", "milk coffee", "दूध वाली कॉफी",
    ]},
    {"food_name": "Lemon Soda", "category": "Beverages", "price": 246, "aliases": [
        "lemon soda", "नींबू सोडा", "nimbu soda", "lime soda", "lemon drink",
        "nimbu pani soda", "नींबू पानी सोडा",
    ]},
    {"food_name": "Mango Shake", "category": "Beverages", "price": 170, "aliases": [
        "mango shake", "मैंगो शेक", "आम का शेक", "aam shake", "mango milkshake",
        "aam milkshake", "मैंगो मिल्कशेक",
    ]},
    {"food_name": "Mint Mojito", "category": "Beverages", "price": 288, "aliases": [
        "mint mojito", "मिंट मोजिटो", "pudina mojito", "पुदीना मोजिटो",
        "mojito", "mint drink", "pudina drink",
    ]},
    {"food_name": "Pepsi", "category": "Beverages", "price": 81, "aliases": [
        "pepsi", "पेप्सी", "soda", "सोडा", "ठंडा पेप्सी",
    ]},
    {"food_name": "Strawberry Shake", "category": "Beverages", "price": 105, "aliases": [
        "strawberry shake", "स्ट्रॉबेरी शेक", "strawberry milkshake",
        "pink shake", "स्ट्रॉबेरी मिल्कशेक",
    ]},

    # ── Breads ─────────────────────────────────────────────────────────────────
    {"food_name": "Aloo Paratha", "category": "Breads", "price": 218, "aliases": [
        "aloo paratha", "आलू पराठा", "potato paratha", "aloo ka paratha",
        "आलू का पराठा", "paratha", "पराठा",
    ]},
    {"food_name": "Butter Naan", "category": "Breads", "price": 329, "aliases": [
        "butter naan", "बटर नान", "naan", "नान", "butter nan", "naan roti",
        "मक्खन नान", "makhan naan",
    ]},
    {"food_name": "Paneer Paratha", "category": "Breads", "price": 188, "aliases": [
        "paneer paratha", "पनीर पराठा", "cheese paratha", "paneer ka paratha",
        "पनीर का पराठा",
    ]},
    {"food_name": "Tandoori Roti", "category": "Breads", "price": 329, "aliases": [
        "tandoori roti", "तंदूरी रोटी", "roti", "रोटी", "tandoor roti",
        "plain roti", "तंदूर रोटी",
    ]},

    # ── Burgers ────────────────────────────────────────────────────────────────
    {"food_name": "Cheese Burger", "category": "Burgers", "price": 177, "aliases": [
        "cheese burger", "चीज़ बर्गर", "cheesy burger", "cheese wala burger",
        "चीज़ वाला बर्गर", "cheeseburger",
    ]},
    {"food_name": "Veg Burger", "category": "Burgers", "price": 135, "aliases": [
        "veg burger", "वेज बर्गर", "burger", "बर्गर", "vegetable burger",
        "veggie burger", "वेजिटेबल बर्गर", "veg wala burger",
    ]},

    # ── Desserts ───────────────────────────────────────────────────────────────
    {"food_name": "Brownie", "category": "Desserts", "price": 314, "aliases": [
        "brownie", "ब्राउनी", "chocolate brownie", "चॉकलेट ब्राउनी",
        "browni", "brownie cake",
    ]},
    {"food_name": "Chocolate Lava Cake", "category": "Desserts", "price": 371, "aliases": [
        "chocolate lava cake", "चॉकलेट लावा केक", "lava cake", "लावा केक",
        "molten cake", "choco lava cake", "choco lava", "chocolate cake",
    ]},
    {"food_name": "Falooda", "category": "Desserts", "price": 345, "aliases": [
        "falooda", "फालूदा", "faluda", "rose falooda", "फालूदा कुल्फी",
    ]},
    {"food_name": "Ice Cream Chocolate", "category": "Desserts", "price": 200, "aliases": [
        "chocolate ice cream", "चॉकलेट आइसक्रीम", "choco ice cream",
        "ice cream chocolate", "chocolate flavour ice cream",
        "चॉकलेट फ्लेवर आइसक्रीम", "ice cream",
    ]},
    {"food_name": "Ice Cream Vanilla", "category": "Desserts", "price": 82, "aliases": [
        "vanilla ice cream", "वनीला आइसक्रीम", "ice cream vanilla",
        "plain ice cream", "सादी आइसक्रीम", "vanilla flavour", "vanila ice cream",
    ]},

    # ── Fries ──────────────────────────────────────────────────────────────────
    {"food_name": "Peri Peri Fries", "category": "Fries", "price": 373, "aliases": [
        "peri peri fries", "पेरी पेरी फ्राइज़", "fries", "फ्राइज़",
        "french fries", "spicy fries", "masala fries", "peri fries",
        "मसाला फ्राइज़", "तीखी फ्राइज़",
    ]},

    # ── Light Course ───────────────────────────────────────────────────────────
    {"food_name": "Club Sandwich", "category": "Light Course", "price": 269, "aliases": [
        "club sandwich", "क्लब सैंडविच", "club sandwitch", "sandwich", "सैंडविच",
    ]},
    {"food_name": "Hakka Noodles", "category": "Light Course", "price": 115, "aliases": [
        "hakka noodles", "हक्का नूडल्स", "noodles", "नूडल्स", "chowmein",
        "chow mein", "चाउमीन", "veg noodles", "हक्का",
    ]},
    {"food_name": "Paneer Momos", "category": "Light Course", "price": 298, "aliases": [
        "paneer momos", "पनीर मोमोज़", "cheese momos", "paneer momo",
        "पनीर मोमो", "paneer wale momos",
    ]},
    {"food_name": "Schezwan Noodles", "category": "Light Course", "price": 275, "aliases": [
        "schezwan noodles", "शेज़वान नूडल्स", "szechuan noodles", "spicy noodles",
        "तीखे नूडल्स", "schezuan noodles", "schezwan", "shezwan noodles",
    ]},
    {"food_name": "Vada Pav", "category": "Light Course", "price": 311, "aliases": [
        "vada pav", "वड़ा पाव", "wada pav", "batata vada pav", "vada pao",
        "वड़ा पाओ", "mumbai vada pav",
    ]},
    {"food_name": "Veg Cutlet", "category": "Light Course", "price": 389, "aliases": [
        "veg cutlet", "वेज कटलेट", "cutlet", "कटलेट", "vegetable cutlet",
        "aloo cutlet", "आलू कटलेट",
    ]},
    {"food_name": "Veg Manchurian", "category": "Light Course", "price": 329, "aliases": [
        "veg manchurian", "वेज मंचूरियन", "manchurian", "मंचूरियन",
        "manchurian gravy", "veg manchurian gravy", "मंचूरियन ग्रेवी",
    ]},
    {"food_name": "Veg Momos", "category": "Light Course", "price": 400, "aliases": [
        "veg momos", "वेज मोमोज़", "momos", "मोमोज़", "momo", "मोमो",
        "vegetable momos", "steamed momos", "veg momo",
    ]},
    {"food_name": "Veg Sandwich", "category": "Light Course", "price": 272, "aliases": [
        "veg sandwich", "वेज सैंडविच", "vegetable sandwich", "plain sandwich",
        "sandwitch", "veg sandwitch",
    ]},
    {"food_name": "Samosa", "category": "Light Course", "price": 269, "aliases": [
        "samosa", "समोसा", "samose", "समोसे", "aloo samosa", "आलू समोसा",
        "samosa chaat",
    ]},

    # ── Main Course ────────────────────────────────────────────────────────────
    {"food_name": "Chole Bhature", "category": "Main Course", "price": 103, "aliases": [
        "chole bhature", "छोले भटूरे", "chhole bhature", "chole bature",
        "bhature", "भटूरे", "chhole", "छोले", "chole",
    ]},
    {"food_name": "Dal Makhani", "category": "Main Course", "price": 109, "aliases": [
        "dal makhani", "दाल मखनी", "dal makhni", "makhani dal", "black dal",
        "काली दाल", "kali dal", "butter dal", "दाल",
    ]},
    {"food_name": "Idli Sambar", "category": "Main Course", "price": 346, "aliases": [
        "idli sambar", "इडली सांभर", "idli", "इडली", "sambar idli",
        "idly sambar", "idli sambhar",
    ]},
    {"food_name": "Masala Dosa", "category": "Main Course", "price": 227, "aliases": [
        "masala dosa", "मसाला डोसा", "masala dose", "aloo dosa",
        "आलू डोसा", "dosa", "डोसा",
    ]},
    {"food_name": "Paneer Butter Masala", "category": "Main Course", "price": 240, "aliases": [
        "paneer butter masala", "पनीर बटर मसाला", "butter paneer", "बटर पनीर",
        "paneer makhani", "पनीर मखनी", "paneer", "पनीर",
        "shahi paneer", "paneer gravy",
    ]},
    {"food_name": "Pav Bhaji", "category": "Main Course", "price": 389, "aliases": [
        "pav bhaji", "पाव भाजी", "pavbhaji", "pao bhaji", "bhaji pav",
        "mumbai pav bhaji", "bhaji", "भाजी",
    ]},
    {"food_name": "Plain Dosa", "category": "Main Course", "price": 344, "aliases": [
        "plain dosa", "सादा डोसा", "sada dosa", "crispy dosa", "plain dose",
    ]},

    # ── Pasta & Italian ────────────────────────────────────────────────────────
    {"food_name": "Pasta Alfredo", "category": "Pasta & Italian", "price": 268, "aliases": [
        "pasta alfredo", "पास्ता अल्फ्रेडो", "white sauce pasta", "alfredo pasta",
        "white pasta", "cream pasta", "व्हाइट सॉस पास्ता", "pasta",
    ]},
    {"food_name": "Pasta Arrabiata", "category": "Pasta & Italian", "price": 366, "aliases": [
        "pasta arrabiata", "पास्ता अरबियाटा", "red sauce pasta", "arrabiata pasta",
        "spicy pasta", "tomato pasta", "रेड सॉस पास्ता", "तीखा पास्ता",
        "arrabbiata", "arabiata pasta",
    ]},

    # ── Pizza ──────────────────────────────────────────────────────────────────
    {"food_name": "Corn Pizza", "category": "Pizza", "price": 217, "aliases": [
        "corn pizza", "कॉर्न पिज़्ज़ा", "sweet corn pizza", "मकई पिज़्ज़ा",
        "makkai pizza", "corn wala pizza",
    ]},
    {"food_name": "Farmhouse Pizza", "category": "Pizza", "price": 86, "aliases": [
        "farmhouse pizza", "फार्महाउस पिज़्ज़ा", "farm house pizza",
        "farmhouse", "farm pizza", "loaded pizza",
    ]},
    {"food_name": "Margherita Pizza", "category": "Pizza", "price": 242, "aliases": [
        "margherita pizza", "मार्गेरिटा पिज़्ज़ा", "margarita pizza",
        "cheese pizza", "चीज़ पिज़्ज़ा", "plain pizza", "सादा पिज़्ज़ा",
        "margherita", "margarita",
    ]},
    {"food_name": "Mushroom Pizza", "category": "Pizza", "price": 154, "aliases": [
        "mushroom pizza", "मशरूम पिज़्ज़ा", "mushroom wala pizza",
        "खुम्ब पिज़्ज़ा",
    ]},
    {"food_name": "Paneer Pizza", "category": "Pizza", "price": 123, "aliases": [
        "paneer pizza", "पनीर पिज़्ज़ा", "cottage cheese pizza",
        "paneer wala pizza", "panner pizza",
    ]},
    {"food_name": "Veg Pizza", "category": "Pizza", "price": 290, "aliases": [
        "veg pizza", "वेज पिज़्ज़ा", "pizza", "पिज़्ज़ा", "पिज्जा", "पीज़ा",
        "vegetable pizza", "veg wala pizza", "veggie pizza", "piza", "pizaa",
    ]},

    # ── Rice & Biryani ─────────────────────────────────────────────────────────
    {"food_name": "Kadhi Chawal", "category": "Rice & Biryani", "price": 185, "aliases": [
        "kadhi chawal", "कढ़ी चावल", "kadhi rice", "curry chawal", "कढ़ी", "kadhi",
    ]},
    {"food_name": "Rajma Chawal", "category": "Rice & Biryani", "price": 146, "aliases": [
        "rajma chawal", "राजमा चावल", "rajma rice", "rajma", "राजमा",
        "kidney beans rice", "राजमा चांवल",
    ]},
    {"food_name": "Fried Rice", "category": "Rice & Biryani", "price": 80, "aliases": [
        "fried rice", "फ्राइड राइस", "veg fried rice", "chinese rice",
        "चाइनीज़ राइस", "rice", "चावल",
    ]},
    {"food_name": "Paneer Biryani", "category": "Rice & Biryani", "price": 81, "aliases": [
        "paneer biryani", "पनीर बिरयानी", "paneer biriyani", "paneer birani",
        "पनीर बिरानी", "cheese biryani",
    ]},
    {"food_name": "Veg Biryani", "category": "Rice & Biryani", "price": 368, "aliases": [
        "veg biryani", "वेज बिरयानी", "biryani", "बिरयानी", "biriyani",
        "vegetable biryani", "veg biriyani", "veg birani", "बिरानी",
    ]},

    # ── Soups ──────────────────────────────────────────────────────────────────
    {"food_name": "Sweet Corn Soup", "category": "Soups", "price": 143, "aliases": [
        "sweet corn soup", "स्वीट कॉर्न सूप", "corn soup", "कॉर्न सूप",
        "makkai soup", "मकई सूप", "sweet corn",
    ]},
    {"food_name": "Tomato Soup", "category": "Soups", "price": 281, "aliases": [
        "tomato soup", "टमाटर सूप", "tamatar soup", "red soup",
        "लाल सूप", "tomato shorba", "टमाटर शोरबा",
    ]},
    {"food_name": "Veg Soup", "category": "Soups", "price": 203, "aliases": [
        "veg soup", "वेज सूप", "vegetable soup", "सब्ज़ी सूप",
        "sabzi soup", "soup", "सूप", "clear soup",
    ]},

    # ── Starters ───────────────────────────────────────────────────────────────
    {"food_name": "Cheese Balls", "category": "Starters", "price": 298, "aliases": [
        "cheese balls", "चीज़ बॉल्स", "cheesy balls", "cheese wale balls",
        "fried cheese balls", "मोज़ेरेला बॉल्स",
    ]},
    {"food_name": "Chilli Paneer", "category": "Starters", "price": 315, "aliases": [
        "chilli paneer", "चिली पनीर", "chili paneer", "spicy paneer",
        "तीखा पनीर", "chinese paneer", "chilli paneer dry",
    ]},
    {"food_name": "Garlic Bread", "category": "Starters", "price": 86, "aliases": [
        "garlic bread", "गार्लिक ब्रेड", "lahsun bread", "लहसुन ब्रेड",
        "garlic toast", "cheesy garlic bread", "गार्लिक टोस्ट",
    ]},
    {"food_name": "Greek Salad", "category": "Starters", "price": 341, "aliases": [
        "greek salad", "ग्रीक सलाद", "salad", "सलाद", "fresh salad",
        "veggie salad", "healthy salad",
    ]},
    {"food_name": "Kachori", "category": "Starters", "price": 118, "aliases": [
        "kachori", "कचौरी", "kachodi", "kachauri", "masala kachori",
        "pyaaz kachori", "प्याज कचौरी",
    ]},
    {"food_name": "Nachos", "category": "Starters", "price": 136, "aliases": [
        "nachos", "नाचोज़", "tortilla chips", "nacho", "cheese nachos",
        "चीज़ नाचोज़", "nacho chips",
    ]},
    {"food_name": "Onion Rings", "category": "Starters", "price": 172, "aliases": [
        "onion rings", "अनियन रिंग्स", "pyaaz rings", "प्याज़ रिंग्स",
        "fried onion rings", "crispy onion rings",
    ]},
    {"food_name": "Spring Rolls", "category": "Starters", "price": 160, "aliases": [
        "spring rolls", "स्प्रिंग रोल्स", "veg spring rolls", "chinese rolls",
        "चाइनीज़ रोल्स", "spring roll", "fried rolls",
    ]},

    # ── Wraps ──────────────────────────────────────────────────────────────────
    {"food_name": "Falafel Wrap", "category": "Wraps", "price": 203, "aliases": [
        "falafel wrap", "फलाफेल रैप", "falafel roll", "falafel",
        "फलाफेल", "arabic wrap",
    ]},
    {"food_name": "Paneer Wrap", "category": "Wraps", "price": 202, "aliases": [
        "paneer wrap", "पनीर रैप", "paneer roll", "पनीर रोल",
        "cottage cheese wrap", "paneer frankie", "पनीर फ्रैंकी",
    ]},
    {"food_name": "Veg Wrap", "category": "Wraps", "price": 335, "aliases": [
        "veg wrap", "वेज रैप", "veg roll", "वेज रोल", "vegetable wrap",
        "wrap", "रैप", "veg frankie", "वेज फ्रैंकी",
    ]},
]

# ─── Flat alias → canonical name lookup (O(1) after build) ────────────────────
ALIAS_MAP: dict[str, str] = {
    alias.lower(): item["food_name"]
    for item in MENU_ALIASES
    for alias in item["aliases"]
}

# ─── Lookup helper ─────────────────────────────────────────────────────────────
def match_spoken_to_item(spoken: str) -> dict | None:
    """
    Match a spoken string (any language) to a menu item.
    First tries exact/substring alias match, then falls back to
    fuzzy matching via difflib for typos.
    Returns the full menu item dict or None.
    """
    spoken = spoken.strip().lower()

    # 1. Exact match
    if spoken in ALIAS_MAP:
        name = ALIAS_MAP[spoken]
        return next(i for i in MENU_ALIASES if i["food_name"] == name)

    # 2. Substring match — spoken contains alias or alias contains spoken
    for alias, name in ALIAS_MAP.items():
        if alias in spoken or spoken in alias:
            return next(i for i in MENU_ALIASES if i["food_name"] == name)

    # 3. Fuzzy fallback (handles typos like "piza", "burgar")
    from difflib import get_close_matches
    close = get_close_matches(spoken, ALIAS_MAP.keys(), n=1, cutoff=0.72)
    if close:
        name = ALIAS_MAP[close[0]]
        return next(i for i in MENU_ALIASES if i["food_name"] == name)

    return None


# ─── Ambiguous category resolver ──────────────────────────────────────────────
def get_items_by_category_alias(spoken: str) -> list[dict]:
    """
    If user says 'pizza' or 'पिज़्ज़ा', return all pizza items for disambiguation.
    """
    spoken = spoken.strip().lower()
    results = []
    seen = set()
    for alias, name in ALIAS_MAP.items():
        if alias in spoken or spoken in alias:
            if name not in seen:
                seen.add(name)
                results.append(next(i for i in MENU_ALIASES if i["food_name"] == name))
    return results


# ─── Quick test ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    tests = [
        "पिज्जा",         # Hindi pizza → should return multiple pizza options
        "biryani",        # Generic → Veg Biryani
        "momos",          # Ambiguous → both momo types
        "choco lava",     # Partial → Chocolate Lava Cake
        "burgar",         # Typo → Veg Burger / Cheese Burger
        "आलू पराठा",      # Hindi → Aloo Paratha
        "cold coffee",    # English → Cold Coffee
    ]
    for t in tests:
        result = match_spoken_to_item(t)
        print(f"'{t}' → {result['food_name'] if result else 'NOT FOUND'}")