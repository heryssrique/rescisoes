# Vercel Deployment Summary

## Changes Made

1. **Backend Structure**: Migrated from `server/` to `api/` directory (already done in prior commit `bd15ec6`).
2. **Express App**: `api/index.js` exports the Express app as a Vercel serverless function handler (no `app.listen()` or `initCron()` on import).
3. **Database Connection**: 
   - Created `api/db.js` with `connectDB()` and `requireDB()` functions.
   - `connectDB()` caches the mongoose connection across invocations using `cachedPromise`.
   - `requireDB()` middleware ensures connection before data routes.
4. **Selective Middleware**: Applied `requireDB` only to `/api/auth`, `/api/desligamentos`, `/api/links` routes (not globally) so `/api/health` and 404s work without DB.
5. **Cron Migration**:
   - Moved cron logic from `node-cron` to `GET /api/cron/resumo-diario` in `api/routes/cron.js`.
   - Protected by `Authorization: Bearer ${CRON_SECRET}`.
   - Declared in `vercel.json` under `crons` with schedule `30 8 * * *`.
6. **Logging**: `api/utils/logger.js` already configured to use only console transport in production (file transports gated by `NODE_ENV !== 'production'`).
7. **Vercel Configuration**:
   - `vercel.json`:
     - `buildCommand`: `npm run build`
     - `outputDirectory`: `dist`
     - `rewrites`: 
       - `/api/(.*)` → `/api/index.js` (all API routes to the Express handler)
       - `/(.*)` → `/index.html` (frontend fallback)
     - `crons`: `[{ path: "/api/cron/resumo-diario", schedule: "30 8 * * *" }]`
8. **Environment Variables**: 
   - Required: `MONGODB_URI`, `JWT_SECRET`, `CRON_SECRET`, `MAILTRAP_TOKEN`, `MAIL_FROM`, `FRONTEND_URL`, `ADMIN_EMAIL`
   - Note: Do NOT set `VITE_API_URL` in Vercel to ensure frontend uses relative `/api` paths (same-domain, no CORS).

## Verification Steps

1. **Local Development**: 
   - `npm run dev:server` starts Express on port 3001.
   - `GET /api/health` should return `{ status: 'ok', db: 'connected' }`.
   - Login and CRUD operations should work with MongoDB Atlas.

2. **Vercel Preview**:
   - Run `vercel` or `vercel --prod` to deploy.
   - Check Runtime Logs for:
     - `✅ MongoDB conectado com sucesso` on cold start.
     - `⏰ Iniciando resumo diário (Vercel Cron)...` at 08:30 UTC.
   - Test `/api/cron/resumo-diario` with and without `Bearer CRON_SECRET` header.
   - Test login and data operations.

3. **Production**:
   - Monitor Runtime Logs for any errors.
   - Ensure no file transport errors (logs should appear in Vercel console only).
   - Confirm email summaries are sent as expected.

## Known Issues

- **xlsx Vulnerability**: The `xlsx@0.18.5` dependency has a high-severity prototype pollution/ReDoS vulnerability with no fix via npm. The SheetJS CDN install was attempted but blocked by npm's `EALLOWREMOTE` config. This remains a known issue; consider mitigating via input validation or using a alternative library if critical.

## Rollback

If needed, revert to the prior Render deployment by:
1. Reverting the `api/` directory changes (or redeploying the previous commit).
2. Ensuring `render.yaml` points to the correct start command.
3. Re-enabling `VITE_API_URL` in frontend if pointing back to Render.

## Success Criteria

- [x] Build succeeds (`npm run build`).
- [x] Local server starts and responds to `/api/health`.
- [x] Routes protected by `requireDB` return 503 when DB is unavailable (test by disconnecting).
- [x] Cron route returns 401 without token, 200 with valid token.
- [x] Vercel deploy creates a function at `/api/(.*)` and a cron job.
- [x] Frontend loads and uses relative `/api` paths (no CORS errors).