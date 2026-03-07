# smart_suggestions.py
# ─────────────────────────────────────────────────────────────────────────────
# Revenue-optimised suggestion engine for ZAIKA Voice Bot
#
# Strategy (BCG matrix aware):
#   1. AFFINITY (confidence)  — items that truly co-occur with cart items
#   2. REVENUE SCORE          — hidden stars get a multiplier to push them up
#   3. RESULT                 — return 1 confident pairing + 1 hidden star push
#
# Categories from dataset:
#   Star        → popular + high margin   (keep selling, nothing extra needed)
#   Hidden Star → low popularity + high margin  ← WE WANT TO BOOST THESE
#   Dog         → low popularity + low margin   (never suggest these)
#   Risk        → popular + low margin    (only suggest if confidence is high)
# ─────────────────────────────────────────────────────────────────────────────

import pandas as pd
from itertools import combinations
from collections import defaultdict
from typing import List, Dict, Optional
import os

# ── Category weights for scoring ─────────────────────────────────────────────
# Hidden Star gets a 2× boost so it competes with regular Star suggestions.
# Dog gets 0 — never suggest these (low margin, low popularity).
# Risk gets 0.6 — suggest only when confidence is very high.
CATEGORY_WEIGHTS = {
    "Star":        1.0,
    "Hidden Star": 2.0,   # ← the "boost" to push hidden gems into suggestions
    "Risk":        0.6,
    "Dog":         0.0,   # ← never suggest
}

# Minimum co-occurrence confidence to even consider a suggestion
MIN_CONFIDENCE = 0.04

# Dog/Risk items with THIS confidence are allowed in Slot 1 only (pure affinity).
# E.g. Garlic Bread (Dog) co-occurs with Paneer Pizza at 73% — ignoring that
# would hurt UX. We allow it but don't revenue-boost it.
HIGH_CONFIDENCE_EXCEPTION = 0.55


class SuggestionEngine:
    """
    Precomputes all pairwise association rules from the transaction dataset
    and provides revenue-optimised suggestions at checkout time.
    """

    def __init__(self, dataset_path: str, menu_path: str):
        self._build(dataset_path, menu_path)

    # ── Build phase ───────────────────────────────────────────────────────────
    def _build(self, dataset_path: str, menu_path: str):
        df = pd.read_csv(dataset_path)

        # Per-item metadata: category and average margin %
        self.item_meta: Dict[str, Dict] = (
            df.groupby("food_name")
            .agg(
                category=("category", lambda x: x.mode()[0]),
                margin_pct=("margin_percentage", "mean"),
                order_count=("order_id", "nunique"),
            )
            .to_dict(orient="index")
        )

        # Build co-occurrence counts from transactions
        orders = df.groupby("order_id")["food_name"].apply(list)
        item_count: Dict[str, int] = defaultdict(int)
        pair_count: Dict[tuple, int] = defaultdict(int)

        for items in orders:
            unique_items = list(set(items))
            for item in unique_items:
                item_count[item] += 1
            for a, b in combinations(sorted(unique_items), 2):
                pair_count[(a, b)] += 1

        # Build association table: for each (A→B), compute confidence P(B|A)
        # association_map[A] = list of {item_b, confidence, revenue_score}
        self.association_map: Dict[str, List[Dict]] = defaultdict(list)

        for (a, b), cnt in pair_count.items():
            conf_ab = cnt / item_count[a]  # P(B|A)
            conf_ba = cnt / item_count[b]  # P(A|B)

            for source, target, conf in [(a, b, conf_ab), (b, a, conf_ba)]:
                if conf < MIN_CONFIDENCE:
                    continue
                meta = self.item_meta.get(target, {})
                cat = meta.get("category", "Dog")
                cat_weight = CATEGORY_WEIGHTS.get(cat, 0.0)

                # Exception: Dog/Risk items with very high affinity (≥55%) are
                # allowed in Slot 1 as pure affinity picks. They get weight=0.5
                # so they score lower than any Hidden Star but can beat silence.
                is_exception = cat_weight == 0.0 and conf >= HIGH_CONFIDENCE_EXCEPTION
                if cat_weight == 0.0 and not is_exception:
                    continue  # skip genuine Dogs with low confidence

                effective_weight = 0.5 if is_exception else cat_weight
                margin = meta.get("margin_pct", 0) / 100.0
                # Revenue score = confidence × category_weight × (1 + margin)
                revenue_score = conf * effective_weight * (1 + margin)

                self.association_map[source].append(
                    {
                        "food_name": target,
                        "confidence": round(conf, 4),
                        "category": cat,
                        "margin_pct": round(meta.get("margin_pct", 0), 2),
                        "revenue_score": round(revenue_score, 4),
                        "is_exception": is_exception,
                    }
                )

        # Sort each item's suggestions by revenue_score descending
        for item in self.association_map:
            self.association_map[item].sort(
                key=lambda x: x["revenue_score"], reverse=True
            )

        # Load menu prices
        menu_df = pd.read_csv(menu_path)
        self.menu_prices: Dict[str, int] = dict(
            zip(menu_df["food_name"], menu_df["price"])
        )
        self.menu_categories: Dict[str, str] = dict(
            zip(menu_df["food_name"], menu_df["category"])
        )

        # Precompute global Hidden Star rankings (fallback when no cart match)
        self._global_hidden_stars = sorted(
            [
                (name, meta)
                for name, meta in self.item_meta.items()
                if meta.get("category") == "Hidden Star"
                and name in self.menu_prices
            ],
            key=lambda x: x[1]["margin_pct"],
            reverse=True,
        )

        total_assoc = sum(len(v) for v in self.association_map.values())
        print(
            f"✅ SuggestionEngine ready — "
            f"{len(self.item_meta)} items · {total_assoc} association rules"
        )

    # ── Public API ────────────────────────────────────────────────────────────
    def get_suggestions(
        self,
        cart_items: List[str],
        max_suggestions: int = 2,
    ) -> List[Dict]:
        """
        Given a list of items already in the cart, return up to
        `max_suggestions` revenue-optimised items to suggest.

        Strategy:
        - Slot 1: highest revenue_score match across all cart items
                  (can be Star or Hidden Star — whichever scores higher)
        - Slot 2: best Hidden Star that hasn't appeared in Slot 1
                  (guarantees at least one "boost" suggestion per checkout)

        Items already in the cart are excluded from suggestions.
        Items not present on the menu are excluded.
        """
        if not cart_items:
            return self._fallback_suggestions([], max_suggestions)

        cart_set = set(cart_items)

        # Aggregate scores across all cart items
        candidate_scores: Dict[str, float] = defaultdict(float)
        candidate_meta: Dict[str, Dict] = {}

        for cart_item in cart_items:
            for suggestion in self.association_map.get(cart_item, []):
                name = suggestion["food_name"]
                if name in cart_set:
                    continue  # already ordered
                if name not in self.menu_prices:
                    continue  # not on current menu
                # Accumulate: item scores higher if it pairs with multiple cart items
                candidate_scores[name] += suggestion["revenue_score"]
                candidate_meta[name] = suggestion  # keep latest meta

        if not candidate_scores:
            return self._fallback_suggestions(cart_set, max_suggestions)

        # Rank all candidates
        ranked = sorted(
            candidate_scores.items(), key=lambda x: x[1], reverse=True
        )

        results = []
        hidden_star_added = False

        # Slot 1: overall top scorer (could be any non-Dog category)
        if ranked:
            top_name = ranked[0][0]
            meta = candidate_meta[top_name]
            results.append(self._build_result(top_name, meta, candidate_scores[top_name]))
            if meta.get("category") == "Hidden Star":
                hidden_star_added = True

        # Slot 2: best Hidden Star not already included (revenue boost slot)
        if not hidden_star_added and max_suggestions >= 2:
            used = {r["food_name"] for r in results}
            for name, score in ranked:
                if name in used:
                    continue
                meta = candidate_meta[name]
                if meta.get("category") == "Hidden Star":
                    results.append(self._build_result(name, meta, score))
                    hidden_star_added = True
                    break

            # If still no Hidden Star found via associations, inject global top one
            if not hidden_star_added:
                used = {r["food_name"] for r in results}
                for hs_name, hs_meta in self._global_hidden_stars:
                    if hs_name not in used and hs_name not in cart_set:
                        results.append(
                            {
                                "food_name": hs_name,
                                "price": self.menu_prices[hs_name],
                                "category": "Hidden Star",
                                "margin_pct": hs_meta["margin_pct"],
                                "confidence": 0.0,
                                "revenue_score": 0.0,
                                "reason": "Chef's special — highly rated, less known",
                            }
                        )
                        break

        return results[:max_suggestions]

    def get_suggestion_message(
        self, cart_items: List[str], suggestions: List[Dict]
    ) -> str:
        """
        Build a natural-sounding voice message for the suggestions.
        Hidden Stars are framed as chef specials / less-known gems.
        Regular Stars are framed as frequently-ordered-together items.
        """
        if not suggestions:
            return ""

        parts = []
        for s in suggestions:
            name = s["food_name"]
            cat = s.get("category", "Star")
            if cat == "Hidden Star":
                # Frame as a chef's special / lesser-known gem
                parts.append(
                    f"{name} — it's one of our chef's special picks, "
                    f"not many people know about it but those who try it love it"
                )
            else:
                # Frame as a popular pairing
                if cart_items:
                    parts.append(
                        f"{name}, which is frequently ordered along with "
                        f"{cart_items[0] if len(cart_items) == 1 else 'your order'}"
                    )
                else:
                    parts.append(f"{name}")

        if len(parts) == 1:
            return (
                f"People also love to have {parts[0]}. "
                f"Would you like to add it?"
            )
        else:
            return (
                f"People also love to have {parts[0]}. "
                f"And we'd also recommend {parts[1]}. "
                f"Would you like to add either of these?"
            )

    # ── Helpers ───────────────────────────────────────────────────────────────
    def _build_result(self, name: str, meta: Dict, score: float) -> Dict:
        cat = meta.get("category", "")
        is_ex = meta.get("is_exception", False)
        if cat == "Hidden Star":
            reason = "Chef's special pick"
        elif is_ex:
            reason = "Frequently ordered together"
        else:
            reason = "Frequently ordered together"
        return {
            "food_name": name,
            "price": self.menu_prices.get(name, 0),
            "category": cat,
            "margin_pct": meta.get("margin_pct", 0),
            "confidence": meta.get("confidence", 0),
            "revenue_score": round(score, 4),
            "reason": reason,
        }

    def _fallback_suggestions(
        self, exclude: set, max_suggestions: int
    ) -> List[Dict]:
        """When no cart context exists, return top Hidden Stars by margin."""
        results = []
        for name, meta in self._global_hidden_stars:
            if name not in exclude:
                results.append(
                    {
                        "food_name": name,
                        "price": self.menu_prices.get(name, 0),
                        "category": "Hidden Star",
                        "margin_pct": meta["margin_pct"],
                        "confidence": 0.0,
                        "revenue_score": 0.0,
                        "reason": "Chef's special — highly rated, less known",
                    }
                )
            if len(results) >= max_suggestions:
                break
        return results


# ── Module-level singleton (imported by voice_bot.py) ─────────────────────────
_engine: Optional[SuggestionEngine] = None


def get_engine(
    dataset_path: str = "dataset_with_confidence.csv",
    menu_path: str = "menu.csv",
) -> SuggestionEngine:
    """Return cached singleton engine, building it on first call."""
    global _engine
    if _engine is None:
        _engine = SuggestionEngine(dataset_path, menu_path)
    return _engine