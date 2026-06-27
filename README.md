# 🌍 Wanderlust — AI-Powered Travel Booking Platform

A production-grade travel booking platform (Airbnb clone) built with React + Express, featuring AI chatbot, dynamic pricing, real-time updates, and full payment integration.

## 🚀 Features

- 🔍 **Smart Search** — fuzzy matching, autocomplete, trending destinations
- 💰 **Dynamic Pricing** — 6-rule engine (weekend, festival, season, demand, occupancy, timing)
- 🔒 **Booking Conflict Resolution** — distributed locks + unique indexes + atomic ops
- ⚡ **Real-time Updates** — WebSocket viewer count, live notifications, instant availability
- 🧠 **Recommendation Engine** — hybrid content-based + collaborative filtering
- 🗺️ **Smart Trip Planner** — generates itineraries with stays, activities, budgets
- 🤖 **AI Travel Assistant** — OpenAI GPT-powered chatbot
- 🌤️ **Live Weather** — Open-Meteo integration for every destination
- 📍 **Interactive Maps** — Mapbox with nearby restaurants, hospitals, attractions
- 💳 **Razorpay Payments** — full checkout flow with receipts (UPI, cards, QR)
- ⭐ **Reviews & Ratings** — interactive star rating system
- ⏱️ **Waitlist System** — FIFO queue with auto-notify on cancellation
- 🎨 **Advanced Filters** — price heatmap, family-friendly, pet-friendly, instant book
- 🏎️ **Multi-tier Caching** — Redis + LRU in-memory fallback
- 🖼️ **Image Optimization** — Cloudinary with WebP/AVIF + lazy loading
- 🌐 **Production Architecture** — Docker, Nginx, PM2, cluster mode, worker queues

## 🛠️ Tech Stack

**Frontend**: React 18 · Vite · React Router · Axios · Mapbox GL · Bootstrap 5
**Backend**: Node.js · Express 5 · MongoDB · Mongoose · JWT · Socket.IO · Bull
**AI**: OpenAI GPT-3.5
**Payment**: Razorpay
**Hosting**: Vercel (frontend) · Render (backend) · MongoDB Atlas · Upstash Redis · Cloudinary

## 📦 Quick Start

```bash
# 1. Install dependencies
npm run install:all

# 2. Create env files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Edit both .env files with your API keys

# 3. Start MongoDB
sudo systemctl start mongod

# 4. Seed the database
cd backend && node init/index.js && node init/seedFilters.js
cd ..

# 5. Run dev servers (frontend + backend)
npm run dev
```

Open http://localhost:5173

## 📚 Documentation

- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — Full system architecture and tech decisions
- [`DEPLOYMENT.md`](./DEPLOYMENT.md) — Step-by-step Render + Vercel deployment guide

## 🔑 Required API Keys

| Service | Required for | Free tier |
|---------|-------------|-----------|
| [MongoDB Atlas](https://cloud.mongodb.com) | Database | ✅ 512MB |
| [Cloudinary](https://cloudinary.com) | Image uploads | ✅ 25GB |
| [Mapbox](https://mapbox.com) | Maps | ✅ 50k loads/mo |
| [OpenAI](https://platform.openai.com) | AI chatbot | Pay-as-you-go |
| [Razorpay](https://razorpay.com) | Payments | ✅ Test mode free |

## 📁 Project Structure

```
Wanderlust/
├── backend/          # Express REST API
│   ├── controllers/  # Route handlers
│   ├── models/       # Mongoose schemas
│   ├── routes/       # API routes
│   ├── utils/        # Engines (pricing, AI, cache, etc.)
│   └── server.js     # Entry point
├── frontend/         # React SPA
│   └── src/
│       ├── pages/    # Route pages
│       ├── components/
│       ├── context/  # AuthContext, ToastContext
│       └── utils/    # API client
└── package.json      # Root: runs both with concurrently
```

## 📜 License

ISC — built as a major project for educational purposes.
