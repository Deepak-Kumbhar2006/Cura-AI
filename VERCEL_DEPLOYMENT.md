# Deploy Cura AI Frontend to Vercel

## Prerequisites
- GitHub account with repository pushed
- Vercel account (free at vercel.com)
- Live backend: https://cura-ai-83af.onrender.com

## Step-by-Step Deployment

### Step 1: Push Code to GitHub
```bash
cd c:\Users\NISHAD\OneDrive\Desktop\Cura-AI
git add .
git commit -m "Deploy ready: client configured for vercel"
git push origin main
```

### Step 2: Create Vercel Account
1. Go to https://vercel.com/signup
2. Sign up with GitHub account
3. Authorize Vercel to access your repositories

### Step 3: Import Project to Vercel
1. Go to https://vercel.com/dashboard
2. Click **"Add New..." → "Project"**
3. Select your Cura-AI repository
4. Click **"Import"**

### Step 4: Configure Build Settings
**In the "Configure Project" page:**

- **Framework Preset**: Select `Next.js` → Change to `Vite`
- **Root Directory**: `client` (or `./client`)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Step 5: Add Environment Variables
1. In the Project Settings page, scroll to **"Environment Variables"**
2. Add new variable:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://cura-ai-83af.onrender.com`
   - **Environments**: Select All (Production, Preview, Development)
3. Click **"Add"**

### Step 6: Deploy
1. Click **"Deploy"** button
2. Wait for deployment to complete (usually 2-3 minutes)
3. You'll get a live URL like: `https://cura-ai-xxx.vercel.app`

### Step 7: Verify Deployment
1. Open your Vercel deployment URL
2. Open DevTools → **Network** tab
3. Click a button that makes an API call (e.g., view dashboard)
4. Verify API requests go to: `https://cura-ai-83af.onrender.com/api/*`
5. Check for **200 responses** (not 403/401)

---

## Automatic Deployments

After initial setup, Vercel automatically deploys when:
- You push to `main` branch
- You create a pull request (creates preview deployment)
- You click **"Redeploy"** in Vercel dashboard

---

## Environment Variables Reference

| Variable | Value | Purpose |
|----------|-------|---------|
| `VITE_API_URL` | `https://cura-ai-83af.onrender.com` | Backend API endpoint |

---

## Troubleshooting

### CORS Errors in Console
**Issue**: API calls fail with CORS error
**Solution**: 
1. Backend CORS might be misconfigured
2. Check server `.env` has: `CLIENT_ORIGIN=https://your-vercel-url.vercel.app`
3. Contact backend admin to update CORS

### API 404 Errors
**Issue**: Getting 404 on API calls
**Solution**: 
1. Verify `VITE_API_URL` is set correctly in Vercel
2. Check backend is running and accessible
3. Try: `curl https://cura-ai-83af.onrender.com/healthz`

### Build Fails
**Issue**: Deployment fails during build
**Solution**:
1. Check build logs in Vercel dashboard
2. Verify `package.json` has correct scripts
3. Ensure Node version compatible (use Node 18+ recommended)

### Environment Variables Not Loaded
**Issue**: Getting undefined for `import.meta.env.VITE_API_URL`
**Solution**:
1. Variables must start with `VITE_` (Vite requirement)
2. Redeploy after adding/changing variables
3. Wait 5-10 seconds after updating in Vercel

---

## After Deployment

1. **Share your live URL**: `https://your-cura-ai.vercel.app`
2. **Monitor**: Vercel dashboard shows real-time deployment logs
3. **Rollback**: Click "Deployments" → Previous version → "Promote to Production"

---

## Dashboard Features Available
✅ Dashboard Overview with charts
✅ Disease Trends visualization
✅ Disease Distribution pie chart
✅ Real-time data fetching from backend
✅ Responsive design for mobile/tablet

---

## Next Steps
1. Deploy frontend to Vercel (this guide)
2. Test the live deployment
3. Share the live URL with team
4. Monitor performance in Vercel Analytics

**Live Frontend URL** (after deployment): `https://cura-ai-xxx.vercel.app`
**Live Backend URL** (already deployed): `https://cura-ai-83af.onrender.com`
