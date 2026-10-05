# Supplier Portal: Next.js + TypeScript + Tailwind Migration

**Date:** 2026-10-05
**Status:** Approved by user, ready for implementation planning

## Goal

Migrate the Supplier Portal from a vanilla multi-page HTML/CSS/JS static site
into a Next.js (App Router) + TypeScript + Tailwind project, with ESLint
configured for ECMAScript 2019 (`ecmaVersion: 2019`, per the user's "ES10"
requirement).

**The overriding constraint, stated explicitly by the user: the UI/UX must
remain visually identical to the current HTML in every respect.** This is a
framework/tooling migration, not a redesign. The rule that governs every
decision below: if a page doesn't look pixel-identical to the current
`index.html` / `login.html` / `register.html` / `form.html` /
`submissions.html` / `admin.html`, under every role, that is a bug to be
fixed before the migration is considered done — not a matter of taste.

## Non-goals (explicitly out of scope)

- No real backend, database, or server-side auth. The app keeps using
  `localStorage` / `sessionStorage` exactly as it does today (confirmed with
  user — this is a pure framework swap, not a backend build-out).
- No visual redesign, no "cleanup" of markup, no new shared abstractions that
  the current pages don't already share verbatim.
- No new features. Feature set is frozen to what exists today.

## Current state (as read directly from the repo)

Plain static site served by a hand-rolled `server.js` (`http` + manual MIME
map + directory-traversal guard), with `serve.json` as an alternate static
server config. Tailwind is loaded at runtime via the CDN script
(`cdn.tailwindcss.com`) on every page; the "Prompt" Google Font is loaded via
a `<link>` tag. All app state lives in `localStorage`/`sessionStorage`; there
is no backend at all.

Six pages, six matching JS files, one shared `css/style.css` (69 lines:
`.inp`, `.fadein` + keyframes, `.brand`, `:root` safe-area padding), one
shared `js/data.js` (field-catalog config + mock data), one shared
`js/common.js` (DOM helpers + `Auth`/`Store`/`Permissions`/`Suppliers`
objects):

| Page | Lines (html/js) | Purpose |
|---|---|---|
| `index.html` | 209 / — | Role picker (Supplier/Buyer/Admin), active-session banner |
| `login.html` | 116 / 151 | Role-tabbed login, buyer demo-account quick-fill, redirect by role |
| `register.html` | 24 / 8 | Supplier self-registration |
| `form.html` | 315 / 744 | Multi-step asset-intake wizard + AI nameplate-scan modal |
| `submissions.html` | 165 / 271 | Buyer/Admin list of submitted assets, filters, detail modal |
| `admin.html` | 1067 / 1386 | Admin dashboard: 3 in-page views + 4 modals |

### Shared data/state layer (`js/common.js`, `js/data.js`)

- `Auth` — `login`/`register`/`require`/`logout`/`home`, backed by a hardcoded
  `SEED` array of demo accounts plus `portal_users` in localStorage.
  `Auth.require(roles)` runs synchronously and calls `location.replace()`
  before paint if the session is missing/wrong-role.
- `Store` — CRUD over submitted asset records (`portal_subs` in
  localStorage), seeded from `MOCK_SUBS` (6 realistic Thai-language demo
  records) if empty.
- `Permissions` — per-buyer category allow-lists (`buyer_category_permissions`
  in localStorage), defaulting from `DEFAULT_BUYER_PERMS`.
- `Suppliers` — supplier directory (`portal_suppliers` in localStorage),
  defaulting from `DEFAULT_SUPPLIERS`, merged with anyone who self-registered.
- `CATS`/`STEPS`/`HIDE`/`CARBON` (`js/data.js`) — the 14-category taxonomy,
  the 4-step field schema (built via a tiny `f()`/`O()`/`only()` DSL), and the
  per-category field-hiding rules. This is the data that drives the entire
  `form.html` wizard and its calculated fields (`tco`, `co2y`, `co2l`,
  `cval`).
- DOM helpers: `E` (getElementById), `esc`, `fdt`, `toast`, `J` (safe
  JSON-in-localStorage get/set).

### Page-by-page functional notes

**`index.html`** — static role-selection cards linking to
`login.html?role=<role>`; shows a dismissable session banner if already
logged in (does not force-redirect, so users can switch roles deliberately).

**`login.html` / `js/login.js`** — role read from `?role=` query param,
`sessionStorage`, or `localStorage`, in that priority order. Three role tabs
re-render title/description/submit-button text and re-apply demo credentials
into the email/password fields (with a retry loop at 50/150/300/600ms plus
`load`/`pageshow` listeners to fight browser password-manager autofill
races). Buyer role shows two additional "demo account" pills (different
category permissions per buyer). Submits via `Auth.login()`, redirects to
`Auth.home(role)`.

**`register.html` / `js/register.js`** — single flat form; client validation
(13-digit numeric tax ID, password ≥ 8 chars, password confirmation match);
calls `Auth.register()` then auto-logs-in and redirects.

**`form.html` / `js/form.js`** (744 lines, most complex after admin) —
multi-step wizard where steps are computed per-role from `STEPS`. Each field's
visibility depends on role (`only()`), selected category (`HIDE`), and
whether the category has sub-categories (`CATS`). Progress bar + per-step tab
bar with "ครบ" (complete) markers. Calculated fields recompute on every input
via `calc()`: Total Cost of Ownership, annual/lifetime CO2, and carbon-credit
value. Includes a full **AI nameplate-scan modal**: live camera capture via
`getUserMedia` with a facing-mode switch, file upload via `FileReader`, 4
canned equipment presets that generate a mock nameplate as an inline SVG
data-URI, and an "apply scanned data to form" step that respects buyer
category permissions. Supports edit mode via `?edit=<id>` or
`sessionStorage.edit_id`, pre-filling from an existing `Store` record and
showing a "returned for correction" banner when relevant. `autofill()` fills
the whole form from a canned example record (`S` in `data.js`) for demo
purposes.

**`submissions.html` / `js/submissions.js`** — buyer/admin-only
(`Auth.require(['buyer','admin'])`). Buyers only see submissions in categories
they have permission for (`Permissions.canView`); admins see everything. 4
stat cards, a category bar chart (plain divs, width set via inline style —
no charting library), filter bar (source/category/status/free-text search
across JSON-stringified values), a data table with 3 status-badge styles,
and a detail modal rendering every non-empty field as a label/value pair. A
"reset mock data" affordance reseeds `Store` from `MOCK_SUBS`.

**`admin.html` / `js/admin.js`** (1386 lines, by far the largest) — single
page with **3 in-page "views"** toggled via `hidden` class (not real
navigation — no URL change, so switching views does not add browser-history
entries):

1. **Dashboard view** — hero banner, 4 metric cards (buyer count, pending
   count, perms count, supplier count, each linking to a view/filter), a
   per-category progress-bar list, and a tabbed table section (buyer
   permissions table ⇄ document-submissions table) with a 5-field filter bar.
2. **Buyer-permissions full-page view** — master/detail layout: left column
   is a searchable buyer list with an inline "add buyer" mini-form; right
   column shows the selected buyer's 14 interactive category toggle-cards,
   4 one-click permission presets (HVAC/Electrical-Safety/Logistics/
   Food-equipment), select-all/clear-all, and save/reset/delete-buyer
   actions.
3. **Supplier-directory full-page view** — 4 stat cards + a searchable,
   status-filterable supplier table.

Plus 4 modals (return-document-to-buyer with quick-remark chips, item detail,
supplier detail with that supplier's submitted items, add-supplier form),
a notification bell dropdown (static demo content), a user-profile dropdown,
and a mobile sidebar toggle/overlay.

### CSS/font loading per page

All 6 pages load Tailwind from `cdn.tailwindcss.com` (with a console-warning
suppressor for the CDN-in-production warning) and `css/style.css`. Google
Font "Prompt" weight ranges vary slightly per page:

| Page | Prompt weights loaded |
|---|---|
| `index.html` | 400;500;600;700;800 |
| `login.html` | 400;500;600;700;800 |
| `register.html` | 400;500;600;700 |
| `form.html` | 400;500;600;700 |
| `submissions.html` | 300;400;500;600;700 |
| `admin.html` | 300;400;500;600;700 |

Three pages (`index.html`, `login.html`, `admin.html`) also carry a page-local
`<style>` block for a background gradient (index/login) or sidebar
active/hover rules (admin) — these are not in the shared `style.css`.

## Decisions (confirmed with user)

1. **No real backend** — keep client-only `localStorage`/`sessionStorage`,
   same keys, same shapes. Pure framework migration.
2. **Build-time Tailwind** — standard Next.js Tailwind setup (compiled at
   build time via config), not the CDN script. Visual output must match
   exactly; every current color is already an arbitrary-value class
   (e.g. `text-[#0b6330]`), which compiles identically either way, so no
   `tailwind.config` color customization is needed.
3. **App Router** — `app/` directory, current Next.js default.
4. **ESLint "ES10"** — Next's scaffolded ESLint config (`eslint-config-next`)
   plus `parserOptions.ecmaVersion: 2019` set explicitly.
5. **Mirror current route names** — `/`, `/login`, `/register`, `/form`,
   `/submissions`, `/admin` (no `.html`), preserving query-param behavior
   (`?role=`, `?edit=`).
6. **Pixel-identical UI/UX** — the overriding constraint (see Goal). No
   shared-component abstraction is introduced across pages unless the
   underlying markup is already byte-identical today.

## Design

### 1. Scaffold & tooling

Run `create-next-app` (TypeScript, Tailwind, ESLint, App Router, no `src/`
directory — matching the current flat repo layout) directly inside
`CMS_BJC`, replacing the static files. Nothing is destroyed irrecoverably:
the repo is git-tracked and clean, so old files remain in history.

- Delete `server.js`, `serve.json`, and the `serve` devDependency.
- `package.json` scripts become the standard `dev`/`build`/`start`/`lint`.
- ESLint: start from the Next.js scaffold's generated config and add
  `parserOptions: { ecmaVersion: 2019 }`.

### 2. Routing — exact 1:1 mapping

| Current file | New route | Notes |
|---|---|---|
| `index.html` | `app/page.tsx` | |
| `login.html` | `app/login/page.tsx` | reads `?role=` via `useSearchParams` |
| `register.html` | `app/register/page.tsx` | |
| `form.html` | `app/form/page.tsx` | reads `?edit=` via `useSearchParams` |
| `submissions.html` | `app/submissions/page.tsx` | |
| `admin.html` | `app/admin/page.tsx` | the 3 "views" stay as in-page React state, not sub-routes — matches current no-URL-change behavior exactly |

Every page is gated by session state read from `sessionStorage`, so every
page is a Client Component (`'use client'`). Next.js here acts as
router/bundler/dev-tooling; it is not introducing server rendering of
anything that currently depends on browser-only state.

### 3. Data/logic layer — ported 1:1

`js/data.js` and `js/common.js` become typed modules under `lib/`, using the
**same localStorage/sessionStorage keys** as today (`portal_subs`,
`portal_session`, `portal_users`, `buyer_category_permissions`,
`portal_suppliers`, `selected_role`):

- `lib/catalog.ts` — `CATS`, `STEPS`, `HIDE`, `CARBON`, typed field-builder
  (`f`, `O`, `only`) and a `Field` type.
- `lib/store.ts` — `Store` (`all`/`put`/`update`/`resetMock`).
- `lib/auth.ts` — `Auth` (`login`/`register`/`require`→`useRequireAuth`
  hook/`logout`/`home`), `SEED`.
- `lib/permissions.ts` — `Permissions`, `DEFAULT_BUYER_PERMS`.
- `lib/suppliers.ts` — `Suppliers`, `DEFAULT_SUPPLIERS`.
- `lib/mockData.ts` — `MOCK_SUBS`, `LABELS_MAP`, the autofill demo record `S`.
- `lib/format.ts` — `esc`, `fdt`, `fmt`, the `J` safe-JSON helper.

**Known, intentional behavior difference:** today `Auth.require()` runs
synchronously in a blocking `<script>` tag and calls `location.replace()`
before first paint, so a logged-out user never sees a flash of protected
content. In React, `useEffect` runs after first render. Every gated page
will render `null` (or a blank shell) until a `useEffect`-driven redirect
check resolves, to prevent any flash of protected UI. This is the one place
where the *mechanism* must differ from the original even though the
end-user-visible result (bounce to `/login`) is identical.

### 4. UI conversion — components per page

Vanilla JS templating (`el.innerHTML = items.map(...).join('')` +
`onclick="fn()"` strings) is replaced by idiomatic React: `.map()` over
`useState` arrays and real event handlers. No `dangerouslySetInnerHTML`.
Every Tailwind class, inline SVG, and Thai string carries over verbatim —
only the DOM-construction mechanism changes.

- **`app/page.tsx`** — role cards, session banner. Static, trivial.
- **`app/login/page.tsx`** — role tabs, buyer demo pills, password
  show/hide, the autofill-race-guard (`setTimeout` chain + `load`/`pageshow`
  listeners), `Auth.login()` + redirect.
- **`app/register/page.tsx`** — single form + validation + `Auth.register()`.
- **`app/form/page.tsx`** — step wizard from `STEPS`, field visibility from
  `HIDE`/`only()`/category, live-calculated fields, the full AI
  nameplate-scan modal (camera/upload/presets/generated SVG — all browser
  APIs, ported as-is), autofill, edit-mode prefill, submit → `Store`.
- **`app/submissions/page.tsx`** — stat cards, category bar chart (plain
  divs, no chart library), filters, permission-scoped category list, table
  with status badges, detail modal, reset-mock-data.
- **`app/admin/page.tsx`** — dashboard view, buyer-permissions full-page
  view (master/detail + 14 category cards + presets), supplier-directory
  full-page view, 4 modals, notification/user dropdowns, mobile sidebar.

**Shared components** (only where markup is already byte-identical across
pages today, to avoid introducing drift risk): `Toast`, a `Modal` shell
(backdrop + click-outside-to-close), `StatusBadge` (3 color variants),
`StatCard`. Per-page headers are **not** unified — index's nav, the
form/submissions header-with-badge, and admin's full topbar+sidebar are
visually distinct today and stay that way.

### 5. Styling & font fidelity

- `css/style.css` moves into `app/globals.css` verbatim, alongside Tailwind's
  directives.
- "Prompt" moves from a `<link>` tag to `next/font/google`, preserving each
  page's current weight range (see table above) — self-hosted, pixel-identical
  glyphs, no external request.
- No `tailwind.config` color customization needed (all brand colors are
  already arbitrary-value classes).
- Page-local `<style>` blocks (index/login gradients, admin sidebar rules)
  move into a CSS Module per page (e.g. `app/page.module.css`,
  `app/login/login.module.css`, `app/admin/admin.module.css`) — same
  declarations, just relocated out of inline `<style>` tags into scoped
  files, avoiding any class-name collision with other pages.

### 6. Verification plan

Run the old static site (`node server.js`, port 3000) and the new Next app
(`next dev`, port 3001) side by side. Port page-by-page in increasing
complexity order: index → register → login → submissions → form → admin.
After each page: click through all three roles (supplier/buyer/admin),
visually compare against the original before moving to the next page, check
browser console for errors/warnings.

Finish with `npm run build`, `npm run lint`, and one full three-role
click-through on the finished app only: register → login (all 3 roles,
including both buyer demo pills) → fill the form via manual entry, via
`autofill()`, and via all 4 nameplate-scan presets → confirm it appears in
submissions → buyer views/edits/receives a return → admin manages buyer
permissions and the supplier directory, returns a document to a buyer.

## Open risks / things to watch during implementation

- **Camera permissions in dev** — `getUserMedia` requires HTTPS or
  `localhost`; `next dev` on `localhost` should be fine, but worth an
  explicit check early since it's the most unusual browser API in play.
- **`next/font/google` weight subsetting** — must request the exact same
  weight list per page (see table) to avoid any font-weight pixel diff.
- **Next.js dev-mode double-render** (React Strict Mode) could double-fire
  `useEffect`-based redirects or camera-start calls; needs a cleanup-aware
  effect (e.g. `stopCamera()` in the effect's cleanup) to avoid leaking a
  camera stream or double-writing to `sessionStorage`.
