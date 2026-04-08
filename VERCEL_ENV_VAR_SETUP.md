# VERCEL ENVIRONMENT VARIABLE - DETAILED FIX

## The Problem
Frontend is still using `localhost:5000` instead of the live backend URL.

**This means**: `VITE_API_URL` environment variable is NOT SET in Vercel.

---

## VERIFICATION: Check if Vercel Has the Variable Set

### Quick Test:
1. Open: https://cura-ai-nine.vercel.app
2. Open DevTools → Console
3. Paste: `console.log(import.meta.env.VITE_API_URL)`
4. **If it shows `undefined`**: Variable is NOT set ❌
5. **If it shows URL**: Variable IS set ✅

---

## STEP-BY-STEP: Set Environment Variable in Vercel (EXACT STEPS)

### Step 1: Go to Vercel Dashboard
- URL: https://vercel.com/dashboard
- Log in with GitHub

### Step 2: Select Project
1. Find **"cura-ai"** in the list
2. Click on it to open project

### Step 3: Open Settings
1. Click **"Settings"** tab (top menu bar)
2. Look for left sidebar
3. Click **"Environment Variables"**

### Step 4: Add New Variable
1. Click **"Add New"** button
2. **Name field**: Type exactly: `VITE_API_URL`
3. **Value field**: Type exactly: `https://cura-ai-83af.onrender.com`
4. **Environments dropdown**: Click and select ALL THREE:
   - ☑️ Production
   - ☑️ Preview  
   - ☑️ Development
5. Click **"Save"** or **"Add"** button

### Step 5: Verify Variable is Saved
- You should see: `VITE_API_URL` listed with value `https://cura-ai-83af.onrender.com`
- All 3 environment badges should show

---

## STEP 6: Redeploy (CRITICAL!)

**Just setting the variable is NOT enough - you MUST redeploy:**

1. Go to **"Deployments"** tab
2. Find the latest deployment (top of list)
3. Click **"..."** (three dots menu)
4. Click **"Redeploy"**
5. A dialog will appear
6. Leave all settings as default
7. Click **"Redeploy"** button
8. Watch for green checkmark (takes 2-3 minutes)

---

## STEP 7: CLEAR BROWSER CACHE

After redeploy completes:
1. Open: https://cura-ai-nine.vercel.app
2. Press **Ctrl+Shift+Delete** (Windows) or **Cmd+Shift+Delete** (Mac)
3. Select "All time"
4. Click "Clear data"
5. Refresh page: **Ctrl+R** or **Cmd+R**

---

## VERIFY THE FIX

1. Open: https://cura-ai-nine.vercel.app/login
2. Open DevTools → **Console** tab
3. Paste: `console.log(import.meta.env.VITE_API_URL)`
4. Should show: `https://cura-ai-83af.onrender.com` ✅

5. Try to login:
   - Email: nishadamale1010@gmail.com
   - Password: (your password)
6. No more CORS error! ✅

---

## BACKEND CORS - Verify It's Set

Go to: https://dashboard.render.com
- Service: **cura-ai-server**
- Click **Settings**
- Find **Environment** section
- Verify:
  - `CLIENT_ORIGIN` = `https://cura-ai-nine.vercel.app`
  - `CORS_ORIGIN` = `https://cura-ai-nine.vercel.app`

If values are different, update them and save. Backend will auto-redeploy.

---

## TROUBLESHOOTING

### Still seeing `localhost:5000` error?
- [ ] Did you add the environment variable?
- [ ] Did you select ALL THREE environments?
- [ ] Did you click Redeploy?
- [ ] Did you wait 3 minutes for deployment?
- [ ] Did you clear browser cache?
- [ ] Is Vercel deployment showing green checkmark?

### Check Vercel Build Logs
1. Go to Deployments
2. Click the latest deployment
3. Click **"View Build Logs"**
4. Search for: `VITE_API_URL`
5. Should show: `VITE_API_URL https://cura-ai-83af.onrender.com`

If not found, variable wasn't picked up - set it again and redeploy.

### Test Backend is Working
```bash
curl https://cura-ai-83af.onrender.com/api/dashboard/stats
```
Should return JSON data (not 404 or CORS error).

---

## IF NOTHING WORKS: Nuclear Option

1. Vercel Dashboard → Project Settings → Delete from Vercel
2. Push code to GitHub: `git push origin main`
3. Vercel Dashboard → "Add New" → "Project"
4. Import GitHub repo again
5. **Before deploying**, set environment:
   - `VITE_API_URL=https://cura-ai-83af.onrender.com`
6. Deploy

---

## EXPECTED RESULT

✅ Frontend loads without errors
✅ Can navigate to login page
✅ API calls go to: `https://cura-ai-83af.onrender.com/api/*`
✅ Login works
✅ Dashboard displays with charts

---

## DO THIS NOW (Takes 5 minutes):

1. ✅ Set `VITE_API_URL` in Vercel Environment Variables
2. ✅ Select ALL THREE environments
3. ✅ Redeploy
4. ✅ Wait 3 minutes
5. ✅ Clear cache and refresh
6. ✅ Test login

**Report back your results!**
