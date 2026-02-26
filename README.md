# Renderify — Image Generation API

A cheaper, fully-featured alternative to Placid.app — auto-generate images, PDFs, and videos from custom drag-and-drop templates via API.

## Features

- 🎨 **Drag & Drop Template Editor** - Visual editor powered by Fabric.js
- 🔄 **Dynamic Variables** - Use `{{variable}}` syntax for personalized content  
- 🚀 **REST API** - Generate images programmatically via simple API
- 📦 **Multiple Formats** - PNG, JPEG, and PDF export
- ☁️ **Cloud Storage** - Images stored on Cloudinary CDN
- 💳 **Stripe Billing** - Free, Pro ($9/mo), and Business ($29/mo) plans
- 🔐 **Authentication** - Email + Google OAuth via NextAuth.js

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL (via Supabase or local)
- **Auth**: NextAuth.js
- **Payments**: Stripe
- **Image Generation**: Puppeteer
- **File Storage**: Cloudinary
- **Canvas Editor**: Fabric.js
- **Styling**: Tailwind CSS + shadcn/ui

## Getting Started

### 1. Install Dependencies

\`\`\`bash
npm install
\`\`\`

### 2. Set Up Environment Variables

Create a `.env` file based on `.env.example`:

\`\`\`bash
cp .env.example .env
\`\`\`

Fill in the required environment variables:

#### Database
- Set up a PostgreSQL database (Supabase recommended)
- Update `DATABASE_URL`

#### NextAuth
\`\`\`bash
# Generate a secret
openssl rand -base64 32
\`\`\`
- Update `NEXTAUTH_SECRET` with the generated value
- Update `NEXTAUTH_URL` (use `http://localhost:3000` for development)

#### Google OAuth (optional)
- Go to [Google Cloud Console](https://console.cloud.google.com/)
- Create OAuth 2.0 credentials
- Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
- Update `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`

#### Stripe
- Go to [Stripe Dashboard](https://dashboard.stripe.com/)
- Get your API keys from Developers > API keys
- Update `STRIPE_SECRET_KEY` and `STRIPE_PUBLISHABLE_KEY`
- Create products and get price IDs for Pro and Business plans
- Set up webhook endpoint and get `STRIPE_WEBHOOK_SECRET`

#### Cloudinary
- Sign up at [Cloudinary](https://cloudinary.com/)
- Get credentials from Dashboard
- Update `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

### 3. Set Up Database

\`\`\`bash
# Push schema to database
npm run db:push

# Or migrate
npx prisma migrate dev
\`\`\`

### 4. Run Development Server

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Project Structure

\`\`\`
editor_canva/
├── app/
│   ├── (marketing)/         # Landing page, pricing
│   ├── (auth)/              # Sign in, sign up
│   ├── (dashboard)/         # Templates, editor, API keys, usage, settings
│   ├── api/
│   │   ├── auth/            # NextAuth
│   │   ├── v1/images/       # Public generation API
│   │   ├── templates/       # Template CRUD
│   │   ├── projects/        # Project CRUD
│   │   ├── api-keys/        # API key management
│   │   └── stripe/          # Stripe checkout & webhooks
│   └── layout.tsx
├── components/
│   ├── editor/              # Canvas editor components
│   ├── ui/                  # shadcn/ui components
│   └── dashboard/
├── lib/
│   ├── db.ts                # Prisma client
│   ├── auth.ts              # NextAuth config
│   ├── stripe.ts            # Stripe client
│   ├── cloudinary.ts        # Upload helper
│   ├── generator.ts         # Puppeteer image generation
│   └── api-key.ts           # API key utilities
├── prisma/
│   └── schema.prisma
└── public/
\`\`\`

## API Usage

### Generate an Image

\`\`\`bash
curl -X POST http://localhost:3000/api/v1/images \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "template_id": "template_id_here",
    "modifications": {
      "name": "John Doe",
      "title": "Software Engineer"
    },
    "format": "png"
  }'
\`\`\`

Response:
\`\`\`json
{
  "image_url": "https://res.cloudinary.com/...",
  "template_id": "template_id_here",
  "format": "png",
  "usage": {
    "used": 1,
    "limit": 100
  }
}
\`\`\`

## Pricing Plans

| Plan | Price | API Calls/mo | Templates |
|------|-------|--------------|-----------|
| Free | $0 | 100 | 3 |
| Pro | $9/mo | 5,000 | Unlimited |
| Business | $29/mo | 25,000 | Unlimited |

## Deployment

### Puppeteer Requirements

Puppeteer requires a headless Chrome installation. This works on:

- ✅ Local development
- ✅ VPS/cloud servers (Railway, Render, Fly.io)
- ❌ Vercel serverless functions (use Vercel Edge or dedicated server)

### Recommended Hosting

- **App**: Vercel (with Edge Functions) or Railway
- **Database**: Supabase (free tier) or Railway
- **Generation Service**: Separate Railway/Render service for Puppeteer

## Verification Checklist

- [ ] Landing page loads correctly
- [ ] Sign up with email works
- [ ] Sign up with Google works
- [ ] Create a new template
- [ ] Add text layer with `{{name}}` variable
- [ ] Save template
- [ ] Generate API key
- [ ] Test image generation API
- [ ] Upgrade to Pro plan (Stripe test mode)
- [ ] View usage statistics

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
