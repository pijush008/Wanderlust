# 🏗️ Wanderlust — Full Project Architecture

## Overview

Wanderlust is a production-grade travel booking platform (Airbnb clone) built with modern backend engineering practices. It goes far beyond a basic CRUD app — implementing real-time systems, AI integration, distributed caching, dynamic pricing, and conflict-safe booking.

---

## 🧰 Tech Stack Summary

| Layer | Technology | Why |
|-------|-----------|-----|
| **Runtime** | Node.js (v22) | Non-blocking I/O, perfect for real-time + high-concurrency |
| **Backend Framework** | Express.js 5 | Minimal, flexible REST API |
| **Frontend Framework** | React 18 + Vite | Modern SPA with instant HMR |
| **Routing** | React Router 6 | Client-side routing with protected routes |
| **HTTP Client** | Axios | Request/response interceptors for JWT |
| **State Management** | React Context | Auth + Toast notifications (no Redux needed) |
| **Database** | MongoDB + Mongoose | Schema flexibility for listings, geo queries, text search |
| **Template Engine** | EJS + ejs-mate | Server-side rendering with layouts |
| **Authentication** | Passport.js + passport-local-mongoose | Session-based auth with hashed passwords |
| **Real-time** | Socket.IO | WebSocket for live availability updates |
| **AI** | OpenAI GPT-3.5 | Natural language chatbot, smart search, review summaries |
| **Caching** | Redis (ioredis) + In-Memory LRU | Reduce DB load, sub-5ms response times |
| **Image CDN** | Cloudinary | Upload, transform, WebP conversion, responsive delivery |
| **Maps** | Mapbox GL JS + Mapbox Geocoding SDK | Interactive maps, geocoding, POI markers |
| **Job Queue** | Bull (Redis-backed) | Background tasks: email, image processing, cleanup |
| **Process Manager** | PM2 + Node Cluster | Multi-core scaling, zero-downtime deploys |
| **Load Balancer** | Nginx | Reverse proxy, rate limiting, static file serving |
| **Containerization** | Docker + Docker Compose | Reproducible environments, one-command deployment |
| **File Upload** | Multer + multer-storage-cloudinary | Multipart upload directly to Cloudinary |
| **Session Store** | connect-mongo | Persistent sessions in MongoDB |
| **Validation** | Joi | Schema validation for request bodies |

---

## 📐 System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT (Browser)                             │
│  EJS Templates + Bootstrap 5 + Mapbox GL + Socket.IO Client          │
└───────────────────────────────────┬─────────────────────────────────┘
                                    │ HTTP / WebSocket
┌───────────────────────────────────▼─────────────────────────────────┐
│                         NGINX (Load Balancer)                         │
│  • SSL Termination  • Gzip  • Rate Limiting  • Static Files          │
│  • WebSocket Upgrade  • Health-based Routing                         │
└───────────────────────────────────┬─────────────────────────────────┘
                                    │ Upstream (least_conn)
┌───────────────────────────────────▼─────────────────────────────────┐
│                    NODE.JS CLUSTER (4 Workers)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │ Worker 0 │  │ Worker 1 │  │ Worker 2 │  │ Worker 3 │           │
│  │ Express  │  │ Express  │  │ Express  │  │ Express  │           │
│  │ Socket.IO│  │ Socket.IO│  │ Socket.IO│  │ Socket.IO│           │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘           │
└───────┼──────────────┼──────────────┼──────────────┼────────────────┘
        └──────────────┴──────┬───────┴──────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────▼───────┐  ┌──────────▼──────────┐  ┌──────▼───────┐
│   MongoDB     │  │   Redis             │  │  Cloudinary  │
│  • Listings   │  │  • Cache Layer      │  │  • Images    │
│  • Users      │  │  • Job Queues       │  │  • CDN       │
│  • Bookings   │  │  • Session (opt)    │  │  • WebP      │
│  • Reviews    │  │  • Pub/Sub          │  │  • Transform │
│  • Activities │  │  • Locks            │  │              │
└───────────────┘  └─────────────────────┘  └──────────────┘
                              │
                   ┌──────────▼──────────┐
                   │  Background Worker  │
                   │  • Email jobs       │
                   │  • Image optimize   │
                   │  • Analytics        │
                   │  • Cleanup cron     │
                   │  • Price recalc     │
                   └─────────────────────┘
```

---

## 🗂️ Project Structure

```
Major_project/
├── app.js                    # Main application entry point
├── cluster.js                # Multi-core cluster mode
├── worker.js                 # Background job processor
├── ecosystem.config.js       # PM2 production config
├── Dockerfile                # Multi-stage Docker build
├── docker-compose.yml        # Full stack orchestration
├── .dockerignore             # Docker build exclusions
├── package.json
├── .env                      # Environment variables
│
├── models/                   # MongoDB Schemas (Mongoose)
│   ├── listing.js            # Listing schema (geo, categories, amenities)
│   ├── user.js               # User schema (passport-local-mongoose)
│   ├── review.js             # Review schema
│   ├── booking.js            # Booking with conflict resolution
│   ├── waitlist.js           # FIFO waitlist queue
│   └── userActivity.js       # Activity tracking for recommendations
│
├── controllers/              # Route handlers (business logic)
│   ├── listing.js            # CRUD + dynamic pricing + image optimization
│   ├── user.js               # Auth (signup, login, logout)
│   ├── review.js             # Review CRUD
│   ├── booking.js            # Booking with 3-layer conflict resolution
│   ├── search.js             # Smart search + autocomplete + trending
│   ├── filter.js             # Advanced filtering + price heatmap
│   ├── pricing.js            # Dynamic pricing API
│   ├── tripPlanner.js        # AI trip planner
│   ├── recommendation.js     # Recommendation engine
│   ├── waitlist.js           # Waitlist queue management
│   ├── maps.js               # Geo queries + nearby POI
│   └── ai.js                 # AI chatbot + smart search
│
├── routes/                   # Express route definitions
│   ├── listing.js, user.js, review.js, booking.js
│   ├── search.js, filter.js, pricing.js
│   ├── tripPlanner.js, recommendation.js
│   ├── waitlist.js, maps.js, ai.js, cache.js
│
├── utils/                    # Core engines & services
│   ├── pricingEngine.js      # Dynamic pricing (6 multiplier rules)
│   ├── recommendationEngine.js # Hybrid recommendation system
│   ├── tripPlanner.js        # Trip planning engine
│   ├── filterEngine.js       # Query builder + scoring
│   ├── geoService.js         # Haversine + geo queries + clustering
│   ├── imageOptimizer.js     # Cloudinary transforms + responsive
│   ├── lockManager.js        # Distributed locking (booking conflicts)
│   ├── waitlistService.js    # Event-driven waitlist processing
│   ├── realtime.js           # Socket.IO server + broadcasts
│   ├── cache.js              # Redis + LRU cache layer
│   ├── workerQueue.js        # Bull job queues
│   ├── healthCheck.js        # Health probes + graceful shutdown
│   ├── cdn.js                # CDN helper + cache headers
│   ├── aiService.js          # OpenAI GPT integration
│   ├── ExpressError.js       # Custom error class
│   └── wrapAsync.js          # Async error wrapper
│
├── views/                    # EJS Templates
│   ├── layouts/boilerplate.ejs
│   ├── listings/ (index, show, new, edit, search, filter)
│   ├── users/ (login, signup)
│   ├── bookings/ (index, show)
│   ├── trips/ (planner, result)
│   ├── recommendations/ (index)
│   ├── waitlist/ (index)
│   └── ai/ (chat)
│
├── public/                   # Static assets
│   └── css/ (style.css, rating.css)
│
├── nginx/                    # Nginx load balancer config
│   ├── nginx.conf            # Bare-metal Nginx config
│   └── docker-nginx.conf     # Docker Nginx config
│
└── init/                     # Database seeders
    ├── data.js               # Sample listings
    ├── index.js              # Seed script
    └── seedFilters.js        # Seed filter fields
```

---

## 🔧 Feature-wise Architecture & Tech Explanation

### 1. Smart Search Engine

**Tech**: MongoDB Text Index + Regex + Fuzzy Matching  
**Why**: Text indexes give O(1) lookup for keyword search. Fuzzy regex handles typos (e.g., "mnali" → "Manali"). No external search service needed.

```
User types "beach" → 
  1. MongoDB $text search (indexed, fast)
  2. Fuzzy regex (typo tolerance)
  3. Prefix match (autocomplete)
  4. Relevance scoring (title > location > description)
  5. Cache result (60s TTL)
```

**Interview value**: Demonstrates understanding of search algorithms, indexing, and caching strategies.

---

### 2. Dynamic Pricing Engine

**Tech**: Custom rule engine with 6 independent multipliers  
**Why**: Real Airbnb uses ML models. We simulate the same behavior with deterministic rules — easier to explain, debug, and demonstrate.

```
finalPrice = basePrice × weekend × festival × season × demand × occupancy × timing
```

| Rule | Logic |
|------|-------|
| Weekend | Fri 1.15×, Sat 1.25×, Sun 1.2× |
| Festival | 10 Indian festivals with date ranges (Diwali = 1.5×) |
| Season | Location-aware (Goa winter = peak, Manali summer = peak) |
| Demand | Based on review count / views |
| Occupancy | Booking rate optimization |
| Timing | Last-minute surge, early-bird discount |

**Interview value**: Rule engines, business logic separation, scheduling systems.

---

### 3. Booking Conflict Resolution

**Tech**: MongoDB Distributed Lock + Unique Index + Atomic Operations  
**Why**: Prevents double-booking without requiring a replica set (no transactions needed). Three independent layers ensure safety.

```
Layer 1: Distributed Lock (only one user proceeds)
Layer 2: Application check (hasConflict query)
Layer 3: Unique compound index (DB rejects duplicates)
```

**Interview value**: Race conditions, pessimistic locking, distributed systems, idempotency.

---

### 4. Real-time Availability (WebSocket)

**Tech**: Socket.IO  
**Why**: HTTP polling wastes bandwidth. WebSocket gives instant push notifications. Socket.IO handles fallback to long-polling automatically.

```
User A books → Server broadcasts "availability:updated" → 
User B (viewing same listing) gets instant notification
```

Events: `viewers:count`, `availability:updated`, `booking:conflict`, `pricing:updated`

**Interview value**: Event-driven architecture, pub/sub, real-time systems.

---

### 5. Caching Layer

**Tech**: Redis (production) + In-Memory LRU (development)  
**Why**: Database queries take 50-200ms. Cache hits take 1-5ms. For read-heavy pages (listings index, search), caching gives 5-10× speedup.

```
Request → L1 Memory Cache (fastest) → L2 Redis (shared) → L3 MongoDB (source of truth)
```

| Data | TTL | Reason |
|------|-----|--------|
| Search results | 60s | High frequency, moderate change |
| Trending | 5min | Expensive aggregation |
| Listing index | 2min | Most visited page |
| Pricing | 60s | Time-sensitive |

**Interview value**: Cache-aside pattern, TTL strategies, cache invalidation, LRU eviction.

---

### 6. Recommendation System

**Tech**: Custom hybrid engine (Content-Based + Collaborative Filtering)  
**Why**: No ML library needed. Pure algorithmic approach that's explainable in interviews.

```
User views beach listings → Profile builds: { beaches: 3, mid_price: 2 }
                          → Content-based: find similar listings
                          → Collaborative: "users like you also booked..."
                          → Hybrid score: 60% content + 30% collaborative + 10% popularity
```

**Cold start**: New users get popularity-based recommendations.  
**Diversity**: Max 2 listings from same location in results.

**Interview value**: Recommendation algorithms, scoring systems, cold-start problem.

---

### 7. Smart Trip Planner

**Tech**: Rule-based engine with pre-computed travel data  
**Why**: Generates complete trip plans without AI API costs. Demonstrates graph-like routing and budget optimization.

```
Input: Kolkata → Goa, ₹20K, 3 days, Friends
Output: Travel mode, budget split, stay recommendations, day-wise itinerary, tips
```

Engines: Location (distance/routes), Budget (weighted allocation), Recommendation (stay matching), Itinerary (preference-scored activities).

**Interview value**: Graph algorithms, optimization, recommendation systems.

---

### 8. AI Integration (OpenAI GPT)

**Tech**: OpenAI GPT-3.5-turbo via official SDK  
**Why**: Natural language understanding for chatbot, semantic search, and content generation.

| Feature | What it does |
|---------|-------------|
| Travel Chatbot | Natural language trip advice |
| Smart Search | "cozy mountain cabin" → structured filters |
| Review Summary | 50 reviews → 3 bullet points |
| Description Generator | Helps hosts write listings |

**Interview value**: AI/LLM integration, prompt engineering, API design.

---

### 9. Image Optimization Pipeline

**Tech**: Cloudinary CDN + Transformation API  
**Why**: Travel apps are image-heavy. Unoptimized images = slow pages. Cloudinary handles format conversion, compression, and CDN delivery in one URL transform.

```
Original JPEG (2MB) → Cloudinary URL transform → WebP (200KB) + blur placeholder (200 bytes)
```

Features: Lazy loading (IntersectionObserver), blur-up placeholders, responsive srcset, auto WebP/AVIF.

**Interview value**: Performance optimization, CDN architecture, progressive loading.

---

### 10. Waitlist System

**Tech**: MongoDB FIFO queue + Event-driven processing  
**Why**: When dates are booked, users shouldn't leave — they join a queue. Cancellation auto-notifies next user.

```
Booking cancelled → processWaitlist() → Notify #1 in queue → 15 min to book → 
If expired → auto-notify #2
```

**Interview value**: Queue data structures, event-driven systems, state machines.

---

### 11. Advanced Filtering

**Tech**: Query Builder pattern + Scoring engines  
**Why**: Multiple filters (price, category, family-friendly, pet-friendly, instant book) need to combine cleanly without spaghetti code.

Features: Price heatmap, cancellation flexibility filter, family/pet scoring (0-100), sort options.

**Interview value**: Design patterns, scoring algorithms, aggregation pipelines.

---

### 12. Interactive Maps & Geo Queries

**Tech**: Mapbox GL + MongoDB 2dsphere index + Haversine formula  
**Why**: Travel = location. Geo queries find nearby listings. POI data shows restaurants, hospitals, stations.

```
Listing coordinates → $geoNear query → nearby listings within 50km
                   → POI database → restaurants, hospitals, attractions with distance
                   → Grid clustering → group markers at low zoom
```

**Interview value**: Geo algorithms, spatial indexing, distance calculations.

---

### 13. Load Balancing & Scaling

**Tech**: Nginx + Node Cluster + PM2 + Bull queues  
**Why**: Single Node.js process uses one CPU core. Cluster mode uses all cores. Nginx distributes across instances.

```
Nginx (port 80) → 4 Node.js workers (round-robin)
                → Background worker (job processing)
                → Health checks (auto-remove unhealthy)
```

**Interview value**: Horizontal scaling, process management, zero-downtime deploys.

---

### 14. CDN Integration

**Tech**: Vercel Edge Network + jsDelivr + Cloudinary + Vite build optimization  
**Why**: Static assets from CDN = faster global delivery + reduced server load.

| Layer | What's served |
|-------|--------------|
| **Vercel Edge** | React build artifacts (HTML, JS, CSS bundles) — auto-cached globally |
| **jsDelivr** | Bootstrap + Font Awesome (third-party libraries) |
| **Cloudinary** | Listing images with on-the-fly transformations |
| **Vite** | Asset hashing (`app.abc123.js`) for cache-busting |

Features: DNS prefetch, preconnect, automatic gzip/brotli, immutable cache headers, hashed filenames for cache-busting.

**Interview value**: Web performance, multi-tier CDN architecture, build-time optimization.

---

## 🔐 Security Measures

| Measure | Implementation |
|---------|---------------|
| Password Hashing | bcryptjs (10 rounds, slow hash) |
| Auth Token | JWT (signed with HS256, 7-day expiry) |
| Token Storage | localStorage (frontend) with Axios interceptor |
| Input Validation | Joi schema validation on all inputs |
| Rate Limiting | Nginx: 30 req/s API, 5 req/min login |
| CORS | Whitelist frontend origin only |
| XSS Prevention | React auto-escapes JSX, no `dangerouslySetInnerHTML` (except chat replies) |
| File Upload | Cloudinary (no local file storage) |
| Environment Variables | dotenv, secrets never in code |
| Graceful Shutdown | SIGTERM handling, drain connections |
| Auto-logout | 401 response triggers token removal (Axios interceptor) |

---

## 📊 API Endpoints Summary

All endpoints prefixed with `/api`.

| Category | Endpoints |
|----------|-----------|
| **Auth** | `POST /api/auth/signup`, `POST /api/auth/login`, `GET /api/auth/me` |
| **Listings** | `GET/POST /api/listings`, `GET/PUT/DELETE /api/listings/:id` |
| **Reviews** | `POST /api/listings/:id/reviews`, `DELETE /api/listings/:id/reviews/:reviewId` |
| **Search** | `GET /api/search?q=`, `/api/search/autocomplete`, `/api/search/trending` |
| **Filter** | `GET /api/filter`, `/api/filter/options`, `/api/filter/heatmap`, `/api/filter/distribution` |
| **Booking** | `POST /api/listings/:id/book`, `GET /api/bookings`, `POST /api/bookings/:id/cancel`, `GET /api/listings/:id/availability` |
| **Pricing** | `GET /api/pricing/:id`, `/breakdown`, `/calendar`, `/analytics`, `/info/festivals` |
| **Recommendations** | `GET /api/recommendations`, `/api/recommendations/similar/:id`, `/api/recommendations/profile` |
| **Trip Planner** | `POST /api/trips/plan`, `GET /api/trips/options`, `/api/trips/destinations` |
| **Waitlist** | `POST /api/waitlist/:id/join`, `/api/waitlist/:id/leave`, `GET /api/waitlist/:id/status` |
| **Maps** | `GET /api/maps/:id/poi`, `/api/maps/:id/nearby`, `/api/maps/clusters`, `/api/maps/markers` |
| **AI** | `POST /api/ai/chat`, `GET /api/ai/search`, `/api/ai/reviews/:id/summary` |
| **Health** | `GET /health`, `/health/ready`, `/health/live`, `/health/full` |

### Auth Header

All protected endpoints require:
```
Authorization: Bearer <jwt_token>
```

Token is obtained from `POST /api/auth/login` and stored in localStorage by the frontend.

---

## 🚀 Running the Project

### Local Development

```bash
# Development (single process, auto-reload)
npm run dev

# Production (multi-core cluster)
npm run cluster

# Background worker (job processing)
npm run worker

# PM2 managed (auto-restart, monitoring)
npm run pm2:start

# Seed database
node init/index.js
node init/seedFilters.js
```

### Docker (Recommended for Production)

```bash
# Start entire stack (web + worker + MongoDB + Redis + Nginx)
docker-compose up -d

# Scale web to 4 instances
docker-compose up -d --scale web=4

# View logs
docker-compose logs -f web

# Stop everything
docker-compose down

# Rebuild after code changes
docker-compose up -d --build
```

### Docker Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    docker-compose.yml                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────┐    ┌──────────┐    ┌──────────────────┐  │
│  │  Nginx   │───▶│   Web    │───▶│    MongoDB       │  │
│  │  :80     │    │  :3000   │    │    :27017        │  │
│  │  (proxy) │    │ (Express)│    │  (persistent vol)│  │
│  └──────────┘    └────┬─────┘    └──────────────────┘  │
│                       │                                  │
│                       ▼                                  │
│                  ┌──────────┐    ┌──────────────────┐  │
│                  │  Worker  │───▶│     Redis        │  │
│                  │  (jobs)  │    │     :6379        │  │
│                  └──────────┘    │  (cache + queue) │  │
│                                  └──────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

**Services:**
| Service | Image | Purpose |
|---------|-------|---------|
| `web` | Custom (Dockerfile) | Express app + Socket.IO |
| `worker` | Custom (Dockerfile) | Background job processor |
| `mongo` | mongo:7 | Database (persistent volume) |
| `redis` | redis:7-alpine | Cache + queues + pub/sub |
| `nginx` | nginx:alpine | Load balancer + reverse proxy |

**Docker Features:**
- Multi-stage build (smaller image: ~150MB vs ~800MB)
- Non-root user (security)
- Health checks on all services
- Persistent volumes for data
- Auto-restart on failure
- Bridge network isolation
- Redis LRU eviction (128MB cap)

---

## 🧠 Interview Discussion Points

This project demonstrates understanding of:

1. **Distributed Systems** — Locking, caching, pub/sub, eventual consistency
2. **Algorithm Design** — Haversine, scoring engines, fuzzy matching, FIFO queues
3. **System Design** — Load balancing, horizontal scaling, microservice-ready architecture
4. **Real-time Systems** — WebSocket, event-driven, live notifications
5. **Database Design** — Indexes (text, geo, compound), schema design, conflict prevention
6. **Performance** — Caching layers, lazy loading, CDN, image optimization
7. **AI/ML Integration** — LLM APIs, prompt engineering, intent parsing
8. **Security** — Auth, rate limiting, input validation, session management
9. **DevOps** — Nginx, PM2, Docker, health checks, graceful shutdown, container orchestration
10. **Business Logic** — Dynamic pricing, recommendations, trip planning, waitlists

---

## 📦 Dependencies

```json
{
  "express": "^5.1.0",          // Web framework
  "mongoose": "^8.19.2",        // MongoDB ODM
  "ejs": "^3.1.10",             // Templating
  "ejs-mate": "^4.0.0",         // EJS layouts
  "passport": "^0.7.0",         // Authentication
  "passport-local-mongoose": "^8.0.0",
  "express-session": "^1.18.2", // Sessions
  "connect-mongo": "^4.6.0",    // Session store
  "connect-flash": "^0.1.1",    // Flash messages
  "socket.io": "^4.7.5",        // WebSocket
  "ioredis": "^5.4.1",          // Redis client
  "bull": "^4.12.9",            // Job queues
  "openai": "^4.73.0",          // AI integration
  "@google/generative-ai": "^0.21.0", // Gemini (backup)
  "cloudinary": "^1.41.3",      // Image CDN
  "multer": "^2.0.2",           // File uploads
  "@mapbox/mapbox-sdk": "^0.16.2", // Geocoding
  "joi": "^18.0.2",             // Validation
  "uuid": "^9.0.1",             // Idempotency keys
  "method-override": "^3.0.0",  // PUT/DELETE in forms
  "dotenv": "^17.2.3"           // Environment config
}
```

---

*Built with ❤️ as a Major Project — demonstrating production-grade backend engineering.*

---

## 🌐 Frontend / Backend Split (Production Architecture)

The project is split into two independent deployable services:

```
┌──────────────────────────────────────────────────────────────┐
│                       USER (Browser)                          │
└───────────┬──────────────────────────────────┬───────────────┘
            │                                  │
            ▼                                  ▼
   ┌─────────────────┐              ┌─────────────────┐
   │   FRONTEND      │              │    BACKEND      │
   │   (Vercel)      │  fetch() →   │   (Render)      │
   │                 │  ← JSON      │                 │
   │ • HTML + JS     │              │ • Express API   │
   │ • Bootstrap     │              │ • JWT auth      │
   │ • Hash routing  │              │ • Socket.IO     │
   │ • Static CDN    │              │ • All features  │
   └─────────────────┘              └────────┬────────┘
                                             │
                              ┌──────────────┼──────────────┐
                              ▼              ▼              ▼
                       ┌──────────┐  ┌──────────┐  ┌──────────────┐
                       │ MongoDB  │  │  Redis   │  │  Cloudinary  │
                       │  Atlas   │  │ (Upstash)│  │  + OpenAI    │
                       └──────────┘  └──────────┘  └──────────────┘
```

### Folder Structure (after split)

```
Major_project/
├── backend/                  # API Server (deploy to Render)
│   ├── server.js             # Entry point
│   ├── package.json
│   ├── render.yaml           # Render deployment config
│   ├── controllers/          # JSON-only endpoints
│   ├── models/               # MongoDB schemas
│   ├── routes/               # REST API routes
│   ├── middleware/
│   │   └── auth.js           # JWT auth (replaces sessions)
│   ├── utils/                # All engines (pricing, AI, cache, etc.)
│   └── init/                 # DB seeders
│
├── frontend/                 # React app (deploy to Vercel)
│   ├── package.json
│   ├── vite.config.js        # Vite build config
│   ├── index.html
│   ├── vercel.json           # Vercel config
│   └── src/
│       ├── main.jsx          # React entry point
│       ├── App.jsx           # Router + providers
│       ├── index.css         # Global styles
│       ├── components/       # Navbar, Footer, ListingCard, ProtectedRoute
│       ├── pages/            # Listings, Login, Signup, TripPlanner, AIChat...
│       ├── context/          # AuthContext, ToastContext
│       └── utils/
│           └── api.js        # Axios client with JWT
│
├── package.json              # Root: concurrently runs both
├── DEPLOYMENT.md             # Step-by-step deployment guide
└── ARCHITECTURE.md           # This file
```

### Key Changes from Monolith

| Aspect | Before (Monolith) | After (Split) |
|--------|------------------|---------------|
| Architecture | EJS server-rendered | React SPA + JSON API |
| Frontend | EJS templates | React 18 + React Router 6 |
| Build tool | None | Vite (instant HMR) |
| HTTP client | jQuery/fetch | Axios with interceptors |
| Auth | Express sessions + Passport | JWT tokens in localStorage |
| State | Server-side | React Context (Auth, Toast) |
| CORS | Not needed | Configured for cross-domain |
| Deployment | One server | Two services (separate scaling) |

### Why This Split?

1. **Scalability** — Frontend cached globally on CDN. Backend scales independently.
2. **Cost** — Frontend hosting is free forever. Backend can sleep when idle.
3. **Performance** — Static files served from edge (Vercel CDN). API calls in parallel.
4. **Industry Standard** — Most modern apps use this architecture (separation of concerns).
5. **Mobile-Ready** — Same API serves web + mobile apps + any future client.

### Hosting Stack

| Service | Used For | Cost |
|---------|----------|------|
| **Vercel** | Frontend static site | Free (100GB/mo) |
| **Render** | Backend API + WebSocket | Free (750hrs/mo) |
| **MongoDB Atlas** | Database | Free (512MB) |
| **Upstash** | Redis cache | Free (256MB) |
| **Cloudinary** | Image CDN + transforms | Free (25GB) |
| **OpenAI** | AI chatbot | Pay-as-you-go (~$1-5/mo) |

**Total**: Effectively $0/month for development/portfolio.

See [DEPLOYMENT.md](./DEPLOYMENT.md) for step-by-step deployment instructions.