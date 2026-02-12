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

---

## Staging vs Production (Two Environments)

You can run **staging** (for testing) and **production** (live) side by side.

### Overview

| | **Production** | **Staging** |
|---|----------------|-------------|
| **Purpose** | Live site for users | Test before releasing |
| **URL** | `https://storiapro.com` | `https://storia-staging.onrender.com` or `https://staging.storiapro.com` |
| **Git branch** | `main` | `develop` (or `staging`) |
| **Database** | Production Neon DB | Separate Neon DB or Neon branch |
| **Deploys** | When you merge to `main` | When you push to `develop` |

### Option A: Two Render Web Services (Recommended)

1. **Production service** (you already have this)
   - Render → existing Web Service
   - **Branch:** `main`
   - **Environment:** Production env vars, production `DATABASE_URL`, `APP_URL=https://storiapro.com`
   - **Custom domain:** storiapro.com

2. **Staging service** (new)
   - Render → **New** → **Web Service**
   - Connect the **same** GitHub repo
   - **Branch:** `develop` (create this branch if you don’t have it)
   - **Name:** e.g. `storia-staging`
   - **Environment variables:** Copy from production, then override:
     - `NODE_ENV` = `production` (still use production mode for realistic behavior)
     - `APP_URL` = `https://storia-staging.onrender.com` (or your staging custom domain)
     - `DATABASE_URL` = **different** Neon connection string (see below)
     - `SESSION_SECRET` = **different** secret (e.g. another `openssl rand -hex 32`)
   - No custom domain required; Render gives you `https://storia-staging.onrender.com`.

3. **Database for staging**
   - **Option 1 – Neon branch:** In Neon console, create a branch of your project (e.g. `staging`). Use that branch’s connection string for staging `DATABASE_URL`. Same project, isolated data.
   - **Option 2 – Separate Neon project:** Create a second Neon project and use its `DATABASE_URL` for staging. Fully isolated.

4. **OAuth / third‑party apps**
   - Add staging redirect URIs where needed (e.g. Google OAuth: `https://storia-staging.onrender.com/api/auth/google/callback`).
   - Use separate API keys for staging if the provider supports it (optional).

### Option B: One Service, Manual Branch Deploys

- Single Render Web Service.
- In Render: **Settings** → **Build & Deploy** → **Branch**.
- For staging: deploy from `develop` by changing the branch temporarily, then switch back to `main` for production. Not ideal because you have to remember to switch; Option A is clearer.

### Workflow

1. **Develop on a branch:** e.g. `develop` or feature branches.
2. **Push to `develop`** → staging service auto-deploys (if branch is `develop`).
3. **Test on staging** (staging URL).
4. **Merge `develop` → `main`** → production service auto-deploys.
5. Production stays on `main` only; staging stays on `develop` (or your chosen branch).

### Summary

- **Staging:** Second Render Web Service + `develop` branch + separate DB (Neon branch or project) + staging `APP_URL` and `SESSION_SECRET`.
- **Production:** Existing service + `main` branch + production DB and env vars.
- Use staging to verify changes before merging to `main` and deploying to production.
