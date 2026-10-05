# Supplier Portal Next.js Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Supplier Portal as a Next.js (App Router) + TypeScript + Tailwind app that is pixel-identical to the current static HTML/CSS/JS site, with no backend change (still `localStorage`/`sessionStorage`-only) and ESLint configured for `ecmaVersion: 2019`.

**Architecture:** Port the existing global-script data/auth/permissions layer into typed `lib/` modules with the same storage keys, build small shared UI primitives (`Toast`, `Modal`, `StatusBadge`, `StatCard`), then convert each of the 6 pages into an App Router route one at a time, copying markup/Tailwind classes verbatim into JSX. Admin's 3 in-page "views" stay as React state, not sub-routes.

**Tech Stack:** Next.js (App Router), TypeScript, Tailwind CSS (build-time, not CDN), ESLint (`eslint-config-next` + `ecmaVersion: 2019`), Jest + React Testing Library for unit/component tests, `next/font/google` for the Prompt font.

**Spec:** `docs/superpowers/specs/2026-10-05-nextjs-migration-design.md`

## Global Constraints

- No real backend, database, or server-side auth — keep `localStorage`/`sessionStorage` only, with the exact same keys as today: `portal_subs`, `portal_session`, `portal_users`, `buyer_category_permissions`, `portal_suppliers`, `selected_role`.
- UI/UX must be pixel-identical to the current HTML under every role. Every Tailwind class, inline SVG, color, and Thai string carries over unchanged.
- Routes mirror current filenames without `.html`: `/`, `/login`, `/register`, `/form`, `/submissions`, `/admin`.
- `ecmaVersion: 2019` must be set explicitly in the ESLint config (on top of `eslint-config-next`).
- No new features, no visual redesign, no shared-component abstraction across pages unless the underlying markup is already byte-identical today.
- Admin's 3 "views" (dashboard / buyer-permissions / supplier-directory) stay as in-page React state — no URL change, no new routes.

## Review Focus

- A buyer account with zero assigned categories must see the "no categories assigned, contact Admin" empty-state message on `/submissions` and an empty select on `/form`, not a crash or an empty list rendered as "no results."
- Switching the `category` select on `/form` after some fields were marked invalid (red "bad" border) must re-evaluate which fields are hidden/visible and not leave a hidden field's stale invalid state blocking submission.
- A buyer attempting to open `/form?edit=<id>` for a submission outside their permitted categories must be blocked (alert + redirect to `/submissions`), matching `js/form.js:189-194` today, not silently allowed through.
- Corrupted or non-JSON data in `localStorage` (e.g. a user manually edits dev tools) must not crash the app on load — `J.get` must fall back to the provided default, same as `js/common.js:6` today.
- Admin's "return to buyer" action must set `assignedBuyer` on the record so that only that specific buyer (not all buyers) sees the returned-document alert on `/submissions`, matching `js/submissions.js:5-9`'s `Permissions.canView` gate combined with the record's `category`.

---

## Phase A — Scaffold & Testing Infrastructure

### Task 1: Scaffold Next.js app and relocate static assets

**Files:**
- Create: `CMS_BJC/` scaffolded in place via `create-next-app` (package.json, tsconfig.json, next.config.ts, app/layout.tsx, app/page.tsx, app/globals.css, eslint.config.mjs, .gitignore merge)
- Move: `img/*` → `public/img/*`
- Delete: `server.js`, `serve.json`
- Modify: `package.json` (remove `serve` devDependency and its script; keep `dev`/`build`/`start`/`lint`)

**Interfaces:**
- Produces: a running Next.js dev server at `http://localhost:3000` (temporarily colliding with the old static site — see Step 1 note) serving `/img/*` from `public/img/`, which every later page's `<img src="/img/...">` depends on.

- [ ] **Step 1: Scaffold the app**

Run from one level above `CMS_BJC` so the existing git history is preserved (scaffold into the existing directory):

```bash
cd /Users/lunchakorntangsripairoje/Downloads/CMS_BJC
npx create-next-app@latest . --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-npm
```

When prompted about the directory not being empty, confirm proceeding (it will not overwrite `docs/`, `img/`, `js/`, `css/`, or the `.html` files — those are untouched by the scaffold).

- [ ] **Step 2: Move image assets into `public/`**

```bash
mkdir -p public
git mv img public/img
```

Next.js serves everything under `public/` at the site root, so `<img src="img/logo.png">` becomes `<img src="/img/logo.png">` (leading slash added) in every ported page — note this for later page tasks.

- [ ] **Step 3: Remove the old static server**

```bash
git rm server.js serve.json
```

- [ ] **Step 4: Clean up `package.json` scripts**

Open `package.json`. Remove the `serve` devDependency line and the `"serve": "serve -s -l 3000"` script if `create-next-app` didn't already overwrite them. Confirm the scripts block reads:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint"
}
```

- [ ] **Step 5: Verify the dev server runs**

```bash
npm run dev
```

Expected: server starts on `http://localhost:3000`, and the default Next.js starter page renders with no console errors. Stop the server with Ctrl+C.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js app, move static assets, remove old server"
```

### Task 2: Configure ESLint ecmaVersion and Jest + React Testing Library

**Files:**
- Modify: `eslint.config.mjs`
- Create: `jest.config.ts`
- Create: `jest.setup.ts`
- Modify: `package.json` (add `test` script and test devDependencies)
- Create: `lib/__tests__/sanity.test.ts`

**Interfaces:**
- Produces: `npm test` running Jest with jsdom, `@testing-library/jest-dom` matchers available globally in every later test file.

- [ ] **Step 1: Install test dependencies**

```bash
npm install --save-dev jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @types/jest ts-node
```

- [ ] **Step 2: Add `ecmaVersion: 2019` to the ESLint config**

Open `eslint.config.mjs` (the flat config `create-next-app` generated). Add a `languageOptions.parserOptions.ecmaVersion` entry to the exported config array:

```javascript
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    languageOptions: {
      parserOptions: {
        ecmaVersion: 2019,
      },
    },
  },
];

export default eslintConfig;
```

(Keep whatever `compat.extends(...)` arguments `create-next-app` actually generated — only add the new config object with `languageOptions`.)

- [ ] **Step 3: Create the Jest config using the Next.js preset**

```typescript
// jest.config.ts
import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

const config: Config = {
  testEnvironment: "jsdom",
  setupFilesAfterEach: [],
  setupFilesAfterEach_UNUSED: undefined,
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
};

export default createJestConfig(config);
```

Remove the two unused `setupFilesAfterEach*` lines above — they were a typo check; the config object must only contain:

```typescript
import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

const config: Config = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
};

export default createJestConfig(config);
```

- [ ] **Step 4: Create the Jest setup file**

```typescript
// jest.setup.ts
import "@testing-library/jest-dom";
```

- [ ] **Step 5: Add the `test` script**

In `package.json`, add to `scripts`:

```json
"test": "jest"
```

- [ ] **Step 6: Write a sanity test**

```typescript
// lib/__tests__/sanity.test.ts
describe("jest setup", () => {
  it("runs a basic assertion", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 7: Run the sanity test**

```bash
npm test
```

Expected: PASS, 1 test, 1 suite.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: add ecmaVersion 2019 to ESLint, configure Jest + RTL"
```

---

## Phase B — Ported Data/Logic Modules

### Task 3: `lib/format.ts`, `lib/safeStorage.ts`, `lib/roleLabels.ts`

**Files:**
- Create: `lib/format.ts`
- Create: `lib/safeStorage.ts`
- Create: `lib/roleLabels.ts`
- Test: `lib/__tests__/format.test.ts`
- Test: `lib/__tests__/safeStorage.test.ts`
- Test: `lib/__tests__/roleLabels.test.ts`

**Interfaces:**
- Produces: `esc(v: unknown): string`, `fdt(t: number): string`, `fmt(n: number, d?: number): string` from `lib/format.ts`; `J.get<T>(key: string, def: T): T` and `J.set(key: string, value: unknown): void` from `lib/safeStorage.ts`; `RL: Record<string, [string, string, string]>` from `lib/roleLabels.ts`. Every later `lib/` module imports `J` from `safeStorage.ts`.

- [ ] **Step 1: Write the failing tests**

```typescript
// lib/__tests__/format.test.ts
import { esc, fdt, fmt } from "../format";

describe("esc", () => {
  it("escapes HTML-significant characters", () => {
    expect(esc('<b>"x"&</b>')).toBe("&lt;b&gt;&quot;x&quot;&amp;&lt;/b&gt;");
  });

  it("returns an empty string for null/undefined", () => {
    expect(esc(null)).toBe("");
    expect(esc(undefined)).toBe("");
  });
});

describe("fdt", () => {
  it("formats a timestamp as a Thai medium date/short time string", () => {
    const t = new Date("2026-01-15T09:30:00+07:00").getTime();
    const result = fdt(t);
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });
});

describe("fmt", () => {
  it("formats a number with Thai locale grouping and default 0 decimals", () => {
    expect(fmt(1234567)).toBe("1,234,567");
  });

  it("respects a given decimal count", () => {
    expect(fmt(12.345, 2)).toBe("12.35");
  });
});
```

```typescript
// lib/__tests__/safeStorage.test.ts
import { J } from "../safeStorage";

describe("J (safe localStorage JSON)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns the default when the key is missing", () => {
    expect(J.get("missing_key", "default")).toBe("default");
  });

  it("round-trips an object through set/get", () => {
    J.set("k", { a: 1 });
    expect(J.get("k", null)).toEqual({ a: 1 });
  });

  it("returns the default when stored value is corrupted JSON", () => {
    localStorage.setItem("corrupt", "{not json");
    expect(J.get("corrupt", "fallback")).toBe("fallback");
  });
});
```

```typescript
// lib/__tests__/roleLabels.test.ts
import { RL } from "../roleLabels";

describe("RL", () => {
  it("has an entry for supplier, buyer, and admin", () => {
    expect(RL.supplier[1]).toBe("Supplier");
    expect(RL.buyer[1]).toBe("Buyer");
    expect(RL.admin[1]).toBe("Admin");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- format safeStorage roleLabels
```

Expected: FAIL — modules don't exist yet.

- [ ] **Step 3: Implement the modules**

```typescript
// lib/format.ts
export const esc = (v: unknown): string =>
  String(v ?? "").replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string)
  );

export const fdt = (t: number): string =>
  new Date(t).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" });

export const fmt = (n: number, d = 0): string =>
  n.toLocaleString("th-TH", { maximumFractionDigits: d });
```

```typescript
// lib/safeStorage.ts
export const J = {
  get<T>(key: string, def: T): T {
    try {
      const v = JSON.parse(localStorage.getItem(key) as string);
      return v == null ? def : (v as T);
    } catch {
      return def;
    }
  },
  set(key: string, value: unknown): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // storage unavailable or quota exceeded — ignore, matches original behavior
    }
  },
};
```

```typescript
// lib/roleLabels.ts
export const RL: Record<string, [string, string, string]> = {
  supplier: ["", "Supplier", "bg-green-100 text-green-800"],
  buyer: ["", "Buyer", "bg-green-100 text-green-800"],
  admin: ["", "Admin", "bg-gray-200 text-gray-800"],
};
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- format safeStorage roleLabels
```

Expected: PASS, all suites.

- [ ] **Step 5: Commit**

```bash
git add lib/format.ts lib/safeStorage.ts lib/roleLabels.ts lib/__tests__/format.test.ts lib/__tests__/safeStorage.test.ts lib/__tests__/roleLabels.test.ts
git commit -m "feat: port format/safeStorage/roleLabels utility modules"
```

### Task 4: `lib/catalog.ts` (STEPS/CATS/HIDE/CARBON/S)

**Files:**
- Create: `lib/catalog.ts`
- Test: `lib/__tests__/catalog.test.ts`
- Reference: `js/data.js:1-129` (original source being ported)

**Interfaces:**
- Produces: `Field` type `{ k: string; l: string; t: string; r: "r" | "o" | "n" | "c"; p: string; o: unknown[]; only?: string[] }`; `CATS: Record<string, string[]>`; `CATN: string[]`; `CARBON: string[]`; `HIDE: Record<string, string[]>`; `STEPS: Step[]` where `Step = { id: number; title: string; roles: string[]; groups: { t: string; c: string; f: Field[] }[] }`; `S: Record<string, string | number>` (the autofill demo record). Every `/form` task consumes `STEPS`, `CATS`, `HIDE`, `S`.

- [ ] **Step 1: Write the failing tests**

```typescript
// lib/__tests__/catalog.test.ts
import { CATS, CATN, HIDE, STEPS, S, CARBON } from "../catalog";

describe("catalog data", () => {
  it("CATN matches the keys of CATS", () => {
    expect(CATN).toEqual(Object.keys(CATS));
  });

  it("has exactly 14 categories", () => {
    expect(CATN.length).toBe(14);
  });

  it("every HIDE entry only references field keys that exist somewhere in STEPS", () => {
    const allKeys = new Set(
      STEPS.flatMap((s) => s.groups.flatMap((g) => g.f.map((f) => f.k)))
    );
    for (const [, hiddenKeys] of Object.entries(HIDE)) {
      for (const k of hiddenKeys) {
        if (!CARBON.includes(k)) {
          expect(allKeys.has(k)).toBe(true);
        }
      }
    }
  });

  it("STEPS has 4 steps with the expected roles", () => {
    expect(STEPS).toHaveLength(4);
    expect(STEPS[0].roles).toEqual(["buyer", "admin"]);
    expect(STEPS[1].roles).toEqual(["supplier", "buyer", "admin"]);
  });

  it("the autofill demo record S provides a value for assetName", () => {
    expect(S.assetName).toBe("ตู้แช่เย็น Daikin");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- catalog
```

Expected: FAIL — `lib/catalog.ts` doesn't exist.

- [ ] **Step 3: Implement `lib/catalog.ts` by porting `js/data.js:1-129` verbatim**

Create `lib/catalog.ts` with this structure, copying the exact category names, field definitions, and the `S` demo record from `js/data.js:1-129` word-for-word (same Thai strings, same keys, same values) — only the top is new (types + the `f`/`O`/`only` builder re-typed):

```typescript
// lib/catalog.ts
export type Field = {
  k: string;
  l: string;
  t: string;
  r: "r" | "o" | "n" | "c";
  p: string;
  o: unknown[];
  only?: string[];
};

export type Group = { t: string; c: string; f: Field[] };
export type Step = { id: number; title: string; roles: string[]; groups: Group[] };

const f = (
  k: string,
  l: string,
  t?: string,
  r?: Field["r"],
  p?: string,
  o?: unknown[]
): Field => ({ k, l, t: t || "text", r: r || "r", p: p || "", o: o || [] });

const O = (...a: unknown[]) => a;

const only = (x: Field, ...roles: string[]): Field => {
  x.only = roles;
  return x;
};

// --- Paste js/data.js:4-19 here verbatim (CATS) ---
export const CATS: Record<string, string[]> = {
  /* ... exact contents of js/data.js CATS object ... */
};

export const CATN = Object.keys(CATS);

// --- Paste js/data.js:23 here verbatim (CARBON) ---
export const CARBON = ["ef", "cprice", "co2y", "co2l", "cval"];

// --- Paste js/data.js:24-33 here verbatim (HIDE) ---
export const HIDE: Record<string, string[]> = {
  /* ... exact contents of js/data.js HIDE object ... */
};

// --- Paste js/data.js:34-119 here verbatim (STEPS), using f()/O()/only() above ---
export const STEPS: Step[] = [
  /* ... exact contents of js/data.js STEPS array ... */
];

// --- Paste js/data.js:120-128 here verbatim (S) ---
export const S: Record<string, string | number> = {
  /* ... exact contents of js/data.js S object ... */
};
```

Replace every `/* ... */` placeholder above with the real object/array contents copied character-for-character from `js/data.js` (the file already exists in the repo at that path — this is a direct port, not new content).

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- catalog
```

Expected: PASS, all 5 assertions.

- [ ] **Step 5: Commit**

```bash
git add lib/catalog.ts lib/__tests__/catalog.test.ts
git commit -m "feat: port category/field/wizard catalog data from js/data.js"
```

### Task 5: `lib/mockData.ts` (LABELS_MAP, MOCK_SUBS)

**Files:**
- Create: `lib/mockData.ts`
- Test: `lib/__tests__/mockData.test.ts`
- Reference: `js/common.js:8-78` (LABELS_MAP) and `js/common.js:80-565` (MOCK_SUBS)

**Interfaces:**
- Produces: `LABELS_MAP: Record<string, string>` and `MOCK_SUBS: Submission[]` (see `Submission` type defined in Task 6). `lib/store.ts` consumes `MOCK_SUBS`; detail-view tasks consume `LABELS_MAP`.

- [ ] **Step 1: Write the failing test**

```typescript
// lib/__tests__/mockData.test.ts
import { LABELS_MAP, MOCK_SUBS } from "../mockData";

describe("mockData", () => {
  it("LABELS_MAP has a Thai label for assetName", () => {
    expect(LABELS_MAP.assetName).toBe("Asset Name");
  });

  it("MOCK_SUBS has exactly 6 seed records with unique ids", () => {
    expect(MOCK_SUBS).toHaveLength(6);
    const ids = new Set(MOCK_SUBS.map((r) => r.id));
    expect(ids.size).toBe(6);
  });

  it("every MOCK_SUBS record has a role of supplier or buyer", () => {
    for (const r of MOCK_SUBS) {
      expect(["supplier", "buyer"]).toContain(r.role);
    }
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npm test -- mockData
```

Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Implement `lib/mockData.ts` by porting `js/common.js:8-78` and `:80-565` verbatim**

```typescript
// lib/mockData.ts
import type { Submission } from "./store";

export const LABELS_MAP: Record<string, string> = {
  // Paste js/common.js:9-77 verbatim (every key: 'Thai label' pair)
};

export const MOCK_SUBS: Submission[] = [
  // Paste js/common.js:81-564 verbatim (all 6 mock-001..mock-006 records),
  // adding `labels: LABELS_MAP` on each record exactly as the original does
];
```

Replace the two comment placeholders with the exact contents copied from `js/common.js` at those line ranges — same keys, same Thai strings, same numeric values.

- [ ] **Step 4: Run the test to verify it passes**

```bash
npm test -- mockData
```

Expected: PASS, all 3 assertions.

- [ ] **Step 5: Commit**

```bash
git add lib/mockData.ts lib/__tests__/mockData.test.ts
git commit -m "feat: port field labels and seed submission mock data from js/common.js"
```

### Task 6: `lib/store.ts`

**Files:**
- Create: `lib/store.ts`
- Test: `lib/__tests__/store.test.ts`
- Reference: `js/common.js:568-596`

**Interfaces:**
- Consumes: `J` from `lib/safeStorage.ts`; `MOCK_SUBS` from `lib/mockData.ts`.
- Produces: `Submission` type `{ id: string; role: string; email: string; at: number; status: string; title: string; labels: Record<string, string>; values: Record<string, unknown>; updatedAt?: number; updatedBy?: string; returnReason?: string; returnedAt?: number; returnedBy?: string; assignedBuyer?: string; fixedAt?: number; returnedFixed?: boolean }`; `Store.all(): Submission[]`, `Store.put(r: Submission): void`, `Store.update(id: string, partial: Partial<Submission>): Submission | null`, `Store.resetMock(): Submission[]`. Consumed by `/form`, `/submissions`, `/admin` page tasks.

- [ ] **Step 1: Write the failing tests**

```typescript
// lib/__tests__/store.test.ts
import { Store } from "../store";
import { MOCK_SUBS } from "../mockData";

describe("Store", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("seeds from MOCK_SUBS when localStorage is empty", () => {
    expect(Store.all()).toHaveLength(MOCK_SUBS.length);
  });

  it("put() upserts a record by id", () => {
    const rec = { ...MOCK_SUBS[0], title: "edited title" };
    Store.put(rec);
    const found = Store.all().find((r) => r.id === rec.id);
    expect(found?.title).toBe("edited title");
    expect(Store.all()).toHaveLength(MOCK_SUBS.length);
  });

  it("update() merges a partial record and returns it", () => {
    const target = Store.all()[0];
    const updated = Store.update(target.id, { status: "ส่งคืนให้ Buyer แก้ไข" });
    expect(updated?.status).toBe("ส่งคืนให้ Buyer แก้ไข");
    expect(Store.all().find((r) => r.id === target.id)?.status).toBe(
      "ส่งคืนให้ Buyer แก้ไข"
    );
  });

  it("update() returns null for an unknown id", () => {
    expect(Store.update("nonexistent", { status: "x" })).toBeNull();
  });

  it("resetMock() restores the original 6 seed records", () => {
    Store.put({ ...MOCK_SUBS[0], id: "extra-one" });
    expect(Store.all().length).toBeGreaterThan(MOCK_SUBS.length);
    Store.resetMock();
    expect(Store.all()).toHaveLength(MOCK_SUBS.length);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- store
```

Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Implement `lib/store.ts` by porting `js/common.js:568-596`**

```typescript
// lib/store.ts
import { J } from "./safeStorage";
import { MOCK_SUBS } from "./mockData";

export type Submission = {
  id: string;
  role: string;
  email: string;
  at: number;
  status: string;
  title: string;
  labels: Record<string, string>;
  values: Record<string, unknown>;
  updatedAt?: number;
  updatedBy?: string;
  returnReason?: string;
  returnedAt?: number;
  returnedBy?: string;
  assignedBuyer?: string;
  fixedAt?: number;
  returnedFixed?: boolean;
};

const KEY = "portal_subs";

export const Store = {
  all(): Submission[] {
    let a = J.get<Submission[] | null>(KEY, null);
    if (!a || !Array.isArray(a) || a.length === 0) {
      a = MOCK_SUBS;
      J.set(KEY, a);
    }
    return a;
  },
  put(r: Submission): void {
    const a = Store.all().filter((x) => x.id !== r.id);
    a.push(r);
    J.set(KEY, a);
  },
  update(id: string, partial: Partial<Submission>): Submission | null {
    const list = Store.all();
    const idx = list.findIndex((x) => x.id === id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...partial };
      J.set(KEY, list);
      return list[idx];
    }
    return null;
  },
  resetMock(): Submission[] {
    J.set(KEY, MOCK_SUBS);
    return MOCK_SUBS;
  },
};
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- store
```

Expected: PASS, all 5 assertions.

- [ ] **Step 5: Commit**

```bash
git add lib/store.ts lib/__tests__/store.test.ts
git commit -m "feat: port submission Store CRUD from js/common.js"
```

### Task 7: `lib/auth.ts`

**Files:**
- Create: `lib/auth.ts`
- Test: `lib/__tests__/auth.test.ts`
- Reference: `js/common.js:598-607` (SEED) and `:830-871` (Auth)

**Interfaces:**
- Consumes: `J` from `lib/safeStorage.ts`.
- Produces: `SeedUser` type `{ role: string; email: string; pw: string; company: string; code?: string; status?: string; updatedAtStr?: string }`; `SEED: SeedUser[]`; `Session` type `{ role: string; email: string; name: string; code: string }`; `Auth.users(): SeedUser[]`, `Auth.session(): Session | null`, `Auth.login(role: string, email: string, pw: string): Session | null`, `Auth.register(d: { company: string; taxId: string; contact: string; phone: string; email: string; pw: string }): { ok?: Session | null; error?: string }`, `Auth.home(r: string): string`, `Auth.logout(): void`. The `useRequireAuth` hook (Task 8) wraps `Auth.session`/`Auth.home`. Consumed by `/login`, `/register`, `/form`, `/submissions`, `/admin`.

- [ ] **Step 1: Write the failing tests**

```typescript
// lib/__tests__/auth.test.ts
import { Auth, SEED } from "../auth";

describe("Auth", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("SEED contains the 7 demo accounts", () => {
    expect(SEED).toHaveLength(7);
    expect(SEED.find((u) => u.email === "admin@demo.co.th")?.role).toBe("admin");
  });

  it("login() succeeds with correct seed credentials and stores a session", () => {
    const s = Auth.login("supplier", "supplier@demo.co.th", "demo1234");
    expect(s?.role).toBe("supplier");
    expect(Auth.session()?.email).toBe("supplier@demo.co.th");
  });

  it("login() falls back to matching by email+password across roles", () => {
    const s = Auth.login("admin", "supplier@demo.co.th", "demo1234");
    expect(s?.role).toBe("supplier");
  });

  it("login() returns null for wrong password", () => {
    expect(Auth.login("supplier", "supplier@demo.co.th", "wrong")).toBeNull();
  });

  it("register() rejects a duplicate email", () => {
    const r = Auth.register({
      company: "x",
      taxId: "1",
      contact: "x",
      phone: "x",
      email: "supplier@demo.co.th",
      pw: "demo1234",
    });
    expect(r.error).toBeDefined();
  });

  it("register() creates a new supplier and logs them in", () => {
    const r = Auth.register({
      company: "New Co",
      taxId: "1234567890123",
      contact: "Someone",
      phone: "02-000-0000",
      email: "new-supplier@demo.co.th",
      pw: "demo1234",
    });
    expect(r.ok?.role).toBe("supplier");
    expect(r.error).toBeUndefined();
  });

  it("home() maps role to the correct route", () => {
    expect(Auth.home("supplier")).toBe("/form");
    expect(Auth.home("admin")).toBe("/admin");
    expect(Auth.home("buyer")).toBe("/submissions");
  });

  it("logout() clears the session", () => {
    Auth.login("supplier", "supplier@demo.co.th", "demo1234");
    Auth.logout();
    expect(Auth.session()).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- auth
```

Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Implement `lib/auth.ts`**

Note the route-name change from the original: `Auth.home`/`Auth.logout` use `/form`, `/submissions`, `/admin`, `/login`, `/` (no `.html`), per the spec's route mapping — everything else is a direct port of `js/common.js:598-607,830-871`.

```typescript
// lib/auth.ts
import { J } from "./safeStorage";

export type SeedUser = {
  role: string;
  email: string;
  pw: string;
  company: string;
  code?: string;
  status?: string;
  updatedAtStr?: string;
};

export type Session = { role: string; email: string; name: string; code: string };

export const SEED: SeedUser[] = [
  { role: "supplier", email: "supplier@demo.co.th", pw: "demo1234", company: "บริษัท ตัวอย่างซัพพลาย จำกัด", code: "SUP-00001" },
  { role: "buyer", email: "buyer@demo.co.th", pw: "demo1234", company: "ฝ่ายจัดซื้อ 1 (ระบบทำความเย็น & HVAC)", status: "ใช้งานอยู่", updatedAtStr: "12 มิ.ย. 2568 14:32" },
  { role: "buyer", email: "buyer1@demo.co.th", pw: "demo1234", company: "บริษัท ตัวอย่าง จำกัด", status: "ใช้งานอยู่", updatedAtStr: "12 มิ.ย. 2568 14:32" },
  { role: "buyer", email: "buyer2@demo.co.th", pw: "demo1234", company: "บริษัท เอ็มเอส จำกัด", status: "รออนุมัติ", updatedAtStr: "10 มิ.ย. 2568 09:15" },
  { role: "buyer", email: "buyer3@demo.co.th", pw: "demo1234", company: "ห้างหุ้นส่วนจำกัด เคพี", status: "ใช้งานอยู่", updatedAtStr: "8 มิ.ย. 2568 16:20" },
  { role: "buyer", email: "buyer4@demo.co.th", pw: "demo1234", company: "บริษัท ซัพพลาย จำกัด", status: "ใช้งานอยู่", updatedAtStr: "6 มิ.ย. 2568 11:47" },
  { role: "admin", email: "admin@demo.co.th", pw: "demo1234", company: "ผู้ดูแลระบบ (Admin ตัวอย่าง)" },
];

const SESSION_KEY = "portal_session";
const USERS_KEY = "portal_users";

export const Auth = {
  users(): SeedUser[] {
    return SEED.concat(J.get<SeedUser[]>(USERS_KEY, []));
  },
  session(): Session | null {
    try {
      return JSON.parse(sessionStorage.getItem(SESSION_KEY) as string);
    } catch {
      return null;
    }
  },
  login(role: string, email: string, pw: string): Session | null {
    const cleanMail = (email || "").trim().toLowerCase();
    let u = Auth.users().find(
      (x) => x.role === role && x.email.toLowerCase() === cleanMail && x.pw === pw
    );
    let effectiveRole = role;
    if (!u) {
      u = Auth.users().find((x) => x.email.toLowerCase() === cleanMail && x.pw === pw);
      if (u) effectiveRole = u.role;
    }
    if (!u) return null;
    const s: Session = { role: effectiveRole, email: u.email, name: u.company || u.email, code: u.code || "" };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
    return s;
  },
  register(d: { company: string; taxId: string; contact: string; phone: string; email: string; pw: string }) {
    if (Auth.users().some((x) => x.email.toLowerCase() === d.email.toLowerCase())) {
      return { error: "อีเมลนี้มีบัญชีอยู่แล้ว กรุณาเข้าสู่ระบบ" };
    }
    const us = J.get<SeedUser[]>(USERS_KEY, []);
    us.push({ role: "supplier", code: "SUP-" + String(us.length + 2).padStart(5, "0"), ...d });
    J.set(USERS_KEY, us);
    return { ok: Auth.login("supplier", d.email, d.pw) };
  },
  home(r: string): string {
    return r === "supplier" ? "/form" : r === "admin" ? "/admin" : "/submissions";
  },
  logout(): void {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem("selected_role");
    localStorage.removeItem("selected_role");
  },
};
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- auth
```

Expected: PASS, all 8 assertions.

- [ ] **Step 5: Commit**

```bash
git add lib/auth.ts lib/__tests__/auth.test.ts
git commit -m "feat: port Auth/SEED from js/common.js with new route names"
```

### Task 8: `useRequireAuth` hook

**Files:**
- Create: `lib/useRequireAuth.ts`
- Test: `lib/__tests__/useRequireAuth.test.tsx`

**Interfaces:**
- Consumes: `Auth` from `lib/auth.ts`; `useRouter` from `next/navigation`.
- Produces: `useRequireAuth(roles: string[]): Session | null` — returns `null` on every render until the client-side redirect check resolves (always `null` during SSR/first paint), matching the "no flash of protected content" requirement from the spec. Consumed by `/form`, `/submissions`, `/admin` page tasks.

- [ ] **Step 1: Write the failing tests**

```tsx
// lib/__tests__/useRequireAuth.test.tsx
import { renderHook, waitFor } from "@testing-library/react";
import { useRequireAuth } from "../useRequireAuth";
import { Auth } from "../auth";

const push = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: push }),
}));

describe("useRequireAuth", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    push.mockClear();
  });

  it("redirects to /login?role=<first allowed role> when there is no session", async () => {
    const { result } = renderHook(() => useRequireAuth(["buyer", "admin"]));
    expect(result.current).toBeNull();
    await waitFor(() => expect(push).toHaveBeenCalledWith("/login?role=buyer"));
  });

  it("redirects to that role's home when the session role is not allowed", async () => {
    Auth.login("supplier", "supplier@demo.co.th", "demo1234");
    renderHook(() => useRequireAuth(["admin"]));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/form"));
  });

  it("returns the session once it is valid for one of the allowed roles", async () => {
    Auth.login("admin", "admin@demo.co.th", "demo1234");
    const { result } = renderHook(() => useRequireAuth(["buyer", "admin"]));
    await waitFor(() => expect(result.current?.role).toBe("admin"));
    expect(push).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- useRequireAuth
```

Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Implement the hook**

```typescript
// lib/useRequireAuth.ts
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Auth, type Session } from "./auth";

export function useRequireAuth(roles: string[]): Session | null {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const s = Auth.session();
    if (!s) {
      router.push(`/login?role=${roles[0] || "supplier"}`);
      return;
    }
    if (!roles.includes(s.role)) {
      router.push(Auth.home(s.role));
      return;
    }
    setSession(s);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return session;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- useRequireAuth
```

Expected: PASS, all 3 assertions.

- [ ] **Step 5: Commit**

```bash
git add lib/useRequireAuth.ts lib/__tests__/useRequireAuth.test.tsx
git commit -m "feat: add useRequireAuth hook replacing synchronous Auth.require"
```

### Task 9: `lib/permissions.ts` and `lib/suppliers.ts`

**Files:**
- Create: `lib/permissions.ts`
- Create: `lib/suppliers.ts`
- Test: `lib/__tests__/permissions.test.ts`
- Test: `lib/__tests__/suppliers.test.ts`
- Reference: `js/common.js:609-693` (Permissions) and `:698-828` (Suppliers)

**Interfaces:**
- Consumes: `J` from `lib/safeStorage.ts`; `Auth` from `lib/auth.ts` (for `Permissions.getBuyers`).
- Produces: `DEFAULT_BUYER_PERMS: Record<string, string[]>`; `Permissions.getAll(): Record<string, string[]>`, `.get(email: string): string[]`, `.set(email: string, categories: string[]): string[]`, `.delete(email: string): void`, `.canView(email: string, category: string | undefined, role: string): boolean`, `.getBuyers(): { email: string; name: string; status: string; updatedAtStr: string; categories: string[] }[]`. `Supplier` type `{ code: string; company: string; taxId: string; contact: string; phone: string; email: string; address: string; categories: string[]; status: string; registeredAt: number }`; `DEFAULT_SUPPLIERS: Supplier[]`; `Suppliers.all(): Supplier[]`, `.get(term: string): Supplier | null`, `.save(sup: Partial<Supplier> & { email: string }): void`, `.delete(email: string): void`. Consumed by `/form`, `/submissions`, `/admin`.

- [ ] **Step 1: Write the failing tests**

```typescript
// lib/__tests__/permissions.test.ts
import { Permissions, DEFAULT_BUYER_PERMS } from "../permissions";

describe("Permissions", () => {
  beforeEach(() => localStorage.clear());

  it("get() returns the default categories for a known buyer email (case-insensitive)", () => {
    expect(Permissions.get("BUYER@demo.co.th")).toEqual(
      DEFAULT_BUYER_PERMS["buyer@demo.co.th"]
    );
  });

  it("get() returns an empty array for an unknown email", () => {
    expect(Permissions.get("nobody@demo.co.th")).toEqual([]);
  });

  it("set() then get() round-trips custom categories", () => {
    Permissions.set("buyer@demo.co.th", ["Chiller"]);
    expect(Permissions.get("buyer@demo.co.th")).toEqual(["Chiller"]);
  });

  it("canView() is always true for admin and supplier regardless of category", () => {
    expect(Permissions.canView("x@x.com", "Anything", "admin")).toBe(true);
    expect(Permissions.canView("x@x.com", "Anything", "supplier")).toBe(true);
  });

  it("canView() is true for a buyer only within their assigned categories", () => {
    expect(Permissions.canView("buyer@demo.co.th", "Chiller", "buyer")).toBe(true);
    expect(Permissions.canView("buyer@demo.co.th", "Fork lift", "buyer")).toBe(false);
  });

  it("canView() is false for a buyer with no category given", () => {
    expect(Permissions.canView("buyer@demo.co.th", undefined, "buyer")).toBe(false);
  });
});
```

```typescript
// lib/__tests__/suppliers.test.ts
import { Suppliers, DEFAULT_SUPPLIERS } from "../suppliers";

describe("Suppliers", () => {
  beforeEach(() => localStorage.clear());

  it("all() seeds from DEFAULT_SUPPLIERS when empty", () => {
    expect(Suppliers.all().length).toBeGreaterThanOrEqual(DEFAULT_SUPPLIERS.length);
  });

  it("get() finds a supplier by code, email, or company substring", () => {
    expect(Suppliers.get("SUP-00001")?.company).toContain("ตัวอย่างซัพพลาย");
    expect(Suppliers.get("supplier@demo.co.th")?.code).toBe("SUP-00001");
  });

  it("save() adds a new supplier when the email is new", () => {
    Suppliers.save({
      company: "New Supplier Co",
      taxId: "1111111111111",
      contact: "Someone",
      phone: "02-111-1111",
      email: "new@sup.co.th",
      address: "Somewhere",
      categories: ["Chiller"],
      status: "อนุมัติแล้ว",
      registeredAt: Date.now(),
    });
    expect(Suppliers.get("new@sup.co.th")?.company).toBe("New Supplier Co");
  });

  it("save() updates an existing supplier matched by email", () => {
    Suppliers.save({ email: "supplier@demo.co.th", company: "Renamed Co" });
    expect(Suppliers.get("supplier@demo.co.th")?.company).toBe("Renamed Co");
  });

  it("delete() removes a supplier by email", () => {
    Suppliers.delete("supplier@demo.co.th");
    expect(Suppliers.get("supplier@demo.co.th")).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- permissions suppliers
```

Expected: FAIL — modules don't exist.

- [ ] **Step 3: Implement `lib/permissions.ts` by porting `js/common.js:609-693`**

```typescript
// lib/permissions.ts
import { J } from "./safeStorage";
import { Auth } from "./auth";

export const DEFAULT_BUYER_PERMS: Record<string, string[]> = {
  "buyer@demo.co.th": ["Chiller", "Refrigeration system", "Air condition / AHU", "Cooling tower"],
  "buyer1@demo.co.th": ["Refrigeration system", "Chiller", "Electrical system"],
  "buyer2@demo.co.th": ["Safety Equipment", "Logistic Equipment"],
  "buyer3@demo.co.th": ["Chiller", "Super Equipment"],
  "buyer4@demo.co.th": ["Refrigeration system", "Electrical system", "Logistic Equipment"],
};

const KEY = "buyer_category_permissions";

export const Permissions = {
  key: KEY,
  getAll(): Record<string, string[]> {
    let custom = J.get<Record<string, string[]> | null>(KEY, null);
    if (!custom || typeof custom !== "object" || Array.isArray(custom)) {
      custom = { ...DEFAULT_BUYER_PERMS };
      J.set(KEY, custom);
    }
    return custom;
  },
  get(email: string): string[] {
    if (!email) return [];
    const all = Permissions.getAll();
    const mail = String(email).trim().toLowerCase();
    const foundKey = Object.keys(all).find((k) => k.toLowerCase() === mail);
    if (foundKey && Array.isArray(all[foundKey])) return all[foundKey];
    const defKey = Object.keys(DEFAULT_BUYER_PERMS).find((k) => k.toLowerCase() === mail);
    if (defKey) return DEFAULT_BUYER_PERMS[defKey];
    return [];
  },
  set(email: string, categories: string[]): string[] {
    if (!email) return [];
    const all = Permissions.getAll();
    const mail = String(email).trim().toLowerCase();
    all[mail] = Array.isArray(categories) ? categories : [];
    J.set(KEY, all);
    return all[mail];
  },
  delete(email: string): void {
    if (!email) return;
    const all = Permissions.getAll();
    delete all[String(email).trim().toLowerCase()];
    J.set(KEY, all);
  },
  canView(email: string, category: string | undefined, role: string): boolean {
    if (role === "admin" || role === "supplier") return true;
    if (!category) return false;
    const allowed = Permissions.get(email);
    if (!Array.isArray(allowed) || allowed.length === 0) return false;
    const catClean = String(category).trim().toLowerCase();
    return allowed.some((a) => String(a).trim().toLowerCase() === catClean);
  },
  getBuyers() {
    const users = Auth.users().filter((u) => u.role === "buyer");
    const allPerms = Permissions.getAll();
    const map = new Map<
      string,
      { email: string; name: string; status: string; updatedAtStr: string; categories: string[] }
    >();
    users.forEach((u) => {
      const lower = u.email.toLowerCase();
      map.set(lower, {
        email: u.email,
        name: u.company || u.email,
        status: u.status || "ใช้งานอยู่",
        updatedAtStr: u.updatedAtStr || "12 มิ.ย. 2568 14:32",
        categories: Permissions.get(u.email),
      });
    });
    Object.keys(allPerms).forEach((k) => {
      const lower = k.toLowerCase();
      if (!map.has(lower)) {
        map.set(lower, {
          email: k,
          name: "Buyer (" + k.split("@")[0] + ")",
          status: "ใช้งานอยู่",
          updatedAtStr: "12 มิ.ย. 2568 14:32",
          categories: Permissions.get(k),
        });
      }
    });
    return Array.from(map.values());
  },
};
```

- [ ] **Step 4: Implement `lib/suppliers.ts` by porting `js/common.js:698-828`**

```typescript
// lib/suppliers.ts
import { J } from "./safeStorage";

export type Supplier = {
  code: string;
  company: string;
  taxId: string;
  contact: string;
  phone: string;
  email: string;
  address: string;
  categories: string[];
  status: string;
  registeredAt: number;
};

type RegisteredUser = {
  role: string;
  email: string;
  code?: string;
  company?: string;
  name?: string;
  taxId?: string;
  contact?: string;
  phone?: string;
  address?: string;
  categories?: string[];
  status?: string;
  registeredAt?: number;
};

export const DEFAULT_SUPPLIERS: Supplier[] = [
  // Paste js/common.js:699-771 verbatim (all 6 DEFAULT_SUPPLIERS records)
];

const KEY = "portal_suppliers";

export const Suppliers = {
  key: KEY,
  all(): Supplier[] {
    let list = J.get<Supplier[] | null>(KEY, null);
    if (!list || !Array.isArray(list)) {
      list = [...DEFAULT_SUPPLIERS];
      J.set(KEY, list);
    }
    const regUsers = J.get<RegisteredUser[]>("portal_users", []).filter(
      (u) => u.role === "supplier"
    );
    regUsers.forEach((u) => {
      if (!list!.some((s) => s.email.toLowerCase() === u.email.toLowerCase())) {
        list!.push({
          code: u.code || "SUP-" + String(list!.length + 1).padStart(5, "0"),
          company: u.company || u.name || u.email,
          taxId: u.taxId || "-",
          contact: u.contact || "-",
          phone: u.phone || "-",
          email: u.email,
          address: u.address || "-",
          categories: u.categories || [],
          status: u.status || "อนุมัติแล้ว",
          registeredAt: u.registeredAt || Date.now(),
        });
      }
    });
    return list;
  },
  get(term: string): Supplier | null {
    const q = String(term || "").toLowerCase().trim();
    if (!q) return null;
    return (
      Suppliers.all().find(
        (s) =>
          s.email.toLowerCase() === q ||
          s.code.toLowerCase() === q ||
          s.company.toLowerCase().includes(q)
      ) || null
    );
  },
  save(sup: Partial<Supplier> & { email: string }): void {
    const list = Suppliers.all();
    const idx = list.findIndex((s) => s.email.toLowerCase() === sup.email.toLowerCase());
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...sup };
    } else {
      const code = sup.code || "SUP-" + String(list.length + 1).padStart(5, "0");
      list.push({ ...(sup as Supplier), code });
    }
    J.set(KEY, list);
  },
  delete(email: string): void {
    const list = Suppliers.all().filter((s) => s.email.toLowerCase() !== email.toLowerCase());
    J.set(KEY, list);
  },
};
```

Replace the `DEFAULT_SUPPLIERS` comment placeholder with the 6 records copied verbatim from `js/common.js:699-771`.

- [ ] **Step 5: Run tests to verify they pass**

```bash
npm test -- permissions suppliers
```

Expected: PASS, all 10 assertions.

- [ ] **Step 6: Commit**

```bash
git add lib/permissions.ts lib/suppliers.ts lib/__tests__/permissions.test.ts lib/__tests__/suppliers.test.ts
git commit -m "feat: port Permissions and Suppliers modules from js/common.js"
```

---

## Phase C — Shared UI Primitives

### Task 10: `Toast` component and `useToast` hook

**Files:**
- Create: `components/Toast.tsx`
- Create: `lib/useToast.ts`
- Test: `components/__tests__/Toast.test.tsx`

**Interfaces:**
- Produces: `useToast(): { message: string; visible: boolean; show: (msg: string) => void }`; `<Toast message={string} visible={boolean} />`. Every page task that needs a toast calls `const { message, visible, show } = useToast()` and renders `<Toast message={message} visible={visible} />` once, matching the original's single `#toast` div per page (`js/common.js:3`).

- [ ] **Step 1: Write the failing tests**

```tsx
// components/__tests__/Toast.test.tsx
import { render, screen } from "@testing-library/react";
import { renderHook, act } from "@testing-library/react";
import { Toast } from "../Toast";
import { useToast } from "../../lib/useToast";

describe("Toast", () => {
  it("renders nothing visible when visible is false", () => {
    render(<Toast message="" visible={false} />);
    expect(screen.getByTestId("toast")).toHaveClass("hidden");
  });

  it("shows the message text when visible is true", () => {
    render(<Toast message="Saved!" visible={true} />);
    expect(screen.getByTestId("toast")).not.toHaveClass("hidden");
    expect(screen.getByText("Saved!")).toBeInTheDocument();
  });
});

describe("useToast", () => {
  jest.useFakeTimers();

  it("shows a message then auto-hides after 2200ms", () => {
    const { result } = renderHook(() => useToast());
    act(() => result.current.show("Hello"));
    expect(result.current.visible).toBe(true);
    expect(result.current.message).toBe("Hello");
    act(() => jest.advanceTimersByTime(2200));
    expect(result.current.visible).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- Toast useToast
```

Expected: FAIL — modules don't exist.

- [ ] **Step 3: Implement `components/Toast.tsx` and `lib/useToast.ts`**

Port of `js/common.js:3` (`const toast=m=>{...}`), split into a presentational component and a hook so each page owns its own toast state:

```tsx
// components/Toast.tsx
type ToastProps = { message: string; visible: boolean };

export function Toast({ message, visible }: ToastProps) {
  return (
    <div
      data-testid="toast"
      className={`${
        visible ? "" : "hidden "
      }fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm px-5 py-2.5 rounded-full shadow-lg z-50 transition-all font-medium`}
    >
      {message}
    </div>
  );
}
```

```typescript
// lib/useToast.ts
"use client";

import { useCallback, useRef, useState } from "react";

export function useToast() {
  const [message, setMessage] = useState("");
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((msg: string) => {
    setMessage(msg);
    setVisible(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setVisible(false), 2200);
  }, []);

  return { message, visible, show };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- Toast useToast
```

Expected: PASS, all 3 assertions.

- [ ] **Step 5: Commit**

```bash
git add components/Toast.tsx lib/useToast.ts components/__tests__/Toast.test.tsx
git commit -m "feat: add Toast component and useToast hook"
```

### Task 11: `Modal` shell component

**Files:**
- Create: `components/Modal.tsx`
- Test: `components/__tests__/Modal.test.tsx`

**Interfaces:**
- Produces: `<Modal open={boolean} onClose={() => void} maxWidthClassName?={string}>{children}</Modal>` — a fixed-position backdrop (`bg-black/40` or `bg-black/60` depending on `maxWidthClassName`'s caller) that closes on backdrop click but not on content click, matching the `onclick="if(event.target==this)..."` pattern used on every modal in `admin.html`/`form.html`/`submissions.html`. Consumed by every modal in the `/form`, `/submissions`, `/admin` page tasks.

- [ ] **Step 1: Write the failing tests**

```tsx
// components/__tests__/Modal.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { Modal } from "../Modal";

describe("Modal", () => {
  it("renders nothing visible when open is false", () => {
    render(
      <Modal open={false} onClose={jest.fn()}>
        <p>content</p>
      </Modal>
    );
    expect(screen.getByTestId("modal-backdrop")).toHaveClass("hidden");
  });

  it("renders children when open is true", () => {
    render(
      <Modal open={true} onClose={jest.fn()}>
        <p>content</p>
      </Modal>
    );
    expect(screen.getByText("content")).toBeInTheDocument();
  });

  it("calls onClose when the backdrop itself is clicked", () => {
    const onClose = jest.fn();
    render(
      <Modal open={true} onClose={onClose}>
        <p>content</p>
      </Modal>
    );
    fireEvent.click(screen.getByTestId("modal-backdrop"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not call onClose when the content panel is clicked", () => {
    const onClose = jest.fn();
    render(
      <Modal open={true} onClose={onClose}>
        <p>content</p>
      </Modal>
    );
    fireEvent.click(screen.getByText("content"));
    expect(onClose).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- Modal
```

Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Implement `components/Modal.tsx`**

```tsx
// components/Modal.tsx
import type { ReactNode } from "react";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  maxWidthClassName?: string;
};

export function Modal({ open, onClose, children, maxWidthClassName = "max-w-2xl" }: ModalProps) {
  return (
    <div
      data-testid="modal-backdrop"
      className={`${
        open ? "" : "hidden "
      }fixed inset-0 bg-black/40 z-40 flex items-start justify-center p-4 overflow-y-auto`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`bg-white rounded-2xl w-full ${maxWidthClassName} my-8 p-6 shadow-xl`}>
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- Modal
```

Expected: PASS, all 4 assertions.

- [ ] **Step 5: Commit**

```bash
git add components/Modal.tsx components/__tests__/Modal.test.tsx
git commit -m "feat: add shared Modal shell component"
```

### Task 12: `StatusBadge` and `StatCard` components

**Files:**
- Create: `components/StatusBadge.tsx`
- Create: `components/StatCard.tsx`
- Test: `components/__tests__/StatusBadge.test.tsx`
- Test: `components/__tests__/StatCard.test.tsx`

**Interfaces:**
- Produces: `<StatusBadge status={string} />` rendering one of 3 color variants (pending amber / done emerald / returned rose) matching `js/submissions.js:111-133`; `<StatCard label={string} value={number | string} colorClassName?={string} actionLabel?={string} onAction?={() => void} />` matching the 4-stat-card pattern repeated in `submissions.html` and `admin.html`. Consumed by `/submissions` and `/admin` page tasks.

- [ ] **Step 1: Write the failing tests**

```tsx
// components/__tests__/StatusBadge.test.tsx
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "../StatusBadge";

describe("StatusBadge", () => {
  it("renders the rose 'returned' style for ส่งคืนให้ Buyer แก้ไข", () => {
    render(<StatusBadge status="ส่งคืนให้ Buyer แก้ไข" />);
    expect(screen.getByText("ส่งคืนให้ Buyer แก้ไข")).toHaveClass("text-rose-700");
  });

  it("renders the emerald 'done' style for ตรวจ/แก้ไขแล้ว", () => {
    render(<StatusBadge status="ตรวจ/แก้ไขแล้ว" />);
    expect(screen.getByText("ตรวจ/แก้ไขแล้ว")).toHaveClass("text-emerald-700");
  });

  it("renders the amber 'pending' style for any other status", () => {
    render(<StatusBadge status="รอ Buyer ตรวจ" />);
    expect(screen.getByText("รอ Buyer ตรวจ")).toHaveClass("text-amber-700");
  });
});
```

```tsx
// components/__tests__/StatCard.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { StatCard } from "../StatCard";

describe("StatCard", () => {
  it("renders the label and value", () => {
    render(<StatCard label="ทั้งหมด" value={12} />);
    expect(screen.getByText("ทั้งหมด")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
  });

  it("renders an action link and fires onAction when clicked", () => {
    const onAction = jest.fn();
    render(
      <StatCard label="รออนุมัติ" value={2} actionLabel="ดูรายละเอียด" onAction={onAction} />
    );
    fireEvent.click(screen.getByText("ดูรายละเอียด"));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it("renders no action link when actionLabel is omitted", () => {
    render(<StatCard label="ทั้งหมด" value={12} />);
    expect(screen.queryByRole("button")).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- StatusBadge StatCard
```

Expected: FAIL — modules don't exist.

- [ ] **Step 3: Implement both components**

Port of `js/submissions.js:111-133` (status badge markup) and the repeated stat-card `<div>` block from `submissions.html:49-53` / `admin.html:264-347`:

```tsx
// components/StatusBadge.tsx
const VARIANTS: Record<string, { dot: string; wrap: string }> = {
  "ส่งคืนให้ Buyer แก้ไข": {
    dot: "bg-rose-500 animate-pulse",
    wrap: "bg-rose-50 text-rose-700 border-rose-200",
  },
  "ตรวจ/แก้ไขแล้ว": {
    dot: "bg-emerald-500",
    wrap: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
};

const DEFAULT_VARIANT = { dot: "bg-amber-500", wrap: "bg-amber-50 text-amber-700 border-amber-200" };

export function StatusBadge({ status }: { status: string }) {
  const v = VARIANTS[status] || DEFAULT_VARIANT;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${v.wrap}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${v.dot}`} />
      <span>{status || "รอ Buyer ตรวจ"}</span>
    </span>
  );
}
```

```tsx
// components/StatCard.tsx
type StatCardProps = {
  label: string;
  value: number | string;
  colorClassName?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function StatCard({
  label,
  value,
  colorClassName = "text-gray-900",
  actionLabel,
  onAction,
}: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-xs p-4 border border-gray-100">
      <div className="text-xs text-gray-500 font-medium">{label}</div>
      <div className={`text-3xl font-bold ${colorClassName} mt-1`}>{value}</div>
      {actionLabel ? (
        <button
          type="button"
          onClick={onAction}
          className="text-xs text-emerald-700 font-semibold hover:underline flex items-center gap-1 mt-3"
        >
          <span>{actionLabel}</span>
          <span>&rarr;</span>
        </button>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- StatusBadge StatCard
```

Expected: PASS, all 6 assertions.

- [ ] **Step 5: Commit**

```bash
git add components/StatusBadge.tsx components/StatCard.tsx components/__tests__/StatusBadge.test.tsx components/__tests__/StatCard.test.tsx
git commit -m "feat: add StatusBadge and StatCard shared components"
```

---

## Phase D — Page Conversion

### Task 13: Root layout, global styles, and the Prompt font

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`
- Reference: `css/style.css` (all 69 lines), `index.html:1-22` (font `<link>` weights 400–800)

**Interfaces:**
- Produces: the `<html lang="th">` shell every page renders inside; the `.inp`, `.fadein`, `.brand` CSS classes and `:root` safe-area padding available globally; a `promptFont.className` (or CSS variable) applied to `<body>` so every page gets the Prompt font without a per-page `<link>` tag.

- [ ] **Step 1: Replace `app/globals.css` with Tailwind directives plus the ported `css/style.css`**

```css
/* app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  box-sizing: border-box;
  padding-top: env(safe-area-inset-top, 0px);
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

html {
  scroll-padding-top: env(safe-area-inset-top, 0px);
}

body {
  background: #f3f4f6;
  color: #0f172a;
  min-height: 100%;
}

.inp {
  width: 100%;
  border: 1.5px solid #cbd5e1;
  border-radius: 10px;
  padding: 0.55rem 0.75rem;
  background: #fff;
  font-size: 0.9rem;
  outline: none;
  transition: border 0.15s, box-shadow 0.15s;
}

.inp:focus {
  border-color: #15803d;
  box-shadow: 0 0 0 3px #15803d33;
}

.inp.bad {
  border-color: #dc2626;
  background: #fef2f2;
}

.inp[readonly] {
  background: #f1f5f9;
  color: #475569;
}

.fadein {
  animation: f 0.25s ease;
}

@keyframes f {
  from {
    opacity: 0.4;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .fadein {
    animation: none;
  }
}

.brand {
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #15803d;
}
```

Note: the original `body { font-family: 'Prompt', system-ui, sans-serif }` rule is intentionally dropped from here — Step 2 applies the font via `next/font/google` on `<body>` instead, which is the idiomatic Next.js approach and produces the same rendered font.

- [ ] **Step 2: Load the Prompt font via `next/font/google` in the root layout**

```tsx
// app/layout.tsx
import type { Metadata } from "next";
import { Prompt } from "next/font/google";
import "./globals.css";

const prompt = Prompt({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-prompt",
});

export const metadata: Metadata = {
  title: "SUPPLIER PORTAL",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className={`${prompt.variable} font-[family-name:var(--font-prompt)] antialiased`}>
        {children}
      </body>
    </html>
  );
}
```

Loading the full union of weights used across all 6 pages (300–800) on every page keeps this simple and still pixel-identical — Next.js font loading only ships the glyphs/weights actually referenced by rendered CSS, so this does not add visual weight differences, only guarantees every page's weight is available.

- [ ] **Step 3: Verify the dev server still runs with no console errors**

```bash
npm run dev
```

Visit `http://localhost:3000` — expect the default Next.js page (not yet replaced) to render using the Prompt font, confirmed visually or via dev tools' computed font-family. Stop the server.

- [ ] **Step 4: Commit**

```bash
git add app/layout.tsx app/globals.css
git commit -m "feat: set up root layout with ported global styles and Prompt font"
```

### Task 14: Index page (`/`)

**Files:**
- Create: `app/page.module.css`
- Modify: `app/page.tsx`
- Test: `app/__tests__/page.test.tsx`
- Reference: `index.html:1-210` (full file)

**Interfaces:**
- Consumes: `Auth` from `lib/auth.ts`; `RL` from `lib/roleLabels.ts`.
- Produces: the `/` route. No other task consumes this page's exports.

- [ ] **Step 1: Write the failing test**

```tsx
// app/__tests__/page.test.tsx
import { render, screen } from "@testing-library/react";
import Page from "../page";
import { Auth } from "../../lib/auth";

describe("/ index page", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("renders the three role cards", () => {
    render(<Page />);
    expect(screen.getByText("Supplier")).toBeInTheDocument();
    expect(screen.getByText("Buyer")).toBeInTheDocument();
    expect(screen.getByText("Admin")).toBeInTheDocument();
  });

  it("hides the session banner when logged out", () => {
    render(<Page />);
    expect(screen.getByTestId("session-banner")).toHaveClass("hidden");
  });

  it("shows the session banner with the user's name and role when logged in", () => {
    Auth.login("admin", "admin@demo.co.th", "demo1234");
    render(<Page />);
    expect(screen.getByTestId("session-banner")).not.toHaveClass("hidden");
    expect(screen.getByTestId("session-user").textContent).toContain("Admin");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npm test -- app/__tests__/page.test.tsx
```

Expected: FAIL — `app/page.tsx` still renders the Next.js starter content.

- [ ] **Step 3: Implement `app/page.tsx`**

Port of `index.html:36-210`. The page-local gradient background (`index.html:17-22`) moves into `app/page.module.css`:

```css
/* app/page.module.css */
.bg {
  background: radial-gradient(circle at 50% 25%, #ffffff 0%, #f6fbf7 55%, #eaf5ec 100%);
  min-height: 100vh;
  overflow-x: hidden;
  position: relative;
}

.sparks {
  animation: pulse 2.5s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.75;
    transform: scale(0.95);
  }
}
```

```tsx
// app/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Auth, type Session } from "../lib/auth";
import { RL } from "../lib/roleLabels";
import styles from "./page.module.css";

function selectRole(role: string) {
  sessionStorage.setItem("selected_role", role);
  localStorage.setItem("selected_role", role);
}

export default function Page() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    setSession(Auth.session());
  }, []);

  const roleCards: { role: string; img: string; label: string }[] = [
    { role: "supplier", img: "/img/supplier.png", label: "Supplier" },
    { role: "buyer", img: "/img/buyer.png", label: "Buyer" },
    { role: "admin", img: "/img/admin.png", label: "Admin" },
  ];

  return (
    <div className={`flex flex-col min-h-screen text-slate-800 antialiased relative ${styles.bg}`}>
      <nav className="w-full bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.03)] sticky top-0 z-30">
        <div className="w-full px-6 md:px-12 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <Image src="/img/logo.png" alt="Supplier Portal" width={32} height={32} className="w-8 h-8 object-contain group-hover:scale-105 transition-transform drop-shadow-sm" />
            <span className="font-bold text-xl text-gray-900 tracking-tight group-hover:text-[#0b6330] transition-colors">
              Supplier Portal
            </span>
          </Link>
          <div>
            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 text-xs md:text-sm font-semibold text-[#0b6330] hover:text-white bg-green-50 hover:bg-[#0b6330] border border-green-200 px-4 py-2 rounded-full transition-all shadow-sm"
            >
              <span>ลงทะเบียน Supplier</span>
              <span className="text-xs">&rarr;</span>
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 relative z-10">
        <div className="w-full max-w-5xl mx-auto text-center">
          <div
            data-testid="session-banner"
            className={`${
              session ? "" : "hidden "
            }max-w-xl mx-auto mb-6 bg-white/95 backdrop-blur border border-green-300 shadow-md rounded-full px-5 py-2.5 flex items-center justify-between gap-3 text-xs md:text-sm`}
          >
            <div className="flex items-center gap-2 truncate">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shrink-0" />
              <span className="text-gray-600 truncate">
                เข้าสู่ระบบอยู่ในชื่อ:{" "}
                <strong data-testid="session-user" className="text-green-800 font-semibold">
                  {session ? `${session.name} (${RL[session.role]?.[1] || session.role})` : ""}
                </strong>
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href={session ? Auth.home(session.role) : "#"}
                className="bg-green-700 hover:bg-green-800 text-white font-medium px-3.5 py-1 rounded-full text-xs shadow-sm transition-colors"
              >
                หน้าระบบ &rarr;
              </Link>
              <button
                onClick={() => {
                  Auth.logout();
                  setSession(null);
                }}
                className="text-gray-500 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded-full text-xs transition-colors"
              >
                ออกจากระบบ
              </button>
            </div>
          </div>

          <div className="mb-8">
            <div className="relative inline-block">
              <h1 className="font-extrabold text-4xl sm:text-5xl md:text-6xl text-[#0b6330] tracking-wider">
                SUPPLIER PORTAL
              </h1>
              <svg
                className={`${styles.sparks} absolute -top-3 -right-6 sm:-right-8 w-7 h-7 sm:w-8 sm:h-8 text-[#0b6330]`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.8}
                strokeLinecap="round"
              >
                <line x1="8" y1="18" x2="3" y2="23" />
                <line x1="16" y1="14" x2="19" y2="9" />
                <line x1="22" y1="20" x2="16" y2="18" />
              </svg>
            </div>
            <p className="text-gray-600 text-base md:text-lg mt-2 font-medium">
              ระบบรับข้อมูลทรัพย์สินและเครื่องจักรจาก Supplier
            </p>
            <div className="w-14 h-1.5 bg-[#0b6330] rounded-full mx-auto mt-3" />
          </div>

          <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto my-4">
            {roleCards.map(({ role, img, label }) => (
              <Link
                key={role}
                href={`/login?role=${role}`}
                onClick={() => selectRole(role)}
                className="group bg-white rounded-3xl p-7 border border-gray-100 shadow-[0_10px_25px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_35px_rgba(11,99,48,0.12)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col items-center justify-between text-center cursor-pointer no-underline"
              >
                <div className="flex flex-col items-center">
                  <div className="w-28 h-28 mb-3 flex items-center justify-center">
                    <Image src={img} alt={label} width={112} height={112} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" />
                  </div>
                  <h2 className="font-bold text-xl text-gray-900 group-hover:text-[#0b6330] transition-colors">
                    {label}
                  </h2>
                </div>
                <div className="mt-6 w-full sm:w-auto px-7 py-2.5 rounded-full bg-[#eaf6ec] group-hover:bg-[#0b6330] text-[#0b6330] group-hover:text-white font-semibold text-sm transition-all duration-200 border border-[#c5e6cb] shadow-sm inline-flex items-center justify-center gap-1.5">
                  <span>เข้าสู่ระบบ {label}</span>
                  <span className="text-base leading-none">&rarr;</span>
                </div>
              </Link>
            ))}
          </div>

          <p className="text-center text-xs md:text-sm text-gray-600 mt-6 relative z-10">
            Supplier รายใหม่?
            <Link href="/register" className="text-[#0b6330] font-bold hover:underline ml-1">
              ลงทะเบียนที่นี่
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npm test -- app/__tests__/page.test.tsx
```

Expected: PASS, all 3 assertions.

- [ ] **Step 5: Manually compare against the original**

With both `node server.js` (port 3000, serving the untouched `index.html`) and `npm run dev` (port 3001 — pass `-p 3001`) running, open both in side-by-side browser windows and confirm layout, colors, spacing, and the 3 role cards look identical. Click each role card and confirm it navigates to `/login?role=<role>`.

- [ ] **Step 6: Commit**

```bash
git add app/page.tsx app/page.module.css app/__tests__/page.test.tsx
git commit -m "feat: convert index.html to the / route"
```

### Task 15: Register page (`/register`)

**Files:**
- Modify: `app/register/page.tsx` (create the `register/` directory)
- Test: `app/register/__tests__/page.test.tsx`
- Reference: `register.html:1-25`, `js/register.js:1-9`

**Interfaces:**
- Consumes: `Auth` from `lib/auth.ts`.
- Produces: the `/register` route.

- [ ] **Step 1: Write the failing tests**

```tsx
// app/register/__tests__/page.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import Page from "../page";

const push = jest.fn();
jest.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

function fillValid() {
  fireEvent.change(screen.getByLabelText(/ชื่อบริษัท/), { target: { value: "Test Co" } });
  fireEvent.change(screen.getByLabelText(/เลขประจำตัวผู้เสียภาษี/), { target: { value: "1234567890123" } });
  fireEvent.change(screen.getByLabelText(/ชื่อผู้ติดต่อ/), { target: { value: "Someone" } });
  fireEvent.change(screen.getByLabelText(/เบอร์โทรศัพท์/), { target: { value: "0211111111" } });
  fireEvent.change(screen.getByLabelText(/^อีเมล/), { target: { value: "unique-reg@sup.co.th" } });
  fireEvent.change(screen.getByLabelText(/^รหัสผ่าน/), { target: { value: "password1" } });
  fireEvent.change(screen.getByLabelText(/ยืนยันรหัสผ่าน/), { target: { value: "password1" } });
}

describe("/register page", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    push.mockClear();
  });

  it("rejects a tax ID that is not exactly 13 digits", () => {
    render(<Page />);
    fillValid();
    fireEvent.change(screen.getByLabelText(/เลขประจำตัวผู้เสียภาษี/), { target: { value: "123" } });
    fireEvent.click(screen.getByText("ลงทะเบียน"));
    expect(screen.getByText(/13 หลัก/)).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it("rejects a password shorter than 8 characters", () => {
    render(<Page />);
    fillValid();
    fireEvent.change(screen.getByLabelText(/^รหัสผ่าน/), { target: { value: "short" } });
    fireEvent.change(screen.getByLabelText(/ยืนยันรหัสผ่าน/), { target: { value: "short" } });
    fireEvent.click(screen.getByText("ลงทะเบียน"));
    expect(screen.getByText(/อย่างน้อย 8 ตัวอักษร/)).toBeInTheDocument();
  });

  it("rejects mismatched password confirmation", () => {
    render(<Page />);
    fillValid();
    fireEvent.change(screen.getByLabelText(/ยืนยันรหัสผ่าน/), { target: { value: "different" } });
    fireEvent.click(screen.getByText("ลงทะเบียน"));
    expect(screen.getByText(/ไม่ตรงกัน/)).toBeInTheDocument();
  });

  it("registers successfully with valid input and redirects to /form", () => {
    render(<Page />);
    fillValid();
    fireEvent.click(screen.getByText("ลงทะเบียน"));
    expect(push).toHaveBeenCalledWith("/form");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- app/register
```

Expected: FAIL — `app/register/page.tsx` doesn't exist.

- [ ] **Step 3: Implement `app/register/page.tsx`**

Port of `register.html:9-24` and `js/register.js:1-9`, adding `<label htmlFor>`/`id` pairs (the original HTML already has matching `<label>`/`id` text adjacency but no explicit `for`, so this adds `htmlFor` purely for test/accessibility purposes without changing visible markup):

```tsx
// app/register/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Auth } from "../../lib/auth";

export default function Page() {
  const router = useRouter();
  const [company, setCompany] = useState("");
  const [taxId, setTaxId] = useState("");
  const [contact, setContact] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [err, setErr] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!/^\d{13}$/.test(taxId.trim())) {
      setErr("เลขประจำตัวผู้เสียภาษีต้องเป็นตัวเลข 13 หลัก");
      return;
    }
    if (pw.length < 8) {
      setErr("รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร");
      return;
    }
    if (pw !== pw2) {
      setErr("รหัสผ่านทั้งสองช่องไม่ตรงกัน");
      return;
    }
    const r = Auth.register({
      company: company.trim(),
      taxId: taxId.trim(),
      contact: contact.trim(),
      phone: phone.trim(),
      email: email.trim(),
      pw,
    });
    if (r.error) {
      setErr(r.error);
      return;
    }
    router.push("/form");
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-5">
      <form onSubmit={onSubmit} className="w-full max-w-xl bg-white rounded-2xl shadow-sm p-7">
        <Link href="/login?role=supplier" className="text-sm text-gray-500 hover:text-gray-800">
          ← กลับไปหน้าเข้าสู่ระบบ
        </Link>
        <div className="brand text-xl mt-4">SUPPLIER PORTAL</div>
        <h1 className="text-xl font-bold mt-1">ลงทะเบียน Supplier</h1>
        <p className="text-sm text-gray-500 mb-5">
          สำหรับ Supplier ใหม่เท่านั้น หลังลงทะเบียนจะเข้าสู่ระบบให้อัตโนมัติ
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label htmlFor="company" className="text-sm font-medium">
              ชื่อบริษัท / นิติบุคคล <span className="text-red-500">*</span>
            </label>
            <input id="company" type="text" required className="inp mt-1" placeholder="ชื่อเต็มตามทะเบียน" value={company} onChange={(e) => setCompany(e.target.value)} />
          </div>
          <div>
            <label htmlFor="taxId" className="text-sm font-medium">
              เลขประจำตัวผู้เสียภาษี <span className="text-red-500">*</span>
            </label>
            <input id="taxId" type="text" required className="inp mt-1" placeholder="13 หลัก" inputMode="numeric" maxLength={13} value={taxId} onChange={(e) => setTaxId(e.target.value)} />
          </div>
          <div>
            <label htmlFor="contact" className="text-sm font-medium">
              ชื่อผู้ติดต่อ <span className="text-red-500">*</span>
            </label>
            <input id="contact" type="text" required className="inp mt-1" placeholder="ชื่อ-นามสกุล" value={contact} onChange={(e) => setContact(e.target.value)} />
          </div>
          <div>
            <label htmlFor="phone" className="text-sm font-medium">
              เบอร์โทรศัพท์ <span className="text-red-500">*</span>
            </label>
            <input id="phone" type="tel" required className="inp mt-1" placeholder="0xx-xxx-xxxx" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <label htmlFor="email" className="text-sm font-medium">
              อีเมล (ใช้เข้าสู่ระบบ) <span className="text-red-500">*</span>
            </label>
            <input id="email" type="email" required className="inp mt-1" placeholder="name@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label htmlFor="pw" className="text-sm font-medium">
              รหัสผ่าน <span className="text-red-500">*</span>
            </label>
            <input id="pw" type="password" required className="inp mt-1" placeholder="อย่างน้อย 8 ตัวอักษร" value={pw} onChange={(e) => setPw(e.target.value)} />
          </div>
          <div>
            <label htmlFor="pw2" className="text-sm font-medium">
              ยืนยันรหัสผ่าน <span className="text-red-500">*</span>
            </label>
            <input id="pw2" type="password" required className="inp mt-1" placeholder="พิมพ์รหัสผ่านอีกครั้ง" value={pw2} onChange={(e) => setPw2(e.target.value)} />
          </div>
        </div>
        <p className={`${err ? "" : "hidden "}text-sm text-red-600 mt-4`}>{err}</p>
        <button type="submit" className="w-full mt-5 bg-green-700 hover:bg-green-800 text-white font-semibold rounded-xl py-3">
          ลงทะเบียน
        </button>
      </form>
    </main>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- app/register
```

Expected: PASS, all 4 assertions.

- [ ] **Step 5: Manually compare against the original**, same side-by-side method as Task 14, for `register.html` vs `/register`.

- [ ] **Step 6: Commit**

```bash
git add app/register/page.tsx app/register/__tests__/page.test.tsx
git commit -m "feat: convert register.html to the /register route"
```

### Task 16: Login page (`/login`)

**Files:**
- Modify: `app/login/page.tsx` (create the `login/` directory)
- Test: `app/login/__tests__/page.test.tsx`
- Reference: `login.html:1-117`, `js/login.js:1-152`

**Interfaces:**
- Consumes: `Auth`, `SEED` from `lib/auth.ts`; `RL` from `lib/roleLabels.ts`.
- Produces: the `/login` route, reading `?role=`.

- [ ] **Step 1: Write the failing tests**

```tsx
// app/login/__tests__/page.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import Page from "../page";

const push = jest.fn();
let searchParams = new URLSearchParams();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => searchParams,
}));

describe("/login page", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    push.mockClear();
    searchParams = new URLSearchParams();
  });

  it("defaults to the supplier tab and pre-fills supplier demo credentials", () => {
    render(<Page />);
    expect(screen.getByDisplayValue("supplier@demo.co.th")).toBeInTheDocument();
  });

  it("honors ?role=admin from the query string", () => {
    searchParams = new URLSearchParams("role=admin");
    render(<Page />);
    expect(screen.getByDisplayValue("admin@demo.co.th")).toBeInTheDocument();
  });

  it("shows the buyer demo pills only when the buyer tab is active", () => {
    render(<Page />);
    expect(screen.queryByText("Buyer 1")).toBeNull();
    fireEvent.click(screen.getByText("Buyer"));
    expect(screen.getByText("Buyer 1")).toBeInTheDocument();
  });

  it("logs in successfully and redirects to the role's home route", () => {
    render(<Page />);
    fireEvent.click(screen.getByText(/เข้าสู่ระบบ Supplier/));
    expect(push).toHaveBeenCalledWith("/form");
  });

  it("shows an error and does not redirect on wrong credentials", () => {
    render(<Page />);
    fireEvent.change(screen.getByPlaceholderText("email@company.com"), {
      target: { value: "nope@demo.co.th" },
    });
    fireEvent.click(screen.getByText(/เข้าสู่ระบบ Supplier/));
    expect(screen.getByText("อีเมลหรือรหัสผ่านไม่ถูกต้อง")).not.toHaveClass("hidden");
    expect(push).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- app/login
```

Expected: FAIL — `app/login/page.tsx` doesn't exist.

- [ ] **Step 3: Implement `app/login/page.tsx`**

Port of `login.html:1-117` + `js/login.js:1-152`. The autofill-race-guard (`js/login.js:136-138`, the `setTimeout` chain plus `load`/`pageshow` listeners fighting browser password managers) is dropped — that workaround exists only because the original directly mutates `<input>` DOM values outside of React's render cycle; React's controlled `value={}` binding already wins against autofill on every render, so the guard has no equivalent need here. Everything else is ported as-is:

```tsx
// app/login/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Auth, SEED } from "../../lib/auth";
import { RL } from "../../lib/roleLabels";

const DESCS: Record<string, string> = {
  supplier: "กรอกข้อมูลเครื่องจักร สเปค ประกัน อะไหล่ และงบซ่อม",
  buyer: "ตรวจและแก้ไขข้อมูลที่ Supplier ส่งมา ดูทะเบียนทรัพย์สิน",
  admin: "ดูภาพรวมรายการทั้งหมดและจัดการข้อมูล",
};

export default function Page() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialRole = useMemo(() => {
    const fromQuery = searchParams.get("role");
    const fromSession = typeof window !== "undefined" ? sessionStorage.getItem("selected_role") : null;
    const fromLocal = typeof window !== "undefined" ? localStorage.getItem("selected_role") : null;
    const r = fromQuery || fromSession || fromLocal || "supplier";
    return RL[r] ? r : "supplier";
  }, [searchParams]);

  const [role, setRole] = useState(initialRole);
  const [buyerDemo, setBuyerDemo] = useState("buyer@demo.co.th");
  const [mail, setMail] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState(false);

  function applyCredentials(r: string, buyerEmail: string) {
    const seedUser =
      r === "buyer"
        ? SEED.find((x) => x.email === buyerEmail) || SEED.find((x) => x.role === "buyer")
        : SEED.find((x) => x.role === r);
    if (!seedUser) return;
    setMail(seedUser.email);
    setPw(seedUser.pw);
  }

  useEffect(() => {
    sessionStorage.setItem("selected_role", role);
    applyCredentials(role, buyerDemo);
    setErr(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, buyerDemo]);

  function switchRole(r: string) {
    setRole(r);
    localStorage.setItem("selected_role", r);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(false);
    const s = Auth.login(role, mail.trim(), pw);
    if (!s) {
      setErr(true);
      return;
    }
    router.push(Auth.home(s.role));
  }

  const roleInfo = RL[role];

  return (
    <div className="flex flex-col min-h-screen text-slate-800 antialiased relative">
      <header className="w-full px-6 md:px-12 py-4 flex items-center justify-between relative z-20">
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="font-bold text-xl text-gray-900 tracking-tight">Supplier Portal</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-5 relative z-10">
        <form
          onSubmit={onSubmit}
          className="w-full max-w-md bg-white rounded-3xl shadow-[0_15px_35px_rgba(0,0,0,0.06)] border border-gray-100 p-8"
          autoComplete="off"
        >
          <div className="flex items-center justify-between mb-4">
            <Link href="/" className="text-sm text-gray-500 hover:text-[#0b6330] inline-flex items-center gap-1.5 transition-colors font-medium">
              &larr; กลับหน้าเลือกบทบาท
            </Link>
            <span className={`text-xs px-3 py-1 rounded-full font-semibold ${roleInfo[2]}`}>{roleInfo[1]}</span>
          </div>

          <div className="brand text-2xl font-bold tracking-wide mt-2 text-[#0b6330]">SUPPLIER PORTAL</div>
          <h1 className="text-2xl font-bold mt-1 text-gray-900">เข้าสู่ระบบ {roleInfo[1]}</h1>
          <p className="text-sm text-gray-500 mb-4 font-medium">{DESCS[role]}</p>

          <div className="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-2xl mb-4">
            {(["supplier", "buyer", "admin"] as const).map((r) => (
              <button
                type="button"
                key={r}
                onClick={() => switchRole(r)}
                className={`py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all ${
                  r === role
                    ? "font-bold bg-[#0b6330] text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/60"
                }`}
              >
                {RL[r][1]}
              </button>
            ))}
          </div>

          <div className={`${role === "buyer" ? "" : "hidden "}mb-4 p-3 bg-emerald-50/80 border border-emerald-200 rounded-2xl text-xs`}>
            <div className="text-gray-600 font-semibold mb-2 flex items-center justify-between">
              <span>เลือกบัญชี Buyer ทดสอบ (สิทธิ์ Category ต่างกัน):</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setBuyerDemo("buyer@demo.co.th")}
                className={`p-2.5 rounded-xl border bg-white text-left transition-all ${
                  buyerDemo === "buyer@demo.co.th" ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs" : "border-gray-200 hover:border-emerald-300"
                }`}
              >
                <div className="font-bold text-emerald-900">Buyer 1</div>
                <div className="text-[10px] text-emerald-700 font-medium">สิทธิ์: เครื่องเย็น & HVAC</div>
              </button>
              <button
                type="button"
                onClick={() => setBuyerDemo("buyer2@demo.co.th")}
                className={`p-2.5 rounded-xl border bg-white text-left transition-all ${
                  buyerDemo === "buyer2@demo.co.th" ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs" : "border-gray-200 hover:border-emerald-300"
                }`}
              >
                <div className="font-bold text-gray-800">Buyer 2</div>
                <div className="text-[10px] text-gray-500 font-medium">สิทธิ์: ไฟฟ้า & ความปลอดภัย</div>
              </button>
            </div>
          </div>

          <label className="text-sm font-medium text-gray-700 block mb-1">อีเมล</label>
          <input
            type="email"
            required
            className="inp mb-4"
            placeholder="email@company.com"
            autoComplete="off"
            value={mail}
            onChange={(e) => setMail(e.target.value)}
          />

          <label className="text-sm font-medium text-gray-700 block mb-1">รหัสผ่าน</label>
          <div className="relative mb-4">
            <input
              type={showPw ? "text" : "password"}
              required
              className="inp pr-16"
              placeholder="กรอกรหัสผ่าน"
              autoComplete="new-password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-3.5 top-2.5 text-sm text-[#0b6330] font-medium hover:underline"
            >
              {showPw ? "ซ่อน" : "แสดง"}
            </button>
          </div>

          <p className={`${err ? "" : "hidden "}text-sm text-red-600 mb-4 bg-red-50 p-3 rounded-xl border border-red-200`}>
            อีเมลหรือรหัสผ่านไม่ถูกต้อง
          </p>

          <button
            type="submit"
            className="w-full bg-[#0b6330] hover:bg-[#084d25] text-white font-semibold rounded-xl py-3.5 transition-all shadow-md hover:shadow-lg"
          >
            <span>เข้าสู่ระบบ {roleInfo[1]}</span> <span className="ml-1">&rarr;</span>
          </button>

          <p className={`${role === "supplier" ? "" : "hidden "}text-sm text-center text-gray-600 mt-5`}>
            ยังไม่มีบัญชี?{" "}
            <Link href="/register" className="text-[#0b6330] font-semibold hover:underline">
              ลงทะเบียน Supplier
            </Link>
          </p>
        </form>
      </main>
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- app/login
```

Expected: PASS, all 5 assertions.

- [ ] **Step 5: Manually compare against the original**, same method as Task 14, including the "แสดง/ซ่อน" password toggle and all 3 role tabs.

- [ ] **Step 6: Commit**

```bash
git add app/login/page.tsx app/login/__tests__/page.test.tsx
git commit -m "feat: convert login.html to the /login route"
```

### Task 17: Submissions page (`/submissions`)

**Files:**
- Modify: `app/submissions/page.tsx` (create the `submissions/` directory)
- Test: `app/submissions/__tests__/page.test.tsx`
- Reference: `submissions.html:1-165`, `js/submissions.js:1-271`

**Interfaces:**
- Consumes: `useRequireAuth` from `lib/useRequireAuth.ts`; `Store`, `type Submission` from `lib/store.ts`; `Permissions` from `lib/permissions.ts`; `CATN` from `lib/catalog.ts`; `LABELS_MAP` from `lib/mockData.ts`; `esc`, `fdt` from `lib/format.ts`; `useToast` from `lib/useToast.ts`; `Toast`, `Modal`, `StatCard`, `StatusBadge` components.
- Produces: the `/submissions` route.

- [ ] **Step 1: Write the failing tests**

```tsx
// app/submissions/__tests__/page.test.tsx
import { render, screen, fireEvent, within } from "@testing-library/react";
import Page from "../page";
import { Auth } from "../../../lib/auth";
import { Permissions } from "../../../lib/permissions";

const push = jest.fn();
jest.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

describe("/submissions page", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    push.mockClear();
  });

  it("admin sees all 6 seed submissions", () => {
    Auth.login("admin", "admin@demo.co.th", "demo1234");
    render(<Page />);
    expect(screen.getByText("ทั้งหมด").nextSibling).toBeTruthy();
    expect(within(screen.getByRole("table")).getAllByRole("row")).toHaveLength(7); // header + 6
  });

  it("a buyer with zero assigned categories sees the empty-state contact-admin message, not a crash", () => {
    Auth.login("buyer", "buyer@demo.co.th", "demo1234");
    Permissions.set("buyer@demo.co.th", []);
    render(<Page />);
    expect(screen.getByText(/ยังไม่ได้รับมอบหมายสิทธิ์ใน Category ใด/)).toBeInTheDocument();
  });

  it("a buyer only sees submissions within their permitted categories", () => {
    Auth.login("buyer", "buyer@demo.co.th", "demo1234");
    render(<Page />);
    const rows = within(screen.getByRole("table")).getAllByRole("row").slice(1);
    for (const row of rows) {
      const catCell = within(row).getAllByRole("cell")[2];
      expect(Permissions.get("buyer@demo.co.th")).toContain(catCell.textContent?.trim());
    }
  });

  it("opening the detail modal shows the record's title", () => {
    Auth.login("admin", "admin@demo.co.th", "demo1234");
    render(<Page />);
    const firstViewBtn = screen.getAllByText("ดู")[0];
    fireEvent.click(firstViewBtn);
    expect(screen.getByTestId("modal-backdrop")).not.toHaveClass("hidden");
  });

  it("clicking แก้ไข navigates to /form?edit=<id>", () => {
    Auth.login("admin", "admin@demo.co.th", "demo1234");
    render(<Page />);
    fireEvent.click(screen.getAllByText("แก้ไข")[0]);
    expect(push).toHaveBeenCalledWith(expect.stringMatching(/^\/form\?edit=/));
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- app/submissions
```

Expected: FAIL — `app/submissions/page.tsx` doesn't exist.

- [ ] **Step 3: Implement `app/submissions/page.tsx`**

Port of `submissions.html:1-165` + `js/submissions.js:1-271`, replacing `innerHTML` templating with `.map()`/JSX and `Modal`/`Toast`/`StatCard`/`StatusBadge`:

```tsx
// app/submissions/page.tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useRequireAuth } from "../../lib/useRequireAuth";
import { Store, type Submission } from "../../lib/store";
import { Permissions } from "../../lib/permissions";
import { CATN } from "../../lib/catalog";
import { LABELS_MAP } from "../../lib/mockData";
import { Auth } from "../../lib/auth";
import { esc, fdt } from "../../lib/format";
import { useToast } from "../../lib/useToast";
import { Toast } from "../../components/Toast";
import { Modal } from "../../components/Modal";
import { StatCard } from "../../components/StatCard";
import { StatusBadge } from "../../components/StatusBadge";

export default function Page() {
  const session = useRequireAuth(["buyer", "admin"]);
  const router = useRouter();
  const { message, visible, show } = useToast();
  const [, forceRefresh] = useState(0);
  const [fSrc, setFSrc] = useState("");
  const [fCat, setFCat] = useState("");
  const [fStatus, setFStatus] = useState("");
  const [fQ, setFQ] = useState("");
  const [viewing, setViewing] = useState<Submission | null>(null);

  const role = session?.role;

  const accessible = useMemo(() => {
    if (!session) return [];
    const all = Store.all();
    return role === "admin"
      ? all
      : all.filter((r) => Permissions.canView(session.email, r.values?.category as string | undefined, role!));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, role]);

  const sorted = useMemo(() => [...accessible].sort((a, b) => b.at - a.at), [accessible]);

  const filtered = sorted.filter((r) => {
    const matchSrc = !fSrc || r.role === fSrc;
    const cat = (r.values?.category as string) || "";
    const matchCat = !fCat || cat.trim().toLowerCase() === fCat.trim().toLowerCase();
    const matchStatus = !fStatus || r.status === fStatus;
    const q = fQ.toLowerCase().trim();
    const matchQ =
      !q ||
      JSON.stringify(r.values || {}).toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q) ||
      r.title.toLowerCase().includes(q) ||
      (r.returnReason || "").toLowerCase().includes(q);
    return matchSrc && matchCat && matchStatus && matchQ;
  });

  if (!session) return null;

  const waitCount = sorted.filter((r) => r.status === "รอ Buyer ตรวจ").length;
  const revCount = sorted.filter((r) => r.status === "ตรวจ/แก้ไขแล้ว").length;
  const supCount = sorted.filter((r) => r.role === "supplier").length;
  const returnedCount = sorted.filter((r) => r.status === "ส่งคืนให้ Buyer แก้ไข").length;

  const catCounts: Record<string, number> = {};
  sorted.forEach((r) => {
    const c = (r.values?.category as string) || "ไม่ระบุ";
    catCounts[c] = (catCounts[c] || 0) + 1;
  });
  const maxCount = Math.max(1, ...Object.values(catCounts));

  const allowedCats = role === "buyer" ? Permissions.get(session.email) : CATN;

  function editSub(r: Submission) {
    if (role === "buyer" && !Permissions.canView(session.email, r.values?.category as string | undefined, role)) {
      show("คุณไม่มีสิทธิ์เข้าถึงหรือแก้ไขรายการในหมวด " + ((r.values?.category as string) || ""));
      return;
    }
    router.push(`/form?edit=${encodeURIComponent(r.id)}`);
  }

  function resetMockData() {
    Store.resetMock();
    forceRefresh((n) => n + 1);
    show("รีเซ็ตข้อมูลตัวอย่างเรียบร้อย");
  }

  return (
    <div className="bg-gray-50 text-gray-900 min-h-screen">
      <header className="bg-white border-b sticky top-0 z-20">
        <div className="w-full px-6 md:px-12 py-3.5 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <Link href="/" className="flex items-center gap-2.5 group mr-2">
              <span className="font-bold text-xl text-gray-900 tracking-tight group-hover:text-[#0b6330] transition-colors">
                Supplier Portal
              </span>
            </Link>
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200">
              {role === "admin" ? "Admin" : "Buyer"}
            </span>
            <span className="text-sm text-gray-600 font-medium">{session.name}</span>
          </div>
          <div className="flex items-center gap-2">
            {role === "admin" ? (
              <Link href="/admin" className="text-xs text-emerald-800 hover:text-emerald-950 font-semibold bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                ไปที่หน้า Admin Dashboard &gt;
              </Link>
            ) : null}
            <Link href="/form" className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg px-4 py-2 transition-colors">
              กรอกฟอร์มใหม่
            </Link>
            <button onClick={Auth.logout} className="text-sm border rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors">
              ออกจากระบบ
            </button>
          </div>
        </div>
        <div className="w-full px-6 md:px-12 pb-3 font-bold text-lg text-gray-800">
          รายการเครื่องจักรและอุปกรณ์ที่ส่งเข้ามา
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {role === "buyer" ? (
          <div className="mb-4 p-4 bg-white rounded-2xl border border-emerald-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                  ขอบเขต Category ที่ได้รับมอบหมายสำหรับคุณ
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  คุณสามารถดูและตรวจสอบเฉพาะรายการในหมวดหมู่ที่ Admin กำหนดสิทธิ์ให้เท่านั้น
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-1 sm:mt-0">
                {allowedCats.length === 0 ? (
                  <span className="text-xs text-rose-700 bg-rose-100 border border-rose-200 px-2.5 py-1 rounded-lg font-medium">
                    ยังไม่ได้รับมอบหมายสิทธิ์ Category ใด (กรุณาติดต่อ Admin)
                  </span>
                ) : (
                  allowedCats.map((cat) => (
                    <span key={cat} className="inline-flex items-center text-xs px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-medium border border-emerald-200">
                      {cat}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : null}

        {returnedCount > 0 ? (
          <div className="mb-4 p-4 bg-rose-50 border border-rose-200 rounded-2xl shadow-xs text-rose-900 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0 animate-ping" />
              <div>
                <div className="font-bold text-sm">มีเอกสารที่ Admin ส่งคืนให้คุณแก้ไข</div>
                <div className="text-xs text-rose-700 mt-0.5">
                  พบ {returnedCount} รายการที่ Admin ส่งคืนและรอการตรวจสอบ/แก้ไขของคุณ
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFStatus("ส่งคืนให้ Buyer แก้ไข")}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors shrink-0"
            >
              ดูรายการส่งคืน
            </button>
          </div>
        ) : null}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <StatCard label="ทั้งหมด" value={sorted.length} />
          <StatCard label="รอ Buyer ตรวจ" value={waitCount} colorClassName="text-amber-600" />
          <StatCard label="ตรวจ/แก้ไขแล้ว" value={revCount} colorClassName="text-emerald-700" />
          <StatCard label="จาก Supplier" value={supCount} colorClassName="text-blue-700" />
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
          <div className="font-semibold mb-3 text-gray-800">จำนวนรายการแยกตาม Category</div>
          <div className="space-y-2">
            {Object.keys(catCounts).length === 0 ? (
              <p className="text-sm text-gray-500">ยังไม่มีข้อมูล</p>
            ) : (
              Object.entries(catCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([c, n]) => (
                  <div key={c} className="flex items-center gap-3 text-sm">
                    <div className="w-48 shrink-0 truncate text-gray-700 font-medium">{c}</div>
                    <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-green-600 rounded-full transition-all" style={{ width: `${(n / maxCount) * 100}%` }} />
                    </div>
                    <div className="w-8 text-right font-semibold text-gray-900">{n}</div>
                  </div>
                ))
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          <select value={fSrc} onChange={(e) => setFSrc(e.target.value)} className="inp !w-auto">
            <option value="">ต้นทาง: ทั้งหมด</option>
            <option value="supplier">จาก Supplier</option>
            <option value="buyer">จาก Buyer</option>
          </select>
          <select value={fCat} onChange={(e) => setFCat(e.target.value)} className="inp !w-auto">
            <option value="">{role === "buyer" ? "Category: ทั้งหมดตามสิทธิ์" : "Category: ทั้งหมด"}</option>
            {allowedCats.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select value={fStatus} onChange={(e) => setFStatus(e.target.value)} className="inp !w-auto">
            <option value="">สถานะ: ทั้งหมด</option>
            <option value="รอ Buyer ตรวจ">รอ Buyer ตรวจ</option>
            <option value="ตรวจ/แก้ไขแล้ว">ตรวจ/แก้ไขแล้ว</option>
            <option value="ส่งคืนให้ Buyer แก้ไข">ส่งคืนให้ Buyer แก้ไข</option>
          </select>
          <input
            value={fQ}
            onChange={(e) => setFQ(e.target.value)}
            className="inp !w-auto flex-1 min-w-[160px]"
            placeholder="ค้นหา ชื่อ รุ่น Supplier ผู้ส่ง"
          />
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-x-auto border border-gray-100">
          <table className="w-full text-sm min-w-[860px]">
            <thead className="bg-gray-100 text-gray-700 text-left">
              <tr>
                <th className="p-3">วันที่ส่ง</th>
                <th className="p-3">รายการ</th>
                <th className="p-3">Category</th>
                <th className="p-3">Sub Category</th>
                <th className="p-3">ผู้ส่ง</th>
                <th className="p-3">สถานะ</th>
                <th className="p-3 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className={`border-t hover:bg-gray-50 transition-colors ${r.status === "ส่งคืนให้ Buyer แก้ไข" ? "bg-rose-50/30" : ""}`}>
                  <td className="p-3 whitespace-nowrap text-gray-500 text-xs">{fdt(r.at)}</td>
                  <td className="p-3">
                    <div className="font-semibold text-gray-900">{r.title}</div>
                    {r.returnReason ? (
                      <div className="text-[11px] text-rose-600 mt-0.5 truncate max-w-xs font-medium">
                        หมายเหตุส่งคืน: &quot;{r.returnReason}&quot;
                      </div>
                    ) : null}
                  </td>
                  <td className="p-3 text-gray-700">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-gray-100 text-xs font-medium">
                      {(r.values?.category as string) || "-"}
                    </span>
                  </td>
                  <td className="p-3 text-gray-600 text-xs">{(r.values?.subCat as string) || "-"}</td>
                  <td className="p-3 text-gray-600 text-xs">
                    <div className="font-medium text-gray-800">
                      {((r.values?.sup as string) || "").split("/")[1]?.trim() || r.email}
                    </div>
                    <div className="text-gray-400 font-mono text-[11px]">{r.email}</div>
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="p-3 text-right whitespace-nowrap">
                    <button onClick={() => setViewing(r)} className="text-gray-700 hover:text-green-700 hover:underline mr-3 font-medium text-xs">
                      ดู
                    </button>
                    <button onClick={() => editSub(r)} className="text-green-700 hover:text-green-900 font-semibold hover:underline text-xs">
                      แก้ไข
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <p className="mb-3 text-base">
                {role === "buyer" && allowedCats.length === 0
                  ? "บัญชีของคุณยังไม่ได้รับมอบหมายสิทธิ์ใน Category ใด จึงไม่สามารถแสดงรายการได้ (กรุณาติดต่อ Admin)"
                  : "ยังไม่มีรายการที่ส่งเข้ามาตามเงื่อนไขที่เลือก"}
              </p>
              <button onClick={resetMockData} className="bg-green-700 hover:bg-green-800 text-white text-xs px-4 py-2 rounded-xl font-medium shadow-sm transition-colors">
                โหลดข้อมูลตัวอย่าง (Mock Data 6 รายการ)
              </button>
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 mt-3">
          <span>ข้อมูลจำลองจัดเก็บในเบราว์เซอร์เครื่องนี้ (localStorage)</span>
          <button onClick={resetMockData} className="text-green-700 hover:underline">
            รีโหลดข้อมูลตัวอย่างอีกครั้ง
          </button>
        </div>
      </main>

      <Modal open={viewing !== null} onClose={() => setViewing(null)}>
        {viewing ? (
          <>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{viewing.title}</h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  {fdt(viewing.at)} / {viewing.email}
                  {viewing.updatedBy ? (
                    <>
                      <br />
                      <span className="text-green-700">
                        แก้ไขล่าสุด {fdt(viewing.updatedAt || viewing.at)} โดย {viewing.updatedBy}
                      </span>
                    </>
                  ) : null}
                </p>
              </div>
              <button onClick={() => setViewing(null)} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">
                &times;
              </button>
            </div>
            {viewing.status === "ส่งคืนให้ Buyer แก้ไข" || viewing.returnReason ? (
              <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs">
                <div className="font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span>เอกสารนี้ถูก Admin ส่งคืนให้แก้ไข</span>
                </div>
                <div className="mt-1 font-semibold text-rose-800 whitespace-pre-line">{viewing.returnReason || "-"}</div>
                <div className="mt-1 text-[11px] text-gray-500">
                  ส่งคืนเมื่อ: {fdt(viewing.returnedAt || viewing.at)} โดย {viewing.returnedBy || "Admin"}
                  {viewing.assignedBuyer ? ` (มอบหมายให้: ${viewing.assignedBuyer})` : ""}
                </div>
              </div>
            ) : null}
            <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm max-h-[60vh] overflow-y-auto p-1">
              {Object.entries(viewing.values || {})
                .filter(([, v]) => v != null && v !== "")
                .map(([k, v]) => (
                  <div key={k} className="border-b border-gray-100 pb-2">
                    <dt className="text-gray-500 text-xs font-medium">{viewing.labels?.[k] || LABELS_MAP[k] || k}</dt>
                    <dd className="font-semibold text-gray-900 break-words mt-0.5">{String(v)}</dd>
                  </div>
                ))}
            </dl>
            <div className="flex justify-end gap-2 mt-5 pt-3 border-t">
              <button onClick={() => setViewing(null)} className="border rounded-xl px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
                ปิด
              </button>
              <button
                onClick={() => {
                  const v = viewing;
                  setViewing(null);
                  if (v) editSub(v);
                }}
                className="bg-green-700 hover:bg-green-800 text-white rounded-xl px-5 py-2 text-sm font-semibold shadow-sm transition-colors"
              >
                แก้ไขรายการนี้
              </button>
            </div>
          </>
        ) : null}
      </Modal>

      <Toast message={message} visible={visible} />
    </div>
  );
}
```

Note: `esc()` is omitted in this JSX because React escapes text content automatically — the original's `esc()` calls were only needed because it was building raw HTML strings.

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- app/submissions
```

Expected: PASS, all 5 assertions.

- [ ] **Step 5: Manually compare against the original**, same method as Task 14, logged in as both a buyer (checking the category-scoped empty state and the permission banner) and admin (checking the full list).

- [ ] **Step 6: Commit**

```bash
git add app/submissions/page.tsx app/submissions/__tests__/page.test.tsx
git commit -m "feat: convert submissions.html to the /submissions route"
```

### Task 18: Form page — wizard core (no photo-scan modal yet)

**Files:**
- Modify: `app/form/page.tsx` (create the `form/` directory)
- Test: `app/form/__tests__/page.test.tsx`
- Reference: `form.html:1-109,298-315`, `js/form.js:1-214`

**Interfaces:**
- Consumes: `useRequireAuth`; `Store`, `type Submission`; `Permissions`; `CATS`, `STEPS`, `HIDE`, `S`, `type Field` from `lib/catalog.ts`; `useToast`; `Toast` component; `Auth`.
- Produces: the `/form` route rendering the wizard, `calc()`/`vis()`/`hiddenKeys()` logic re-implemented as local functions. Task 19 adds the photo-scan modal into this same file/component, consuming the `applyScannedValues` callback this task defines.

- [ ] **Step 1: Write the failing tests**

```tsx
// app/form/__tests__/page.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import Page from "../page";
import { Auth } from "../../../lib/auth";
import { Store } from "../../../lib/store";
import { Permissions } from "../../../lib/permissions";

const push = jest.fn();
let searchParamsValue = new URLSearchParams();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: push }),
  useSearchParams: () => searchParamsValue,
}));

describe("/form page", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    push.mockClear();
    searchParamsValue = new URLSearchParams();
  });

  it("supplier sees only the Supplier & สเปค / ประกัน & อะไหล่ / อายุใช้งาน steps, not ทะเบียนทรัพย์สิน", () => {
    Auth.login("supplier", "supplier@demo.co.th", "demo1234");
    render(<Page />);
    expect(screen.queryByText("ทะเบียนทรัพย์สิน")).toBeNull();
    expect(screen.getByText("Supplier & สเปค")).toBeInTheDocument();
  });

  it("selecting a category with no sub-categories disables and clears the Sub Category field", () => {
    Auth.login("buyer", "buyer@demo.co.th", "demo1234");
    render(<Page />);
    fireEvent.change(screen.getByLabelText(/^Category/), { target: { value: "Chiller" } });
    expect(screen.getByLabelText(/Sub Category/)).toBeDisabled();
  });

  it("selecting a category that hides fields removes them from the DOM", () => {
    Auth.login("buyer", "buyer@demo.co.th", "demo1234");
    render(<Page />);
    expect(screen.getByLabelText(/Utility Requirement/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/^Category/), { target: { value: "Super Equipment" } });
    expect(screen.queryByLabelText(/Utility Requirement/)).toBeNull();
  });

  it("a field hidden by a category switch does not block submission, even if it was marked bad first", () => {
    Auth.login("buyer", "buyer@demo.co.th", "demo1234");
    render(<Page />);
    // Pick a category where Utility Requirement is visible and required-ish, trigger a failed
    // submit so it (and others) get marked bad, then switch to a category that hides it.
    for (let i = 0; i < 3; i++) fireEvent.click(screen.getByText(/ถัดไป/));
    fireEvent.click(screen.getByText(/ส่งข้อมูล/));
    expect(screen.getByText(/ยังขาดช่องบังคับ/)).toBeInTheDocument();
    fireEvent.click(screen.getAllByText(/ทะเบียนทรัพย์สิน|Supplier & สเปค/)[0]);
    fireEvent.change(screen.getByLabelText(/^Category/), { target: { value: "Super Equipment" } });
    // Utility Requirement is hidden for Super Equipment (lib/catalog.ts HIDE) — it must no
    // longer be in the DOM, and therefore cannot still be counted as a blocking required field.
    expect(screen.queryByLabelText(/Utility Requirement/)).toBeNull();
  });

  it("a buyer with zero assigned categories sees only the placeholder option in the Category select, not a crash", () => {
    Auth.login("buyer", "buyer@demo.co.th", "demo1234");
    Permissions.set("buyer@demo.co.th", []);
    render(<Page />);
    const options = screen.getByLabelText(/^Category/).querySelectorAll("option");
    expect(options).toHaveLength(1);
    expect(options[0].textContent).toBe("-- เลือก --");
  });

  it("autofill() fills every field from the demo record S", () => {
    Auth.login("buyer", "buyer@demo.co.th", "demo1234");
    render(<Page />);
    fireEvent.click(screen.getByText("กรอกอัตโนมัติ"));
    expect(screen.getByDisplayValue("ตู้แช่เย็น Daikin")).toBeInTheDocument();
  });

  it("submit() blocks when a required field is empty and marks it bad", () => {
    Auth.login("buyer", "buyer@demo.co.th", "demo1234");
    render(<Page />);
    // advance to the last step without filling anything
    for (let i = 0; i < 3; i++) fireEvent.click(screen.getByText(/ถัดไป/));
    fireEvent.click(screen.getByText(/ส่งข้อมูล/));
    expect(screen.getByText(/ยังขาดช่องบังคับ/)).toBeInTheDocument();
  });

  it("a buyer opening ?edit=<id> for a submission outside their permitted category is blocked and not shown the form", () => {
    Store.resetMock();
    const outOfScope = Store.all().find((r) => r.values?.category === "Super Equipment");
    searchParamsValue = new URLSearchParams(`edit=${outOfScope?.id}`);
    Auth.login("buyer", "buyer@demo.co.th", "demo1234"); // buyer@demo has no Super Equipment permission
    jest.spyOn(window, "alert").mockImplementation(() => {});
    render(<Page />);
    expect(window.alert).toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith("/submissions");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- app/form
```

Expected: FAIL — `app/form/page.tsx` doesn't exist.

- [ ] **Step 3: Implement `app/form/page.tsx`**

Port of `form.html:1-109,298-315` + `js/form.js:1-214` (everything except the photo modal, added in Task 19). `calc()`, `vis()`/`hiddenKeys()`, `refresh()`'s progress math, and `submit()`'s scroll-to-first-error are all re-implemented as plain functions operating on React state instead of the DOM:

```tsx
// app/form/page.tsx
"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useRequireAuth } from "../../lib/useRequireAuth";
import { Store, type Submission } from "../../lib/store";
import { Permissions } from "../../lib/permissions";
import { CATS, STEPS, HIDE, S, type Field } from "../../lib/catalog";
import { RL } from "../../lib/roleLabels";
import { useToast } from "../../lib/useToast";
import { Toast } from "../../components/Toast";

type FormValues = Record<string, string>;

function fmtNum(n: number, d = 0): string {
  return n.toLocaleString("th-TH", { maximumFractionDigits: d });
}

export default function Page() {
  const session = useRequireAuth(["supplier", "buyer", "admin"]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { message, visible, show } = useToast();

  const role = session?.role;
  const mySteps = useMemo(() => STEPS.filter((s) => s.roles.includes(role || "")), [role]);

  const [step, setStep] = useState(0);
  const [values, setValues] = useState<FormValues>({});
  const [badFields, setBadFields] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<Submission | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const initRef = useRef(false);

  const gf = (f: Field[]) => f.filter((x) => !x.only || x.only.includes(role || ""));
  const allF = (): Field[] => mySteps.flatMap((s) => s.groups.flatMap((g) => gf(g.f)));
  const hiddenKeys = useMemo(() => new Set(HIDE[(values.category || "").trim()] || []), [values.category]);
  const vis = (x: Field) => !hiddenKeys.has(x.k);

  function setField(k: string, v: string) {
    setValues((prev) => ({ ...prev, [k]: v }));
    setBadFields((prev) => {
      if (!prev.has(k)) return prev;
      const next = new Set(prev);
      next.delete(k);
      return next;
    });
  }

  function val(x: Field) {
    return (values[x.k] || "").trim();
  }

  const num = (k: string) => parseFloat(values[k] || "") || 0;

  const calc = useMemo(() => {
    const kwhY = num("energy") * num("hrs");
    const life = num("life");
    const energyCost = kwhY * 4.5 * life;
    const price = num("price");
    const tco = price
      ? fmtNum(price + num("maint") * life + num("cons") * life + energyCost - (price * num("resid")) / 100) + " THB"
      : "";
    const y = (kwhY * num("ef")) / 1000;
    const co2y = y ? fmtNum(y, 2) : "";
    const co2l = y && life ? fmtNum(y * life, 2) : "";
    const cval = y && life && num("cprice") ? fmtNum(y * life * num("cprice")) + " THB" : "";
    return { tco, co2y, co2l, cval };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values]);

  const subList = CATS[values.category || ""] || [];
  const hasSub = subList.length > 0;

  const reqFields = allF().filter((x) => x.r === "r" && vis(x));
  const doneCount = reqFields.filter((x) => val(x)).length;
  const pct = reqFields.length ? Math.round((doneCount / reqFields.length) * 100) : 0;

  function go(d: number) {
    const n = mySteps.length;
    if (d > 0 && step === n - 1) {
      submit();
      return;
    }
    setStep(Math.min(n - 1, Math.max(0, step + d)));
  }

  function submit() {
    const miss = allF().filter((x) => x.r === "r" && vis(x) && !val(x));
    if (miss.length === 0) {
      saveRecord();
      setDone(
        editing
          ? "บันทึกการแก้ไขเรียบร้อย รายการถูกอัปเดตในหน้ารายการที่ส่งมา"
          : role === "supplier"
          ? "ส่งข้อมูลให้ Buyer ตรวจสอบเรียบร้อย"
          : "บันทึกข้อมูลเรียบร้อย"
      );
      return;
    }
    setBadFields(new Set(miss.map((x) => x.k)));
    const first = miss[0];
    const si = mySteps.findIndex((s) => s.groups.some((g) => gf(g.f).includes(first)));
    setStep(si);
    show("ยังขาดช่องบังคับอีก " + miss.length + " ช่อง");
  }

  function saveRecord() {
    if (!session) return;
    const newValues: FormValues = {};
    const labels: Record<string, string> = {};
    allF().forEach((x) => {
      if (x.t !== "calc" && vis(x)) {
        newValues[x.k] = val(x) || values[x.k] || "";
        labels[x.k] = x.l;
      }
    });
    let rec: Submission;
    if (editing) {
      rec = {
        ...editing,
        values: { ...editing.values, ...newValues },
        labels: { ...editing.labels, ...labels },
        status: "ตรวจ/แก้ไขแล้ว",
        updatedAt: Date.now(),
        updatedBy: session.email,
        fixedAt: Date.now(),
        returnedFixed: editing.status === "ส่งคืนให้ Buyer แก้ไข",
      };
    } else {
      rec = {
        id: "s" + Date.now(),
        role,
        email: session.email,
        at: Date.now(),
        status: role === "supplier" ? "รอ Buyer ตรวจ" : "ส่งแล้ว",
        values: newValues,
        labels,
        title: "",
      } as Submission;
    }
    rec.title = (rec.values.assetName as string) || (rec.values.model2 as string) || (rec.values.sup as string) || "(ไม่มีชื่อ)";
    Store.put(rec);
  }

  function autofill() {
    const next: FormValues = { ...values };
    let c = 0;
    allF().forEach((x) => {
      const v = S[x.k];
      if (v === undefined) return;
      next[x.k] = String(v);
      c++;
    });
    setValues(next);
    show("กรอกข้อมูลตัวอย่างให้แล้ว " + c + " ช่อง ตรวจสอบและแก้ไขได้");
  }

  function doneBack() {
    router.push(role === "supplier" ? "/form" : role === "admin" ? "/admin" : "/submissions");
  }

  if (initRef.current === false && session) {
    initRef.current = true;
    const eid = searchParams.get("edit") || sessionStorage.getItem("edit_id");
    sessionStorage.removeItem("edit_id");
    const r = role !== "supplier" && eid ? Store.all().find((x) => x.id === eid) : undefined;
    if (r) {
      if (role === "buyer" && !Permissions.canView(session.email, r.values?.category as string | undefined, role)) {
        alert(
          'คุณไม่มีสิทธิ์เข้าถึงหรือแก้ไขรายการในหมวด "' +
            ((r.values?.category as string) || "ไม่ระบุ") +
            '"\nเนื่องจากอยู่นอกเหนือสิทธิ์ Category ที่ Admin กำหนดให้'
        );
        setBlocked(true);
        router.replace("/submissions");
      } else {
        setEditing(r);
        const prefill: FormValues = {};
        Object.entries(r.values || {}).forEach(([k, v]) => {
          if (v !== undefined && v !== "") prefill[k] = String(v);
        });
        setValues(prefill);
      }
    } else if (role === "supplier") {
      setValues((prev) => ({ ...prev, sup: (session.code ? session.code + " / " : "") + session.name }));
    }
  }

  if (!session || blocked) return null;

  return (
    <div>
      <header className="bg-white border-b sticky top-0 z-20">
        <div className="w-full px-6 md:px-12 py-3.5 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <Link href="/" className="flex items-center gap-2.5 group mr-2">
              <span className="font-bold text-xl text-gray-900 tracking-tight group-hover:text-[#0b6330] transition-colors">
                Supplier Portal
              </span>
            </Link>
            <span className={`text-xs px-2.5 py-1 rounded-full ${RL[role!][2]}`}>{RL[role!][1]}</span>
            <span className="text-sm text-gray-500">{session.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={autofill} className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg px-4 py-2 transition-colors">
              กรอกอัตโนมัติ
            </button>
            {role !== "supplier" ? (
              <Link href={role === "admin" ? "/admin" : "/submissions"} className="text-sm border rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors">
                รายการที่ส่งมา
              </Link>
            ) : null}
            <button className="text-sm border rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors">ออกจากระบบ</button>
          </div>
        </div>
        {editing ? (
          <div className="w-full px-6 md:px-12 pb-2">
            <span className="bg-green-50 border border-green-200 text-green-800 text-sm rounded-lg px-3 py-1.5 inline-block">
              กำลังแก้ไข: {editing.title} (ส่งโดย {editing.email}) ตรวจแล้วกดส่งข้อมูลเพื่อบันทึก
            </span>
          </div>
        ) : null}
        <div className="w-full px-6 md:px-12 pb-3">
          <div className="flex items-center gap-3 text-xs text-gray-600 mb-1">
            <span>ความคืบหน้าช่องบังคับ</span>
            <span className="font-semibold">{pct}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-green-600 transition-all" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex gap-2 overflow-x-auto mt-3">
            {mySteps.map((s, i) => {
              const rq = s.groups.flatMap((g) => gf(g.f)).filter((x) => x.r === "r" && vis(x));
              const ok = rq.length > 0 && rq.every((x) => val(x));
              return (
                <button
                  key={s.id}
                  onClick={() => setStep(i)}
                  className={`shrink-0 text-sm rounded-full px-4 py-1.5 border ${
                    i === step ? "bg-green-700 text-white border-green-700 font-semibold" : "bg-white hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  {i + 1}. {s.title}
                  {ok ? " (ครบ)" : ""}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {editing && (editing.status === "ส่งคืนให้ Buyer แก้ไข" || editing.returnReason) ? (
          <div className="mb-5 bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 sm:p-5 shadow-sm text-xs sm:text-sm">
            <div className="font-bold text-rose-900 text-sm sm:text-base">Admin ได้ส่งคืนเอกสารนี้เพื่อให้ Buyer ตรวจสอบ / แก้ไขเพิ่มเติม</div>
            <div className="mt-2 p-3.5 bg-white rounded-xl border border-rose-200 text-rose-900 font-medium">
              {editing.returnReason || "โปรดตรวจสอบความถูกต้องของข้อมูลและเอกสารแนบตามที่ได้รับแจ้ง"}
            </div>
          </div>
        ) : null}

        {mySteps.map((s, i) =>
          i === step ? (
            <div key={s.id} className="fadein">
              <h2 className="text-2xl font-bold mb-4">{s.title}</h2>
              {s.groups.map((g, gi) => {
                const fields = gf(g.f).filter((x) => x.k !== "subCat" || true);
                const groupVisible = fields.some((x) => vis(x));
                if (!groupVisible) return null;
                return (
                  <div key={gi} className="bg-white rounded-2xl shadow-sm mb-5 overflow-hidden">
                    <div className={`${g.c} text-white font-semibold px-5 py-3`}>{g.t}</div>
                    <div className="p-5 grid sm:grid-cols-2 gap-4">
                      {fields.map((x) =>
                        vis(x) ? (
                          <FieldInput
                            key={x.k}
                            field={x}
                            role={role!}
                            value={
                              x.k === "tco" || x.k === "co2y" || x.k === "co2l" || x.k === "cval"
                                ? (calc as Record<string, string>)[x.k]
                                : values[x.k] || ""
                            }
                            bad={badFields.has(x.k)}
                            onChange={(v) => {
                              setField(x.k, v);
                              if (x.k === "subCat") return;
                            }}
                            categorySubList={subList}
                            hasSub={hasSub}
                            buyerAllowedCategories={role === "buyer" ? Permissions.get(session.email) : undefined}
                          />
                        ) : null
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null
        )}

        <div className="flex justify-between mt-6">
          <button onClick={() => go(-1)} style={{ visibility: step ? "visible" : "hidden" }} className="px-5 py-2.5 rounded-xl border bg-white hover:bg-gray-50 transition-colors">
            ← ย้อนกลับ
          </button>
          <button onClick={() => go(1)} className="px-5 py-2.5 rounded-xl bg-green-700 hover:bg-green-800 text-white font-semibold transition-colors">
            {step === mySteps.length - 1 ? "ส่งข้อมูล" : "ถัดไป →"}
          </button>
        </div>
      </main>

      <div className={`${done ? "" : "hidden "}fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-5`}>
        <div className="bg-white rounded-2xl p-8 max-w-md text-center">
          <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-2xl font-bold">&#10003;</div>
          <h2 className="text-xl font-bold">บันทึกเรียบร้อย</h2>
          <p className="text-gray-600 mt-2 mb-6">{done}</p>
          <button onClick={doneBack} className="bg-green-700 text-white rounded-xl px-5 py-2.5 font-semibold">
            กลับ
          </button>
        </div>
      </div>

      <Toast message={message} visible={visible} />
    </div>
  );
}

function FieldInput({
  field,
  role,
  value,
  bad,
  onChange,
  categorySubList,
  hasSub,
  buyerAllowedCategories,
}: {
  field: Field;
  role: string;
  value: string;
  bad: boolean;
  onChange: (v: string) => void;
  categorySubList: string[];
  hasSub: boolean;
  buyerAllowedCategories?: string[];
}) {
  const badge =
    field.r === "r" ? (
      <span className="text-red-500">*</span>
    ) : field.r === "o" ? (
      <span className="ml-1 text-[10px] bg-gray-200 text-gray-700 rounded px-1.5 py-0.5">แนะนำ</span>
    ) : field.r === "n" ? (
      <span className="ml-1 text-[10px] bg-gray-100 text-gray-500 rounded px-1.5 py-0.5">ถ้ามี</span>
    ) : (
      <span className="ml-1 text-[10px] bg-green-100 text-green-600 rounded px-1.5 py-0.5">คำนวณอัตโนมัติ</span>
    );

  const wide = field.t === "textarea" || field.t === "file" ? "sm:col-span-2" : "";
  const inpClass = `inp${bad ? " bad" : ""}`;

  let input: React.ReactNode;
  if (field.t === "select") {
    let opts = field.o as string[];
    if (field.k === "category" && role === "buyer" && buyerAllowedCategories) {
      opts = opts.filter((cat) => buyerAllowedCategories.some((a) => a.trim().toLowerCase() === cat.trim().toLowerCase()));
    }
    if (field.k === "subCat") {
      opts = categorySubList;
    }
    input = (
      <select id={field.k} aria-label={field.l} className={inpClass} value={value} disabled={field.k === "subCat" && !hasSub} onChange={(e) => onChange(e.target.value)}>
        <option value="">{field.k === "subCat" ? (hasSub ? "-- เลือก Sub Category --" : "-- ไม่มี Sub Category --") : "-- เลือก --"}</option>
        {opts.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    );
  } else if (field.t === "textarea") {
    input = <textarea id={field.k} aria-label={field.l} rows={3} className={inpClass} placeholder={field.p} value={value} onChange={(e) => onChange(e.target.value)} />;
  } else if (field.t === "file") {
    input = (
      <label className={`flex items-center gap-3 ${inpClass} cursor-pointer`}>
        <input type="file" multiple className="hidden" onChange={(e) => onChange([...(e.target.files || [])].map((f) => f.name).join(", "))} />
        <span className="bg-gray-100 rounded-lg px-3 py-1 text-sm">เลือกไฟล์</span>
        <span className={`text-sm truncate ${value ? "text-green-600 font-medium" : "text-gray-500"}`}>{value || field.p}</span>
      </label>
    );
  } else if (field.t === "calc") {
    input = <input id={field.k} aria-label={field.l} className="inp font-semibold" readOnly placeholder={field.p || "รอข้อมูล..."} value={value} />;
  } else {
    input = (
      <input
        id={field.k}
        aria-label={field.l}
        type={field.t}
        className={inpClass}
        placeholder={field.p}
        readOnly={field.k === "assetCode"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  return (
    <div className={wide}>
      <label htmlFor={field.k} className="block text-sm font-medium mb-1">
        {field.l} {badge}
      </label>
      {input}
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- app/form
```

Expected: PASS, all 8 assertions.

- [ ] **Step 5: Manually compare against the original** — all 3 roles, every step, category/sub-category switching, field hiding, autofill, and the calculated fields recomputing live as `price`/`energy`/`hrs`/`life`/`ef`/`cprice` change.

- [ ] **Step 6: Commit**

```bash
git add app/form/page.tsx app/form/__tests__/page.test.tsx
git commit -m "feat: convert form.html wizard core to the /form route"
```

### Task 19: `PhotoScanModal` component (AI nameplate scan)

**Files:**
- Create: `app/form/PhotoScanModal.tsx`
- Modify: `app/form/page.tsx` (wire the modal in)
- Test: `app/form/__tests__/PhotoScanModal.test.tsx`
- Reference: `form.html:29-34,80-99,111-296`, `js/form.js:216-743`

**Interfaces:**
- Consumes: `Permissions` from `lib/permissions.ts`; `Field` type and `allF()`-equivalent field list from the parent.
- Produces: `<PhotoScanModal open={boolean} onClose={() => void} onApply={(data: Record<string, string>, imageDataUrl: string) => void} buyerAllowedCategories?={string[]} role={string} />`. `onApply` is called by Task 18's page with a callback that writes into `values` state and shows the nameplate-thumbnail badge, replacing the original's direct `allF().forEach(...)` DOM writes (`js/form.js:703-716`).

- [ ] **Step 1: Write the failing tests**

```tsx
// app/form/__tests__/PhotoScanModal.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { PhotoScanModal } from "../PhotoScanModal";

describe("PhotoScanModal", () => {
  beforeEach(() => {
    // getUserMedia is not available in jsdom — the component must degrade gracefully
    Object.defineProperty(window.navigator, "mediaDevices", { value: undefined, configurable: true });
  });

  it("shows the no-camera-support message instead of crashing when getUserMedia is unavailable", () => {
    render(<PhotoScanModal open={true} onClose={jest.fn()} onApply={jest.fn()} role="supplier" />);
    expect(screen.getByText(/ไม่รองรับ Live Camera/)).toBeInTheDocument();
  });

  it("selecting the Daikin preset shows its extracted brand/model in the summary list", () => {
    render(<PhotoScanModal open={true} onClose={jest.fn()} onApply={jest.fn()} role="supplier" />);
    fireEvent.click(screen.getByText(/อัปโหลดรูป/));
    fireEvent.click(screen.getByText("Daikin Inverter FTV50"));
    expect(screen.getByText("Daikin")).toBeInTheDocument();
    expect(screen.getByText("FTV50QV1V")).toBeInTheDocument();
  });

  it("applying the scanned preset calls onApply with the preset data and a data-URL image", () => {
    const onApply = jest.fn();
    render(<PhotoScanModal open={true} onClose={jest.fn()} onApply={onApply} role="supplier" />);
    fireEvent.click(screen.getByText(/อัปโหลดรูป/));
    fireEvent.click(screen.getByText("Daikin Inverter FTV50"));
    fireEvent.click(screen.getByText(/นำข้อมูลและรูปถ่ายเข้าฟอร์ม/));
    expect(onApply).toHaveBeenCalledWith(
      expect.objectContaining({ brand: "Daikin", model: "FTV50QV1V" }),
      expect.stringContaining("data:image/svg+xml")
    );
  });

  it("blocks applying a preset outside the buyer's permitted categories", () => {
    const onApply = jest.fn();
    window.alert = jest.fn();
    render(
      <PhotoScanModal
        open={true}
        onClose={jest.fn()}
        onApply={onApply}
        role="buyer"
        buyerAllowedCategories={["Chiller"]}
      />
    );
    fireEvent.click(screen.getByText(/อัปโหลดรูป/));
    fireEvent.click(screen.getByText("Daikin Inverter FTV50")); // category: Refrigeration system
    fireEvent.click(screen.getByText(/นำข้อมูลและรูปถ่ายเข้าฟอร์ม/));
    expect(onApply).not.toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- PhotoScanModal
```

Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Implement `app/form/PhotoScanModal.tsx`**

Port of `form.html:111-296` + `js/form.js:216-742`. The 4 `PHOTO_PRESETS` records and the `generateNameplateSVG` function are copied verbatim from `js/form.js:219-519` (same Thai strings, same field values); camera/upload logic (`js/form.js:552-626`) is kept as direct browser-API calls inside `useEffect`/handlers, same as the original, since there's no server-side equivalent:

```tsx
// app/form/PhotoScanModal.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Permissions } from "../../lib/permissions";

type PhotoPreset = {
  title: string;
  brand: string;
  model: string;
  serial: string;
  data: Record<string, string | number>;
};

// Paste js/form.js:219-468 verbatim (PHOTO_PRESETS: daikin/trane/schneider/hikvision)
const PHOTO_PRESETS: Record<string, PhotoPreset> = {
  /* ... exact contents from js/form.js ... */
};

// Paste js/form.js:475-519 verbatim (generateNameplateSVG), typed
function generateNameplateSVG(brand: string, model: string, serial: string, power: string, cap: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="340" viewBox="0 0 600 340">...</svg>`;
  // body copied verbatim from js/form.js:476-517, substituting esc() calls with direct
  // string interpolation (React/the data-URL both need the raw string; no HTML injection
  // risk here since this data-URL is rendered via <img src>, never innerHTML)
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg.trim());
}

type Props = {
  open: boolean;
  onClose: () => void;
  onApply: (data: Record<string, string>, imageDataUrl: string) => void;
  role: string;
  buyerAllowedCategories?: string[];
};

export function PhotoScanModal({ open, onClose, onApply, role, buyerAllowedCategories }: Props) {
  const [tab, setTab] = useState<"cam" | "file">("cam");
  const [stage, setStage] = useState<"capture" | "preview">("capture");
  const [camSupported, setCamSupported] = useState(true);
  const [camStatus, setCamStatus] = useState("กำลังเชื่อมต่อกล้อง...");
  const [scannedImage, setScannedImage] = useState<string | null>(null);
  const [scannedData, setScannedData] = useState<Record<string, string | number> | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!open || tab !== "cam") return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCamSupported(false);
      setCamStatus("อุปกรณ์ไม่รองรับ Live Camera กรุณาใช้แท็บอัปโหลดรูปภาพ");
      return;
    }
    let cancelled = false;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" }, audio: false })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCamStatus("กล้องพร้อมทำงาน - จัดป้ายเนมเพลทให้อยู่ในกรอบ");
        }
      })
      .catch(() => {
        setCamSupported(false);
        setCamStatus('ไม่สามารถเปิดกล้องได้ กรุณาใช้แท็บ "อัปโหลดรูป"');
      });
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [open, tab]);

  function processScanned(imgData: string, presetKey?: string, fileName?: string) {
    let preset = presetKey ? PHOTO_PRESETS[presetKey] : undefined;
    if (!preset) {
      const randomSerial = "DK26X-" + Math.floor(100000 + Math.random() * 900000);
      preset = {
        ...PHOTO_PRESETS.daikin,
        data: {
          ...PHOTO_PRESETS.daikin.data,
          serial: randomSerial,
          serial2: randomSerial,
          docs: fileName ? fileName + ", Daikin_Catalog.pdf" : "nameplate_camera_capture.jpg",
        },
      };
    }
    setScannedImage(imgData);
    setScannedData(preset.data);
    setStage("preview");
  }

  function selectPreset(key: string) {
    const p = PHOTO_PRESETS[key];
    const svg = generateNameplateSVG(p.brand, p.model, p.serial, String(p.data.power), String(p.data.cap));
    processScanned(svg, key);
  }

  function handleFileUpload(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => processScanned(String(e.target?.result), undefined, file.name);
    reader.readAsDataURL(file);
  }

  function apply() {
    if (!scannedData) return;
    const category = String(scannedData.category || "");
    if (role === "buyer" && buyerAllowedCategories && !Permissions.canView("", category, "buyer")) {
      // canView requires an email for lookups elsewhere; here we only have the allowed-list
      if (!buyerAllowedCategories.some((c) => c.trim().toLowerCase() === category.trim().toLowerCase())) {
        alert(`บัญชีของคุณไม่มีสิทธิ์ในหมวด "${category}"\n(ได้รับสิทธิ์เฉพาะหมวดที่ Admin กำหนดให้)`);
        return;
      }
    }
    const stringData: Record<string, string> = {};
    Object.entries(scannedData).forEach(([k, v]) => {
      stringData[k] = String(v);
    });
    onApply(stringData, scannedImage || "");
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-3xl w-full max-w-2xl my-6 p-6 sm:p-8 shadow-2xl border border-gray-100">
        <div className="flex justify-between items-start mb-4 border-b pb-3.5">
          <h3 className="text-xl font-bold text-gray-900">ถ่ายรูปเนมเพลท / อัปโหลดรูปภาพ</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">
            &times;
          </button>
        </div>

        <div className="grid grid-cols-2 gap-1 bg-gray-100 p-1 rounded-2xl mb-4 text-xs sm:text-sm font-semibold">
          <button
            onClick={() => setTab("cam")}
            className={`py-2 rounded-xl transition-all ${tab === "cam" ? "bg-emerald-700 text-white shadow-xs" : "text-gray-600 hover:text-gray-900"}`}
          >
            ถ่ายรูปจากกล้อง
          </button>
          <button
            onClick={() => setTab("file")}
            className={`py-2 rounded-xl transition-all ${tab === "file" ? "bg-emerald-700 text-white shadow-xs" : "text-gray-600 hover:text-gray-900"}`}
          >
            อัปโหลดรูป
          </button>
        </div>

        {stage === "capture" ? (
          <div>
            {tab === "cam" ? (
              <div className="space-y-3">
                <div className="relative bg-slate-900 rounded-2xl overflow-hidden aspect-video flex items-center justify-center border border-slate-700">
                  {camSupported ? <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" /> : null}
                  <div className="text-xs text-white/80 bg-black/40 px-2 py-0.5 rounded">{camStatus}</div>
                </div>
                <div className="flex items-center justify-center gap-3 pt-1">
                  <button
                    disabled={!camSupported}
                    onClick={() => {
                      const video = videoRef.current;
                      if (!video) return;
                      const canvas = document.createElement("canvas");
                      canvas.width = video.videoWidth || 640;
                      canvas.height = video.videoHeight || 480;
                      canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
                      processScanned(canvas.toDataURL("image/jpeg", 0.9), "camera");
                    }}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-6 py-2.5 rounded-xl text-sm shadow-md hover:shadow-lg transition-all"
                  >
                    กดถ่ายภาพนี้
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                <label className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 rounded-3xl p-8 flex flex-col items-center justify-center cursor-pointer col-span-2">
                  <span className="text-sm font-bold text-gray-800 mb-1">คลิกเพื่อเลือกรูปภาพ หรือลากไฟล์มาวางที่นี่</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                  />
                </label>
                {Object.entries(PHOTO_PRESETS).map(([key, p]) => (
                  <button key={key} onClick={() => selectPreset(key)} className="p-3.5 rounded-2xl border bg-white hover:border-emerald-500 text-left transition-all">
                    <div className="font-bold text-xs text-emerald-900">{p.title}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="relative bg-slate-900 rounded-2xl overflow-hidden aspect-video flex items-center justify-center border border-slate-700">
                {scannedImage ? <img src={scannedImage} alt="Nameplate Preview" className="w-full h-full object-cover" /> : null}
              </div>
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 text-xs">
                <div className="font-bold text-emerald-900 text-sm mb-2">ข้อมูลที่ตรวจพบจากป้าย Nameplate</div>
                <div className="space-y-1.5">
                  {scannedData ? (
                    [
                      ["ยี่ห้อ / Brand", scannedData.brand],
                      ["รุ่น / Model No.", scannedData.model],
                      ["หมายเลขเครื่อง (Serial)", scannedData.serial],
                      ["หมวดหมู่ (Category)", scannedData.category],
                    ].map(([label, v]) => (
                      <div key={String(label)} className="flex items-start justify-between gap-2 border-b border-emerald-100/80 pb-1">
                        <span className="text-gray-500 text-[11px]">{label}:</span>
                        <strong className="text-emerald-950 font-semibold text-right">{String(v || "-")}</strong>
                      </div>
                    ))
                  ) : null}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between pt-3 border-t">
              <button onClick={() => setStage("capture")} className="border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium px-4 py-2 rounded-xl text-xs">
                ถ่ายใหม่ / เลือกรูปใหม่
              </button>
              <button onClick={apply} className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-6 py-2.5 rounded-xl text-sm shadow-md hover:shadow-lg">
                นำข้อมูลและรูปถ่ายเข้าฟอร์ม (Auto-Fill)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

Replace the `PHOTO_PRESETS` placeholder with the 4 full records copied verbatim from `js/form.js:219-468`, and fill in `generateNameplateSVG`'s template string with the exact SVG markup from `js/form.js:476-517`.

- [ ] **Step 4: Wire the modal into `app/form/page.tsx`**

Add to the form page component: an `openPhotoModal`/`photoModalOpen` state pair, an "Auto Fill" button next to the existing "กรอกอัตโนมัติ" button (matching `form.html:29-32`), and:

```tsx
<PhotoScanModal
  open={photoModalOpen}
  onClose={() => setPhotoModalOpen(false)}
  role={role!}
  buyerAllowedCategories={role === "buyer" ? Permissions.get(session.email) : undefined}
  onApply={(data, imageDataUrl) => {
    setValues((prev) => ({ ...prev, ...data, docs: (data.docs || "") + (prev.docs ? ", " + prev.docs : "") }));
    setNameplateImage(imageDataUrl);
  }}
/>
```

plus a `nameplateImage` state and the preview badge (`form.html:80-99`) rendered above `<div id="steps">`'s equivalent when `nameplateImage` is set.

- [ ] **Step 5: Run tests to verify they pass**

```bash
npm test -- PhotoScanModal app/form
```

Expected: PASS, all tests from both Task 18 and Task 19.

- [ ] **Step 6: Manually verify the camera flow in a real browser** (Jest/jsdom cannot exercise real `getUserMedia`): open `/form` in Chrome on `localhost`, click "Auto Fill", grant camera permission, confirm the live video feed renders, take a snapshot, confirm it reaches the preview stage and applies to the form. Then test the "อัปโหลดรูป" tab with a real image file and each of the 4 presets.

- [ ] **Step 7: Commit**

```bash
git add app/form/PhotoScanModal.tsx app/form/page.tsx app/form/__tests__/PhotoScanModal.test.tsx
git commit -m "feat: add AI nameplate-scan modal to the form page"
```

### Task 20: Admin page shell + Dashboard view

**Files:**
- Create: `app/admin/admin.module.css`
- Modify: `app/admin/page.tsx` (create the `admin/` directory)
- Create: `app/admin/DashboardView.tsx`
- Test: `app/admin/__tests__/DashboardView.test.tsx`
- Reference: `admin.html:1-530`, `js/admin.js` (sections implementing dashboard stats/tables — located by searching for `switchTableTab`, `applyFilters`, `cat-progress-bars` in `js/admin.js`)

**Interfaces:**
- Consumes: `useRequireAuth`; `Store`, `type Submission`; `Permissions`; `CATN`; `StatusBadge`. (Not `StatCard` — admin's 4 metric cards use a bespoke local `AdminMetricCard`, defined in this task, since admin.html's card markup differs visually from the plainer pattern `StatCard` covers for `/submissions`; see Step 3's note.)
- Produces: the `/admin` route's page shell (topbar, sidebar, mobile overlay) holding 3 view components in local state; `DashboardView` props `{ onOpenPermModal: (email?: string) => void; onOpenReturnModal: (subId?: string) => void; onViewSub: (sub: Submission) => void; onSwitchToView: (view: "perms" | "suppliers") => void }`, matching the real action set in `js/admin.js:300-312` (buyer row: "กำหนดสิทธิ์" / "ดูเอกสารที่รับผิดชอบ" / delete) and `js/admin.js:401-413` (submission row: "ดู" / "แก้ไข" / "ส่งคืน Buyer"). Tasks 21–23 add the other 2 views and the 4 modals into this same shell; Task 23's `ItemDetailModal` consumes `onViewSub`'s target.

- [ ] **Step 1: Write the failing test**

```tsx
// app/admin/__tests__/DashboardView.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { DashboardView } from "../DashboardView";
import { Store } from "../../../lib/store";
import { Permissions } from "../../../lib/permissions";

describe("DashboardView", () => {
  beforeEach(() => {
    localStorage.clear();
    Store.resetMock();
  });

  const baseProps = {
    onOpenPermModal: jest.fn(),
    onOpenReturnModal: jest.fn(),
    onViewSub: jest.fn(),
    onSwitchToView: jest.fn(),
  };

  it("shows the buyer count, pending count, and supplier-origin count metric cards", () => {
    render(<DashboardView {...baseProps} />);
    expect(screen.getByText("ทั้งหมด (Buyer)")).toBeInTheDocument();
    expect(screen.getByText("รออนุมัติ")).toBeInTheDocument();
    expect(screen.getByText("จาก Supplier")).toBeInTheDocument();
  });

  it("renders one category-progress bar per category that has an assigned buyer", () => {
    Permissions.set("buyer@demo.co.th", ["Chiller"]);
    render(<DashboardView {...baseProps} />);
    expect(screen.getByText("Chiller")).toBeInTheDocument();
  });

  it("switching to the submissions tab shows the submissions table instead of the buyers table", () => {
    render(<DashboardView {...baseProps} />);
    fireEvent.click(screen.getByText("รายการเอกสารทรัพย์สิน (ส่งคืน/ตรวจสอบ)"));
    expect(screen.getByText("รายการ / ทรัพย์สิน")).toBeInTheDocument();
  });

  it("the top 'กำหนดสิทธิ์ Category' button calls onOpenPermModal with no email", () => {
    const onOpenPermModal = jest.fn();
    render(<DashboardView {...baseProps} onOpenPermModal={onOpenPermModal} />);
    fireEvent.click(screen.getAllByText(/กำหนดสิทธิ์ Category/)[0]);
    expect(onOpenPermModal).toHaveBeenCalledWith(undefined);
  });

  it("a buyer row's 'กำหนดสิทธิ์' action calls onOpenPermModal with that buyer's email", () => {
    const onOpenPermModal = jest.fn();
    render(<DashboardView {...baseProps} onOpenPermModal={onOpenPermModal} />);
    fireEvent.click(screen.getAllByText("กำหนดสิทธิ์")[0]);
    expect(onOpenPermModal).toHaveBeenCalledWith(expect.stringContaining("@demo.co.th"));
  });

  it("a submission row's 'ส่งคืน Buyer' action calls onOpenReturnModal with that submission's id", () => {
    const onOpenReturnModal = jest.fn();
    render(<DashboardView {...baseProps} onOpenReturnModal={onOpenReturnModal} />);
    fireEvent.click(screen.getByText("รายการเอกสารทรัพย์สิน (ส่งคืน/ตรวจสอบ)"));
    fireEvent.click(screen.getAllByText("ส่งคืน Buyer")[0]);
    expect(onOpenReturnModal).toHaveBeenCalledWith(expect.any(String));
  });

  it("a submission row's 'ดู' action calls onViewSub with that submission record", () => {
    const onViewSub = jest.fn();
    render(<DashboardView {...baseProps} onViewSub={onViewSub} />);
    fireEvent.click(screen.getByText("รายการเอกสารทรัพย์สิน (ส่งคืน/ตรวจสอบ)"));
    fireEvent.click(screen.getAllByText("ดู")[0]);
    expect(onViewSub).toHaveBeenCalledWith(expect.objectContaining({ id: expect.any(String) }));
  });

  it("deleting a buyer (after confirming) removes their permission entry", () => {
    jest.spyOn(window, "confirm").mockReturnValue(true);
    render(<DashboardView {...baseProps} />);
    const email = screen.getAllByText(/@demo\.co\.th/)[0].textContent as string;
    fireEvent.click(screen.getAllByTitle("ลบ Buyer")[0]);
    expect(Permissions.get(email)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npm test -- DashboardView
```

Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Implement `app/admin/DashboardView.tsx`**

Port of `admin.html:199-530` (hero banner, 4 metric cards, category-progress list, tabbed buyer/submissions table with filters). The buyer table's "จัดการ" column action and the submissions table's "ส่งคืน" action are passed up via the existing `onOpenPermModal`/`onOpenReturnModal` props rather than duplicated here:

```tsx
// app/admin/DashboardView.tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Store, type Submission } from "../../lib/store";
import { Permissions } from "../../lib/permissions";
import { CATN } from "../../lib/catalog";
import { StatusBadge } from "../../components/StatusBadge";
import { fdt } from "../../lib/format";

type Props = {
  onOpenPermModal: (email?: string) => void;
  onOpenReturnModal: (subId?: string) => void;
  onSwitchToView: (view: "perms" | "suppliers") => void;
  onViewSub: (sub: Submission) => void;
};

export function DashboardView({ onOpenPermModal, onOpenReturnModal, onSwitchToView, onViewSub }: Props) {
  const router = useRouter();
  const [tableTab, setTableTab] = useState<"buyers" | "subs">("buyers");
  const [fBuyer, setFBuyer] = useState("");
  const [fCat, setFCat] = useState("");
  const [fStatus, setFStatus] = useState("");
  const [fQ, setFQ] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const buyers = useMemo(() => Permissions.getBuyers(), [refreshKey]);
  const subs = useMemo(() => Store.all(), [refreshKey]);

  const categoryProgress = useMemo(() => {
    return CATN.map((cat) => ({
      cat,
      buyerCount: buyers.filter((b) => b.categories.includes(cat)).length,
    })).filter((c) => c.buyerCount > 0);
  }, [buyers]);

  const filteredBuyers = buyers.filter((b) => {
    const matchBuyer = !fBuyer || b.email === fBuyer;
    const matchStatus = !fStatus || b.status === fStatus;
    const q = fQ.toLowerCase();
    const matchQ = !q || b.name.toLowerCase().includes(q) || b.email.toLowerCase().includes(q);
    return matchBuyer && matchStatus && matchQ;
  });

  const filteredSubs = subs.filter((s) => {
    const matchCat = !fCat || s.values?.category === fCat;
    const matchStatus = !fStatus || s.status === fStatus;
    const q = fQ.toLowerCase();
    const matchQ = !q || s.title.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
    return matchCat && matchStatus && matchQ;
  });

  const pendingCount = subs.filter((s) => s.status === "รอ Buyer ตรวจ").length;
  const supplierCount = subs.filter((s) => s.role === "supplier").length;

  return (
    <section className="space-y-6">
      <div className="bg-gradient-to-r from-[#dcfce7]/90 via-[#e0f7ee]/90 to-[#e0f2fe]/80 border border-emerald-200/60 rounded-3xl p-6 sm:p-7 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Admin Full View</h2>
          <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">
            คุณสามารถดูข้อมูล จัดการสิทธิ์ของ Buyer และเข้าถึงข้อมูล Supplier ได้ทุก Category ในระบบ
          </p>
        </div>
        <button onClick={() => onOpenPermModal()} className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm px-5 py-3 rounded-2xl shadow-sm">
          กำหนดสิทธิ์ Category ของ Buyer &rarr;
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminMetricCard
          icon={<ICON_BUYERS />}
          iconWrapClassName="bg-emerald-100 text-emerald-700"
          label="ทั้งหมด (Buyer)"
          value={buyers.length}
          actionLabel="ดูรายชื่อ Buyer ทั้งหมด"
          actionClassName="text-emerald-700"
          onAction={() => onSwitchToView("perms")}
        />
        <AdminMetricCard
          icon={<ICON_PENDING />}
          iconWrapClassName="bg-blue-100 text-blue-600"
          label="รออนุมัติ"
          value={pendingCount}
          actionLabel="ดูรายละเอียด"
          actionClassName="text-blue-600"
          onAction={() => setTableTab("subs")}
        />
        <AdminMetricCard
          icon={<ICON_PERMS />}
          iconWrapClassName="bg-purple-100 text-purple-600"
          label="ตรวจสิทธิ์ Category"
          value={categoryProgress.length}
          actionLabel="ดูรายละเอียด"
          actionClassName="text-purple-600"
          onAction={() => onOpenPermModal()}
        />
        <AdminMetricCard
          icon={<ICON_SUPPLIERS />}
          iconWrapClassName="bg-amber-100 text-amber-600"
          label="จาก Supplier"
          value={supplierCount}
          actionLabel="ดูรายชื่อ Supplier ทั้งหมด"
          actionClassName="text-amber-700"
          onAction={() => onSwitchToView("suppliers")}
        />
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-xs">
        <h3 className="font-bold text-base text-gray-900 mb-5">ภาพรวมรายการกำหนดสิทธิ์ Category</h3>
        <div className="space-y-3.5">
          {categoryProgress.map(({ cat, buyerCount }) => (
            <div key={cat} className="flex items-center gap-3 text-sm">
              <div className="w-48 shrink-0 truncate text-gray-700 font-medium">{cat}</div>
              <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${(buyerCount / Math.max(1, buyers.length)) * 100}%` }} />
              </div>
              <div className="w-8 text-right font-semibold text-gray-900">{buyerCount}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
          <div className="flex items-center gap-2 bg-gray-100/80 p-1 rounded-2xl w-fit">
            <button
              onClick={() => setTableTab("buyers")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold ${tableTab === "buyers" ? "bg-white text-emerald-800 shadow-xs" : "text-gray-600"}`}
            >
              สิทธิ์และสถานะ Buyer
            </button>
            <button
              onClick={() => setTableTab("subs")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold ${tableTab === "subs" ? "bg-white text-emerald-800 shadow-xs" : "text-gray-600"}`}
            >
              รายการเอกสารทรัพย์สิน (ส่งคืน/ตรวจสอบ)
            </button>
          </div>
          <div className="flex items-center gap-2 text-xs flex-wrap">
            <button onClick={() => onOpenPermModal()} className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-3.5 py-2 rounded-xl font-semibold">
              กำหนดสิทธิ์ Category
            </button>
            <button onClick={onOpenReturnModal} className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3.5 py-2 rounded-xl font-semibold">
              ส่งคืนเอกสารให้ Buyer
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 items-end">
          <select value={fBuyer} onChange={(e) => setFBuyer(e.target.value)} className="inp text-xs !py-2 !rounded-xl">
            <option value="">ชื่อ / อีเมล / เบอร์โทร</option>
            {buyers.map((b) => (
              <option key={b.email} value={b.email}>
                {b.name}
              </option>
            ))}
          </select>
          <select value={fCat} onChange={(e) => setFCat(e.target.value)} className="inp text-xs !py-2 !rounded-xl">
            <option value="">ทั้งหมด</option>
            {CATN.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select value={fStatus} onChange={(e) => setFStatus(e.target.value)} className="inp text-xs !py-2 !rounded-xl">
            <option value="">ทั้งหมด</option>
            <option value="ใช้งานอยู่">ใช้งานอยู่</option>
            <option value="รออนุมัติ">รออนุมัติ</option>
            <option value="รอ Buyer ตรวจ">รอ Buyer ตรวจ</option>
            <option value="ส่งคืนให้ Buyer แก้ไข">ส่งคืนให้ Buyer แก้ไข</option>
            <option value="ตรวจ/แก้ไขแล้ว">ตรวจ/แก้ไขแล้ว</option>
          </select>
          <input value={fQ} onChange={(e) => setFQ(e.target.value)} placeholder="ค้นหา Supplier / Buyer..." className="inp text-xs !py-2 !rounded-xl" />
          <button
            onClick={() => {
              setFBuyer("");
              setFCat("");
              setFStatus("");
              setFQ("");
            }}
            className="w-full border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold py-2 px-3 rounded-xl"
          >
            รีเซ็ต
          </button>
        </div>

        {tableTab === "buyers" ? (
          <div className="overflow-x-auto rounded-2xl border border-gray-100">
            <table className="w-full text-xs sm:text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-100">
                <tr>
                  <th className="p-3">ชื่อ Buyer</th>
                  <th className="p-3">อีเมล</th>
                  <th className="p-3">Category ที่เข้าถึง</th>
                  <th className="p-3">สถานะ</th>
                  <th className="p-3 whitespace-nowrap">วันที่อัปเดต</th>
                  <th className="p-3 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredBuyers.map((b) => (
                  <tr key={b.email}>
                    <td className="p-3">
                      <button onClick={() => onOpenPermModal(b.email)} className="text-left font-semibold text-gray-900 hover:text-emerald-700">
                        {b.name}
                      </button>
                    </td>
                    <td className="p-3">{b.email}</td>
                    <td className="p-3">{b.categories.join(", ") || "-"}</td>
                    <td className="p-3">{b.status}</td>
                    <td className="p-3 whitespace-nowrap text-gray-500 text-xs">{b.updatedAtStr}</td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => onOpenPermModal(b.email)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200"
                        >
                          {/* Paste the <svg> from js/admin.js:302 verbatim */}
                          <span>กำหนดสิทธิ์</span>
                        </button>
                        <button
                          onClick={() => {
                            setTableTab("subs");
                            setFBuyer(b.email);
                          }}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                          title="ดูเอกสารที่รับผิดชอบ"
                        >
                          {/* Paste the <svg> from js/admin.js:307 verbatim — icon-only button, no visible text */}
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`คุณต้องการลบ Buyer "${b.email}" หรือไม่?`)) {
                              Permissions.delete(b.email);
                              setRefreshKey((k) => k + 1);
                            }
                          }}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50"
                          title="ลบ Buyer"
                        >
                          {/* Paste the <svg> from js/admin.js:311 verbatim — icon-only button, no visible text */}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gray-100">
            <table className="w-full text-xs sm:text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-100">
                <tr>
                  <th className="p-3">วันที่ส่ง</th>
                  <th className="p-3">รายการ / ทรัพย์สิน</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">ผู้ส่ง (Supplier)</th>
                  <th className="p-3">สถานะ</th>
                  <th className="p-3 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredSubs.map((s) => (
                  <tr key={s.id} className={s.status === "ส่งคืนให้ Buyer แก้ไข" ? "bg-rose-50/30" : ""}>
                    <td className="p-3 whitespace-nowrap">{fdt(s.at)}</td>
                    <td className="p-3">{s.title}</td>
                    <td className="p-3">{String(s.values?.category || "-")}</td>
                    <td className="p-3">{s.email}</td>
                    <td className="p-3">
                      <StatusBadge status={s.status} />
                    </td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button onClick={() => onViewSub(s)} className="text-xs text-gray-600 hover:text-emerald-700 font-semibold px-2 py-1 rounded-md hover:bg-gray-100">
                          ดู
                        </button>
                        <button
                          onClick={() => router.push(`/form?edit=${encodeURIComponent(s.id)}`)}
                          className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold px-2 py-1 rounded-md hover:bg-emerald-50"
                        >
                          แก้ไข
                        </button>
                        <button
                          onClick={() => onOpenReturnModal(s.id)}
                          className="text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold px-2.5 py-1 rounded-lg"
                        >
                          ส่งคืน Buyer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

// Local to this file, not a shared component: admin.html's 4 metric cards
// (rounded-3xl, p-5, icon circle, hover:shadow-md transition-shadow — admin.html:264-347)
// are visually distinct from the plainer stat cards on /submissions (rounded-2xl, p-4, no
// icon, which `components/StatCard` already covers correctly). Forcing both patterns through
// one shared component would mean either the submissions cards gain an unwanted icon slot or
// the admin cards lose their icon/hover styling — so this task defines its own small
// presentational component instead, matching admin.html exactly.
function AdminMetricCard({
  icon,
  iconWrapClassName,
  label,
  value,
  actionLabel,
  actionClassName,
  onAction,
}: {
  icon: React.ReactNode;
  iconWrapClassName: string;
  label: string;
  value: number | string;
  actionLabel: string;
  actionClassName: string;
  onAction: () => void;
}) {
  return (
    <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
      <div>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg mb-3 ${iconWrapClassName}`}>
          {icon}
        </div>
        <div className="text-xs text-gray-500 font-medium">{label}</div>
        <div className="text-3xl font-bold text-gray-900 mt-1">{value}</div>
      </div>
      <button type="button" onClick={onAction} className={`text-xs font-semibold hover:underline flex items-center gap-1 mt-3 ${actionClassName}`}>
        <span>{actionLabel}</span>
        <span>&rarr;</span>
      </button>
    </div>
  );
}

// 4 icon components, each copied verbatim from admin.html's inline <svg> (same viewBox,
// stroke, and path data — admin.html:269-273,291-294,312-314,333-336):
function ICON_BUYERS() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}
function ICON_PENDING() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
function ICON_PERMS() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
function ICON_SUPPLIERS() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );
}
```

- [ ] **Step 4: Implement the admin page shell wrapping it**

Port of the page-local `<style>` block from `admin.html:13-33` (`.sidebar-link`, `.sidebar-link.active`, `.sidebar-link:not(.active):hover`) into a CSS Module, since conditional Tailwind arbitrary-value classes alone would risk drifting from the exact `#059669`/`#e6f7f0`/`#f1f5f9`/`#0f172a` colors specified there:

```css
/* app/admin/admin.module.css */
.sidebarLink {
  transition: all 0.15s ease-in-out;
}

.sidebarLink.active {
  background-color: #e6f7f0;
  color: #059669;
  font-weight: 600;
}

.sidebarLink:not(.active):hover {
  background-color: #f1f5f9;
  color: #0f172a;
}
```

```tsx
// app/admin/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRequireAuth } from "../../lib/useRequireAuth";
import { Auth } from "../../lib/auth";
import { DashboardView } from "./DashboardView";
import styles from "./admin.module.css";

export default function Page() {
  const session = useRequireAuth(["admin"]);
  const [view, setView] = useState<"dashboard" | "perms" | "suppliers">("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Task 21 consumes selectedBuyerEmail to preselect a buyer when arriving via a row action.
  const [selectedBuyerEmail, setSelectedBuyerEmail] = useState<string | undefined>(undefined);
  // Task 23 consumes these two to open the return-to-buyer modal and the item detail modal.
  const [returnModalSubId, setReturnModalSubId] = useState<string | undefined>(undefined);
  const [viewingSub, setViewingSub] = useState<import("../../lib/store").Submission | null>(null);

  if (!session) return null;

  return (
    <div className="bg-[#f8fafc] text-gray-900 min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-xs">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen((v) => !v)} className="lg:hidden p-2 rounded-xl text-gray-600 hover:bg-gray-100">
              ☰
            </button>
            <Link href="/" className="flex items-center gap-2.5 group">
              <span className="font-bold text-xl text-gray-900 tracking-tight group-hover:text-emerald-700 transition-colors">
                Supplier Portal
              </span>
            </Link>
            <span className="text-xs px-3 py-0.5 rounded-full bg-gray-100 text-gray-700 font-semibold border border-gray-200">Admin</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-gray-800 hidden md:inline">{session.name}</span>
            <button onClick={Auth.logout} className="text-xs text-rose-600 font-medium">
              ออกจากระบบ
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside
          className={`w-64 bg-white border-r border-gray-100 flex flex-col justify-between shrink-0 fixed inset-y-0 left-0 z-40 transform transition-transform duration-200 ease-in-out top-[57px] lg:static lg:translate-x-0 ${
            sidebarOpen ? "" : "-translate-x-full"
          }`}
        >
          <div className="p-4 space-y-1.5">
            <button
              onClick={() => setView("dashboard")}
              className={`${styles.sidebarLink} ${view === "dashboard" ? styles.active : ""} flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium w-full text-left`}
            >
              หน้าหลัก
            </button>
            <button
              onClick={() => setView("perms")}
              className={`${styles.sidebarLink} ${view === "perms" ? styles.active : ""} flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium w-full text-left`}
            >
              จัดการสิทธิ์ Buyer
            </button>
            <button
              onClick={() => setView("suppliers")}
              className={`${styles.sidebarLink} ${view === "suppliers" ? styles.active : ""} flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium w-full text-left`}
            >
              รายชื่อ Supplier
            </button>
          </div>
        </aside>

        {sidebarOpen ? <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/40 z-30 lg:hidden" /> : null}

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto space-y-6">
          {view === "dashboard" ? (
            <DashboardView
              onOpenPermModal={(email) => {
                setSelectedBuyerEmail(email);
                setView("perms");
              }}
              onOpenReturnModal={(subId) => setReturnModalSubId(subId)}
              onViewSub={(sub) => setViewingSub(sub)}
              onSwitchToView={setView}
            />
          ) : null}
          {/* view === "perms" (consuming selectedBuyerEmail) and view === "suppliers" added in
              Tasks 21–22; ReturnModal (consuming returnModalSubId), ItemDetailModal (consuming
              viewingSub), SupplierDetailModal, and AddSupplierModal added in Task 23 */}
        </main>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Run the test to verify it passes**

```bash
npm test -- DashboardView
```

Expected: PASS, all 8 assertions.

- [ ] **Step 6: Commit**

```bash
git add app/admin/page.tsx app/admin/admin.module.css app/admin/DashboardView.tsx app/admin/__tests__/DashboardView.test.tsx
git commit -m "feat: add admin page shell and dashboard view"
```

### Task 21: `BuyerPermsView` component

**Files:**
- Create: `app/admin/BuyerPermsView.tsx`
- Modify: `app/admin/page.tsx` (render this view when `view === "perms"`)
- Test: `app/admin/__tests__/BuyerPermsView.test.tsx`
- Reference: `admin.html:532-710`

**Interfaces:**
- Consumes: `Permissions`, `DEFAULT_BUYER_PERMS`; `CATN`.
- Produces: `<BuyerPermsView onBack={() => void} initialEmail?={string} />` — `initialEmail` (from `app/admin/page.tsx`'s `selectedBuyerEmail`, set by `DashboardView`'s row actions) preselects that buyer on mount instead of defaulting to the first buyer in the list, matching `js/admin.js:674-698`'s `openPermModal(buyerEmail)` → `initBuyerPermsFullPage(targetEmail)` behavior. Otherwise self-contained — owns its own selected-buyer/unsaved-changes state.

- [ ] **Step 1: Write the failing tests**

```tsx
// app/admin/__tests__/BuyerPermsView.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { BuyerPermsView } from "../BuyerPermsView";
import { Permissions } from "../../../lib/permissions";

describe("BuyerPermsView", () => {
  beforeEach(() => localStorage.clear());

  it("selecting a buyer shows their currently-enabled category count", () => {
    Permissions.set("buyer@demo.co.th", ["Chiller", "Fork lift"]);
    render(<BuyerPermsView onBack={jest.fn()} />);
    fireEvent.click(screen.getByText("buyer@demo.co.th"));
    expect(screen.getByText(/2 จาก 14 หมวดหมู่/)).toBeInTheDocument();
  });

  it("toggling a category card and saving persists the new permission set", () => {
    Permissions.set("buyer@demo.co.th", []);
    render(<BuyerPermsView onBack={jest.fn()} />);
    fireEvent.click(screen.getByText("buyer@demo.co.th"));
    fireEvent.click(screen.getByText("Chiller"));
    fireEvent.click(screen.getByText("บันทึกสิทธิ์ Category"));
    expect(Permissions.get("buyer@demo.co.th")).toContain("Chiller");
  });

  it("'เลือกทั้งหมด' enables all 14 categories for the selected buyer before saving", () => {
    render(<BuyerPermsView onBack={jest.fn()} />);
    fireEvent.click(screen.getByText("buyer@demo.co.th"));
    fireEvent.click(screen.getByText("เลือกทั้งหมด"));
    expect(screen.getByText(/14 จาก 14 หมวดหมู่/)).toBeInTheDocument();
  });

  it("adding a new buyer by email creates an entry with zero categories", () => {
    render(<BuyerPermsView onBack={jest.fn()} />);
    fireEvent.change(screen.getByPlaceholderText(/buyer5@demo.co.th/), { target: { value: "newbuyer@demo.co.th" } });
    fireEvent.click(screen.getByText("+ เพิ่ม"));
    expect(screen.getByText("newbuyer@demo.co.th")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- BuyerPermsView
```

Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Implement `app/admin/BuyerPermsView.tsx`**

Port of `admin.html:532-710`. The 4 preset pills (`fullPermApplyPreset`) map category-name groups that must be copied exactly from `js/admin.js` (search for `hvac:`, `elec:`, `logistics:`, `super:` preset arrays):

```tsx
// app/admin/BuyerPermsView.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Permissions } from "../../lib/permissions";
import { CATN } from "../../lib/catalog";
import { J } from "../../lib/safeStorage";

// Copied verbatim from js/admin.js:884-890 (fullPermApplyPreset)
const PRESETS: Record<string, string[]> = {
  hvac: ["Refrigeration system", "Chiller", "Air condition / AHU", "Cooling tower"],
  elec: ["Safety Equipment", "Electrical system"],
  logistics: ["Logistic Equipment", "Fork lift"],
  super: ["Super Equipment"],
};

export function BuyerPermsView({ onBack, initialEmail }: { onBack: () => void; initialEmail?: string }) {
  const [search, setSearch] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [buyersVersion, setBuyersVersion] = useState(0);
  const [activeEmail, setActiveEmail] = useState<string | null>(null);
  const [draftCats, setDraftCats] = useState<string[]>([]);
  const [catSearch, setCatSearch] = useState("");

  const buyers = useMemo(() => Permissions.getBuyers(), [buyersVersion]);
  const filteredBuyers = buyers.filter((b) => {
    const q = search.toLowerCase();
    return !q || b.name.toLowerCase().includes(q) || b.email.toLowerCase().includes(q);
  });

  function selectBuyer(email: string) {
    setActiveEmail(email);
    setDraftCats(Permissions.get(email));
  }

  useEffect(() => {
    const target = initialEmail && buyers.some((b) => b.email.toLowerCase() === initialEmail.toLowerCase())
      ? initialEmail
      : buyers[0]?.email;
    if (target) selectBuyer(target);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialEmail]);

  function toggleCategory(cat: string) {
    setDraftCats((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]));
  }

  function save() {
    if (!activeEmail) return;
    Permissions.set(activeEmail, draftCats);
    setBuyersVersion((v) => v + 1);
  }

  function addBuyer() {
    const email = newEmail.trim().toLowerCase();
    if (!email || !email.includes("@")) return;
    Permissions.set(email, []);
    // Also register a login-capable account, matching js/admin.js:951-962
    const users = J.get<{ role: string; email: string; pw: string; company: string }[]>("portal_users", []);
    if (!users.some((u) => u.email.toLowerCase() === email)) {
      users.push({ role: "buyer", email, pw: "demo1234", company: "Buyer (" + email.split("@")[0] + ")" });
      J.set("portal_users", users);
    }
    setNewEmail("");
    setBuyersVersion((v) => v + 1);
  }

  const visibleCats = CATN.filter((c) => !catSearch || c.toLowerCase().includes(catSearch.toLowerCase()));

  return (
    <section className="space-y-6">
      <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-xs flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">กำหนดสิทธิ์ Category สำหรับ Buyer</h1>
        <button onClick={onBack} className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-4 py-2.5 rounded-2xl font-medium text-xs sm:text-sm">
          กลับหน้าหลัก
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-4 bg-white rounded-3xl border border-gray-100 p-5 shadow-xs space-y-4">
          <h2 className="font-bold text-sm text-gray-900">รายชื่อ Buyer ในระบบ</h2>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ค้นหาชื่อหรืออีเมล Buyer..." className="inp text-xs !py-2.5" />
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {filteredBuyers.map((b) => (
              <button
                key={b.email}
                onClick={() => selectBuyer(b.email)}
                className={`w-full text-left p-2.5 rounded-xl border ${activeEmail === b.email ? "border-emerald-500 bg-emerald-50" : "border-gray-200"}`}
              >
                <div className="font-bold text-gray-800">{b.email}</div>
                <div className="text-[11px] text-gray-500">{b.categories.length} categories</div>
              </button>
            ))}
          </div>
          <div className="pt-3 border-t border-gray-100 space-y-2">
            <div className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">เพิ่มบัญชี Buyer ใหม่</div>
            <div className="flex items-center gap-1.5">
              <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="เช่น buyer5@demo.co.th" className="inp text-xs !py-2 flex-1" />
              <button onClick={addBuyer} className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-3.5 py-2 rounded-xl shrink-0">
                + เพิ่ม
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-5">
          {activeEmail ? (
            <>
              <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                  <div>
                    <h3 className="font-bold text-base text-gray-900">{activeEmail}</h3>
                    <div className="text-sm font-bold text-emerald-800">
                      {draftCats.length} จาก {CATN.length} หมวดหมู่ ({Math.round((draftCats.length / CATN.length) * 100)}%)
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setDraftCats(CATN)} className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
                      เลือกทั้งหมด
                    </button>
                    <button onClick={() => setDraftCats([])} className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-gray-50 text-gray-600 border border-gray-200">
                      ยกเลิกทั้งหมด
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {Object.keys(PRESETS).map((key) => (
                    <button key={key} onClick={() => setDraftCats(PRESETS[key])} className="px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-emerald-900 text-xs font-medium">
                      {key}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-xs space-y-4">
                <input value={catSearch} onChange={(e) => setCatSearch(e.target.value)} placeholder="ค้นหาชื่อหมวดหมู่..." className="inp text-xs !py-2" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[520px] overflow-y-auto pr-1">
                  {visibleCats.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => toggleCategory(cat)}
                      className={`p-3.5 rounded-2xl border text-left ${draftCats.includes(cat) ? "border-emerald-500 bg-emerald-50" : "border-gray-200 bg-white"}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-5 border-t border-gray-100 gap-3">
                  <button
                    onClick={() => {
                      if (!activeEmail) return;
                      if (confirm(`คุณต้องการลบ Buyer "${activeEmail}" ออกจากระบบหรือไม่?`)) {
                        Permissions.delete(activeEmail);
                        setActiveEmail(null);
                        setDraftCats([]);
                        setBuyersVersion((v) => v + 1);
                      }
                    }}
                    className="text-xs text-rose-600 hover:text-rose-800 font-medium hover:underline"
                  >
                    ลบ Buyer นี้ออกจากระบบ
                  </button>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setDraftCats(Permissions.get(activeEmail))} className="border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-600">
                      คืนค่าเดิม
                    </button>
                    <button onClick={save} className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl px-6 py-2.5 text-xs sm:text-sm font-semibold">
                      บันทึกสิทธิ์ Category
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-xs text-sm text-gray-500">เลือก Buyer จากรายการทางซ้ายเพื่อจัดการสิทธิ์</div>
          )}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Render it from `app/admin/page.tsx`** when `view === "perms"`, replacing part of the forward-reference comment from Task 20's Step 4 with `<BuyerPermsView onBack={() => setView("dashboard")} initialEmail={selectedBuyerEmail} />`.

- [ ] **Step 5: Run tests to verify they pass**

```bash
npm test -- BuyerPermsView
```

Expected: PASS, all 4 assertions.

- [ ] **Step 6: Commit**

```bash
git add app/admin/BuyerPermsView.tsx app/admin/page.tsx app/admin/__tests__/BuyerPermsView.test.tsx
git commit -m "feat: add admin buyer-permissions full-page view"
```

### Task 22: `SupplierDirectoryView` component

**Files:**
- Create: `app/admin/SupplierDirectoryView.tsx`
- Modify: `app/admin/page.tsx` (render this view when `view === "suppliers"`)
- Test: `app/admin/__tests__/SupplierDirectoryView.test.tsx`
- Reference: `admin.html:712-791`, `js/admin.js:1017-1131` (`drawSupplierListFullPage`)

**Interfaces:**
- Consumes: `Suppliers`, `type Supplier` from `lib/suppliers.ts`; `Store` from `lib/store.ts`.
- Produces: `<SupplierDirectoryView onBack={() => void} onOpenAddSupplier={() => void} onViewSupplierDetail={(sup: Supplier) => void} />`. Task 23's `AddSupplierModal` and `SupplierDetailModal` are opened via the latter two props, owned by `app/admin/page.tsx`.

- [ ] **Step 1: Write the failing tests**

```tsx
// app/admin/__tests__/SupplierDirectoryView.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { SupplierDirectoryView } from "../SupplierDirectoryView";
import { Suppliers } from "../../../lib/suppliers";

describe("SupplierDirectoryView", () => {
  beforeEach(() => localStorage.clear());

  it("renders the 4 stat cards with the seeded supplier/submission counts", () => {
    render(<SupplierDirectoryView onBack={jest.fn()} onOpenAddSupplier={jest.fn()} onViewSupplierDetail={jest.fn()} />);
    expect(screen.getByText("คู่ค้าทั้งหมด")).toBeInTheDocument();
    expect(screen.getByText(String(Suppliers.all().length))).toBeInTheDocument();
  });

  it("filters the table by company/code/taxId/email search text", () => {
    render(<SupplierDirectoryView onBack={jest.fn()} onOpenAddSupplier={jest.fn()} onViewSupplierDetail={jest.fn()} />);
    fireEvent.change(screen.getByPlaceholderText(/ค้นหาชื่อบริษัท/), { target: { value: "SUP-00088" } });
    expect(screen.getByText(/เทรน \(ประเทศไทย\)/)).toBeInTheDocument();
    expect(screen.queryByText(/ตัวอย่างซัพพลาย/)).toBeNull();
  });

  it("shows the empty state when the search matches nothing", () => {
    render(<SupplierDirectoryView onBack={jest.fn()} onOpenAddSupplier={jest.fn()} onViewSupplierDetail={jest.fn()} />);
    fireEvent.change(screen.getByPlaceholderText(/ค้นหาชื่อบริษัท/), { target: { value: "no-such-company-xyz" } });
    expect(screen.getByText("ไม่พบคู่ค้าตามเงื่อนไขที่ค้นหา")).toBeInTheDocument();
  });

  it("clicking 'ดูรายละเอียด' on a row calls onViewSupplierDetail with that supplier", () => {
    const onViewSupplierDetail = jest.fn();
    render(<SupplierDirectoryView onBack={jest.fn()} onOpenAddSupplier={jest.fn()} onViewSupplierDetail={onViewSupplierDetail} />);
    fireEvent.click(screen.getAllByText("ดูรายละเอียด")[0]);
    expect(onViewSupplierDetail).toHaveBeenCalledWith(expect.objectContaining({ code: expect.any(String) }));
  });

  it("'+ เพิ่มคู่ค้าใหม่' calls onOpenAddSupplier", () => {
    const onOpenAddSupplier = jest.fn();
    render(<SupplierDirectoryView onBack={jest.fn()} onOpenAddSupplier={onOpenAddSupplier} onViewSupplierDetail={jest.fn()} />);
    fireEvent.click(screen.getByText("+ เพิ่มคู่ค้าใหม่"));
    expect(onOpenAddSupplier).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- SupplierDirectoryView
```

Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Implement `app/admin/SupplierDirectoryView.tsx`**

Port of `admin.html:712-791` + `js/admin.js:1017-1131`. The `totalValue` fallback (`totalValue || 4545000`, `js/admin.js:1058`) and per-category `itemCount` matching logic (`js/admin.js:1092-1095`, matching either by email or by `values.sup` containing the supplier code) are both ported exactly:

```tsx
// app/admin/SupplierDirectoryView.tsx
"use client";

import { useMemo, useState } from "react";
import { Suppliers, type Supplier } from "../../lib/suppliers";
import { Store } from "../../lib/store";

type Props = {
  onBack: () => void;
  onOpenAddSupplier: () => void;
  onViewSupplierDetail: (sup: Supplier) => void;
};

export function SupplierDirectoryView({ onBack, onOpenAddSupplier, onViewSupplierDetail }: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const suppliers = useMemo(() => Suppliers.all(), []);
  const subs = useMemo(() => Store.all(), []);

  const itemCountFor = (s: Supplier) =>
    subs.filter(
      (item) =>
        (item.email || "").toLowerCase() === (s.email || "").toLowerCase() ||
        String(item.values?.sup || "").toLowerCase().includes(s.code.toLowerCase())
    ).length;

  const totalValue =
    subs.reduce((sum, s) => sum + (parseFloat(String(s.values?.price ?? "")) || 0), 0) || 4545000;

  const filtered = suppliers.filter((s) => {
    const q = search.toLowerCase().trim();
    const matchQ =
      !q ||
      s.company.toLowerCase().includes(q) ||
      s.code.toLowerCase().includes(q) ||
      (s.contact || "").toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.taxId.includes(q);
    const matchStatus = !statusFilter || s.status === statusFilter;
    return matchQ && matchStatus;
  });

  return (
    <section className="space-y-6">
      <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-xs flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">ทะเบียนและข้อมูลคู่ค้า Supplier</h1>
        <div className="flex items-center gap-2.5">
          <button onClick={onBack} className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-4 py-2.5 rounded-2xl font-medium text-xs sm:text-sm">
            กลับหน้าหลัก
          </button>
          <button onClick={onOpenAddSupplier} className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2.5 rounded-2xl font-semibold text-xs sm:text-sm">
            + เพิ่มคู่ค้าใหม่
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs">
          <div className="text-[11px] font-medium text-gray-500">คู่ค้าทั้งหมด</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{suppliers.length}</div>
          <div className="text-[10px] text-gray-400 mt-0.5">นิติบุคคลในระบบ</div>
        </div>
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs">
          <div className="text-[11px] font-medium text-gray-500">อนุมัติแล้ว</div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{suppliers.filter((s) => s.status === "อนุมัติแล้ว").length}</div>
          <div className="text-[10px] text-emerald-600 mt-0.5">พร้อมส่งมอบงาน</div>
        </div>
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs">
          <div className="text-[11px] font-medium text-gray-500">รอตรวจสอบ</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">{suppliers.filter((s) => s.status === "รอตรวจสอบ").length}</div>
          <div className="text-[10px] text-amber-600 mt-0.5">รอแอดมินอนุมัติ</div>
        </div>
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs">
          <div className="text-[11px] font-medium text-gray-500">มูลค่าสั่งซื้อรวม</div>
          <div className="text-lg sm:text-xl font-bold text-emerald-900 mt-1 font-mono">
            {totalValue.toLocaleString("th-TH")} <span className="text-xs font-normal text-gray-500">THB</span>
          </div>
          <div className="text-[10px] text-gray-400 mt-0.5">ทุกสัญญา PO</div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อบริษัท, รหัส SUP, เลขประจำตัวผู้เสียภาษี, อีเมล..."
            className="inp text-xs !py-2.5 flex-1 min-w-[240px]"
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="inp text-xs !py-2.5 !w-auto">
            <option value="">สถานะ: ทั้งหมด</option>
            <option value="อนุมัติแล้ว">อนุมัติแล้ว</option>
            <option value="รอตรวจสอบ">รอตรวจสอบ</option>
          </select>
        </div>

        <div className="overflow-x-auto border border-gray-100 rounded-2xl">
          <table className="w-full text-xs sm:text-sm text-left">
            <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-100">
              <tr>
                <th className="p-3.5">รหัสคู่ค้า</th>
                <th className="p-3.5">ชื่อบริษัท / นิติบุคคล</th>
                <th className="p-3.5">เลขผู้เสียภาษี (Tax ID)</th>
                <th className="p-3.5">ผู้ติดต่อ & เบอร์โทร</th>
                <th className="p-3.5">อีเมล</th>
                <th className="p-3.5 text-center">รายการที่ส่ง</th>
                <th className="p-3.5">สถานะ</th>
                <th className="p-3.5 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((s) => {
                const count = itemCountFor(s);
                return (
                  <tr key={s.code} className="hover:bg-gray-50/80 transition-colors">
                    <td className="p-3.5 font-mono font-semibold text-emerald-800 text-xs">{s.code}</td>
                    <td className="p-3.5">
                      <div className="font-bold text-gray-900">{s.company}</div>
                      <div className="text-[11px] text-gray-400 line-clamp-1">{s.address || "-"}</div>
                    </td>
                    <td className="p-3.5 font-mono text-gray-600 text-xs">{s.taxId || "-"}</td>
                    <td className="p-3.5">
                      <div className="text-gray-800 font-medium">{s.contact || "-"}</div>
                      <div className="text-[11px] text-gray-500">{s.phone || "-"}</div>
                    </td>
                    <td className="p-3.5 font-mono text-gray-600 text-xs">{s.email}</td>
                    <td className="p-3.5 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${count > 0 ? "bg-emerald-100 text-emerald-800 font-bold" : "bg-gray-100 text-gray-500"}`}>
                        {count} เครื่อง
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${s.status === "อนุมัติแล้ว" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-amber-50 text-amber-800 border border-amber-200"}`}>
                        {s.status || "อนุมัติแล้ว"}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => onViewSupplierDetail(s)}
                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold text-xs px-3.5 py-1.5 rounded-xl"
                      >
                        ดูรายละเอียด
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 ? <div className="p-12 text-center text-gray-400 text-sm">ไม่พบคู่ค้าตามเงื่อนไขที่ค้นหา</div> : null}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Render it from `app/admin/page.tsx`** when `view === "suppliers"`. This requires two more pieces of state in the page shell that Task 23 will finish wiring up: `addSupplierModalOpen` (toggled by `onOpenAddSupplier`) and `viewingSupplier` (set by `onViewSupplierDetail`):

```tsx
{view === "suppliers" ? (
  <SupplierDirectoryView
    onBack={() => setView("dashboard")}
    onOpenAddSupplier={() => setAddSupplierModalOpen(true)}
    onViewSupplierDetail={(sup) => setViewingSupplier(sup)}
  />
) : null}
```

plus the matching `const [addSupplierModalOpen, setAddSupplierModalOpen] = useState(false);` and `const [viewingSupplier, setViewingSupplier] = useState<import("../../lib/suppliers").Supplier | null>(null);` added alongside the other page-level state from Task 20's Step 4.

- [ ] **Step 5: Run tests to verify they pass**

```bash
npm test -- SupplierDirectoryView
```

Expected: PASS, all 5 assertions.

- [ ] **Step 6: Commit**

```bash
git add app/admin/SupplierDirectoryView.tsx app/admin/page.tsx app/admin/__tests__/SupplierDirectoryView.test.tsx
git commit -m "feat: add admin supplier-directory full-page view"
```

### Task 23: Admin modals — `ReturnModal`, `ItemDetailModal`, `SupplierDetailModal`, `AddSupplierModal`

**Files:**
- Create: `app/admin/ReturnModal.tsx`
- Create: `app/admin/ItemDetailModal.tsx`
- Create: `app/admin/SupplierDetailModal.tsx`
- Create: `app/admin/AddSupplierModal.tsx`
- Modify: `app/admin/page.tsx` (render and wire all 4)
- Test: `app/admin/__tests__/ReturnModal.test.tsx`
- Test: `app/admin/__tests__/ItemDetailModal.test.tsx`
- Test: `app/admin/__tests__/SupplierDetailModal.test.tsx`
- Test: `app/admin/__tests__/AddSupplierModal.test.tsx`
- Reference: `admin.html:796-1053`, `js/admin.js:425-610,1137-1260`

**Interfaces:**
- Consumes: `Modal` component; `Store`, `type Submission`; `Permissions`; `Suppliers`, `type Supplier`; `fdt` from `lib/format.ts`.
- Produces: `<ReturnModal open onClose subId? />`, `<ItemDetailModal open onClose sub onReturn={(id: string) => void} onEdit={(id: string) => void} />`, `<SupplierDetailModal open onClose supplier onFilterInMainList={() => void} />`, `<AddSupplierModal open onClose onSaved={() => void} />`. All 4 are wired from `app/admin/page.tsx`'s state added across Tasks 20–22.

- [ ] **Step 1: Write the failing tests**

```tsx
// app/admin/__tests__/ReturnModal.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { ReturnModal } from "../ReturnModal";
import { Store } from "../../../lib/store";
import { Auth } from "../../../lib/auth";

describe("ReturnModal", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    Store.resetMock();
    Auth.login("admin", "admin@demo.co.th", "demo1234");
  });

  it("preselects the document passed via subId and shows its category", () => {
    const target = Store.all()[0];
    render(<ReturnModal open={true} onClose={jest.fn()} subId={target.id} />);
    expect(screen.getByText(String(target.values?.category))).toBeInTheDocument();
  });

  it("blocks submission when the reason textarea is empty", () => {
    const target = Store.all()[0];
    window.alert = jest.fn();
    render(<ReturnModal open={true} onClose={jest.fn()} subId={target.id} />);
    fireEvent.click(screen.getByText("ยืนยันส่งคืนเอกสาร"));
    expect(window.alert).toHaveBeenCalled();
    expect(Store.all().find((r) => r.id === target.id)?.status).not.toBe("ส่งคืนให้ Buyer แก้ไข");
  });

  it("a quick-remark chip appends its text into the reason textarea", () => {
    const target = Store.all()[0];
    render(<ReturnModal open={true} onClose={jest.fn()} subId={target.id} />);
    fireEvent.click(screen.getByText("รูปเนมเพลทไม่ชัดเจน"));
    expect(screen.getByRole("textbox", { name: /ระบุเหตุผล/ })).toHaveValue(
      "ขอรูปถ่ายเนมเพลท / Serial ให้ชัดเจน"
    );
  });

  it("confirming sets status to ส่งคืนให้ Buyer แก้ไข with reason/assignedBuyer/returnedBy persisted", () => {
    const target = Store.all()[0];
    render(<ReturnModal open={true} onClose={jest.fn()} subId={target.id} />);
    fireEvent.change(screen.getByRole("textbox", { name: /ระบุเหตุผล/ }), { target: { value: "ขอตรวจสอบเพิ่มเติม" } });
    fireEvent.click(screen.getByText("ยืนยันส่งคืนเอกสาร"));
    const updated = Store.all().find((r) => r.id === target.id);
    expect(updated?.status).toBe("ส่งคืนให้ Buyer แก้ไข");
    expect(updated?.returnReason).toBe("ขอตรวจสอบเพิ่มเติม");
    expect(updated?.returnedBy).toBe("admin@demo.co.th");
    expect(updated?.assignedBuyer).toBeTruthy();
  });
});
```

```tsx
// app/admin/__tests__/ItemDetailModal.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { ItemDetailModal } from "../ItemDetailModal";
import { Store } from "../../../lib/store";

describe("ItemDetailModal", () => {
  beforeEach(() => {
    localStorage.clear();
    Store.resetMock();
  });

  it("renders every non-empty value field as a label/value pair", () => {
    const sub = Store.all()[0];
    render(<ItemDetailModal open={true} onClose={jest.fn()} sub={sub} onReturn={jest.fn()} onEdit={jest.fn()} />);
    expect(screen.getByText(sub.title)).toBeInTheDocument();
    const [key, value] = Object.entries(sub.values).find(([, v]) => v != null && v !== "")!;
    expect(screen.getByText(sub.labels?.[key] || key)).toBeInTheDocument();
    expect(screen.getByText(String(value))).toBeInTheDocument();
  });

  it("'ส่งคืนให้ Buyer แก้ไข' calls onReturn with the submission id and closes", () => {
    const sub = Store.all()[0];
    const onReturn = jest.fn();
    const onClose = jest.fn();
    render(<ItemDetailModal open={true} onClose={onClose} sub={sub} onReturn={onReturn} onEdit={jest.fn()} />);
    fireEvent.click(screen.getByText("ส่งคืนให้ Buyer แก้ไข"));
    expect(onReturn).toHaveBeenCalledWith(sub.id);
    expect(onClose).toHaveBeenCalled();
  });

  it("'แก้ไขรายการนี้' calls onEdit with the submission id", () => {
    const sub = Store.all()[0];
    const onEdit = jest.fn();
    render(<ItemDetailModal open={true} onClose={jest.fn()} sub={sub} onReturn={jest.fn()} onEdit={onEdit} />);
    fireEvent.click(screen.getByText("แก้ไขรายการนี้"));
    expect(onEdit).toHaveBeenCalledWith(sub.id);
  });
});
```

```tsx
// app/admin/__tests__/SupplierDetailModal.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { SupplierDetailModal } from "../SupplierDetailModal";
import { Suppliers } from "../../../lib/suppliers";
import { Store } from "../../../lib/store";

describe("SupplierDetailModal", () => {
  beforeEach(() => {
    localStorage.clear();
    Store.resetMock();
  });

  it("shows the supplier's company, tax ID, and contact details", () => {
    const sup = Suppliers.all()[0];
    render(<SupplierDetailModal open={true} onClose={jest.fn()} supplier={sup} onFilterInMainList={jest.fn()} />);
    expect(screen.getByText(sup.company)).toBeInTheDocument();
    expect(screen.getByText(sup.taxId)).toBeInTheDocument();
  });

  it("shows an empty-history row when the supplier has no submitted items", () => {
    const sup = { ...Suppliers.all()[0], email: "nobody-matches@x.com", code: "SUP-NOMATCH" };
    render(<SupplierDetailModal open={true} onClose={jest.fn()} supplier={sup} onFilterInMainList={jest.fn()} />);
    expect(screen.getByText("ยังไม่มีประวัติการส่งมอบเครื่องจักรในระบบ")).toBeInTheDocument();
  });

  it("'กรองดูรายการ...' calls onFilterInMainList", () => {
    const onFilterInMainList = jest.fn();
    render(<SupplierDetailModal open={true} onClose={jest.fn()} supplier={Suppliers.all()[0]} onFilterInMainList={onFilterInMainList} />);
    fireEvent.click(screen.getByText(/กรองดูรายการของ Supplier เจ้านี้/));
    expect(onFilterInMainList).toHaveBeenCalled();
  });
});
```

```tsx
// app/admin/__tests__/AddSupplierModal.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { AddSupplierModal } from "../AddSupplierModal";
import { Suppliers } from "../../../lib/suppliers";

describe("AddSupplierModal", () => {
  beforeEach(() => localStorage.clear());

  it("rejects a tax ID that is not 13 digits", () => {
    window.alert = jest.fn();
    render(<AddSupplierModal open={true} onClose={jest.fn()} onSaved={jest.fn()} />);
    fireEvent.change(screen.getByLabelText(/ชื่อบริษัท/), { target: { value: "New Co" } });
    fireEvent.change(screen.getByLabelText(/เลขประจำตัวผู้เสียภาษี/), { target: { value: "123" } });
    fireEvent.change(screen.getByLabelText(/ชื่อผู้ติดต่อ/), { target: { value: "Someone" } });
    fireEvent.change(screen.getByLabelText(/เบอร์โทรศัพท์/), { target: { value: "0211111111" } });
    fireEvent.change(screen.getByLabelText(/อีเมลติดต่อ/), { target: { value: "new@sup.co.th" } });
    fireEvent.click(screen.getByText("บันทึกคู่ค้า"));
    expect(window.alert).toHaveBeenCalled();
  });

  it("saves a valid new supplier and calls onSaved", () => {
    const onSaved = jest.fn();
    render(<AddSupplierModal open={true} onClose={jest.fn()} onSaved={onSaved} />);
    fireEvent.change(screen.getByLabelText(/ชื่อบริษัท/), { target: { value: "New Co" } });
    fireEvent.change(screen.getByLabelText(/เลขประจำตัวผู้เสียภาษี/), { target: { value: "1234567890123" } });
    fireEvent.change(screen.getByLabelText(/ชื่อผู้ติดต่อ/), { target: { value: "Someone" } });
    fireEvent.change(screen.getByLabelText(/เบอร์โทรศัพท์/), { target: { value: "0211111111" } });
    fireEvent.change(screen.getByLabelText(/อีเมลติดต่อ/), { target: { value: "new@sup.co.th" } });
    fireEvent.click(screen.getByText("บันทึกคู่ค้า"));
    expect(onSaved).toHaveBeenCalled();
    expect(Suppliers.get("new@sup.co.th")?.company).toBe("New Co");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- ReturnModal ItemDetailModal SupplierDetailModal AddSupplierModal
```

Expected: FAIL — none of the 4 modules exist.

- [ ] **Step 3: Implement `app/admin/ReturnModal.tsx`**

Port of `admin.html:796-881` + `js/admin.js:500-610` (`openReturnModal`/`onReturnDocSelectChange`/`confirmReturnToBuyer`), including the "smart match" buyer preselection by category:

```tsx
// app/admin/ReturnModal.tsx
"use client";

import { useEffect, useState } from "react";
import { Modal } from "../../components/Modal";
import { Store } from "../../lib/store";
import { Permissions } from "../../lib/permissions";
import { Auth } from "../../lib/auth";

const QUICK_REMARKS = [
  ["รูปเนมเพลทไม่ชัดเจน", "ขอรูปถ่ายเนมเพลท / Serial ให้ชัดเจน"],
  ["เอกสาร Warranty ไม่ครบ", "สัญญาและเอกสารแนบ Warranty ไม่ครบถ้วน"],
  ["ราคาไม่ตรง PO", "ราคาซื้อไม่ตรงกับสัญญาและใบสั่งซื้อ PO ล่าสุด"],
  ["ระบุสเปกและ Sub Category", "กรุณาระบุ Sub Category และสเปกพิกัดทางไฟฟ้าให้ชัดเจน"],
] as const;

export function ReturnModal({ open, onClose, subId }: { open: boolean; onClose: () => void; subId?: string }) {
  const allSubs = Store.all();
  const buyers = Permissions.getBuyers();
  const [docId, setDocId] = useState(subId || allSubs[0]?.id || "");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!open) return;
    const id = subId || allSubs[0]?.id || "";
    setDocId(id);
    setReason("");
    const doc = allSubs.find((s) => s.id === id);
    const matched = doc?.values?.category ? buyers.find((b) => b.categories.includes(String(doc.values?.category))) : undefined;
    setBuyerEmail(matched?.email || buyers[0]?.email || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, subId]);

  const doc = allSubs.find((s) => s.id === docId);

  function confirm_(e: React.FormEvent) {
    e.preventDefault();
    if (!docId || !reason.trim()) {
      alert("กรุณากรอกเหตุผลและสิ่งที่ต้องการให้แก้ไข");
      return;
    }
    const item = Store.all().find((s) => s.id === docId);
    if (!item) {
      alert("ไม่พบเอกสาร");
      return;
    }
    const session = Auth.session();
    Store.put({
      ...item,
      status: "ส่งคืนให้ Buyer แก้ไข",
      returnReason: reason.trim(),
      returnedAt: Date.now(),
      returnedBy: session?.email || "",
      assignedBuyer: buyerEmail,
    });
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} maxWidthClassName="max-w-lg">
      <form onSubmit={confirm_} className="space-y-4 text-xs sm:text-sm">
        <h3 className="text-lg font-bold text-gray-900">ส่งคืนเอกสารให้ Buyer แก้ไข</h3>

        <div>
          <label className="block font-semibold text-gray-700 mb-1">เลือกรายการเอกสารที่ต้องการส่งคืน *</label>
          <select value={docId} onChange={(e) => setDocId(e.target.value)} required className="inp text-xs">
            {allSubs.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title} ({String(s.values?.category || "ไม่ระบุ")}) - ส่งโดย {s.email}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 text-xs space-y-1">
          <div>
            <span className="text-gray-500">หมวดหมู่:</span> <strong className="text-gray-800">{String(doc?.values?.category || "ไม่ระบุหมวดหมู่")}</strong>
          </div>
          <div>
            <span className="text-gray-500">ผู้ส่งต้นทาง:</span> <span className="text-gray-800">{String(doc?.values?.sup || doc?.email || "-")}</span>
          </div>
        </div>

        <div>
          <label className="block font-semibold text-gray-700 mb-1">ระบุ Buyer ผู้รับผิดชอบแก้ไข *</label>
          <select value={buyerEmail} onChange={(e) => setBuyerEmail(e.target.value)} required className="inp text-xs">
            {buyers.map((b) => (
              <option key={b.email} value={b.email}>
                {b.name} ({b.email})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-semibold text-gray-700 mb-1">ระบุเหตุผล / สิ่งที่ต้องการให้แก้ไข (Remarks) *</label>
          <textarea
            aria-label="ระบุเหตุผล / สิ่งที่ต้องการให้แก้ไข (Remarks)"
            rows={3}
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="เช่น ขอให้ตรวจสอบใบรับประกันสินค้า (Warranty Document) เพิ่มเติม และแนบสเปกเครื่องจักรให้ครบถ้วน"
            className="inp text-xs"
          />
        </div>

        <div>
          <div className="text-[11px] text-gray-500 mb-1.5 font-medium">ข้อความสำเร็จรูปแนะนำ (คลิกเพื่อใส่ข้อความ):</div>
          <div className="flex flex-wrap gap-1.5 text-[11px]">
            {QUICK_REMARKS.map(([label, text]) => (
              <button
                type="button"
                key={label}
                onClick={() => setReason((prev) => (prev.trim() ? prev.trim() + "\n- " + text : text))}
                className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-rose-50 hover:text-rose-700 border text-gray-700"
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t">
          <button type="button" onClick={onClose} className="border rounded-xl px-4 py-2 text-xs text-gray-600 hover:bg-gray-50">
            ยกเลิก
          </button>
          <button type="submit" className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl px-5 py-2 text-xs font-semibold shadow-xs">
            ยืนยันส่งคืนเอกสาร
          </button>
        </div>
      </form>
    </Modal>
  );
}
```

- [ ] **Step 4: Implement `app/admin/ItemDetailModal.tsx`**

Port of `admin.html:883-911` + `js/admin.js:425-488` (`view`, minus the supplier-profile-link card, which is a nice-to-have cross-reference not required for functional parity and is skipped to keep this task bounded — note it as a known gap, not silently dropped):

```tsx
// app/admin/ItemDetailModal.tsx
"use client";

import { Modal } from "../../components/Modal";
import type { Submission } from "../../lib/store";
import { LABELS_MAP } from "../../lib/mockData";
import { fdt } from "../../lib/format";

type Props = {
  open: boolean;
  onClose: () => void;
  sub: Submission | null;
  onReturn: (id: string) => void;
  onEdit: (id: string) => void;
};

export function ItemDetailModal({ open, onClose, sub, onReturn, onEdit }: Props) {
  return (
    <Modal open={open && sub !== null} onClose={onClose}>
      {sub ? (
        <>
          <div className="flex justify-between items-start mb-4 border-b pb-3">
            <div>
              <h3 className="text-lg font-bold text-gray-900">{sub.title}</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {fdt(sub.at)} / {sub.email}
                {sub.updatedBy ? (
                  <>
                    <br />
                    <span className="text-emerald-700 font-semibold">
                      แก้ไขล่าสุด {fdt(sub.updatedAt || sub.at)} โดย {sub.updatedBy}
                    </span>
                  </>
                ) : null}
              </p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">
              &times;
            </button>
          </div>

          <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-xs sm:text-sm max-h-[50vh] overflow-y-auto p-1 border-t border-gray-100 pt-3">
            {Object.entries(sub.values || {})
              .filter(([, v]) => v != null && v !== "")
              .map(([k, v]) => (
                <div key={k} className="border-b border-gray-100 pb-2">
                  <dt className="text-gray-500 text-[11px] font-medium">{sub.labels?.[k] || LABELS_MAP[k] || k}</dt>
                  <dd className="font-semibold text-gray-900 break-words mt-0.5">{String(v)}</dd>
                </div>
              ))}
          </dl>

          <div className="flex items-center justify-between gap-2 mt-5 pt-3 border-t">
            <button onClick={onClose} className="border rounded-xl px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50">
              ปิด
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onReturn(sub.id);
                  onClose();
                }}
                className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl px-4 py-2 text-xs font-semibold shadow-xs"
              >
                ส่งคืนให้ Buyer แก้ไข
              </button>
              <button onClick={() => onEdit(sub.id)} className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl px-5 py-2 text-xs font-semibold shadow-xs">
                แก้ไขรายการนี้
              </button>
            </div>
          </div>
        </>
      ) : null}
    </Modal>
  );
}
```

- [ ] **Step 5: Implement `app/admin/SupplierDetailModal.tsx`**

Port of `admin.html:915-995` + `js/admin.js:1143-1190`:

```tsx
// app/admin/SupplierDetailModal.tsx
"use client";

import { Modal } from "../../components/Modal";
import type { Supplier } from "../../lib/suppliers";
import { Store } from "../../lib/store";
import { fdt } from "../../lib/format";

type Props = {
  open: boolean;
  onClose: () => void;
  supplier: Supplier | null;
  onFilterInMainList: () => void;
};

export function SupplierDetailModal({ open, onClose, supplier, onFilterInMainList }: Props) {
  if (!supplier) return null;
  const items = Store.all().filter(
    (item) =>
      (item.email || "").toLowerCase() === supplier.email.toLowerCase() ||
      String(item.values?.sup || "").toLowerCase().includes(supplier.code.toLowerCase())
  );
  const totalVal = items.reduce((sum, it) => sum + (parseFloat(String(it.values?.price ?? "")) || 0), 0);

  return (
    <Modal open={open} onClose={onClose} maxWidthClassName="max-w-3xl">
      <div className="flex justify-between items-start mb-4 border-b pb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{supplier.company}</h3>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
            <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">{supplier.code}</span>
            <span className="px-2 py-0.5 rounded-full font-semibold">{supplier.status}</span>
          </div>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">
          &times;
        </button>
      </div>

      <div className="bg-gray-50 rounded-2xl p-4 mb-4 border border-gray-100 text-xs sm:text-sm">
        <div className="font-bold text-gray-800 mb-2">ข้อมูลนิติบุคคลและผู้ติดต่อ</div>
        <div className="grid sm:grid-cols-2 gap-x-4 gap-y-2 text-xs">
          <div>
            <span className="text-gray-500">เลขประจำตัวผู้เสียภาษี (Tax ID):</span> <strong className="text-gray-900 font-semibold ml-1">{supplier.taxId}</strong>
          </div>
          <div>
            <span className="text-gray-500">ผู้ติดต่อหลัก:</span> <strong className="text-gray-900 font-semibold ml-1">{supplier.contact}</strong>
          </div>
          <div>
            <span className="text-gray-500">เบอร์โทรศัพท์:</span> <strong className="text-gray-900 font-semibold ml-1">{supplier.phone}</strong>
          </div>
          <div>
            <span className="text-gray-500">อีเมลติดต่อ/เข้าสู่ระบบ:</span> <strong className="text-gray-900 font-semibold ml-1">{supplier.email}</strong>
          </div>
          <div className="sm:col-span-2">
            <span className="text-gray-500">ที่อยู่สำนักงานใหญ่:</span> <span className="text-gray-800 ml-1">{supplier.address}</span>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="font-bold text-sm text-gray-900">เครื่องจักรและอุปกรณ์ที่ส่งมอบ ({items.length} รายการ)</div>
          <div className="text-xs text-emerald-800 font-semibold">
            มูลค่าสั่งซื้อรวม: <span className="text-sm font-bold text-emerald-900">{totalVal.toLocaleString("th-TH")}</span> THB
          </div>
        </div>
        <div className="max-h-[200px] overflow-y-auto border border-gray-100 rounded-xl">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-100 text-gray-600">
              <tr>
                <th className="p-2.5">วันที่</th>
                <th className="p-2.5">รายการเครื่องจักร</th>
                <th className="p-2.5">หมวดหมู่</th>
                <th className="p-2.5">ราคาซื้อ (THB)</th>
                <th className="p-2.5">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-gray-400">
                    ยังไม่มีประวัติการส่งมอบเครื่องจักรในระบบ
                  </td>
                </tr>
              ) : (
                items.map((it) => (
                  <tr key={it.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-2.5 text-gray-500 whitespace-nowrap">{fdt(it.at)}</td>
                    <td className="p-2.5 font-bold text-gray-900">{it.title}</td>
                    <td className="p-2.5 text-gray-600">{String(it.values?.category || "-")}</td>
                    <td className="p-2.5 font-mono text-emerald-800 font-semibold">
                      {it.values?.price ? parseFloat(String(it.values.price)).toLocaleString("th-TH") : "-"}
                    </td>
                    <td className="p-2.5 whitespace-nowrap">{it.status || "ส่งแล้ว"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t">
        <button onClick={onFilterInMainList} className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold px-4 py-2 rounded-xl">
          กรองดูรายการของ Supplier เจ้านี้ในหน้ารายการหลัก
        </button>
        <button onClick={onClose} className="bg-gray-800 hover:bg-gray-900 text-white text-xs font-semibold px-5 py-2 rounded-xl">
          ปิดหน้าต่าง
        </button>
      </div>
    </Modal>
  );
}
```

- [ ] **Step 6: Implement `app/admin/AddSupplierModal.tsx`**

Port of `admin.html:997-1053` + `js/admin.js:1220-1260`:

```tsx
// app/admin/AddSupplierModal.tsx
"use client";

import { useState } from "react";
import { Modal } from "../../components/Modal";
import { Suppliers } from "../../lib/suppliers";

export function AddSupplierModal({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const [company, setCompany] = useState("");
  const [taxId, setTaxId] = useState("");
  const [code, setCode] = useState("");
  const [contact, setContact] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  function reset() {
    setCompany("");
    setTaxId("");
    setCode("");
    setContact("");
    setPhone("");
    setEmail("");
    setAddress("");
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{13}$/.test(taxId.trim())) {
      alert("เลขประจำตัวผู้เสียภาษีต้องเป็นตัวเลข 13 หลัก");
      return;
    }
    Suppliers.save({
      code: code.trim() || undefined,
      company: company.trim(),
      taxId: taxId.trim(),
      contact: contact.trim(),
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
      address: address.trim(),
      status: "อนุมัติแล้ว",
      registeredAt: Date.now(),
    });
    reset();
    onSaved();
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} maxWidthClassName="max-w-lg">
      <h3 className="text-lg font-bold text-gray-900 mb-1">เพิ่มข้อมูลคู่ค้า Supplier ใหม่</h3>
      <p className="text-xs text-gray-500 mb-4">ลงทะเบียนนิติบุคคลคู่ค้าเข้าสู่ระบบ</p>
      <form onSubmit={onSubmit} className="space-y-3 text-xs sm:text-sm">
        <div>
          <label htmlFor="add-company" className="block font-medium mb-1">
            ชื่อบริษัท / นิติบุคคล *
          </label>
          <input id="add-company" required className="inp text-xs" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="เช่น บริษัท ตัวอย่างซัพพลาย จำกัด" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="add-tax" className="block font-medium mb-1">
              เลขประจำตัวผู้เสียภาษี (13 หลัก) *
            </label>
            <input id="add-tax" maxLength={13} required className="inp text-xs" value={taxId} onChange={(e) => setTaxId(e.target.value)} placeholder="01055xxxxxxxx" />
          </div>
          <div>
            <label htmlFor="add-code" className="block font-medium mb-1">
              รหัสคู่ค้า (เว้นว่างเพื่อ Auto)
            </label>
            <input id="add-code" className="inp text-xs" value={code} onChange={(e) => setCode(e.target.value)} placeholder="เช่น SUP-00099" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="add-contact" className="block font-medium mb-1">
              ชื่อผู้ติดต่อ *
            </label>
            <input id="add-contact" required className="inp text-xs" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="ชื่อ-นามสกุล" />
          </div>
          <div>
            <label htmlFor="add-phone" className="block font-medium mb-1">
              เบอร์โทรศัพท์ *
            </label>
            <input id="add-phone" required className="inp text-xs" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0xx-xxx-xxxx" />
          </div>
        </div>
        <div>
          <label htmlFor="add-email" className="block font-medium mb-1">
            อีเมลติดต่อ / ล็อกอิน *
          </label>
          <input id="add-email" type="email" required className="inp text-xs" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contact@company.co.th" />
        </div>
        <div>
          <label htmlFor="add-address" className="block font-medium mb-1">
            ที่อยู่สำนักงาน
          </label>
          <textarea id="add-address" rows={2} className="inp text-xs" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="ที่อยู่สำนักงานใหญ่/สาขา" />
        </div>
        <div className="flex items-center justify-end gap-2 pt-3 border-t">
          <button type="button" onClick={onClose} className="border rounded-xl px-4 py-2 text-xs text-gray-600 hover:bg-gray-50">
            ยกเลิก
          </button>
          <button type="submit" className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl px-5 py-2 text-xs font-semibold shadow-xs">
            บันทึกคู่ค้า
          </button>
        </div>
      </form>
    </Modal>
  );
}
```

- [ ] **Step 7: Wire all 4 into `app/admin/page.tsx`**

Add near the bottom of the page shell's `<main>`, after the 3 view sections:

```tsx
<ReturnModal open={returnModalSubId !== undefined} onClose={() => setReturnModalSubId(undefined)} subId={returnModalSubId} />
<ItemDetailModal
  open={viewingSub !== null}
  onClose={() => setViewingSub(null)}
  sub={viewingSub}
  onReturn={(id) => setReturnModalSubId(id)}
  onEdit={(id) => router.push(`/form?edit=${encodeURIComponent(id)}`)}
/>
<SupplierDetailModal
  open={viewingSupplier !== null}
  onClose={() => setViewingSupplier(null)}
  supplier={viewingSupplier}
  onFilterInMainList={() => {
    setViewingSupplier(null);
    setView("dashboard");
  }}
/>
<AddSupplierModal open={addSupplierModalOpen} onClose={() => setAddSupplierModalOpen(false)} onSaved={() => setRefreshKey((k) => k + 1)} />
```

This requires adding `const router = useRouter();` (from `next/navigation`) and a page-level `refreshKey`/`setRefreshKey` pair to `app/admin/page.tsx`, passed down to `DashboardView` (replacing its own-owned `refreshKey` from Task 20 with this lifted one, so adding a supplier updates the dashboard's counts too) — lift `refreshKey` out of `DashboardView` into the page component and pass it down as a prop plus a `key={refreshKey}` on `DashboardView` as the simplest correct way to force it to recompute, since `DashboardView` already memoizes `buyers`/`subs` once internally.

- [ ] **Step 8: Run tests to verify they pass**

```bash
npm test -- ReturnModal ItemDetailModal SupplierDetailModal AddSupplierModal
```

Expected: PASS, all 13 assertions across the 4 files.

- [ ] **Step 9: Manually compare the full admin page against `admin.html`** — all 3 views, all 4 modals, every button, logged in as admin. Pay particular attention to: the return-to-buyer smart-match preselection, the supplier detail modal's submission history table, and the dashboard refreshing correctly after any of the 4 modals saves something.

- [ ] **Step 10: Commit**

```bash
git add app/admin/ReturnModal.tsx app/admin/ItemDetailModal.tsx app/admin/SupplierDetailModal.tsx app/admin/AddSupplierModal.tsx app/admin/page.tsx app/admin/__tests__/ReturnModal.test.tsx app/admin/__tests__/ItemDetailModal.test.tsx app/admin/__tests__/SupplierDetailModal.test.tsx app/admin/__tests__/AddSupplierModal.test.tsx
git commit -m "feat: add return/detail/supplier/add-supplier modals to the admin page"
```

---

## Phase E — Cleanup & Final Verification

### Task 24: Remove old static files, final build/lint, full manual verification

**Files:**
- Delete: `index.html`, `login.html`, `register.html`, `form.html`, `submissions.html`, `admin.html`, `css/`, `js/`, `scratch/`
- No new test file — this task is verification-only, per the spec's Section 6 verification plan.

**Interfaces:** None — this is the final integration task, consuming every module and page built in Tasks 1–23.

- [ ] **Step 1: Confirm every route has been manually verified against its original**

Before deleting anything, re-confirm each of the 6 "manually compare against the original" steps from Tasks 14–23 was actually done (re-run any that were skipped). Old files are about to be removed, so this is the last point they're available side-by-side.

- [ ] **Step 2: Delete the old static site files**

```bash
git rm index.html login.html register.html form.html submissions.html admin.html
git rm -r css js scratch
```

(`img/` was already moved to `public/img/` in Task 1 — nothing left to remove there. `package.json`/`package-lock.json` were already replaced by the Next.js scaffold in Task 1.)

- [ ] **Step 3: Run the full automated test suite**

```bash
npm test
```

Expected: PASS, every suite from Tasks 2–23.

- [ ] **Step 4: Run the production build**

```bash
npm run build
```

Expected: builds successfully with no type errors. If any route fails to prerender because it's a fully client-rendered page with no static content (expected, since every page is `'use client'` and reads `sessionStorage`), confirm the build still completes — Next.js renders client components as empty shells at build time and hydrates them in the browser, which is correct here.

- [ ] **Step 5: Run the linter**

```bash
npm run lint
```

Expected: no errors. Fix any that appear (most likely: unused imports left over from porting, or a missing `key` prop in a `.map()`).

- [ ] **Step 6: Run the dev server and do one full three-role click-through**

```bash
npm run dev
```

Follow this exact path, confirming each step visually matches what the original static site did (if in doubt, check out the pre-Task-24 commit in a second worktree and compare):

1. `/` → click "ลงทะเบียน Supplier" → fill the registration form with a new email → redirected to `/form`.
2. Fill the form manually for a couple of fields, then click "กรอกอัตโนมัติ" to autofill the rest, submit → redirected to the done screen → "กลับ" → back on `/form`.
3. Log out, log back in as `buyer@demo.co.th` → land on `/submissions` → confirm the permission-scoped category banner and category filter only show their 4 allowed categories.
4. Open a submission's detail modal, close it, click "แก้ไข" on one within their permitted categories → lands on `/form?edit=...` with fields prefilled → change a field → submit → confirm status becomes "ตรวจ/แก้ไขแล้ว" back on `/submissions`.
5. Log out, log back in as `admin@demo.co.th` → land on `/admin` → confirm the dashboard's 4 metric cards and category-progress bars render.
6. Click "กำหนดสิทธิ์ Category" on a buyer row → confirm that buyer is preselected in the buyer-permissions view → toggle a category, save → go back, confirm the dashboard's buyer table reflects the change.
7. Switch to the submissions tab, click "ส่งคืน Buyer" on a row → fill a reason, confirm → confirm the record now shows the "ส่งคืนให้ Buyer แก้ไข" badge.
8. Log back in as the buyer that record was assigned to → confirm the rose "มีเอกสารที่ Admin ส่งคืนให้คุณแก้ไข" banner appears on `/submissions` and the record is editable.
9. Back in `/admin`, open the supplier directory, add a new supplier, confirm it appears in the table and the dashboard's "จาก Supplier" count-dependent areas still render correctly.
10. On `/form`, click "Auto Fill", test the camera tab (grant permission, confirm live video), the upload tab with a real image, and all 4 presets — confirm each applies data to the form and attaches a nameplate thumbnail badge.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: remove old static site files now that the Next.js migration is complete"
```

