# Price Tracker Development Log

## Project Overview

Price & Product Tracker SaaS - Track product prices from e-commerce sites and get alerts on price drops.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API routes
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Scraping**: Puppeteer (primary), Cheerio (fallback)
- **Email**: Resend
- **Deployment**: Vercel

## Database Schema

### users table (managed by Supabase Auth)

- id (uuid, primary key)
- email (text)
- created_at (timestamp)

### products table

```sql
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
  currency TEXT DEFAULT 'USD',
  last_checked TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### price_history table

```sql
CREATE TABLE price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  price DECIMAL(10, 2) NOT NULL,
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### alerts table

```sql
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  old_price DECIMAL(10, 2) NOT NULL,
  new_price DECIMAL(10, 2) NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email_sent BOOLEAN DEFAULT false
);
```

## API Routes

### /api/products

- GET - Fetch all user's tracked products
- POST - Add new product to track
- DELETE - Remove product

### /api/products/[id]

- GET - Fetch single product with price history
- PATCH - Update product (target price, active status)

### /api/scrape

- POST - Manually trigger scrape for a product
- (Background: Cron job for automatic scraping)

### /api/alerts

- GET - Fetch user's price alerts

### /api/cron/check-prices

- POST - Background job to check all active products

## Key Features Status

- [x] Project setup and configuration
- [x] Database schema setup in Supabase
- [x] Authentication flow (sign up, login, logout)
- [x] Landing page
- [x] Dashboard layout
- [x] Add product functionality
- [x] URL parser and validator
- [x] Amazon scraper implementation
- [x] Price history storage
- [x] Cron job for periodic scraping
- [x] Health check endpoint
- [x] Cron job testing scripts
- [ ] Price history chart component
- [ ] Email alert system (endpoint created, needs Resend integration)
- [ ] User settings page
- [ ] Pricing/subscription page

## Current Sprint

**Sprint 1: Foundation (October 2025)** ✅ COMPLETED

- [x] Set up Next.js project with TypeScript
- [x] Configure Tailwind CSS and shadcn/ui
- [x] Create folder structure
- [x] Set up utility functions and types
- [x] Set up Supabase project and connect
- [x] Implement authentication

**Sprint 2: Product Tracking** ✅ COMPLETED

- [x] Add product functionality
- [x] URL parser and validator
- [x] Display tracked products
- [x] Product deletion functionality
- [x] Real-time stats on dashboard

**Sprint 3: Web Scraping** ✅ COMPLETED

- [x] Amazon scraper implementation
- [x] Automatic price fetching
- [x] Price history storage
- [x] Price drop detection

**Sprint 4: Background Jobs & Alerts (Current)**

- [x] Cron job for periodic scraping
- [x] Cron job endpoint with security
- [x] Health check endpoint
- [ ] Email alert system (endpoint created, needs Resend integration)
- [ ] Price drop notifications
- [ ] User settings for alerts

## Scraping Strategy

### Amazon Scraper Logic

```
1. Extract product ID from URL
2. Use Puppeteer to load page (handles dynamic content)
3. Wait for price element to load
4. Extract: title, price, image, availability
5. Handle different Amazon domains (.com, .in, .co.uk)
6. Implement rate limiting (1 request per 3 seconds per domain)
7. Retry logic with exponential backoff
8. Fallback to Cheerio if Puppeteer fails
```

### Anti-Detection Measures

- Rotate user agents
- Random delays between requests
- Use headless: false mode occasionally
- Implement proxy rotation (future)

## Environment Variables Needed

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
CRON_SECRET= (for securing cron endpoint)
NEXT_PUBLIC_APP_URL=
```

## Development Notes

### October 22, 2025 - Project Initialization

- Created Next.js 14 project with TypeScript and App Router
- Configured Tailwind CSS with custom theme
- Installed all core dependencies:
  - Supabase client and SSR
  - React Hook Form with Zod validation
  - Puppeteer and Cheerio for scraping
  - Resend for email
  - Recharts for data visualization
  - shadcn/ui components
- Created folder structure:
  - `/src/components/ui` - shadcn/ui components
  - `/src/components/layout` - Layout components
  - `/src/lib` - Utility functions and business logic
  - `/src/lib/scrapers` - Scraping logic
  - `/src/lib/supabase` - Supabase client
  - `/src/types` - TypeScript type definitions
  - `/src/hooks` - Custom React hooks
- Set up TypeScript types for database tables
- Created utility functions (cn, formatPrice, extractNumberFromPrice, getRelativeTime)
- Configured shadcn/ui with neutral theme
- Created .env.example with all required variables

**Next Steps:**

1. ~~Set up Supabase project and create database tables~~ ✅
2. ~~Implement Supabase client and authentication~~ ✅
3. ~~Build authentication pages (login, signup)~~ ✅
4. ~~Create protected route middleware~~ ✅

### October 23, 2025 - Authentication System Implemented

**Supabase Integration:**

- Created Supabase client utilities:
  - `/src/lib/supabase/client.ts` - Browser client using @supabase/ssr
  - `/src/lib/supabase/server.ts` - Server client for server components
  - `/src/lib/supabase/middleware.ts` - Middleware session management
- Set up authentication actions in `/src/lib/actions/auth.ts`:
  - `signup()` - User registration with email/password
  - `login()` - User authentication
  - `signOut()` - User logout
  - `getUser()` - Fetch current user

**Authentication Pages:**

- Created `/app/(auth)/login/page.tsx`:
  - Form validation with React Hook Form and Zod
  - Email and password fields
  - Error handling with user-friendly messages
  - Links to signup and home page
- Created `/app/(auth)/signup/page.tsx`:
  - Strong password validation (8+ chars, uppercase, lowercase, number)
  - Password confirmation with matching validation
  - Email validation
  - Auto-redirect after successful signup
- Auth callback route at `/app/auth/callback/route.ts` for email verification flows

**Route Protection:**

- Implemented middleware in `middleware.ts`:
  - Automatic session refresh
  - Redirects unauthenticated users to login
  - Protects all routes except public pages (/, /login, /signup, /auth)
  - Uses Supabase SSR for cookie management

**Landing Page:**

- Created modern landing page at `/app/page.tsx`:
  - Hero section with value proposition
  - Features showcase (Price Tracking, Smart Alerts, Price History)
  - "How it Works" section with 3-step process
  - CTA sections with links to signup
  - Auto-redirect to dashboard if user is logged in
  - Responsive design with Tailwind CSS

**Dashboard:**

- Basic dashboard at `/app/dashboard/page.tsx`:
  - Stats cards (Total Products, Active Alerts, Price Drops, Last Checked)
  - User email display in header
  - Sign out functionality
  - Empty state with "Get Started" message
  - Ready for product tracking features

**Security:**

- Row Level Security (RLS) enabled on all database tables
- Server-side session validation
- Secure cookie-based authentication
- CSRF protection via Supabase Auth

**Next Steps:**

1. ~~Build Amazon web scraper with Puppeteer~~ ✅
2. ~~Implement initial scrape when product is added~~ ✅
3. ~~Store scraped data (title, price, image) in database~~ ✅
4. ~~Create price history tracking~~ ✅
5. Add background job for periodic price checks (cron)
6. Implement email alert system

### October 23, 2025 - Amazon Scraper Implementation

**Scraper Engine:**

- Created `/src/lib/scrapers/amazon.ts` with Puppeteer
- Implements `scrapeAmazonProduct()` for single product scraping
- Implements `scrapeAmazonProductWithRetry()` with exponential backoff

**Data Extraction:**

- Extracts product title from multiple selectors
- Extracts price from 6+ different Amazon price selectors
- Extracts primary product image
- Checks product availability status
- Detects currency from symbols and URL

**Anti-Detection Measures:**

- Random user agent rotation (4 different agents)
- Random delays between actions (1-3 seconds)
- Blocks unnecessary resources (images, CSS, fonts) for speed
- Stealth browser launch settings
- Proper viewport configuration

**API Integration:**

- Created POST `/api/scrape` endpoint
- Authenticates user and validates product ownership
- Calls scraper and updates database
- Stores price in price_history table
- Detects price drops vs target price
- Creates alerts when price drops

**Automatic Scraping:**

- POST `/api/products` now triggers scrape after product creation
- Background scraping (non-blocking)
- Updates product with title, price, image automatically

**Manual Refresh:**

- Created `RefreshPriceButton` component
- Users can manually trigger price refresh
- Shows loading state with spinner
- Toast notifications for success/error
- Auto-refreshes page after update

**Error Handling:**

- Retry logic with exponential backoff (3 attempts)
- Graceful degradation if scraping fails
- Detailed error logging for debugging
- Browser cleanup in finally blocks

**Price History:**

- Every scrape stores price in price_history table
- Timestamped for historical tracking
- Ready for price charts in future

**Price Drop Detection:**

- Compares current price vs target price
- Creates alert record when price drops
- Logs old price and new price
- Ready for email notifications

### October 23, 2025 - Product Tracking Feature

**URL Validation & Parsing:**

- Created comprehensive URL validator in `/src/lib/validators/product.ts`
- Extracts Amazon product IDs (ASIN) from multiple URL formats
- Normalizes URLs to prevent duplicates
- Supports all major Amazon domains (.com, .uk, .ca, .de, .fr, .in, .jp, .it, .es)

**Add Product Form:**

- React Hook Form with Zod validation
- Product URL and optional target price fields
- Real-time validation with helpful error messages
- Toast notifications for feedback
- Auto-reset after successful submission

**API Implementation:**

- POST `/api/products` - Add new product with duplicate checking
- GET `/api/products` - Fetch user's products with RLS
- DELETE `/api/products` - Remove product with confirmation
- Full authentication on all endpoints

**Products Display:**

- Dedicated products page at `/dashboard/products`
- Grid layout with product cards showing prices and status
- Delete functionality with confirmation dialog
- Links to view products on Amazon
- Empty states for new users

**Dashboard Integration:**

- Added AddProductForm to main dashboard
- Real-time stats: total products, active alerts, last checked
- "View All Products" navigation button
- Split layout for form and activity

**User Experience:**

- Sonner toast notifications throughout
- Loading states on all operations
- Confirmation dialogs for destructive actions
- Responsive design on all pages

## Known Issues

- None yet

## Future Enhancements

- Support for more e-commerce sites (Walmart, Best Buy, eBay)
- Browser extension for easy product adding
- Price drop predictions using historical data
- Mobile app
- Shared wishlists
- Price drop percentage alerts
- Product availability tracking
- Webhook support for real-time updates
- Price comparison across multiple sites
- Wishlist sharing and collaboration

## Testing Checklist

- [ ] User can sign up and login
- [ ] User can add product URL
- [ ] Scraper extracts correct data
- [ ] Price history displays correctly
- [ ] Email alerts are sent
- [ ] Dashboard loads quickly
- [ ] Mobile responsive design
- [ ] Error handling works properly
- [ ] Rate limiting prevents abuse
- [ ] Cron jobs run on schedule

## Deployment Checklist

- [ ] Environment variables set in Vercel
- [ ] Database migrations applied
- [ ] RLS policies enabled and tested
- [ ] Cron job configured
- [ ] Email templates tested
- [ ] Error tracking set up (Sentry)
- [ ] Analytics set up (Plausible/Umami)
- [ ] Performance monitoring enabled
- [ ] Security headers configured
- [ ] CORS settings verified

## Code Conventions

- Use TypeScript strictly (no `any` types unless absolutely necessary)
- Use server components by default, client components only when needed
- Prefix client components with 'use client'
- Use Zod for validation
- Use React Hook Form for forms
- Keep components small and focused (Single Responsibility Principle)
- Write descriptive commit messages
- Use meaningful variable and function names
- Add comments for complex logic
- Follow Next.js 14 best practices
- Use async/await over promises
- Handle errors gracefully with try-catch blocks
- Use environment variables for sensitive data

## Project Dependencies

### Production Dependencies

- `next`: 16.0.0 - React framework
- `react`: 19.2.0 - UI library
- `@supabase/supabase-js`: Database and auth client
- `@supabase/ssr`: Server-side rendering support
- `zod`: Schema validation
- `react-hook-form`: Form management
- `puppeteer`: Web scraping (dynamic content)
- `cheerio`: HTML parsing (static content)
- `resend`: Email service
- `recharts`: Chart components
- `lucide-react`: Icon library
- `tailwind-merge` & `clsx`: Utility styling
- `class-variance-authority`: Component variants

### Development Dependencies

- `typescript`: Type checking
- `tailwindcss`: Utility-first CSS
- `prettier`: Code formatting
- `eslint`: Code linting

## Performance Considerations

- Use Next.js Image component for optimized images
- Implement lazy loading for product lists
- Cache scraping results to reduce API calls
- Use database indexes on frequently queried fields
- Implement pagination for large datasets
- Use React.memo for expensive components
- Debounce search inputs
- Optimize Puppeteer by reusing browser instances

## Security Measures

- Enable Row Level Security (RLS) in Supabase
- Validate all user inputs with Zod
- Sanitize scraped data before storing
- Use environment variables for secrets
- Implement rate limiting on API routes
- Protect cron endpoints with secret tokens
- Use HTTPS only in production
- Implement CSRF protection
- Sanitize user-generated content
