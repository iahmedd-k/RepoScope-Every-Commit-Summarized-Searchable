This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!


## Environment variables

Several features require secrets stored in `.env.local` (not committed to Git). For example:

```bash
# Supabase (public keys ok for client-side access)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Stripe (server only)
#   * **STRIPE_SECRET_KEY** must be set to your **sk_** key
#     (do _not_ use a publishable key or any NEXT_PUBLIC_ prefix).
#   *Price IDs are public and are stored as NEXT_PUBLIC_STRIPE_* variables.
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID=...
NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID=...
NEXT_PUBLIC_STRIPE_TEAM_MONTHLY_PRICE_ID=...
NEXT_PUBLIC_STRIPE_TEAM_YEARLY_PRICE_ID=...

# base URL used for success/cancel redirects (must include scheme, e.g. http://localhost:3000)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> **AI model configuration**: This project uses Groq's API via `lib/gemini.js`. Set `GROQ_API_KEY` in `.env.local` and you can optionally override the model with `GROQ_MODEL` (default: `mixtral-8x7b`). The previous `mixtral-8x7b-32768` model was decommissioned; update if you see 400 errors.

## Deploy on Vercel


