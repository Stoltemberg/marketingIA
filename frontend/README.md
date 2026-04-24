Marketing AI frontend built with Next.js 16 and Supabase auth.

## Environment

Create `frontend/.env.local` from `frontend/.env.example` and fill in:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_API_URL`

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Production

For Render web service deploys:

- Build command: `npm install && npm run build`
- Start command: `npm run start`
- Root directory: `frontend`

Make sure the frontend URL is also added to the backend `FRONTEND_URL` env var so authenticated API calls succeed.
