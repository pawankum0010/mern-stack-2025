# Quick Start: Deploy to Vercel

## ✅ What's Already Done

1. ✅ Created `/api/index.js` - Serverless function wrapper for your Express backend
2. ✅ Updated `vercel.json` - Configuration for monorepo deployment
3. ✅ Updated frontend API client - Uses relative URLs in production
4. ✅ Created deployment guide - See `VERCEL_DEPLOYMENT.md` for details

## 🚀 Quick Deployment Steps

### 1. Push to Git (if not already done)
```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push
```

### 2. Go to Vercel Dashboard
1. Visit [vercel.com](https://vercel.com)
2. Click **"Add New..."** → **"Project"**
3. Import your Git repository

### 3. Configure Project
- **Framework Preset**: Other (or Create React App)
- **Root Directory**: `./` (leave as is)
- Vercel should auto-detect the settings from `vercel.json`

### 4. Add Environment Variables
Go to **Settings** → **Environment Variables** and add:

```
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=1h
FRONTEND_URL=https://your-project.vercel.app
```

**Note**: Update `FRONTEND_URL` after first deployment with your actual Vercel URL.

### 5. Deploy!
Click **Deploy** and wait for it to complete.

### 6. Test
- Frontend: `https://your-project.vercel.app`
- API Health: `https://your-project.vercel.app/api/health`

## ⚠️ Important: File Uploads

Vercel serverless functions **cannot store files permanently**. Your product image uploads won't work on Vercel free tier.

**Solutions:**
- Use Cloudinary (free tier available) for image uploads
- Use AWS S3 or other cloud storage
- Deploy backend separately on Railway/Render for file uploads

## 📝 Next Steps

1. After first deployment, update `FRONTEND_URL` env var with your actual URL
2. Redeploy after updating environment variables
3. Test all features
4. Consider migrating file uploads to cloud storage

For detailed instructions, see `VERCEL_DEPLOYMENT.md`







