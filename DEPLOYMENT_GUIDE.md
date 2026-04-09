# Cura AI - Deployment Guide

## Current Setup
- **Backend (Live)**: https://cura-ai-83af.onrender.com
- **Frontend**: Ready for deployment

## Frontend Deployment (Render, Vercel, or Netlify)

### Option 1: Deploy to Render

1. **Create Render Account** at https://render.com
2. **Create New Static Site**:
   - Connect GitHub repository
   - Build command: `npm install && npm run build`
   - Publish directory: `dist`
   - Environment variables: None needed (uses .env)

3. **Configure Environment**:
   ```
   VITE_API_URL=https://cura-ai-83af.onrender.com
   ```

4. **Deploy**: Render auto-deploys on Git push

### Option 2: Deploy to Vercel

1. **Create Vercel Account** at https://vercel.com
2. **Import Project**:
   - Connect GitHub repository
   - Framework: Vite
   - Root directory: `client`

3. **Environment Variables**:
   ```
   VITE_API_URL=https://cura-ai-83af.onrender.com
   ```

4. **Deploy**: Auto-deploys on Git push

### Option 3: Deploy to Netlify

1. **Create Netlify Account** at https://netlify.com
2. **Connect Repository**:
   - Base directory: `client`
   - Build command: `npm run build`
   - Publish directory: `dist`

3. **Environment Variables**:
   ```
   VITE_API_URL=https://cura-ai-83af.onrender.com
   ```

## Server Configuration for Production

Your Render backend already has:
- ✅ MongoDB Atlas connected
- ✅ CORS configured
- ✅ JWT authentication
- ✅ Environment variables set

### Update Backend CORS (if frontend domain changes):

In Server Dashboard → Environment Variables:
```
CLIENT_ORIGIN=https://your-frontend-domain.com
FRONTEND_ORIGIN=https://your-frontend-domain.com
CORS_ORIGIN=https://your-frontend-domain.com
```

## Testing Deployment

1. **Build locally**:
   ```bash
   cd client
   npm run build
   npm run preview
   ```

2. **Test API calls**:
   - Open DevTools → Network tab
   - Verify requests go to: `https://cura-ai-83af.onrender.com/api/*`
   - Check for 200 responses

3. **Check CORS errors**: None should appear in Console

## Environment Files

### Client (.env)
```
VITE_API_URL=https://cura-ai-83af.onrender.com
```

### Server (.env)
```
PORT=5000
MONGODB_URI=<your-mongodb-uri>
CLIENT_ORIGIN=http://localhost:5173
FRONTEND_ORIGIN=http://localhost:5173
JWT_SECRET=<your-secret-key>
```

## Production Checklist

✅ Backend API running: https://cura-ai-83af.onrender.com
✅ Client uses environment variables for API URL
✅ CORS properly configured
✅ JWT authentication configured
✅ MongoDB connected
✅ All API routes return data (non-protected endpoints public)

## Next Steps

1. Choose deployment platform (Render/Vercel/Netlify)
2. Connect GitHub repository
3. Set environment variables
4. Deploy and test
5. Verify API connectivity from deployed frontend

## Troubleshooting

- **CORS errors**: Check CLIENT_ORIGIN in server .env
- **API 404 errors**: Verify VITE_API_URL is correct
- **Auth issues**: Ensure JWT_SECRET matches between dev and prod
- **MongoDB connection**: Verify MONGODB_URI is accessible
