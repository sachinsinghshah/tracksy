# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. Install Dependencies (Already Done ✅)

```bash
npm install
```

### 2. Set Up Environment Variables

Create `.env.local` file:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Resend
RESEND_API_KEY=re_xxxxxxxx

# Security
CRON_SECRET=your_random_secret_here

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Set Up Supabase Database

Go to your Supabase project → SQL Editor → Run this:

```sql
-- Create products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT,
  current_price DECIMAL(10, 2),
  original_price DECIMAL(10, 2),
  target_price DECIMAL(10, 2),
  image_url TEXT,
  site TEXT NOT NULL,
  last_checked TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create price_history table
CREATE TABLE price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  price DECIMAL(10, 2) NOT NULL,
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create alerts table
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  old_price DECIMAL(10, 2) NOT NULL,
  new_price DECIMAL(10, 2) NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email_sent BOOLEAN DEFAULT false
);

-- Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for products
CREATE POLICY "Users can view their own products"
  ON products FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own products"
  ON products FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own products"
  ON products FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own products"
  ON products FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for price_history
CREATE POLICY "Users can view price history for their products"
  ON price_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = price_history.product_id
      AND products.user_id = auth.uid()
    )
  );

-- RLS Policies for alerts
CREATE POLICY "Users can view their own alerts"
  ON alerts FOR SELECT
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_products_user_id ON products(user_id);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_price_history_product_id ON price_history(product_id);
CREATE INDEX idx_price_history_checked_at ON price_history(checked_at);
CREATE INDEX idx_alerts_user_id ON alerts(user_id);
```

### 4. Start Development Server

```bash
npm run dev
```

Open http://localhost:3000

## 📁 Project Structure Quick Reference

```
src/
├── app/              # Pages and routes
│   ├── api/          # API endpoints (create these)
│   ├── (auth)/       # Auth pages (create these)
│   └── dashboard/    # Dashboard pages (create these)
├── components/
│   ├── ui/           # UI components (✅ ready)
│   └── layout/       # Layout components
├── lib/
│   ├── utils.ts      # Helper functions (✅ ready)
│   ├── scrapers/     # Web scraping logic
│   └── supabase/     # Database client
└── types/            # TypeScript types (✅ ready)
```

## 🎯 Next Feature to Build

**Step 2: Authentication** (from your original prompt)

Use this prompt with Cursor:

```
Referring to DEVELOPMENT.md, build the authentication system:
1. Create Supabase client in /src/lib/supabase/client.ts
2. Create sign up page at /src/app/(auth)/signup/page.tsx
3. Create login page at /src/app/(auth)/login/page.tsx
4. Implement middleware to protect routes
5. Add logout functionality

Follow best practices and update DEVELOPMENT.md progress.
```

## 🛠️ Useful Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server

# Code Quality
npm run lint             # Run linter
npx prettier --write .   # Format code

# Adding shadcn/ui Components
npx shadcn@latest add [component-name]

# Example:
npx shadcn@latest add table
npx shadcn@latest add select
```

## 📚 Key Files to Reference

- **DEVELOPMENT.md** - Complete technical documentation
- **README.md** - Project overview and setup
- **SETUP_COMPLETE.md** - Detailed setup summary
- **.env.example** - Environment variables template

## 🐛 Troubleshooting

### Port already in use?

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or use a different port
npm run dev -- -p 3001
```

### Build errors?

```bash
# Clean and rebuild
rm -rf .next
npm run build
```

### Supabase connection issues?

1. Check .env.local has correct keys
2. Verify Supabase project is active
3. Check RLS policies are enabled

## 💡 Pro Tips

1. **Use Cursor with context** - Always reference DEVELOPMENT.md in your prompts
2. **Build incrementally** - Complete one step at a time
3. **Test frequently** - Run `npm run build` after major changes
4. **Commit often** - Save your progress regularly

## 📖 Documentation

- Refer to **DEVELOPMENT.md** for database schema, API routes, and development notes
- Check **README.md** for deployment instructions
- Review **SETUP_COMPLETE.md** for what's already configured

---

**You're all set! Start building amazing features! 🚀**

