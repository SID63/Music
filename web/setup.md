# 🚀 Quick Setup Checklist

## ✅ **Step 1: Create Supabase Project**
- [ ] Go to [supabase.com](https://supabase.com)
- [ ] Click "New Project"
- [ ] Enter project name: `music-connect`
- [ ] Set database password
- [ ] Choose region
- [ ] Wait for project to be ready

## ✅ **Step 2: Get API Keys**
- [ ] Go to **Settings** → **API**
- [ ] Copy **Project URL**
- [ ] Copy **anon public** key

## ✅ **Step 3: Create .env File**
- [ ] Create `web/.env` file
- [ ] Add your Supabase URL and key:
```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## ✅ **Step 4: Run Database Schema**
- [ ] Go to **SQL Editor** in Supabase
- [ ] Click **New Query**
- [ ] Copy contents of `supabase/schema.sql`
- [ ] Click **Run**

## ✅ **Step 5: Test the App**
- [ ] Run `npm run dev`
- [ ] Sign up as a new user
- [ ] Go to `/profile` and create profile
- [ ] Check that profile appears in database

## 🔍 **Verify Setup**
- [ ] Check **Table Editor** in Supabase - should see `profiles`, `events`, etc.
- [ ] Check **Authentication** → **Users** - should see your user
- [ ] Check **Table Editor** → **profiles** - should see your profile

## 🐛 **If Tables Are Empty**
1. **Check .env file** - make sure credentials are correct
2. **Verify schema ran** - check Table Editor for tables
3. **Check console logs** - look for profile creation errors
4. **Try creating profile manually** - use the "Create Profile" button

## 📞 **Need Help?**
- Check browser console for error messages
- Verify Supabase project is active
- Make sure you're using the correct project credentials
