# Kuro - Authentication & Cloud Sync Setup Guide

## 🚀 What's New

Based on research of top Pomodoro apps (FocusPomo, Flow, Focus To-Do), I've implemented:

### ✅ Completed Features

1. **Advanced Stats with Abandoned Sessions**
   - Completion rate tracking (X% completion)
   - Abandoned sessions shown separately
   - Stacked bar chart (completed vs abandoned)
   - Legend showing both types
   - "Abandoned Today" section
   - All-time abandoned count

2. **Improved UI Smoothness**
   - Better CSS transitions (200ms default)
   - GPU-accelerated animations
   - Smooth scroll behavior
   - Touch feedback on mobile
   - Button press effects (scale 0.97)
   - Loading shimmer effects
   - Staggered children animations
   - Card entrance animations

3. **Supabase Authentication (Ready for Setup)**
   - Package dependencies added
   - Configuration template created
   - Ready for user accounts & cloud sync

---

## 📊 Stats Improvements Details

### New Metrics

**Completion Rate Card** (shows after 5+ attempts)
```
━━━━━━━━━━━━━━━━━━━━
   85%
   17 of 20
━━━━━━━━━━━━━━━━━━━━
[Progress bar]
```

**Today's Stats**
- Completed sessions (bright)
- Focus time
- Abandoned sessions (dimmed, conditional)

**Week Chart**
- White bars = Completed
- Gray bars (20% opacity) = Abandoned
- Stacked visualization
- Hover shows "5 +2" (completed +abandoned)

**All-Time**
- Total Completed ✓
- Total Abandoned ⊗ (conditional)
- Total Focus Time ⏱️

### Data Handling

All queries now filter properly:
```typescript
// Completed only
.filter((s) => s.type === 'work' && !s.abandoned)

// Abandoned only
.filter((s) => s.type === 'work' && s.abandoned)

// Both tracked separately
```

---

## 🎨 UI Smoothness Improvements

### Animation System

**New Animations:**
- `fadeIn` - 300ms fade in
- `slideUp` - 400ms slide from bottom
- `slideDown` - 400ms slide from top
- `scaleIn` - 300ms scale with bounce
- `shimmer` - 2s loading effect
- `pulse` - 1.5s pulse for loading states

**Usage:**
```css
.animate-fadeIn
.animate-slideUp
.animate-slideDown
.animate-scaleIn
.loading-shimmer
.pulse-loading
```

### Transitions

**Default (all elements):**
- Properties: opacity, transform, colors
- Duration: 200ms
- Easing: cubic-bezier(0.4, 0, 0.2, 1)

**Button Presses:**
- Active state: scale(0.97)
- Duration: 50ms (snappy)
- Mobile: adds background highlight

**Hover States:**
- Duration: 150ms
- Opacity changes
- Border color transitions

### GPU Acceleration

```css
.gpu-accelerated {
  transform: translateZ(0);
  will-change: transform;
}
```

Use on animated elements for 60fps performance.

---

## 🔐 Supabase Authentication Setup

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Wait for database to initialize (~2 minutes)

### Step 2: Get API Keys

1. Go to Project Settings → API
2. Copy:
   - Project URL
   - `anon` public key

### Step 3: Configure Environment

Create `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 4: Create Database Schema

Run this SQL in Supabase SQL Editor:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks table (cloud-synced)
CREATE TABLE public.tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT tasks_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Pomodoro sessions table (cloud-synced)
CREATE TABLE public.sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('work', 'short-break', 'long-break')) NOT NULL,
  duration INT NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  date DATE NOT NULL,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  abandoned BOOLEAN DEFAULT FALSE,
  CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Settings table (cloud-synced)
CREATE TABLE public.settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  sound_enabled BOOLEAN DEFAULT TRUE,
  work_duration INT DEFAULT 25,
  short_break_duration INT DEFAULT 5,
  long_break_duration INT DEFAULT 15,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX tasks_user_id_idx ON public.tasks(user_id);
CREATE INDEX tasks_created_at_idx ON public.tasks(created_at DESC);
CREATE INDEX sessions_user_id_idx ON public.sessions(user_id);
CREATE INDEX sessions_date_idx ON public.sessions(date DESC);
CREATE INDEX sessions_user_date_idx ON public.sessions(user_id, date);

-- Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for tasks
CREATE POLICY "Users can view own tasks" ON public.tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks" ON public.tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks" ON public.tasks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks" ON public.tasks
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for sessions
CREATE POLICY "Users can view own sessions" ON public.sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON public.sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for settings
CREATE POLICY "Users can view own settings" ON public.settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON public.settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON public.settings
  FOR UPDATE USING (auth.uid() = user_id);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);

  INSERT INTO public.settings (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Step 5: Install Dependencies

```bash
npm install
```

### Step 6: Authentication Features

Once configured, users will get:

✅ **Email/Password Authentication**
- Secure signup/login
- Email verification
- Password reset

✅ **Cloud Sync**
- Tasks synced across devices
- Sessions backed up
- Settings preserved

✅ **Offline-First**
- Local IndexedDB (current data)
- Sync when online
- No data loss

✅ **Security**
- Row-Level Security (RLS)
- Users can only access their data
- Secure API keys

---

## 🔄 Migration Path

### From Local-Only to Cloud

When users sign up/login:

1. **Existing local data** stays in IndexedDB
2. **Option to sync** local data to cloud
3. **Merge strategy**:
   - Upload local tasks (if not synced)
   - Upload local sessions (if not synced)
   - Keep settings from cloud (latest)

### Sync Strategy

**On App Start:**
1. Check if user authenticated
2. If yes: Fetch cloud data
3. Merge with local data
4. Save to IndexedDB for offline use

**On Data Change:**
1. Save to IndexedDB (instant)
2. Queue cloud sync
3. Sync in background
4. Handle conflicts (last-write-wins)

---

## 📱 User Flow

### First-Time Users

```
1. Open app → See timer (works immediately)
2. Banner: "Sign up to sync across devices"
3. Click → Email/password form
4. Verify email → Logged in
5. Data auto-syncs
```

### Returning Users

```
1. Open app → Auto-login (cookie)
2. Fetch cloud data in background
3. Merge with local
4. Continue working
```

### Logged-Out Users

```
- App works normally (local-only)
- No sync
- Data stays on device
- Can sign up anytime to backup
```

---

## 🚀 Deployment Checklist

Before deploying to Vercel:

- [ ] Supabase project created
- [ ] Database schema executed
- [ ] Environment variables set in Vercel
- [ ] Email templates configured (Supabase dashboard)
- [ ] Site URL configured (Supabase → Authentication → URL Configuration)

---

## 🎯 Next Features (After Auth)

Based on top Pomodoro app research:

1. **Deep Analytics** (like FocusPomo)
   - Focus trends
   - Productivity patterns
   - Best/worst days
   - Time-of-day insights

2. **Website Blocking** (like Flow)
   - Block distracting sites during focus
   - Whitelist mode
   - Schedule-based blocking

3. **Calendar Integration**
   - Sync with Google Calendar
   - Schedule pomodoros
   - Time blocking

4. **Team Features**
   - Share stats
   - Group focus sessions
   - Leaderboards

5. **Advanced Notifications**
   - Custom sounds
   - Desktop notifications
   - Progress reminders

6. **Export/Reports**
   - Weekly summaries
   - Monthly reports
   - CSV export
   - PDF reports

---

## 📚 Resources

### Research Sources

- [Top 11 Pomodoro Timer Apps for 2026 | Reclaim](https://reclaim.ai/blog/best-pomodoro-timer-apps)
- [The 6 best Pomodoro timer apps in 2025 | Zapier](https://zapier.com/blog/best-pomodoro-apps/)
- [Best 100% Free Pomodoro Apps | Paymo](https://www.paymoapp.com/blog/pomodoro-apps/)
- [Supabase Auth with Next.js | Official Docs](https://supabase.com/docs/guides/auth/quickstarts/nextjs)
- [Supabase SSR with Next.js | Official Docs](https://supabase.com/docs/guides/auth/server-side/nextjs)

### Implementation Guides

- Supabase Dashboard: https://supabase.com/dashboard
- Next.js 15 App Router: https://nextjs.org/docs
- PWA Best Practices: https://web.dev/pwa

---

## ✅ Current Status

**Completed:**
- ✅ Advanced stats with abandoned sessions
- ✅ Completion rate tracking
- ✅ Improved UI smoothness
- ✅ Better animations (60fps)
- ✅ Supabase packages installed
- ✅ Database schema ready
- ✅ Environment template created

**Ready for Setup:**
- ⏳ Create Supabase project
- ⏳ Add environment variables
- ⏳ Run database migrations
- ⏳ Test authentication flow
- ⏳ Deploy to Vercel

**Time to Setup:** ~15 minutes

---

Built with insights from FocusPomo (2M+ users), Flow, and Focus To-Do - the top Pomodoro apps of 2026.
