# Vercel Deployment Guide

This guide will help you deploy both the frontend (React) and backend (Express) to Vercel.

## Prerequisites

1. ✅ Vercel account (you mentioned you have one)
2. ✅ Git repository with your code pushed
3. ✅ MongoDB database (MongoDB Atlas free tier works great)
4. ✅ Environment variables ready

## Important Notes

### ⚠️ Limitations of Vercel Free Tier

1. **File Uploads**: Vercel serverless functions have an ephemeral filesystem. File uploads (like product images) won't persist. Consider using:
   - Cloud storage (AWS S3, Cloudinary, etc.)
   - MongoDB GridFS
   - External file storage service

2. **Execution Time**: Free tier has 10-second timeout for serverless functions. Pro tier has 60 seconds.

3. **Cold Starts**: Serverless functions may have cold starts (first request takes longer).

## Step-by-Step Deployment

### Step 1: Prepare Environment Variables

You'll need to set these in Vercel dashboard:

**Backend Environment Variables:**
- `MONGODB_URI` - Your MongoDB connection string
- `JWT_SECRET` - Your JWT secret key (use a strong random string)
- `JWT_EXPIRES_IN` - Token expiration (e.g., "1h")
- `FRONTEND_URL` - Your Vercel deployment URL (will be like `https://your-project.vercel.app`)
- `PORT` - Not needed for Vercel (optional)

### Step 2: Connect Your Git Repository to Vercel

1. Go to [vercel.com](https://vercel.com) and log in
2. Click "Add New..." → "Project"
3. Import your Git repository
4. Select your repository

### Step 3: Configure Project Settings

In the Vercel project settings:

1. **Framework Preset**: Select "Other" or "Create React App"
2. **Root Directory**: Leave as `./` (root of your repo)
3. **Build Command**: `cd frontend && npm run build` (or Vercel will auto-detect)
4. **Output Directory**: `frontend/build`
5. **Install Command**: `npm install --prefix backend && npm install --prefix frontend`

### Step 4: Add Environment Variables

1. In your Vercel project dashboard, go to **Settings** → **Environment Variables**
2. Add all the environment variables listed in Step 1
3. Make sure to add them for **Production**, **Preview**, and **Development** environments

### Step 5: Deploy

1. Click **Deploy** button
2. Vercel will:
   - Install dependencies
   - Build your frontend
   - Set up serverless functions
   - Deploy everything

### Step 6: Verify Deployment

1. After deployment completes, you'll get a URL like `https://your-project.vercel.app`
2. Visit the URL to see your frontend
3. Test API endpoints: `https://your-project.vercel.app/api/health`
4. Update `FRONTEND_URL` environment variable to your actual Vercel URL
5. Redeploy if you updated environment variables

## Project Structure for Vercel

```
mern-stack-2025/
├── api/
│   └── index.js          # Serverless function wrapper (auto-created)
├── backend/              # Backend Express app
├── frontend/             # React frontend
├── vercel.json           # Vercel configuration
└── package.json
```

## How It Works

1. **Frontend**: React app is built and served as static files
2. **Backend**: Express app runs as a serverless function at `/api/*`
3. **Routes**: 
   - `/api/*` → Serverless function (backend)
   - `/*` → Static files (frontend)

## Troubleshooting

### Database Connection Issues

- Make sure `MONGODB_URI` is correct
- Ensure MongoDB Atlas allows connections from anywhere (0.0.0.0/0) or add Vercel IPs
- Check Vercel function logs for connection errors

### CORS Errors

- Update `FRONTEND_URL` environment variable to your Vercel domain
- Redeploy after updating environment variables

### API Not Working

- Check that `/api/index.js` exists in the root
- Verify `vercel.json` routes are correct
- Check Vercel function logs

### Build Fails

- Check that all dependencies are in `package.json`
- Verify build commands are correct
- Check Vercel build logs for specific errors

## File Uploads (Important!)

Since Vercel has an ephemeral filesystem, uploaded files won't persist. You have two options:

### Option 1: Use Cloud Storage (Recommended)

Update your upload middleware to use:
- **Cloudinary** (free tier available)
- **AWS S3**
- **MongoDB GridFS**

### Option 2: Keep File Uploads Local for Development Only

For production, you MUST use cloud storage.

## Next Steps After Deployment

1. ✅ Test all API endpoints
2. ✅ Test authentication flow
3. ✅ Verify database connections
4. ✅ Set up custom domain (optional, available on Vercel)
5. ✅ Enable analytics (optional)
6. ✅ Set up environment-specific configurations

## Continuous Deployment

Once connected to Git, Vercel will automatically deploy:
- **Production**: Every push to `main`/`master` branch
- **Preview**: Every push to other branches (creates preview URLs)

## Support

- Vercel Docs: https://vercel.com/docs
- Vercel Discord: https://vercel.com/discord
- Check Vercel dashboard logs for detailed error messages

