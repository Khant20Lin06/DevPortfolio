# Frontend (Next.js)

Portfolio frontend that mirrors the provided screen design and integrates with the backend contact pipeline.

## Environment

Create `.env.local` from `.env.example`.

- `NEXT_PUBLIC_API_BASE_URL`: Backend base URL.
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`: Cloudflare Turnstile site key.

## Routes

- `/`: public portfolio page
- `/login`: register/login page
- `/admin`: admin content editor (requires admin token)

## Scripts

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
