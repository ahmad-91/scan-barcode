# Vercel Deployment Guide

This guide will help you deploy the Barcode Scanner app to Vercel.

## Prerequisites

- A Vercel account ([sign up here](https://vercel.com/signup))
- A GitHub account (optional, for Git-based deployment)
- Your RapidAPI key from [Big Product Data API](https://rapidapi.com/bigproductdata/api/big-product-data)

## Quick Start

### Method 1: Deploy via Vercel Dashboard (Recommended)

1. **Prepare your code:**
   - Make sure all your code is committed to a Git repository (GitHub, GitLab, or Bitbucket)

2. **Import to Vercel:**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New Project"
   - Import your Git repository
   - Vercel will auto-detect it's a Create React App project

3. **Configure Environment Variables:**
   - Before deploying, go to "Environment Variables" section
   - Add the following variable:
     - **Name:** `REACT_APP_RAPIDAPI_KEY`
     - **Value:** Your RapidAPI key
     - **Environments:** Select all (Production, Preview, Development)
   - Click "Save"

4. **Deploy:**
   - Click "Deploy"
   - Wait for the build to complete
   - Your app will be live at `https://your-project.vercel.app`

### Method 2: Deploy via Vercel CLI

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel
   ```
   - Follow the prompts
   - When asked about environment variables, you can add them later in the dashboard

4. **Set Environment Variables:**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Select your project
   - Go to Settings → Environment Variables
   - Add `REACT_APP_RAPIDAPI_KEY` with your RapidAPI key
   - Redeploy: `vercel --prod`

## Environment Variables

The following environment variable is required:

| Variable | Description | Where to get it |
|----------|-------------|----------------|
| `REACT_APP_RAPIDAPI_KEY` | Your RapidAPI authentication key | [RapidAPI Dashboard](https://rapidapi.com/developer/billing) |

**Important:** 
- Environment variables must be set in Vercel Dashboard, not in `.env` files
- After adding environment variables, you need to redeploy for changes to take effect

## Project Configuration

The project includes:
- ✅ `vercel.json` - Configured for SPA routing and caching
- ✅ Build command: `npm run build`
- ✅ Output directory: `build`
- ✅ Framework: Create React App (auto-detected)

## Post-Deployment Checklist

- [ ] Environment variable `REACT_APP_RAPIDAPI_KEY` is set
- [ ] App is accessible via HTTPS (automatic on Vercel)
- [ ] Test camera access on mobile device
- [ ] Test barcode scanning functionality
- [ ] Verify API calls are working

## Troubleshooting

### Build Fails
- Check that all dependencies are in `package.json`
- Ensure Node.js version is 18+ (specified in `package.json`)

### Camera Not Working
- Verify the app is accessed via HTTPS (Vercel provides this automatically)
- Check browser console for camera permission errors
- Ensure you've granted camera permissions in your browser

### API Errors
- Verify `REACT_APP_RAPIDAPI_KEY` is set correctly in Vercel
- Check RapidAPI subscription is active
- Review API rate limits in RapidAPI dashboard

### 404 Errors on Refresh
- The `vercel.json` includes rewrites for SPA routing
- If issues persist, verify `vercel.json` is in the root directory

## Custom Domain (Optional)

1. Go to your project in Vercel Dashboard
2. Navigate to Settings → Domains
3. Add your custom domain
4. Follow DNS configuration instructions

## Continuous Deployment

Vercel automatically deploys:
- **Production:** Every push to your main/master branch
- **Preview:** Every push to other branches or pull requests

Each deployment gets a unique URL for preview deployments.

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Discord](https://vercel.com/discord)
- [Create React App Documentation](https://create-react-app.dev/)



