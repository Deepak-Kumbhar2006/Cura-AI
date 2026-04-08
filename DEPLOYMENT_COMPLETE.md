# Cura AI - Complete Deployment & Development Guide

## Quick Status
- ✅ **Backend**: Running locally on `http://localhost:5000`
- ✅ **Database**: MongoDB Atlas connected
- ✅ **Frontend**: Ready for local dev and production

---

## LOCAL DEVELOPMENT SETUP

### Start Backend
```bash
cd server
npm install
npm run dev
```
- Backend runs on: `http://localhost:5000`
- MongoDB connected and synced

### Start Frontend
```bash
cd client
npm install
npm run dev
```
- Frontend runs on: `http://localhost:5173`
- Uses `.env` with `VITE_API_URL=http://localhost:5000`

### Test Local Connection
1. Open DevTools → Network tab
2. API calls should go to: `http://localhost:5000/api/*`
3. Check for 200 responses

---

## PRODUCTION DEPLOYMENT TO VERCEL

### Step 1: Build Production Frontend
```bash
cd client
npm run build
# Output: dist/ folder (deployment artifact)
```

### Step 2: Deploy to Vercel
1. Go to https://vercel.com/dashboard
2. Click **"Add New" → "Project"**
3. Import GitHub repository: `NishadDamale1010/Cura-AI`
4. Configure:
   - **Framework**: Vite
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### Step 3: Set Environment Variables in Vercel
In Vercel Project Settings → Environment Variables:
```
VITE_API_URL = https://cura-ai-83af.onrender.com
```
- Apply to: **Production**, **Preview**, **Development**

### Step 4: Deploy
Click **Deploy** button. Vercel will:
1. Build the project
2. Run: `npm run build` in `client/` directory
3. Load `.env.production` with `VITE_API_URL=https://cura-ai-83af.onrender.com`
4. Deploy to Vercel CDN
5. Generate live URL: `https://cura-ai-xxx.vercel.app`

---

## ENVIRONMENT FILES EXPLAINED

### Development (Local)
**client/.env** (for local development)
```
VITE_API_URL=http://localhost:5000
```

### Production (Vercel)
**client/.env.production** (for Vercel build)
```
VITE_API_URL=https://cura-ai-83af.onrender.com
```

**Vite automatically uses `.env.production` when running `npm run build`**

---

## BACKEND CONFIGURATION

### Local Development (server/.env)
```
PORT=5000
MONGODB_URI=mongodb+srv://nishaddamale1010_db_user:...
CLIENT_ORIGIN=http://localhost:5173
CORS_ORIGIN=http://localhost:5173
JWT_SECRET=cura_health_ai_super_secret_key_2026
```

### Production (Render Dashboard)
Set these environment variables in Render:
```
PORT=5000
MONGODB_URI=<your-mongodb-uri>
CLIENT_ORIGIN=https://your-vercel-url.vercel.app
CORS_ORIGIN=https://your-vercel-url.vercel.app
JWT_SECRET=<secure-secret-key>
GEMINI_API_KEY=<your-key>
HF_API_KEY=<your-key>
GROQ_API_KEY=<your-key>
OPENROUTER_API_KEY=<your-key>
```

---

## DEPLOYMENT CHECKLIST

### Frontend (Client)
- ✅ `.env` → `http://localhost:5000` (dev)
- ✅ `.env.production` → `https://cura-ai-83af.onrender.com` (prod)
- ✅ `.gitignore` → excludes `.env` files
- ✅ `package.json` → build scripts configured
- ✅ No hardcoded URLs in source code

### Backend (Server)
- ✅ `.env` → local development configured
- ✅ MongoDB connected and tested
- ✅ CORS configured for localhost
- ✅ All routes working (200 responses)
- ✅ Running on port 5000

### Git Repository
- ✅ Code pushed to GitHub: `main` branch
- ✅ No secrets in git (`.gitignore` configured)
- ✅ Ready for Vercel import

---

## STEP-BY-STEP: DEPLOY TO VERCEL NOW

### 1. Verify Latest Code is Pushed
```bash
cd c:\Users\NISHAD\OneDrive\Desktop\Cura-AI
git status
git push origin main
```

### 2. Go to Vercel
https://vercel.com/dashboard

### 3. New Project
- Click **"Add New" → "Project"**
- Search for **"Cura-AI"**
- Click **"Import"**

### 4. Configure
- **Framework**: Vite
- **Root Directory**: `client`
- **Build Command**: `npm run build`
- **Output**: `dist`
- **Environment**: Add `VITE_API_URL=https://cura-ai-83af.onrender.com`

### 5. Deploy
Click **Deploy** and wait 2-3 minutes.

### 6. Test
- Visit your Vercel URL
- DevTools → Network
- Verify API calls go to backend
- Check for data loading

---

## LIVE URLs (After Deployment)

| Service | URL |
|---------|-----|
| **Frontend (Vercel)** | `https://cura-ai-xxx.vercel.app` |
| **Backend (Render)** | `https://cura-ai-83af.onrender.com` |
| **MongoDB** | `mongodb+srv://...` |

---

## ROLLBACK / CHANGES

**To redeploy after code changes**:
1. Push to GitHub: `git push origin main`
2. Vercel auto-deploys (or click Redeploy in dashboard)
3. ~2-3 minutes for new deployment

**To change API URL**:
1. Vercel → Project Settings → Environment Variables
2. Update `VITE_API_URL`
3. Redeploy

---

## TROUBLESHOOTING

### API Returns 401/403
- Check backend is running and MongoDB connected
- Verify CORS_ORIGIN matches your Vercel URL
- Test: `curl https://cura-ai-83af.onrender.com/api/dashboard/stats`

### API Returns 404
- Verify `VITE_API_URL` is correct in Vercel
- Check backend has correct routes
- Test locally: `curl http://localhost:5000/api/dashboard/stats`

### Build Fails on Vercel
- Check build logs in Vercel dashboard  
- Verify `package.json` has build script
- Ensure Node 18+ (check Vercel settings)

### CORS Error in Browser
- Backend needs: `CLIENT_ORIGIN=https://your-vercel-url.vercel.app`
- Update in Render dashboard
- Redeploy backend

---

## READY TO GO! 🚀

Everything is configured for Vercel deployment. Follow the "STEP-BY-STEP" section above and your app will be live in minutes!
