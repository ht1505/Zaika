# ZAIKA - AI-Powered Restaurant Platform

A complete design system and screen flows for ZAIKA, featuring Customer and Admin portals with premium Indian hospitality aesthetics.

## 🎨 Design System

Visit the root path `/` to explore the complete design system showcasing:
- Brand identity with Playfair Display typography
- Color tokens (Saffron, Turmeric, Forest, Cream)
- BCG classification badges
- Interactive components with animations
- Spacing and border radius scales
- Multi-language support (English/Hindi/Hinglish)

## 🛍️ Customer Portal (8 Screens)

**Entry Point:** `/customer/login`

1. **Login** - `/customer/login`
   - Demo credentials provided
   - Gradient background with centered card

2. **Home** - `/customer`
   - Hero banner with search
   - BCG filter pills (Stars, Hidden Stars, Workhorses, Dogs)
   - Category chips
   - 4-column menu grid with hover effects

3. **Item Detail** - `/customer/item/:id`
   - Full-size image with BCG badge
   - Customization modifiers (checkboxes)
   - Quantity stepper
   - Dynamic price calculation

4. **Chat Order** - `/customer/chat`
   - AI assistant with Hinglish support
   - Quick-start chips
   - Inline suggestion cards
   - Real-time message animations

5. **Voice Order** - `/customer/voice`
   - Animated 80px microphone button
   - Ripple rings when listening
   - 12-bar waveform animation
   - Live transcript with confidence badge

6. **Cart Drawer** - (Accessible from header)
   - Slides from right (280ms ease-out)
   - Item list with quantity steppers
   - Price breakdown with GST
   - "Place Order" CTA

7. **Order Confirmation** - `/customer/order-confirmation/:orderId`
   - Success animation (spring scale)
   - Copyable order ID
   - Estimated time display
   - SMS confirmation message

8. **Profile/Settings** - `/customer/profile`
   - Avatar with editable fields
   - Language preference toggle (EN/HI/Hinglish)
   - Notification toggles (custom switches)

## 👨‍💼 Admin Portal (8 Screens)

**Entry Point:** `/admin/login`

1. **Admin Login** - `/admin/login`
   - Dark forest background
   - Centered white card with demo credentials

2. **Dashboard** - `/admin`
   - 4 KPI tiles (Revenue, Orders, Customers, Avg Order Value)
   - Channel breakdown chart (Voice/Chat/Manual)
   - Recent orders table with status badges

3. **Revenue Insights** - `/admin/revenue`
   - BCG 2x2 matrix cards
   - Category revenue bar chart (horizontal)
   - AI recommendation cards (High/Medium/Low priority)

4. **Menu Analysis** - `/admin/menu`
   - Full data table with BCG badges
   - Sortable columns (click headers)
   - Color-coded margins:
     - Green ≥60% (Excellent)
     - Amber ≥40% (Good)
     - Red <40% (Review)
   - Search functionality

5. **BCG Visual** - `/admin/bcg`
   - Interactive bubble chart (Recharts)
   - X-axis: Popularity
   - Y-axis: Margin
   - Bubble size: Revenue
   - Click bubbles → item detail drawer
   - Quadrant labels with color coding

6. **Order Management** - `/admin/orders`
   - Kanban board (5 columns)
   - Statuses: Pending → Confirmed → Preparing → Ready → Delivered
   - Time-based urgency colors:
     - Green: <10 min
     - Amber: 10-20 min
     - Red: >20 min
   - Drag-and-drop ready

7. **Pricing Config** - `/admin/pricing`
   - Combo meal editor
   - AI price suggestions with:
     - Current vs Suggested comparison
     - Confidence meter (circular progress)
     - "Apply" button for quick updates
   - Reason explanations

8. **Voice Bot Config** - `/admin/voice-config`
   - Language tabs (EN/HI/Hinglish)
   - Intent editor with trigger phrases
   - Example variations
   - Test panel with live results
   - Fuzzy match rules (regex patterns)

## 🎯 Key Features

### Design Tokens
- **Colors:** Saffron (#E85D04), Turmeric (#FFD166), Forest (#1B4332), Cream (#FFF8F0)
- **Typography:** Playfair Display (headings), DM Sans (body), JetBrains Mono (IDs/prices)
- **Spacing:** 4px base scale (4, 8, 12, 16, 20, 24, 32, 40, 48, 64px)
- **Radius:** sm(6px), md(10px), lg(14px), xl(20px), full(9999px)
- **Shadows:** card (soft), warm (saffron glow)

### Animations
- Card hover: translateY(-4px) 200ms
- Button press: scale(0.96) 120ms
- Drawer slide: 280ms ease-out
- Mic ripple: infinite ping (3 rings)
- Chat messages: fade + slide-up 300ms

### BCG Classification
- **Star** 🌟 (Amber): High popularity + High margin
- **Hidden Star** 💜 (Purple): Low popularity + High margin
- **Workhorse** 🔵 (Blue): High popularity + Low margin
- **Dog** ⚫ (Gray): Low popularity + Low margin

## 🚀 Navigation

```
/ → Design System
/customer/login → Customer Portal Entry
/customer → Customer Home
/admin/login → Admin Portal Entry
/admin → Admin Dashboard
```

## 📱 Responsive Design

- **Mobile** (320-767px): Single column, bottom sheets, full-screen chat/voice
- **Tablet** (768-1023px): 2-3 columns, condensed tables
- **Desktop** (1024px+): Full sidebar, 4-column grid, split layouts
- Touch targets: min 44x44px (WCAG 2.1 AA compliant)

## 🌐 Multi-Language Support

Toggle between:
- English (EN)
- हिंदी (HI)
- Hinglish (mix)

Examples:
- "What are you craving?" / "Aaj kya khayenge?"
- "Add to Cart" / "Cart Mein Dalein" / "Add Karo"

## ♿ Accessibility

- 4.5:1 contrast ratios
- 3px saffron focus rings
- ARIA labels on icon buttons
- Live regions for cart/order updates
- Semantic HTML structure

---

Built with React, TypeScript, Tailwind CSS v4, React Router, Recharts, and Motion (Framer Motion).
