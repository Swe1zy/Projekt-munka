# Copilot instructions

## Architecture
- The repository has two independent Node apps: `backend/` (Express 5 + Mongoose ES modules) and `frontend/` (React 19 + Vite).
- In the backend, `server.mjs` connects MongoDB, creates the default admin, and listens; `utils/app.mjs` registers all routes and is also the integration point for middleware/CORS.
- Route/controller separation is consistent: `routes/backendroutes/**` and `routes/frontendroutes/**` point to `controllers/backendcontrollers/**` and `controllers/frontendcontrollers/**`; Mongo schemas live in `models/*.mjs`.
- The backend still serves legacy EJS admin/pages from `views/`, `public/css/`, and `public/js/`, while the React client owns the modern storefront/admin UI.
- Frontend routing is in `frontend/src/App.jsx`. Main providers are `AuthProvider`, `CartProvider`, and `ToastProvider`; reusable API hooks/helpers are in `frontend/src/utils/`.

## Commands and workflows
- Install dependencies separately: `cd backend && npm install`, then `cd ../frontend && npm install`; a repo-level lockfile does not define app scripts.
- Run locally in two terminals: `cd backend && npm run dev` (default `http://localhost:3600`) and `cd frontend && npm run dev` (default `http://localhost:5173`).
- Backend tests are integration tests and assume the backend is already running on port 3600: `cd backend && npm test`.
- Frontend checks: `cd frontend && npm run lint` and `npm run build`. Cypress specs are in `frontend/cypress/e2e/`; use the Cypress project only with both apps running.
- Copy `backend/.env.example` to `backend/.env` before startup. Required operational values include `MONGO_DB`, `AUTH_TOKEN_SECRET`, and `ADMIN_PASSWORD`; Cloudinary, SMTP, Stripe, and `FRONTEND_URL` are feature-specific.
- Without SMTP, emails are written as `.eml` files under `backend/kimeno-levelek/`.

## Important data and pricing rules
- Business constants (zones, delivery, opening hours, discount bands, pallets, VAT-free/invoice settings) belong in `backend/config/uzlet.mjs`; `GET /api/beallitasok` exposes selected public values.
- `backend/utils/arazas.mjs` is the single backend source of delivery/pricing calculations. The frontend `useOsszesito` preview is advisory only; order creation recalculates from database products and must remain authoritative.
- Never trust cart prices/names from the client. `rendelesControllers.mjs` reloads products and validates stock; it atomically reduces inventory and restores it if order/Stripe setup fails.
- Preserve order snapshot data in `models/Rendeles.mjs` and product weight/pallet fields from `models/Termek.mjs`; later catalog/config changes must not silently rewrite historical totals.

## API and auth conventions
- `frontend/src/config.js` currently fixes `API_URL` to `http://localhost:3600/api`; keep this in sync when changing local or deployed URLs. Use `frontend/src/utils/api.js` (`apiKeres`, `fajlLetoltes`, `useLekeres`) for authenticated JSON/file requests.
- Browser calls that need the session cookie must set `credentials: 'include'`. Authentication is a signed HttpOnly `projekt_session` cookie read by `middlewares/requireAdmin.mjs`, not a bearer token.
- Apply `requireAuthenticatedUser` for customer-only routes, `requireAdmin` for admin routes, and `optionalAuthenticatedUser` for guest-or-user flows such as order and quote creation.
- Backend responses for client-visible failures normally use `{ msg: ... }` JSON and appropriate 400/401/403/409/500 statuses. Add logs for unexpected server errors.
- Stripe webhook handling has a deliberate special case: register `/api/rendelesek/stripe-webhook` with `express.raw(...)` before `express.json(...)` in `utils/app.mjs`. Follow `backend/STRIPE_SETUP.md` for local CLI testing.

## Editing conventions
- JavaScript is mostly Hungarian-named for domain code (`rendeles`, `termek`, `kosar`, `fizetes`); follow existing names and accents instead of introducing generic English abstractions.
- Keep each feature split consistently: route -> controller -> model/utility. Put cross-cutting operations (stock, email, invoice PDF, pricing, Stripe) in `backend/utils/` or the appropriate existing controller helper.
- Mongo models enforce enums and validation, but controllers also perform explicit request validation (ObjectIds, units, addresses, quantity limits). Preserve both layers.
- Cloudinary image deletes happen only after a successful database update/delete, as seen in `controllers/backendcontrollers/termek/termekekControllers.mjs`.
- Frontend pages and components use co-located regular CSS imports (for example `App.jsx`/`App.css`), not a CSS-module convention.
- Preserve existing test selectors such as `data-teszt-*` in Cypress-facing elements unless the test suite is updated together.
