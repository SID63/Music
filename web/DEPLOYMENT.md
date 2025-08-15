# Deployment Guide - GitHub to Vercel

## Step 1: Prepare Your Repository

1. **Initialize Git** (if not already done):
```bash
cd web
git init
git add .
git commit -m "Initial commit"
```

2. **Create GitHub Repository**:
   - Go to [GitHub.com](https://github.com)
   - Click "New repository"
   - Name it something like `music-connect-app`
   - Don't initialize with README (you already have one)
   - Click "Create repository"

3. **Push to GitHub**:
```bash
git remote add origin https://github.com/YOUR_USERNAME/music-connect-app.git
git branch -M main
git push -u origin main
```

## Step 2: Deploy to Vercel

1. **Go to Vercel**:
   - Visit [vercel.com](https://vercel.com)
   - Sign up/Login with your GitHub account

2. **Import Project**:
   - Click "New Project"
   - Select "Import Git Repository"
   - Choose your `music-connect-app` repository
   - Click "Import"

3. **Configure Project**:
   - **Framework Preset**: Vite
   - **Root Directory**: `web` (since your project is in the web folder)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. **Environment Variables**:
   - Add these environment variables:
     - `VITE_SUPABASE_URL` = Your Supabase project URL
     - `VITE_SUPABASE_ANON_KEY` = Your Supabase anonymous key

5. **Deploy**:
   - Click "Deploy"
   - Wait for build to complete

## Step 3: Post-Deployment

1. **Test Your App**:
   - Visit your Vercel URL
   - Test all major functionality
   - Check that Supabase connection works

2. **Custom Domain** (Optional):
   - In Vercel dashboard, go to "Settings" → "Domains"
   - Add your custom domain

3. **Environment Variables** (if you forgot):
   - Go to "Settings" → "Environment Variables"
   - Add your Supabase credentials

## Troubleshooting

### Build Errors
- Check that all dependencies are in `package.json`
- Ensure TypeScript compilation passes locally
- Check Vercel build logs for specific errors

### Environment Variables
- Make sure they're exactly named: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Redeploy after adding environment variables

### Supabase Connection
- Verify your Supabase project is active
- Check that your anon key is correct
- Ensure your Supabase project allows connections from your Vercel domain

## Continuous Deployment

Once set up, Vercel will automatically:
- Deploy on every push to `main` branch
- Create preview deployments for pull requests
- Roll back to previous versions if needed

## Useful Commands

```bash
# Test build locally
npm run build

# Preview production build
npm run preview

# Check for TypeScript errors
npx tsc --noEmit

# Lint code
npm run lint
```
