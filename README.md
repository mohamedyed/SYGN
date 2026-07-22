# SYGN

Street-grade signage e-commerce storefront with floating draggable signs, glassmorphism UI, and full Supabase backend.

## Tech Stack

- React 19 + TypeScript 8
- Vite 8 + Tailwind CSS 4
- Framer Motion + Lucide React
- Supabase (Auth, Database, Storage)

## Setup

```bash
npm install
cp .env.example .env
# Fill in your Supabase credentials
npm run dev
```

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous/public key |

## Database Setup

1. Run `supabase-schema.sql` in Supabase SQL Editor
2. Run `admin-migration.sql` in Supabase SQL Editor
3. Sign up with your admin email, then set `is_admin = true` in the profiles table

## Production Build

```bash
npm run build
npm run lint
```

## Security Notes

- RLS enabled on all tables
- Admin operations require `is_admin` flag in profiles
- Order totals calculated server-side via database trigger
- Image uploads validated (5MB limit, image types only)
- Environment variables excluded from git via `.gitignore`
