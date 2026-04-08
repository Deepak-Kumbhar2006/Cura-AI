# FIX: Vercel Frontend CORS Error - Step by Step

## Problem
Frontend (https://cura-ai-nine.vercel.app) is trying to connect to `localhost:5000` instead of live backend.

**Error**: `Access to XMLHttpRequest at 'http://localhost:5000/api/auth/login' has been blocked by CORS policy`

## Root Cause
Vercel environment variables were not set during deployment.

---

## IMMEDIATE FIX (5 Minutes)

### Step 1: Update Vercel Environment Variables
1. Go to: https://vercel.com/dashboard
2. Select **cura-ai project**
3. Click **Settings → Environment Variables**
4. **Delete** any existing `VITE_API_URL` variable
5. **Add new variable**:
   - Name: `VITE_API_URL`
   - Value: `https://cura-ai-83af.onrender.com`
   - Environments: Select **All (Production, Preview, Development)**
6. Click **Save**

### Step 2: Redeploy Frontend
1. Go to **Deployments** tab
2. Find the latest deployment
3. Click **... → Redeploy**
4. Wait 2-3 minutes for rebuild

### Step 3: Verify Fix
1. Open: https://cura-ai-nine.vercel.app
2. DevTools → Network tab
3. API calls should now go to: `https://cura-ai-83af.onrender.com/api/*`
4. No more CORS errors!

---

## Update Backend CORS (Important!)

### Render Dashboard Configuration
1. Go to: https://dashboard.render.com
2. Select **cura-ai-server** service
3. Click **Settings → Environment**
4. Find `CLIENT_ORIGIN` variable
5. Change value to: `https://cura-ai-nine.vercel.app`
6. Change `CORS_ORIGIN` to: `https://cura-ai-nine.vercel.app`
7. Click **Save Changes**
8. Backend will auto-redeploy (watch logs)

### Verify Backend CORS
```bash
curl -H "Origin: https://cura-ai-nine.vercel.app" https://cura-ai-83af.onrender.com/api/dashboard/stats -v
```

Should show: `Access-Control-Allow-Origin: https://cura-ai-nine.vercel.app`

---

## Files Already Updated (In Git)

✅ `client/.env.production` → `https://cura-ai-83af.onrender.com`
✅ `client/src/services/api.js` → fallback changed
✅ `server/.env.production.example` → updated for Vercel URL

---

## What Should Happen After Fix

Frontend (`https://cura-ai-nine.vercel.app`):
- Reads `VITE_API_URL` from Vercel environment
- Uses: `https://cura-ai-83af.onrender.com`
- All API calls go to live backend ✅

Backend (`https://cura-ai-83af.onrender.com`):
- Allows requests from: `https://cura-ai-nine.vercel.app`
- Returns data with proper CORS headers ✅

---

## Checklist

- [ ] Set `VITE_API_URL=https://cura-ai-83af.onrender.com` in Vercel
- [ ] Redeploy frontend on Vercel
- [ ] Update `CLIENT_ORIGIN` in Render backend settings
- [ ] Update `CORS_ORIGIN` in Render backend settings
- [ ] Test frontend - no CORS errors
- [ ] API calls reach backend successfully

---

## If Still Not Working

### Debug Steps:
1. Check Vercel deploy logs for build errors
2. Verify environment variable is set: DevTools → check console for API URL
3. Test backend directly: `curl https://cura-ai-83af.onrender.com/api/dashboard/stats`
4. Check Render backend logs for CORS errors

### Force Clear Cache:
1. Vercel → Deployments → **... → Redeploy** (with "Redeploy with existing Build Cache" disabled)
2. Wait for fresh build
