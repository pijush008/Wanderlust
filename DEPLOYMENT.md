# 🚀 Deployment Guide

This project is split into two parts: **backend** (Express REST API) and **frontend** (static HTML/JS).

## Architecture

```
Frontend (Vercel)  →  Backend (Render)  →  MongoDB Atlas
                                        →  Redis (Upstash)
                                        →  Cloudinary (images)
                                        →  OpenAI (AI)
```

---

## Step 1: MongoDB Atlas (Free 512MB Database)

1. Go to [https://cloud.mongodb.com](https://cloud.mongodb.com) — sign up free
2. Create a **free cluster** (M0 — 512MB)
3. **Database Access**: Add user with username + password
4. **Network Access**: Allow access from anywhere (`0.0.0.0/0`)
5. Click **Connect** → **Drivers** → copy connection string:
   ```
   mongodb+srv://username:password@cluster.xxxxx.mongodb.net/wanderlust?retryWrites=true
   ```
6. Save this — you'll use it as `ATLASDB_URL`

---

## Step 2: Upstash Redis (Optional — Free 256MB)

1. Go to [https://upstash.com](https://upstash.com) — sign up free
2. Create a Redis database (free tier)
3. Copy the **Redis URL** (starts with `redis://`)
4. Save as `REDIS_URL` (optional — app works without it)

---

## Step 3: Backend on Render

1. Push your code to GitHub
2. Go to [https://render.com](https://render.com) — sign up free (no credit card)
3. Click **New** → **Web Service**
4. Connect your GitHub repo
5. Configure:
   - **Name**: `wanderlust-backend`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: Free

6. **Environment Variables** (add in Render dashboard):
   ```
   NODE_ENV=production
   PORT=3000
   JWT_SECRET=<generate a random 32-char string>
   ATLASDB_URL=<your MongoDB Atlas URL>
   SESSION_SECRET=<random string>
   CLOUD_NAME=<from Cloudinary>
   CLOUD_API_KEY=<from Cloudinary>
   CLOUD_API_SECRET=<from Cloudinary>
   MAP_TOKEN=<from Mapbox>
   OPENAI_API_KEY=<from OpenAI>
   FRONTEND_URL=https://your-frontend.vercel.app
   REDIS_URL=<from Upstash, optional>
   ```

7. Click **Create Web Service** — wait 2-3 minutes
8. Your backend URL: `https://wanderlust-backend.onrender.com`
9. Test it: visit the URL — should see `{"name":"Wanderlust API",...}`

**Note**: Free Render sleeps after 15 min idle. First request after sleep takes ~30s to wake up.

---

## Step 4: Frontend on Vercel

1. Update `frontend/.env`:
   ```
   VITE_API_URL=https://wanderlust-backend.onrender.com/api
   ```

2. Push to GitHub

3. Go to [https://vercel.com](https://vercel.com) — sign up free
4. Click **New Project** → import your GitHub repo
5. Configure:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

6. **Environment Variables**:
   - `VITE_API_URL` = `https://wanderlust-backend.onrender.com/api`

7. Click **Deploy** — ~1 minute
8. Your frontend URL: `https://wanderlust-xxx.vercel.app`

---

## Step 5: Connect Them

1. Go back to Render → backend → Environment Variables
2. Update `FRONTEND_URL` to your Vercel URL
3. Save — backend will auto-restart

Now CORS is properly configured between frontend and backend.

---

## Step 6: Seed the Database

```bash
# Locally, with production ATLASDB_URL in .env
cd backend
node init/index.js
node init/seedFilters.js
```

Or run from Render Shell (web service → Shell tab).

---

## Local Development

### Backend
```bash
cd backend
npm install
cp .env.example .env  # Edit with your credentials
npm run dev
# Runs on http://localhost:4000
```

### Frontend
```bash
cd frontend
# Any static server works:
python3 -m http.server 5173
# Or:
npx serve -l 5173
# Then open http://localhost:5173
```

---

## Cost Breakdown

| Service | Free Tier | Limits |
|---------|-----------|--------|
| Vercel (frontend) | Unlimited | 100GB bandwidth/month |
| Render (backend) | 750 hrs/month | Sleeps after 15min idle |
| MongoDB Atlas | 512MB | No expiry |
| Upstash Redis | 256MB | 10K commands/day |
| Cloudinary | 25GB | 25 credits/month |
| OpenAI | Pay-as-you-go | ~$0.002 per chat |

**Total cost: $0/month** (except OpenAI usage, ~$1-5/month for moderate use)

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| CORS error | Check `FRONTEND_URL` in Render matches Vercel URL exactly |
| MongoDB connection error | Whitelist `0.0.0.0/0` in Atlas Network Access |
| Backend slow first request | Free tier sleeps — wait 30s on first hit |
| Token invalid after deploy | Clear localStorage (token uses old JWT_SECRET) |
| Images not loading | Check Cloudinary credentials in Render env vars |
