# Price Tracker - Product Price Monitoring SaaS

A modern web application built with Next.js 14 that helps users track prices of products from e-commerce websites and receive alerts when prices drop.

## Features

- 🔐 **User Authentication** - Secure sign up and login with Supabase Auth
- 🛒 **Product Tracking** - Add products from Amazon (more sites coming soon)
- 📊 **Price History** - Visual charts showing price trends over time
- 🔔 **Price Alerts** - Email notifications when prices drop below your target
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile
- ⚡ **Automated Price Checking** - Cron jobs check prices every 6 hours automatically
- 🔍 **Health Monitoring** - Built-in health check endpoint for uptime monitoring
- 🛡️ **Secure Cron Jobs** - Bearer token authentication for all automated tasks

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui, Radix UI
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Web Scraping**: Puppeteer & Cheerio
- **Email**: Resend
- **Charts**: Recharts
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- Resend account (for email alerts)

### Installation

1. Clone the repository:

```bash
git clone <your-repo-url>
cd price-project-tracker
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

- Supabase project URL and keys
- Resend API key
- Cron secret

4. Set up the database:

- Create a new Supabase project
- Run the SQL commands in `DEVELOPMENT.md` to create tables
- Enable Row Level Security (RLS) policies

5. Run the development server:

```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
price-project-tracker/
├── src/
│   ├── app/              # Next.js app directory
│   │   ├── (auth)/       # Authentication pages
│   │   ├── dashboard/    # Dashboard pages
│   │   └── api/          # API routes
│   ├── components/       # React components
│   │   ├── ui/           # shadcn/ui components
│   │   └── layout/       # Layout components
│   ├── lib/              # Utility functions
│   │   ├── scrapers/     # Scraping logic
│   │   └── supabase/     # Supabase client
│   ├── types/            # TypeScript types
│   └── hooks/            # Custom React hooks
├── public/               # Static assets
└── DEVELOPMENT.md        # Development documentation
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Development

For detailed development notes, database schema, API routes, and implementation details, see [DEVELOPMENT.md](./DEVELOPMENT.md).

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `RESEND_API_KEY`
   - `CRON_SECRET` (generate with: `openssl rand -hex 32`)
   - `NEXT_PUBLIC_APP_URL`
4. Deploy!

### Setting up Cron Jobs

Vercel Cron Jobs are already configured in `vercel.json` to periodically check prices every 6 hours.

**For detailed setup instructions, see:**

- [CRON_JOBS_SETUP.md](./CRON_JOBS_SETUP.md) - Complete guide to cron jobs
- [VERCEL_CONFIGURATION.md](./VERCEL_CONFIGURATION.md) - Vercel configuration options

**Quick Test:**

```bash
# Local testing
./scripts/test-cron.sh

# Or with PowerShell
.\scripts\test-cron.ps1

# Check health
curl https://your-app.vercel.app/api/health
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details

## Support

For bugs and feature requests, please create an issue on GitHub.

---

Built with ❤️ using Next.js and Supabase
