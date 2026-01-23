# Kuro - Deployment Guide

Complete guide to deploy Kuro (Pomodoro Timer + Task Manager + Notion-like Notes) to production.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Deployment Options](#deployment-options)
4. [Environment Setup](#environment-setup)
5. [Database Migration](#database-migration)
6. [Post-Deployment](#post-deployment)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying, ensure you have:

- **Node.js** 18.x or higher
- **npm** or **yarn**
- **Git**
- A **Supabase** account (for auth)
- A hosting platform account (Vercel, Netlify, or similar)

---

## Quick Start

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/yourusername/Kuro.git
cd Kuro

# Install dependencies
npm install

# Test locally
npm run dev
```

Visit `http://localhost:3000` to verify everything works.

### 2. Build for Production

```bash
# Create optimized production build
npm run build

# Test production build locally
npm start
```

---

## Deployment Options

Kuro can be deployed to multiple platforms. Choose the one that fits your needs:

### Option 1: Vercel (Recommended) ⭐

**Why Vercel?**
- Built for Next.js (zero config)
- Automatic deployments
- Edge network (fast globally)
- Free tier generous
- Preview deployments

**Steps:**

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login and Deploy**
   ```bash
   vercel login
   vercel
   ```

3. **Follow Prompts**
   - Link to existing project or create new
   - Set project name
   - Configure build settings (auto-detected)

4. **Production Deployment**
   ```bash
   vercel --prod
   ```

**Vercel Dashboard:**
- Visit: https://vercel.com/dashboard
- Configure domain
- Add environment variables
- Monitor analytics

---

### Option 2: Netlify

**Steps:**

1. **Push to GitHub/GitLab**
   ```bash
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Connect to Netlify**
   - Go to https://app.netlify.com
   - Click "New site from Git"
   - Select your repository

3. **Build Settings**
   ```
   Build command: npm run build
   Publish directory: .next
   ```

4. **Deploy**
   - Click "Deploy site"
   - Netlify auto-deploys on every push

---

### Option 3: Docker + Self-Hosted

**Dockerfile:**

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

**Deploy:**

```bash
# Build image
docker build -t kuro .

# Run container
docker run -p 3000:3000 kuro
```

---

### Option 4: Railway

**Steps:**

1. Install Railway CLI:
   ```bash
   npm i -g @railway/cli
   ```

2. Login and deploy:
   ```bash
   railway login
   railway init
   railway up
   ```

3. Add domain in Railway dashboard

---

## Environment Setup

### Supabase Configuration

1. **Create Supabase Project**
   - Go to https://supabase.com
   - Create new project
   - Copy credentials

2. **Create `.env.local`**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

3. **Set Environment Variables on Host**
   - **Vercel**: Settings → Environment Variables
   - **Netlify**: Site settings → Build & deploy → Environment
   - **Docker**: Use `-e` flag or `docker-compose.yml`

### Environment Variables

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Optional
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

---

## Database Migration

Kuro uses **IndexedDB** (client-side), so no server database setup needed!

### Automatic Migration

On first load, Kuro auto-migrates data:
- **v1**: Tasks + Sessions + Settings
- **v2**: Journal (deprecated)
- **v3**: Notebooks + Notes + Tags + Templates

### Manual Reset (if needed)

Open browser console:
```javascript
// Clear all data
indexedDB.deleteDatabase('KuroDB');
location.reload();
```

---

## Post-Deployment

### 1. Custom Domain

**Vercel:**
```bash
vercel domains add yourdomain.com
```

Then add DNS records:
```
Type: CNAME
Name: @
Value: cname.vercel-dns.com
```

**Netlify:**
- Settings → Domain management → Add custom domain
- Follow DNS instructions

### 2. SSL Certificate

**Automatic** on Vercel and Netlify! ✅

### 3. Analytics (Optional)

**Vercel Analytics:**
```bash
npm i @vercel/analytics
```

In `app/layout.tsx`:
```typescript
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### 4. Progressive Web App (PWA)

Kuro is PWA-ready! Users can install it:
- **Desktop**: Browser menu → Install Kuro
- **Mobile**: Share menu → Add to Home Screen

---

## Build Optimization

### Next.js Config (`next.config.ts`)

Already optimized with:
```typescript
{
  swcMinify: true,                    // Fast minification
  compiler: { removeConsole: true },  // Remove console.logs
  images: { domains: [...] },         // Image optimization
}
```

### Bundle Analysis

```bash
npm run build -- --profile
```

---

## Monitoring

### Check Deployment Status

**Vercel:**
```bash
vercel ls
```

**Netlify:**
```bash
netlify status
```

### View Logs

**Vercel:**
```bash
vercel logs
```

**Netlify:**
- Dashboard → Deploys → [Your deploy] → Deploy log

---

## Troubleshooting

### Build Fails

**Error: Module not found**
```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm install
npm run build
```

**Error: Out of memory**
```bash
# Increase Node memory
NODE_OPTIONS=--max_old_space_size=4096 npm run build
```

### Runtime Issues

**IndexedDB not working**
- Check browser compatibility (95%+ supported)
- Ensure HTTPS (required for PWA features)
- Clear browser cache

**Auth not working**
- Verify Supabase environment variables
- Check Supabase auth settings
- Ensure redirect URLs are configured

### Performance Issues

**Slow initial load**
- Enable Vercel Edge Network
- Check bundle size: `npm run build`
- Lazy load heavy components

**Database queries slow**
- IndexedDB is fast locally
- Check for large note content
- Consider pagination for 1000+ notes

---

## CI/CD Setup

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run build
      - run: vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
```

---

## Security Checklist

- [ ] Environment variables not committed
- [ ] Supabase RLS policies enabled
- [ ] HTTPS enforced
- [ ] CSP headers configured
- [ ] Rate limiting on API routes
- [ ] Regular dependency updates

---

## Backup Strategy

Since Kuro uses IndexedDB (client-side), data is local to each user's browser.

### Export Feature (Future)
```typescript
// Export all data to JSON
const backup = {
  notebooks: await db.notebooks.toArray(),
  notes: await db.notes.toArray(),
  tasks: await db.tasks.toArray(),
  sessions: await db.sessions.toArray(),
};
downloadJSON(backup, 'kuro-backup.json');
```

---

## Scaling

Kuro scales automatically because:
- **Client-side rendering**: No server load
- **IndexedDB**: No database costs
- **Edge deployment**: Fast globally
- **Static generation**: CDN-friendly

---

## Cost Estimation

**Free tier (Vercel):**
- 100GB bandwidth/month
- 1000 builds/month
- Unlimited team members
- **Total: $0/month** ✅

**Supabase:**
- Auth: 50,000 MAU free
- Database: 500MB free
- **Total: $0/month** ✅

**Domain (optional):**
- ~$10-15/year

---

## Support & Updates

### Stay Updated

```bash
# Pull latest changes
git pull origin main

# Update dependencies
npm update

# Redeploy
vercel --prod
```

### Community

- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Twitter**: @kurotimer

---

## Quick Commands Reference

```bash
# Development
npm run dev              # Start dev server
npm run build            # Production build
npm start                # Run production locally

# Deployment
vercel                   # Deploy to Vercel
vercel --prod            # Deploy to production
netlify deploy --prod    # Deploy to Netlify

# Maintenance
npm update               # Update dependencies
npm audit fix            # Fix security issues
rm -rf .next             # Clear build cache
```

---

## Success Metrics

After deployment, monitor:
- **Load time**: < 2 seconds
- **Build time**: < 2 minutes
- **Bundle size**: < 300KB
- **Lighthouse score**: > 90

---

## Next Steps

1. ✅ Deploy to Vercel/Netlify
2. ✅ Configure custom domain
3. ✅ Set up Supabase auth
4. ✅ Enable PWA install
5. ✅ Share with users!

---

**Congratulations! Kuro is now live! 🎉**

Visit your deployed app and start being productive!
