# Marketing IA

Aplicacao com:

- `frontend/`: Next.js 16 com autenticacao Supabase
- `backend/`: Fastify + Supabase + OpenRouter + integracao Meta Ads
- `backend/supabase/schema.sql`: schema inicial do banco
- `render.yaml`: manifesto de deploy para Render

## Variaveis necessarias

Frontend:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_API_URL`

Backend:

- `FRONTEND_URL`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENROUTER_API_KEY`
- `OPENROUTER_SITE_URL`
- `OPENROUTER_APP_NAME`
- `META_ACCESS_TOKEN`
- `META_AD_ACCOUNT_ID`

## Build local

Frontend:

```bash
cd frontend
npm install
npm run lint
npm run build
```

Backend:

```bash
cd backend
npm install
npm run build
```
