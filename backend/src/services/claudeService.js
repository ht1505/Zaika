const Anthropic = require('@anthropic-ai/sdk');

let client = null;
if (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.startsWith('sk-ant')) {
  try {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  } catch {
    console.warn('Anthropic SDK init failed — using smart fallback mode');
  }
}

// ─── Items NOT on our menu (to give polite redirects) ─────────────────────
const NOT_ON_MENU = {
  pizza:    { response: "Pizza hamare menu mein nahi hai 😅 But aap Garlic Naan ya Aloo Paratha try kar sakte ho — equally delicious! 🍕➡️🫓" },
  burger:   { response: "Burger available nahi hai abhi 🍔 But Aloo Tikki ya Samosa try karo — ekdum crispy! 😋" },
  pasta:    { response: "Pasta nahi milega yahan 🍝 But Dal Makhani with Naan is our version of comfort food! Try karein?" },
  sushi:    { response: "Sushi nahi hai hamare paas 🍣 But Tawa Fish Masala is amazing for seafood lovers! 🐟" },
  sandwich: { response: "Sandwich nahi hai menu mein 🥪 But Aloo Paratha is our stuffed bread — even better!" },
  noodles:  { response: "Noodles nahi hain abhi 🍜 But Veg Biryani try karo — rice dish with amazing flavors!" },
  momos:    { response: "Momos nahi hain 🥟 But Veg Spring Roll try karo — similar crispy snack!" },
  dosa:     { response: "Dosa is not available right now 😊 But Plain Roti ya Aloo Paratha is a great alternative!" },
  idli:     { response: "Idli nahi hai hamare menu mein 😊 But healthy options mein Plain Roti or Dal Makhani try karo!" },
  cake:     { response: "Cake nahi milega 🎂 But Shahi Tukda (royal bread pudding) or Gulab Jamun is our sweet specialty!" },
  ice_cream:{ response: "Ice cream nahi hai 🍦 But Mango Lassi try karo — ekdum creamy and refreshing!" },
  chinese:  { response: "Full Chinese menu nahi hai 🥡 But hamare paas Corn Soup aur Veg Spring Roll hain Indo-Chinese style!" },
};

// ─── Semantic intent keywords ─────────────────────────────────────────────
const INTENTS = {
  greet:    ['hi','hello','hey','namaste','hii','namaskar','good morning','good evening','howdy','yo'],
  recommend:['suggest','recommend','popular','best','top','special','bestseller','famous','trending','kya','batao','bataiye','achha','accha','what should','help me choose','kya loon','kya khaaon'],
  veg:      ['veg','vegetarian','no meat','shakahari','without meat','plant based','only veg','sabzi','meatless'],
  spicy:    ['spicy','hot','teekha','mirchi','extra spicy','very spicy','fire','tez','jyada mirch','bahut teekha'],
  mild:     ['mild','less spicy','not spicy','no spice','kam mirchi','bland','light','bina mirch'],
  sweet:    ['sweet','dessert','mithai','meetha','gulab','kheer','halwa','something sweet','after meal','meetha chahiye'],
  drink:    ['drink','beverage','juice','lassi','chai','tea','coffee','water','peena','thanda','garam','kuch peene ko','thirst','pyaas'],
  bread:    ['bread','roti','naan','paratha','chapati','tandoor','roti chahiye','naan chahiye'],
  rice:     ['rice','biryani','pulao','chawal','fried rice','biryani chahiye','rice dish'],
  starter:  ['starter','snack','appetizer','shuru','pehle','light','starters','kuch halka','snacks'],
  cheap:    ['cheap','budget','affordable','sasta','low price','economical','under 100','under 200','less expensive','pocket friendly'],
  heavy:    ['heavy','filling','full meal','bhara hua','pet bharna','main course','full stomach'],
  order:    ['order','add','want','chahiye','dena','lena','please','give me','i want','i need','de do','mujhe','lao','ek','do','teen','char'],
  cart:     ['cart','basket','my order','what i ordered','total','bill','kitna','show cart','order summary'],
  help:     ['help','menu','options','available','kya hai','what is','show me','dikhao','list','what do you have'],
  thanks:   ['thanks','thank you','shukriya','dhanyawad','great','awesome','perfect','amazing','badhiya'],
};

// ─── Responses ────────────────────────────────────────────────────────────
const RESPONSES = {
  greet:    ["Namaste! 🙏 Zaika mein aapka swagat hai! Kya order karein aaj?","Arey waah, welcome! 😊 Main aapka AI food assistant hoon. Kya lenge?","Hello! 👋 Hungry hai? Main help karoonga! Kya chahiye?"],
  recommend:["Bilkul! Yeh raha hamare top picks 👇","Zaroor! Yeh items bahut popular hain aajkal 🔥","Our bestsellers just for you! ⭐"],
  veg:      ["Great choice! Hamare veg options ekdum tasty hain 🌿","Veg lovers ke liye best picks! 😋"],
  nonveg:   ["Non-veg lovers ke liye ekdum best! 🍗","Fresh non-veg collection yeh raha! 🔥"],
  spicy:    ["Teekha pasand hai? Yeh try karo! 🌶️","Spice lovers ke liye perfect options! 🔥"],
  mild:     ["Less spicy options yeh raha! 😊","Mild aur tasty — perfect combination! 🌿"],
  sweet:    ["Meetha khaana hai? Best choice! 🍮","Desserts section — hamare best sweets! 🍬"],
  drink:    ["Refreshing drinks yeh raha! 🥤","Thanda ya garam — dono options hain! ☕"],
  bread:    ["Tandoor fresh breads! 🫓","Rotis aur Naans — garma garam! 🔥"],
  rice:     ["Rice dishes yeh raha! 🍛","Biryani lovers ke liye — most ordered! ✨"],
  starter:  ["Starters se shuru karein! 🥗","Crispy appetizers ready hain! 😋"],
  cheap:    ["Budget-friendly options 💰","Saste aur tasty — dono milenge! 😊"],
  heavy:    ["Full meal ke liye yeh best hain! 🍽️","Filling options — pet pakka bharega! 😄"],
  order:    ["Adding to cart! 🛒","Ho gaya! 🎉"],
  thanks:   ["Arey, mention not! 😊 Aur kuch chahiye?","Khushi hui! 🙏 Kuch aur order karein?","Thank you for ordering from Zaika! 🍽️"],
  help:     ["Main help karta hoon! Yeh hain options 😊","Batao kya chahiye — suggest karoonga! 🙏"],
  fallback: ["Samjha nahi 😅 Thoda aur batao?","Can you rephrase? Main better help karoonga!","Interesting! Thoda aur details dena 🙏 Ya menu browse karein!"],
};

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// ─── Check if user is asking for something not on menu ────────────────────
function checkNotOnMenu(message) {
  const lower = message.toLowerCase();
  for (const [item, data] of Object.entries(NOT_ON_MENU)) {
    if (lower.includes(item)) return data.response;
  }
  return null;
}

// ─── Detect intent ────────────────────────────────────────────────────────
function detectIntent(message) {
  const lower = message.toLowerCase();
  const scores = {};
  for (const [intent, keywords] of Object.entries(INTENTS)) {
    scores[intent] = keywords.filter(k => lower.includes(k)).length;
  }
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  return sorted[0][1] > 0 ? sorted[0][0] : 'fallback';
}

// ─── Extract quantity ─────────────────────────────────────────────────────
function extractQty(message) {
  const lower = message.toLowerCase();
  const map = { ek:1, do:2, teen:3, char:4, paanch:5, one:1, two:2, three:3, four:4, five:5 };
  for (const [w, n] of Object.entries(map)) {
    if (lower.includes(w)) return n;
  }
  const m = lower.match(/\b([2-9]|[1-9]\d)\b/);
  return m ? parseInt(m[1]) : 1;
}

// ─── Fuzzy menu search ────────────────────────────────────────────────────
function searchMenu(message, menu) {
  const lower = message.toLowerCase();
  const words = lower.split(/\s+/).filter(w => w.length > 2);

  return menu.map(item => {
    let score = 0;
    const name = item.name.toLowerCase();
    const desc = (item.description || '').toLowerCase();
    const cat  = item.category.toLowerCase();

    // Exact full name match — highest score
    if (lower.includes(name)) score += 15;
    // Each word of item name found in message
    name.split(' ').forEach(w => {
      if (w.length > 3 && lower.includes(w)) score += 6;
    });
    // Description words
    words.forEach(w => {
      if (desc.includes(w)) score += 2;
      if (cat.includes(w))  score += 3;
    });
    // Tag match
    (item.tags || []).forEach(t => {
      if (lower.includes(t)) score += 3;
    });

    return { ...item, score };
  })
  .filter(i => i.score > 0)
  .sort((a, b) => b.score - a.score)
  .slice(0, 4);
}

// ─── Main chat function ───────────────────────────────────────────────────
exports.chatWithMenu = async ({ message, conversation_history, menu, language, user }) => {
  // Try Claude API first if available
  if (client) {
    try {
      return await callClaude({ message, conversation_history, menu, language });
    } catch (e) {
      console.warn('Claude API failed, using smart fallback:', e.message);
    }
  }
  return smartFallback({ message, menu });
};

function smartFallback({ message, menu }) {
  const lower   = message.toLowerCase();
  const intent  = detectIntent(message);
  const qty     = extractQty(message);
  const matched = searchMenu(message, menu);

  // 1. Check if asking for something NOT on menu
  const notOnMenu = checkNotOnMenu(message);
  if (notOnMenu) {
    // Suggest closest alternatives
    const alts = menu
      .filter(i => i.item_class === 'star' || i.item_class === 'hidden_star')
      .slice(0, 3)
      .map(i => ({ item_id: i.id, item_name: i.name, price: i.price, reason: `Popular alternative • ₹${i.price}` }));
    return {
      message: notOnMenu,
      cart_updates: [],
      suggestions: alts,
      order_ready: false,
      order_summary: null,
      intent: 'not_available',
    };
  }

  // 2. Direct item match with high confidence → auto add to cart
  if (matched.length > 0 && matched[0].score >= 8) {
    const item = matched[0];
    const cart_updates = [{
      action: 'add', item_id: item.id,
      item_name: item.name, qty,
      modifiers: [], price: item.price,
    }];

    // Suggest complementary items
    const suggestions = menu
      .filter(i => i.id !== item.id && i.item_class === 'star')
      .slice(0, 2)
      .map(i => ({ item_id: i.id, item_name: i.name, price: i.price, reason: `Goes well with ${item.name} 😋` }));

    return {
      message: `*${item.name}* (×${qty}) cart mein add kar diya! 🛒 ₹${item.price * qty}\n\nAur kuch lena hai? Yeh bhi try karein 👇`,
      cart_updates,
      suggestions,
      order_ready: false,
      order_summary: null,
      intent: 'order',
    };
  }

  // 3. Partial match → show as clickable suggestions
  if (matched.length > 0) {
    return {
      message: `Yeh items match karte hain aapki request se 👇 Kaunsa add karein?`,
      cart_updates: [],
      suggestions: matched.map(i => ({
        item_id: i.id, item_name: i.name,
        price: i.price,
        reason: `${i.category} • ₹${i.price} • ⭐${i.rating}`,
      })),
      order_ready: false,
      order_summary: null,
      intent,
    };
  }

  // 4. Intent-based browsing
  const intentFilters = {
    veg:      i => (i.tags || []).includes('veg'),
    nonveg:   i => (i.tags || []).includes('non-veg'),
    sweet:    i => i.category === 'Desserts',
    drink:    i => i.category === 'Beverages',
    bread:    i => i.category === 'Breads',
    rice:     i => i.category === 'Biryani',
    starter:  i => i.category === 'Starters',
    cheap:    i => i.price <= 100,
    heavy:    i => ['Main Course', 'Biryani'].includes(i.category),
    spicy:    i => i.cuisine?.includes('Indian') || (i.tags || []).includes('spicy'),
    recommend:i => i.item_class === 'star' || (i.tags || []).includes('bestseller'),
    help:     i => i.item_class === 'star',
    greet:    i => i.item_class === 'star',
  };

  const fn = intentFilters[intent] || (i => i.item_class === 'star');
  const filtered = menu.filter(fn).slice(0, 4);
  const fallbackItems = filtered.length
    ? filtered
    : menu.filter(i => i.item_class === 'star').slice(0, 4);

  return {
    message: rand(RESPONSES[intent] || RESPONSES.fallback),
    cart_updates: [],
    suggestions: fallbackItems.map(i => ({
      item_id: i.id, item_name: i.name,
      price: i.price,
      reason: `${i.category} • ₹${i.price} • ⭐${i.rating}`,
    })),
    order_ready: false,
    order_summary: null,
    intent,
  };
}

// ─── Real Claude API ──────────────────────────────────────────────────────
async function callClaude({ message, conversation_history, menu, language }) {
  const menuCtx = menu.slice(0, 40).map(i =>
    `ID:${i.id}|${i.name}|${i.category}|Rs.${i.price}|${i.item_class}|tags:${(i.tags||[]).join(',')}`
  ).join('\n');

  const SYSTEM = `You are Zaika's friendly AI food ordering assistant for an Indian restaurant.
Respond in ${language === 'hinglish' ? 'Hinglish (natural Hindi+English mix)' : language}.
Be warm, use food emojis, be enthusiastic about food.

IMPORTANT: If user asks for items NOT in the menu (pizza, burger, pasta, sushi etc), 
politely say it's not available and suggest the closest alternative FROM the menu.

MENU:
${menuCtx}

Respond ONLY with valid JSON:
{
  "message": "your friendly response",
  "cart_updates": [{"action":"add","item_id":"...","item_name":"...","qty":1,"modifiers":[],"price":0}],
  "suggestions": [{"item_id":"...","item_name":"...","price":0,"reason":"..."}],
  "order_ready": false,
  "order_summary": null
}
Rules:
- Only use item IDs from the menu above
- Always include 2-3 relevant suggestions
- If item not on menu, say so kindly and suggest alternatives`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    system: SYSTEM,
    messages: [
      ...conversation_history.slice(-6),
      { role: 'user', content: message },
    ],
  });

  const clean = response.content[0].text.replace(/```json\n?|\n?```/g, '').trim();
  return JSON.parse(clean);
}

// ─── Voice parser ─────────────────────────────────────────────────────────
exports.parseVoiceOrder = async ({ transcript, menu, language = 'hinglish' }) => {
  const matched = searchMenu(transcript, menu);
  const qty = extractQty(transcript);

  if (client) {
    try {
      const menuCtx = menu.map(i => `${i.id}|${i.name}|Rs.${i.price}`).join('\n');
      const r = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 600,
        messages: [{
          role: 'user',
          content: `Parse this voice order: "${transcript}"\nMENU:\n${menuCtx}\nJSON only:\n{"items":[{"item_id":"...","item_name":"...","qty":1,"price":0,"modifiers":[]}],"special_notes":"","confidence":0.9,"clarification_needed":false,"clarification_message":""}`,
        }],
      });
      return JSON.parse(r.content[0].text.replace(/```json\n?|\n?```/g, '').trim());
    } catch {}
  }

  if (!matched.length) {
    return {
      items: [], confidence: 0,
      clarification_needed: true,
      clarification_message: 'Koi item nahi mila. Please dobara boliye clearly.',
      special_notes: '',
    };
  }

  return {
    items: matched.slice(0, 3).map(i => ({
      item_id: i.id, item_name: i.name,
      qty, price: i.price, modifiers: [],
    })),
    special_notes: '',
    confidence: Math.min(matched[0].score / 12, 0.95),
    clarification_needed: matched[0].score < 5,
    clarification_message: matched[0].score < 5 ? `Kya aapne "${matched[0].name}" maanga?` : '',
  };
};
