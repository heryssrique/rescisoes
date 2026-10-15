# Desligamento App - Vercel Deployment

## Summary

This repository contains the **Desligamento App**, a Brazilian labor termination management SPA built with React, Framer Motion, and a Node.js/Express backend. The app has been migrated from a Render deployment to Vercel Functions for improved performance and cost efficiency.

## Backend (api/)

### Key Features

- **Modular Express App**: `api/index.js` exports the app as a Vercel serverless function handler.
- **Database Connection Caching**: `api/db.js` caches the MongoDB connection across serverless invocations to avoid connection pool exhaustion.
- **Selective Middleware**: `requireDB` middleware ensures DB connection only for data routes (`/api/auth`, `/api/desligamentos`, `/api/links`), while `/api/health` and 404s work without DB.
- **Cron Job**: The daily summary email is now scheduled via Vercel Cron (`/api/cron/resumo-diario`), protected by `Authorization: Bearer ${CRON_SECRET}`.
- **Production-Ready Logging**: `api/utils/logger.js` uses only console transport in production; file transports are gated by `NODE_ENV !== 'production'`.

### Environment Variables Required

```bash
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
CRON_SECRET=your-cron-secret
MAILTRAP_TOKEN=your-mailtrap-token
MAIL_FROM=noreply@desligest.com
FRONTEND_URL=https://rescisoes.vercel.app
ADMIN_EMAIL=admin@desligest.com
NODE_ENV=production
```

**Note**: Do NOT set `VITE_API_URL` on Vercel. The frontend should use relative `/api` paths (same-domain, no CORS).

### Routes

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `GET /api/auth/users` - List all users (admin only)
- `PATCH /api/auth/users/:id/role` - Change user role (admin only)
- `DELETE /api/auth/users/:id` - Delete user (admin only)
- `POST /api/auth/forgot-password` - Forgot password
- `POST /api/auth/reset-password` - Reset password
- `GET /api/health` - Health check (no DB required)
- `GET /api/cron/resumo-diario` - Daily summary (protected by CRON_SECRET)

## Frontend (src/)

### Build Outputs

- Static files are built to `dist/`
- HTML5 routing is handled via `vercel.json` rewrites
- Frontend uses relative `/api` paths for all API calls

## Vercel Configuration

### vercel.json

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "functions": {
    "index.js": {
      "runtime": "nodejs20.x",
      "maxDuration": 300
    }
  },
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/index.js"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "crons": [
    { "path": "/api/cron/resumo-diario", "schedule": "30 8 * * *" }
  ]
}
```

## Deployment

### Prerequisites

1. Vercel CLI: `npm i -g vercel`
2. Vercel account and project linked (`vercel link`)
3. Environment variables set in Vercel dashboard or via `vercel env add`

### Deployment Commands

```bash
# Deploy preview
vercel deploy

# Deploy to production
vercel --prod

# Set environment variables
vercel env add MONGODB_URI
vercel env add JWT_SECRET
vercel env add CRON_SECRET
vercel env add MAILTRAP_TOKEN
vercel env add MAIL_FROM
vercel env add FRONTEND_URL
vercel env add ADMIN_EMAIL
vercel env add NODE_ENV
```

### Verification

1. **Local**: `npm run dev:server` starts the Express server locally
2. **Vercel Preview**: Check Runtime Logs for:
   - "MongoDB conectado com sucesso"
   - "Iniciando resumo diário (Vercel Cron)..." at 08:30 UTC
3. **Production**: Test login and data operations
4. **Cron**: Test `/api/cron/resumo-diario` with and without `Bearer CRON_SECRET` header

## Known Issues

- **xlsx@0.18.5 Vulnerability**: High-severity prototype pollution/ReDoS. The SheetJS CDN install was blocked by npm's `EALLOWREMOTE` config. This remains a known issue.

## Rollback

If needed, revert to the Render deployment by:
1. Reverting the `api/` directory changes
2. Restoring `render.yaml` with appropriate start command
3. Setting `VITE_API_URL` in frontend

## Architecture Benefits

- **Cold Start Optimization**: MongoDB connection is cached across invocations
- **Cost Efficiency**: Serverless Functions with Active CPU pricing
- **Reliability**: Automatic failover and scaling
- **Compliance**: No disk writes in production (logs go to console)
- **Security**: No CORS issues (frontend and backend on same domain)

## Success Criteria

- [x] Build succeeds (`npm run build`)
- [x] Local server starts and responds to `/api/health`
- [x] Routes protected by `requireDB` return appropriate error when DB unavailable
- [x] Cron route responds correctly with and without authentication
- [x] Vercel deploy creates function and cron job successfully
- [x] Frontend loads and uses relative `/api` paths without CORS errors