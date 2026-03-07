# owner_analytics.py — ZAIKA Owner Intelligence Bot
# FastAPI server that pre-computes all menu analytics and serves an AI-powered
# owner dashboard. Run alongside or separately from main.py (different port).
#
#   python owner_analytics.py
#   → http://localhost:8001

import os, re, json, uuid
from collections import defaultdict
from itertools import combinations
from typing import Dict, List, Optional

import pandas as pd
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from pydantic import BaseModel

# ── Load data ─────────────────────────────────────────────────────────────────
_df  = pd.read_csv("dataset_with_confidence.csv")
_df["timestamp"] = pd.to_datetime(_df["timestamp"])

_menu_df = pd.read_csv("menu.csv")
MENU_PRICES: Dict[str, int] = dict(zip(_menu_df["food_name"], _menu_df["price"]))
MENU_CATS: Dict[str, str]   = dict(zip(_menu_df["food_name"], _menu_df["category"]))

# ── Pre-compute analytics ─────────────────────────────────────────────────────

def _compute_analytics():
    df = _df.copy()

    # Per-item stats
    item_stats = (
        df.groupby("food_name")
        .agg(
            orders    = ("order_id", "nunique"),
            qty_sold  = ("quantity", "sum"),
            avg_margin= ("margin_percentage", "mean"),
            avg_rating= ("rating", "mean"),
            revenue   = ("margin_per", "sum"),
            category  = ("category", lambda x: x.mode()[0]),
        )
        .reset_index()
    )
    item_stats["menu_category"] = item_stats["food_name"].map(MENU_CATS)
    item_stats["price"] = item_stats["food_name"].map(MENU_PRICES)

    # Category-level stats
    cat_stats = (
        item_stats.groupby("menu_category")
        .agg(
            total_orders = ("orders", "sum"),
            avg_margin   = ("avg_margin", "mean"),
            total_revenue= ("revenue", "sum"),
        )
        .reset_index()
        .sort_values("total_revenue", ascending=False)
    )

    # Combo / affinity pairs
    orders_list = df.groupby("order_id")["food_name"].apply(list)
    item_count: Dict[str, int] = defaultdict(int)
    pair_count: Dict[tuple, int] = defaultdict(int)
    for items in orders_list:
        unique = list(set(items))
        for item in unique:
            item_count[item] += 1
        for a, b in combinations(sorted(unique), 2):
            pair_count[(a, b)] += 1

    combos = []
    for (a, b), cnt in pair_count.items():
        conf_ab = cnt / item_count[a]
        conf_ba = cnt / item_count[b]
        cat_a = df[df["food_name"]==a]["category"].mode()
        cat_b = df[df["food_name"]==b]["category"].mode()
        cat_a = cat_a.iloc[0] if not cat_a.empty else "Dog"
        cat_b = cat_b.iloc[0] if not cat_b.empty else "Dog"
        margin_a = df[df["food_name"]==a]["margin_percentage"].mean()
        margin_b = df[df["food_name"]==b]["margin_percentage"].mean()
        avg_margin = (margin_a + margin_b) / 2
        combos.append({
            "item_a": a, "item_b": b,
            "co_orders": cnt,
            "conf_ab": round(conf_ab, 3),
            "conf_ba": round(conf_ba, 3),
            "max_conf": round(max(conf_ab, conf_ba), 3),
            "cat_a": cat_a, "cat_b": cat_b,
            "avg_margin": round(avg_margin, 1),
        })

    combos_df = pd.DataFrame(combos).sort_values("max_conf", ascending=False)

    # Time trends — orders by hour of day
    df["hour"] = df["timestamp"].dt.hour
    hourly = df.groupby("hour")["order_id"].nunique().reset_index()
    hourly.columns = ["hour", "orders"]

    # Underperforming items (Dog) with high margin potential
    hidden_gems = item_stats[item_stats["category"] == "Hidden Star"].sort_values("avg_margin", ascending=False)
    dogs = item_stats[item_stats["category"] == "Dog"].sort_values("avg_margin", ascending=False)
    risks = item_stats[item_stats["category"] == "Risk"].sort_values("orders", ascending=False)
    stars = item_stats[item_stats["category"] == "Star"].sort_values("revenue", ascending=False)

    return {
        "item_stats": item_stats,
        "cat_stats": cat_stats,
        "combos_df": combos_df,
        "hourly": hourly,
        "hidden_gems": hidden_gems,
        "dogs": dogs,
        "risks": risks,
        "stars": stars,
        "item_count": item_count,
        "total_orders": df["order_id"].nunique(),
        "total_revenue": round(df["margin_per"].sum(), 0),
        "avg_order_value": round(df.groupby("order_id")["price"].sum().mean(), 0),
    }

import pickle, hashlib

def _get_cache_path():
    # Cache key based on file modification times
    key = str(os.path.getmtime("dataset_with_confidence.csv")) + str(os.path.getmtime("menu.csv"))
    h = hashlib.md5(key.encode()).hexdigest()[:8]
    return f"_zaika_cache_{h}.pkl"

_cache_path = _get_cache_path()
if os.path.exists(_cache_path):
    print("⚡ Loading from cache...")
    with open(_cache_path, "rb") as f:
        _analytics = pickle.load(f)
    print("✅ Analytics ready (cached)")
else:
    print("⚙️  Computing analytics (first run, will be cached)...")
    _analytics = _compute_analytics()
    with open(_cache_path, "wb") as f:
        pickle.dump(_analytics, f)
    print("✅ Analytics ready + cached for next run")

# ── FastAPI app ───────────────────────────────────────────────────────────────
app = FastAPI(title="ZAIKA Owner Bot")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# ── Chat sessions ─────────────────────────────────────────────────────────────
_sessions: Dict[str, List[Dict]] = {}

def _get_history(sid: str) -> List[Dict]:
    if sid not in _sessions:
        _sessions[sid] = []
    return _sessions[sid]

# ── Build context snapshot for LLM ───────────────────────────────────────────
def _build_context() -> str:
    a = _analytics
    item_stats = a["item_stats"]
    cat_stats  = a["cat_stats"]
    combos_df  = a["combos_df"]
    stars      = a["stars"]
    hidden_gems= a["hidden_gems"]
    dogs       = a["dogs"]
    risks      = a["risks"]

    top_stars   = stars.head(8)[["food_name","orders","avg_margin","avg_rating","revenue"]].to_dict("records")
    top_hidden  = hidden_gems.head(8)[["food_name","orders","avg_margin","avg_rating","revenue"]].to_dict("records")
    top_dogs    = dogs.head(8)[["food_name","orders","avg_margin","avg_rating"]].to_dict("records")
    top_risks   = risks.head(8)[["food_name","orders","avg_margin","avg_rating"]].to_dict("records")
    top_combos  = combos_df[combos_df["max_conf"] > 0.3].head(12)[
        ["item_a","item_b","co_orders","max_conf","avg_margin","cat_a","cat_b"]
    ].to_dict("records")
    cat_summary = cat_stats.to_dict("records")

    context = f"""
You are ZAIKA's intelligent business analytics assistant for the restaurant OWNER.
You have full access to real transaction data. Be specific, confident, and actionable.
Always cite numbers. Speak like a sharp business consultant.

=== RESTAURANT OVERVIEW ===
Total Orders: {a['total_orders']:,}
Total Profit/Margin Revenue: ₹{a['total_revenue']:,.0f}
Avg Order Value: ₹{a['avg_order_value']:,.0f}

=== CATEGORY PERFORMANCE ===
{json.dumps(cat_summary, indent=2)}

=== BCG MATRIX CLASSIFICATION ===
STAR items (popular + high margin) — keep pushing:
{json.dumps(top_stars, indent=2)}

HIDDEN STAR items (low popularity + high margin) — HIGHEST OPPORTUNITY:
{json.dumps(top_hidden, indent=2)}

RISK items (popular + low margin) — review pricing:
{json.dumps(top_risks, indent=2)}

DOG items (low popularity + low margin) — consider removing:
{json.dumps(top_dogs, indent=2)}

=== TOP CO-OCCURRENCE COMBOS (for bundle/combo deals) ===
{json.dumps(top_combos, indent=2)}
conf = confidence (0–1). e.g. 0.65 means 65% of people who order item_a also order item_b.

=== INSTRUCTIONS ===
- Answer questions about revenue, menu optimization, pricing strategy, combos, category performance, hidden gems, etc.
- When asked about combos: suggest specific item pairs from the combo data with their confidence scores.
- When asked about removing items: cross-reference dogs with low margin AND low rating.
- When asked about Hidden Stars: explain they have high margin but low visibility — suggest promotions.
- Format your answers with clear sections using ** for bold, bullet points, and specific ₹ figures.
- Keep answers conversational but packed with insight. Max 250 words unless asked to elaborate.
- You may also respond in Hindi/Hinglish if the owner speaks in Hindi.
"""
    return context.strip()

_SYSTEM_CONTEXT = _build_context()

# ── Endpoints ─────────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    session_id: str
    message: str

class ChatResponse(BaseModel):
    reply: str
    session_id: str

@app.post("/api/owner/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    import httpx

    api_key = "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"  # ← paste your Groq key here

    history = _get_history(req.session_id)
    history.append({"role": "user", "content": req.message})
    messages = history[-20:]

    # Build messages with system prompt
    groq_messages = [{"role": "system", "content": _SYSTEM_CONTEXT}] + messages

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {api_key}",
                },
                json={
                    "model": "llama-3.3-70b-versatile",
                    "messages": groq_messages,
                    "max_tokens": 1000,
                },
            )
            data = resp.json()

        if data.get("error"):
            reply = f"API error: {data['error'].get('message', 'Unknown error')}"
        else:
            reply = data["choices"][0]["message"]["content"]
    except Exception as e:
        reply = f"Request failed: {str(e)}"

    history.append({"role": "assistant", "content": reply})
    return ChatResponse(reply=reply, session_id=req.session_id)


@app.get("/api/owner/stats")
def get_stats():
    a = _analytics
    stars_list   = a["stars"].head(5)[["food_name","orders","avg_margin","revenue"]].to_dict("records")
    hidden_list  = a["hidden_gems"].head(5)[["food_name","orders","avg_margin","revenue"]].to_dict("records")
    dogs_list    = a["dogs"].head(5)[["food_name","orders","avg_margin"]].to_dict("records")
    combos_list  = a["combos_df"][a["combos_df"]["max_conf"] > 0.3].head(6)[
        ["item_a","item_b","max_conf","avg_margin"]].to_dict("records")
    cat_list     = a["cat_stats"].to_dict("records")
    hourly_list  = a["hourly"].to_dict("records")

    return {
        "overview": {
            "total_orders": a["total_orders"],
            "total_revenue": a["total_revenue"],
            "avg_order_value": a["avg_order_value"],
        },
        "stars": stars_list,
        "hidden_gems": hidden_list,
        "dogs": dogs_list,
        "combos": combos_list,
        "categories": cat_list,
        "hourly": hourly_list,
    }


@app.post("/api/owner/reset")
def reset(body: dict):
    sid = body.get("session_id", "")
    if sid in _sessions:
        _sessions[sid] = []
    return {"ok": True}


@app.get("/health")
def health():
    return {"status": "ok", "total_orders": _analytics["total_orders"]}


# ── HTML UI ───────────────────────────────────────────────────────────────────
HTML = open("owner_ui.html", encoding="utf-8").read() if os.path.exists("owner_ui.html") else "<h1>UI not found</h1>"

@app.get("/", response_class=HTMLResponse)
def root():
    return HTML


if __name__ == "__main__":
    import threading, webbrowser, time

    def _open():
        time.sleep(1.5)
        webbrowser.open("http://localhost:8001")

    threading.Thread(target=_open, daemon=True).start()
    uvicorn.run(app, host="0.0.0.0", port=8001)