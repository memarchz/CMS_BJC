# Supplier Portal

Asset-intake portal for BJC / Big C: suppliers submit equipment specifications,
buyers review them, and admins manage buyer category permissions and the supplier
directory.

Next.js (App Router) + TypeScript + Tailwind CSS v3. State lives in
`localStorage`/`sessionStorage` — there is no application database.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

Demo accounts are seeded in [lib/auth.ts](lib/auth.ts): `supplier@demo.co.th`,
`buyer@demo.co.th`, `admin@demo.co.th` (and `buyer1`–`buyer4`, each with different
category permissions). The password for every seeded account is in that file.

## Routes

| Route | Who | Purpose |
|---|---|---|
| `/` | anyone | role picker |
| `/login`, `/register` | anyone | sign in / supplier self-registration |
| `/form` | supplier, buyer | asset-intake wizard (`?edit=<id>` to edit) |
| `/submissions` | buyer, admin | submitted assets, filters, detail modal |
| `/admin` | admin | dashboard, buyer permissions, supplier directory |
| `/api/ocr` | internal | nameplate OCR (server-side, see below) |

## Nameplate OCR (Gemini)

The asset-intake wizard's "Auto Fill" modal can read an equipment nameplate from a
photo and pre-fill the form.

### Setup

```bash
cp .env.example .env.local
```

Put a Google AI Studio key in `GEMINI_API_KEY` (get one at
https://aistudio.google.com/apikey), then restart `npm run dev`.

`.env.example` is only a template — Next.js never reads it. The key has to be in
`.env.local` (gitignored) to take effect.

The key is read **only** in [app/api/ocr/route.ts](app/api/ocr/route.ts), which runs
on the server. Never rename it to `NEXT_PUBLIC_*`: that ships the key to every
visitor's browser.

### Choosing a model

The default is `gemini-3.5-flash-lite`, which read the test nameplate in ~6s with
every field correct. **Mind the free-tier quota when overriding it:**
`gemini-3.8-flash` allows only **20 requests per day**, which a single demo session
exhausts — and it was no more accurate on the same plate. Your project's real limits
are at https://aistudio.google.com/rate-limit.

The route calls the REST endpoint with `fetch` rather than using `@google/genai`.
The SDK sends a streamed request body and retries it on a 429; the retry throws
`TypeError: unusable`, which hid the quota error behind a generic connection
failure. With a plain string body, a 429 now reaches the user with Google's own
message, including how long to wait.

### What it does and does not fill

The model reports only what is physically printed on the plate — brand, series,
model, serial, country of origin, manufacturing date, capacity/rating, power
requirement, certifications, dimensions/weight — plus a Category/Sub-Category
classification based on the equipment type.

It never fills warranty terms, maintenance budgets, prices, TCO or PO/contract
numbers: that information is not on a nameplate, so inventing it would put made-up
figures into a procurement record. Those fields stay empty for a human. The mapping
and this boundary are enforced in [lib/ocr.ts](lib/ocr.ts), not just requested in
the prompt.

A returned Category is validated against the real taxonomy in
[lib/catalog.ts](lib/catalog.ts) before it is used, because the form's select and
the buyer permission check both key off it.

### Without a key

The modal's four sample nameplates (Daikin / Trane / Schneider / Hikvision) are
canned demo data and never call the API, so a demo works with no key, no network
and no quota. Only the camera and upload tabs call Gemini.

### Free tier caveat

On Gemini's unpaid tier, Google uses submitted content to improve its products and
human reviewers may read it (https://ai.google.dev/gemini-api/terms). Use test
images only. Before sending real supplier photos, move to a paid tier or Vertex AI,
where prompts are not used for training.

Per-model free-tier rate limits are no longer published; your project's actual
limits are at https://aistudio.google.com/rate-limit.

## Checks

```bash
npm test        # Jest + React Testing Library
npm run lint    # ESLint 10, configured for ecmaVersion 2019
npm run build   # production build + type check
```
