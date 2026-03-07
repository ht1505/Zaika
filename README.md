# 🍽️ Zaika — AI-Powered Restaurant Platform

A full-stack restaurant management and ordering platform with AI-driven insights, chat-based ordering, voice bot, and revenue intelligence.

---

## 🗂️ Project Structure

```
zaika/
├── frontend/          # Next.js + TypeScript (deploy to Vercel)
└── backend/           # Node.js + Express + PostgreSQL (deploy to Render)
```

---

## 🚀 Local Setup

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- VS Code with GitHub Copilot (Student)
- Git

---

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd zaika

# Install frontend deps
cd frontend && npm install

# Install backend deps
cd ../backend && npm install
```

---

### 2. PostgreSQL Setup

```bash
# Create database
psql -U postgres
CREATE DATABASE zaika_db;
\q

# Run schema + seed
psql -U postgres -d zaika_db -f backend/src/db/schema.sql
psql -U postgres -d zaika_db -f backend/src/db/seed.sql
```

---

### 3. Environment Variables

**backend/.env**
```env
PORT=4000
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/zaika_db
JWT_SECRET=your_super_secret_jwt_key_change_this
JWT_EXPIRES_IN=7d
ANTHROPIC_API_KEY=sk-ant-...        # For Claude AI chat
TWILIO_ACCOUNT_SID=                 # Optional: SMS
TWILIO_AUTH_TOKEN=                  # Optional: SMS
TWILIO_PHONE_NUMBER=                # Optional: SMS
SENDGRID_API_KEY=                   # Optional: Email
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

**frontend/.env.local**
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_APP_NAME=Zaika
```

---

### 4. Run Dev Servers

```bash
# Terminal 1 — Backend
cd backend && npm run dev
# Runs on http://localhost:4000

# Terminal 2 — Frontend
cd frontend && npm run dev
# Runs on http://localhost:3000
```

---

## 👤 Demo Accounts

| Role     | Email                  | Password   |
|----------|------------------------|------------|
| Customer | customer@zaika.com     | demo123    |
| Admin    | admin@zaika.com        | admin123   |

---

## 📡 API Reference

### Auth
| Method | Endpoint           | Description         | Auth |
|--------|--------------------|---------------------|------|
| POST   | /api/auth/register | Register user       | ❌   |
| POST   | /api/auth/login    | Login, returns JWT  | ❌   |
| GET    | /api/auth/me       | Get current user    | ✅   |

### Menu
| Method | Endpoint           | Description                     | Auth |
|--------|--------------------|----------------------------------|------|
| GET    | /api/menu          | Get full menu (filtered)        | ✅   |
| GET    | /api/menu/:id      | Single item details             | ✅   |
| POST   | /api/menu          | Create menu item (admin)        | 🔐   |
| PUT    | /api/menu/:id      | Update item (admin)             | 🔐   |

### Orders
| Method | Endpoint              | Description               | Auth |
|--------|-----------------------|---------------------------|------|
| POST   | /api/orders           | Place order               | ✅   |
| GET    | /api/orders           | My order history          | ✅   |
| GET    | /api/orders/all       | All orders (admin)        | 🔐   |
| PATCH  | /api/orders/:id/status| Update order status (admin)| 🔐  |

### AI / Chat
| Method | Endpoint              | Description                | Auth |
|--------|-----------------------|----------------------------|------|
| POST   | /api/orders/chat      | AI chat-based ordering     | ✅   |
| POST   | /api/voice/order      | Voice transcript → order   | ✅   |

### Revenue (Admin Only)
| Method | Endpoint                      | Description              |
|--------|-------------------------------|--------------------------|
| GET    | /api/revenue/insights         | Full revenue dashboard   |
| GET    | /api/revenue/recommendations  | AI pricing suggestions   |
| GET    | /api/revenue/combos           | Combo suggestions        |

---

## 🧠 AI Features

### Chat Ordering (Claude-powered)
- Guided natural language ordering in English/Hinglish
- Understands modifiers, quantities, dietary preferences
- Fallback to menu search if AI unavailable

### Menu Intelligence (BCG Matrix)
- **⭐ Star** — High margin + High popularity
- **💎 Hidden Star** — High margin + Low popularity  
- **💪 Workhorse** — Low margin + High popularity
- **🐶 Dog** — Low margin + Low popularity

### Recommendations
- Based on order history + collaborative filtering
- Combo suggestions to boost AOV

---

## 🌐 Multi-Language Support

- Primary: **Hinglish** (Hindi + English mixed)
- Optional: **Hindi**, **Gujarati**
- Toggle in customer dashboard header

---

## 🏗️ Deployment

### Frontend → Vercel
```bash
cd frontend
npx vercel --prod
# Set env: NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
```

### Backend → Render
1. Push to GitHub
2. New Web Service on render.com
3. Root dir: `backend`
4. Build: `npm install`
5. Start: `npm start`
6. Add all env vars in Render dashboard
7. Add PostgreSQL service on Render → copy DATABASE_URL

---

## 🔧 VS Code Setup (Recommended Extensions)

```json
// .vscode/extensions.json
{
  "recommendations": [
    "github.copilot",
    "github.copilot-chat",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "prisma.prisma",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `backend/src/db/schema.sql` | Full PostgreSQL schema |
| `backend/src/db/seed.sql` | Mock restaurant data |
| `frontend/src/data/mockData.ts` | Frontend mock data |
| `backend/src/services/claudeService.js` | AI integration |
| `backend/src/services/revenueService.js` | BCG matrix + insights |
| `frontend/src/lib/claude.ts` | Frontend AI client |

---

## 📦 Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Backend | Node.js, Express, PostgreSQL |
| AI | Claude (Anthropic API) |
| Auth | JWT (jsonwebtoken) |
| Notifications | Twilio SMS, SendGrid Email |
| Deployment | Vercel + Render |
