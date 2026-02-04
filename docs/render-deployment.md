# Storia - Render + Neon Deployment Guide

## Prerequisites

- [x] Neon database subscription
- [x] Render subscription
- [x] Custom domain
- [x] GitHub repo with Storia code

## Quick Setup

### 1. Neon Database

1. Create project at [console.neon.tech](https://console.neon.tech)
2. Copy connection string (Settings → Connection string)
3. Run migrations locally first:
   ```bash
   DATABASE_URL="your-neon-url" npm run db:push
   ```

### 2. Render Web Service

1. [Dashboard](https://dashboard.render.com) → **New** → **Web Service**
2. Connect GitHub repo
3. Configure:

| Setting | Value |
|---------|-------|
| Name | storia |
| Region | Your choice |
| Branch | main |
| Build Command | `npm install && npm run build` |
| Start Command | `npm run start` |
| Instance | Standard ($25) or Pro ($85) for video |

### 3. Environment Variables (Render)

Add in **Environment** tab:

**Required:**
- `DATABASE_URL` - From Neon console
- `SESSION_SECRET` - `openssl rand -hex 32`
- `NODE_ENV` - `production`
- `APP_URL` - `https://yourdomain.com` (for OAuth + absolute URLs)

**Storage (Bunny CDN):**
- `BUNNY_STORAGE_ZONE`
- `BUNNY_STORAGE_API_KEY`
- `BUNNY_CDN_URL`
- `BUNNY_STORAGE_REGION`

**AI / Integrations:** Add keys as needed (OpenAI, Gemini, Runware, ElevenLabs, etc.)

See `.env.example` for full list.

### 4. Custom Domain

1. Render → Settings → **Custom Domains** → Add
2. At your DNS provider, add CNAME:
   - Name: `app` (or your subdomain)
   - Value: `storia.onrender.com` (your service URL)
3. Render provisions SSL automatically

### 5. Google OAuth (if used)

1. [Google Cloud Console](https://console.cloud.google.com) → Credentials
2. Add redirect URI: `https://yourdomain.com/api/auth/google/callback`
3. Ensure `APP_URL` in Render matches your domain

## Deploy Flow

- **Push to main** → Auto-deploys to production
- **Rollback** → Dashboard → Deploys → Rollback

## Staging Environment

1. Create second Web Service (or use Render's branching)
2. Connect to `develop` branch
3. Use separate Neon database (or Neon branch)
4. Set `APP_URL` to staging URL
