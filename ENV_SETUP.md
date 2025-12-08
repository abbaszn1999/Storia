# Environment Variables Setup

## Quick Setup Instructions

Please add the following line to your `.env` file:

```env
DATABASE_URL=postgresql://localhost:5432/storia
```

Or if you're using Neon Database (recommended for cloud hosting):

```env
DATABASE_URL=postgresql://username:password@host.neon.tech/database?sslmode=require
```

## Complete .env File Template

Your `.env` file should look like this:

```env
# Database Configuration (REQUIRED)
DATABASE_URL=postgresql://localhost:5432/storia

# Email Service (Already configured)
APP_RESEND_API_KEY=re_bUPisxYp_FMBx6N3cWkATS9zGWJCKkd4Y

# Optional: AI Provider API Keys
# OPENAI_API_KEY=your_openai_key_here
# GEMINI_API_KEY=your_gemini_key_here
# ELEVENLABS_API_KEY=your_elevenlabs_key_here
# RUNWARE_API_KEY=your_runware_key_here

# Optional: Bunny CDN Storage
# BUNNY_STORAGE_ZONE=your_storage_zone
# BUNNY_STORAGE_API_KEY=your_bunny_api_key
# BUNNY_CDN_URL=https://your-cdn-url.b-cdn.net

# Optional: Google OAuth
# GOOGLE_CLIENT_ID=your_google_client_id
# GOOGLE_CLIENT_SECRET=your_google_client_secret
# GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback

# Session Secret (Important for security)
SESSION_SECRET=your_random_secret_key_change_this_in_production

# Server Port (Optional, defaults to 5000)
PORT=5000
```

## Getting a Database URL

### Option 1: Neon Database (Free, Cloud-based, Recommended)
1. Go to https://console.neon.tech
2. Sign up or log in
3. Create a new project
4. Copy the connection string
5. Paste it as DATABASE_URL in .env

### Option 2: Local PostgreSQL
If you have PostgreSQL installed locally:
```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/storia
```

### Option 3: Other Cloud Providers
- Supabase: https://supabase.com
- Railway: https://railway.app
- ElephantSQL: https://www.elephantsql.com

## After Setting Up

1. Save your `.env` file
2. Run: `npm run dev`
3. The application should start without errors

