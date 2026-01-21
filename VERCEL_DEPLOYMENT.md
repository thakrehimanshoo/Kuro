# Deploying Kuro to Vercel

This guide will help you deploy the Kuro PWA app to Vercel.

## Prerequisites

1. **GitHub Account**: Make sure your code is pushed to GitHub
2. **Vercel Account**: Sign up at [vercel.com](https://vercel.com) (free tier is perfect)

## Deployment Steps

### 1. Push Your Code to GitHub

Your code is already on branch `claude/build-kuro-pwa-app-FOXPL`. You should merge this to your main branch or deploy from this branch directly.

```bash
# Option A: Merge to main (recommended)
git checkout main
git merge claude/build-kuro-pwa-app-FOXPL
git push origin main

# Option B: Deploy from feature branch directly
# (You can select this branch in Vercel dashboard)
```

### 2. Connect to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **"Add New..."** → **"Project"**
3. Import your `Kuro` repository
4. Vercel will auto-detect Next.js settings

### 3. Configure Build Settings

Vercel should auto-detect these settings:

- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next` (auto-detected)
- **Install Command**: `npm install`

### 4. Environment Variables (Optional - Only if using Supabase)

If you want to enable authentication, add these environment variables:

1. Click **"Environment Variables"** in Vercel dashboard
2. Add the following (get values from your Supabase project):

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Note**: The app works perfectly WITHOUT these variables - it will run in offline-only mode.

### 5. Deploy

1. Click **"Deploy"**
2. Wait 2-3 minutes for the build to complete
3. You'll get a live URL like: `https://kuro-yourname.vercel.app`

### 6. Install as PWA on iPhone

Once deployed:

1. Open the Vercel URL in Safari on iPhone
2. Tap the **Share** button (square with arrow)
3. Scroll down and tap **"Add to Home Screen"**
4. Name it "Kuro" and tap **Add**
5. The app icon will appear on your home screen!

## Post-Deployment

### Automatic Deployments

Vercel automatically redeploys when you push to your connected branch:

```bash
# Make changes
git add .
git commit -m "Update feature"
git push

# Vercel auto-deploys in ~2 minutes
```

### Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

### Performance

Your Kuro PWA will have:
- ✅ Global CDN (fast worldwide)
- ✅ HTTPS by default
- ✅ Automatic compression
- ✅ Service worker caching (offline support)
- ✅ Installable on iOS Safari

## Enabling Supabase Authentication (Later)

If you want to add cloud sync later:

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL from `AUTHENTICATION_SETUP.md`
3. Add environment variables to Vercel:
   - Go to Project Settings → Environment Variables
   - Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Redeploy (Vercel → Deployments → Click "..." → Redeploy)

## Troubleshooting

### Build Fails

Check the build logs in Vercel. Common issues:
- Missing dependencies: Clear build cache in Vercel settings
- TypeScript errors: Run `npm run build` locally first

### PWA Not Installing

- Make sure you're using Safari on iOS
- The URL must be HTTPS (Vercel provides this automatically)
- Clear Safari cache if needed

### Authentication Not Working

- Check environment variables are set correctly
- Make sure Supabase project is configured (see AUTHENTICATION_SETUP.md)
- Check browser console for errors

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Test build locally: `npm run build && npm start`
3. Verify all files are committed to git

---

**You're all set!** Your Kuro Pomodoro PWA will be live and installable on any device. 🎉
