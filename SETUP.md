# Quick Setup Guide

## Step 1: Install Dependencies

\`\`\`bash
npm install
\`\`\`

## Step 2: Set Up Database (Supabase - Recommended)

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Project Settings > Database
4. Copy the connection string (URI format)
5. Create `.env` file and add:

\`\`\`
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@[YOUR-HOST]:5432/postgres"
\`\`\`

## Step 3: Configure Environment Variables

Create `.env` file:

\`\`\`bash
# Database
DATABASE_URL="your-database-url-here"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="run: openssl rand -base64 32"

# Google OAuth (optional - skip for now)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Email (optional - skip for now)
EMAIL_SERVER=""
EMAIL_FROM=""

# Stripe (use test keys)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRICE_ID_PRO="price_..."
STRIPE_PRICE_ID_BUSINESS="price_..."

# Cloudinary
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
\`\`\`

### Generate NEXTAUTH_SECRET:

\`\`\`bash
openssl rand -base64 32
\`\`\`

### Get Stripe Keys:

1. Go to [stripe.com/test](https://dashboard.stripe.com/test/apikeys)
2. Copy Secret key and Publishable key
3. Create 2 products:
   - Pro: $9/month → get price ID
   - Business: $29/month → get price ID
4. Set up webhook:
   - Go to Developers > Webhooks
   - Add endpoint: `http://localhost:3000/api/stripe/webhook`
   - Select events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Copy webhook secret

### Get Cloudinary Keys:

1. Sign up at [cloudinary.com](https://cloudinary.com)
2. Go to Dashboard
3. Copy Cloud name, API Key, API Secret

## Step 4: Push Database Schema

\`\`\`bash
npm run db:push
\`\`\`

## Step 5: Run Development Server

\`\`\`bash
npm run dev
\`\`\`

Visit: http://localhost:3000

## Step 6: Test the Application

### Manual Testing:

1. **Landing Page**
   - Open http://localhost:3000
   - Verify hero, features, pricing sections render

2. **Authentication**
   - Click "Get Started"
   - Sign up with email (if configured) or skip to use database directly
   - For quick testing, you can manually create a user in the database

3. **Create Template**
   - Navigate to Templates page
   - Click "New Project" → enter name
   - Click "New Template" → enter name
   - You'll be redirected to the editor

4. **Template Editor**
   - Click "Text" to add text layer
   - Double-click text to edit, type: `Hello {{name}}`
   - Click "Rectangle" to add a shape
   - Click "Save"

5. **API Key**
   - Go to API Keys page
   - Click "Create API Key"
   - Copy the key (save it!)

6. **Test Image Generation**

\`\`\`bash
# Get your template ID from the URL when editing
# Get your API key from the previous step

curl -X POST http://localhost:3000/api/v1/images \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "template_id": "YOUR_TEMPLATE_ID",
    "modifications": {
      "name": "World"
    },
    "format": "png"
  }'
\`\`\`

You should get back an image URL!

## Troubleshooting

### Puppeteer Installation Issues

If Puppeteer fails to install Chrome:

\`\`\`bash
# Linux
sudo apt-get install -y chromium-browser

# macOS
brew install chromium
\`\`\`

### Database Connection Issues

- Make sure PostgreSQL is running
- Check DATABASE_URL format
- Verify network access to database

### Port Already in Use

\`\`\`bash
# Kill process on port 3000
kill -9 $(lsof -ti:3000)

# Or use a different port
PORT=3001 npm run dev
\`\`\`

## Next Steps

1. Set up Google OAuth for easier authentication
2. Configure email provider (Resend, SendGrid) for magic links
3. Test Stripe checkout flow
4. Deploy to production (Railway, Render, or VPS)

## Need Help?

Check the full README.md for detailed documentation.
