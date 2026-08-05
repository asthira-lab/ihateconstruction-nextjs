# ihateconstruction.co — Frontend Development Roadmap

> Staged build plan. Ship something useful at every step instead of spending months on infrastructure. Each phase builds on the previous, and the **vertical slice** (§0) drives the order — phases are the *reference*, the slice is the *plan*.

---

## Guiding Principles

- **Vertical slice first, breadth later.** Ship one polished flow end-to-end before adding a second calculator.
- **Component before page.** Every screen is assembled from primitives — no bespoke buttons per page.
- **Feature folders own their world.** UI, API calls, hooks, and validation for `projects` live under `features/projects/`. No cross-feature imports except through a public `index.ts`.
- **Server Components by default, Client Components only when needed.** Interactivity, browser APIs, or hooks → `"use client"`. Everything else stays a Server Component.
- **Validate at every boundary.** Zod for forms and API responses. TypeScript is not enough — the network lies.
- **Skip Zustand until it hurts.** React Context + TanStack Query covers 90% of state. Add Zustand only when a genuine cross-tree client store appears.
- **Ship, then polish.** Dark mode, keyboard shortcuts, animations belong in Phase 12 — not sprinkled through every phase.

---

## §0 — The Vertical Slice (North Star)

Build this end-to-end before touching anything else. Everything in the phase list serves this flow.

```
Home
  ↓
Concrete Calculator
  ↓
Calculate result
  ↓
Sign up / Log in
  ↓
Save to a Project
  ↓
View Project
  ↓
Generate BOQ
  ↓
Generate Quotation
  ↓
Download PDF
```

If this flow is excellent, every future calculator and business feature plugs into the same workflow instead of existing as an isolated page.

**Definition of done for the slice:**

- Anonymous user can complete the calculator without an account.
- Saving prompts for auth; auth persists via httpOnly cookie or secure JWT storage.
- Project view shows the saved calculation, editable.
- BOQ renders as an editable table with running totals.
- Quotation PDF renders with company settings applied (logo, GST, address).
- Works on mobile (viewport 375px) and desktop.

---

## Phase 1 — Foundation (Week 1)

Set up the project. **Read `node_modules/next/dist/docs/` first** — this Next.js version differs from what any of us remember.

### Tech Stack

| Layer            | Choice                        | Why                                            |
| ---------------- | ----------------------------- | ---------------------------------------------- |
| Framework        | Next.js (App Router)          | RSC, streaming, file-based routing             |
| Language         | TypeScript (strict)           | Catch errors before runtime                    |
| Styling          | Tailwind CSS                  | Utility-first, no CSS files to maintain        |
| Components       | shadcn/ui                     | Copy-paste primitives you own                  |
| Icons            | Lucide                        | Consistent, tree-shakeable                     |
| Forms            | React Hook Form + Zod         | Uncontrolled inputs + schema validation        |
| Server state     | TanStack Query                | Caching, retries, background refetch           |
| HTTP client      | Axios (or `fetch` with wrapper) | Interceptors for auth headers                |
| Client state     | React Context → Zustand later | Don't over-engineer state management           |
| Testing          | Vitest + Testing Library      | Fast, RSC-friendly                             |
| E2E              | Playwright                    | Real-browser tests for the vertical slice     |
| Linting          | ESLint + Prettier             | Enforce consistency in CI                      |
| Git hooks        | Husky + lint-staged           | Block bad commits locally                      |

### Setup Checklist

- [ ] `tsconfig.json` with `"strict": true` and `"noUncheckedIndexedAccess": true`
- [ ] Tailwind configured with the design tokens (colors, spacing, radius) — not raw utilities everywhere
- [ ] `shadcn/ui` initialized, first primitive (Button) added
- [ ] Path aliases: `@/components`, `@/features`, `@/lib`, `@/services`
- [ ] `.env.local` + `.env.example` + typed env access via `@/lib/env.ts` (Zod-validated)
- [ ] Axios instance with base URL, auth interceptor, error normalizer
- [ ] TanStack Query provider wired in root layout
- [ ] ESLint + Prettier + Husky pre-commit
- [ ] CI: lint, typecheck, test on every PR

### Learn

App Router · Layouts · Server vs Client Components · Route handlers · Forms · Data fetching · Env vars · Metadata API

---

## Phase 2 — Design System (Week 1)

Build primitives before pages. Every component gets a **story or preview page** at `/dev/components` so you can eyeball them in isolation.

### Primitives (from shadcn/ui, styled to brand)

```
Button        Input         Textarea      Select
Checkbox      Radio         Switch        Slider
Card          Modal         Dialog        Sheet (mobile drawer)
Badge         Tag           Tooltip       Toast
Table         Pagination    SearchBar     Tabs
Loader        Skeleton      EmptyState    ErrorState
Breadcrumbs   Avatar        Progress
```

### Layout Components

```
Navbar (public + authed variants)
Sidebar (collapsible on mobile)
Footer
PageHeader (title + actions + breadcrumb slot)
```

### Design Tokens

Define once in `tailwind.config.ts` and `globals.css`:

- Color scale (brand, neutral, success, warning, danger) with dark-mode pair
- Type scale (12/14/16/18/20/24/32)
- Spacing scale (4px base)
- Radius (sm/md/lg/full)
- Shadow (sm/md/lg)

### Accessibility Baseline

- Every interactive element has a focus ring
- Modals trap focus and close on Escape
- Form inputs have associated labels (not placeholder-as-label)
- Color contrast ≥ 4.5:1 for body text

---

## Phase 3 — Public Website (Weeks 2–3)

Marketing and SEO-facing pages. **Server Components only** — these must be fast and indexable.

```
/                     Home (hero, feature grid, testimonials, CTA)
/about
/contact              Contact form (server action or POST to /api/contact)
/pricing
/blog                 Blog index (MDX or headless CMS later)
/blog/[slug]
/calculators          Directory of all calculators
```

### Calculators (first slice: concrete only)

```
/calculators/concrete
/calculators/brick        ← Phase 6+
/calculators/paint        ← Phase 6+
/calculators/tile         ← Phase 6+
/calculators/steel        ← Phase 6+
```

Each calculator page has:

- Calculator form (Client Component island)
- Formula (rendered from data, not hardcoded per page)
- Worked example
- FAQ (structured data → SEO)
- Related calculators
- CTA to save the result (auth wall)

### SEO

- `metadata` export on every page (title, description, OG image)
- `sitemap.ts` and `robots.ts`
- JSON-LD for FAQ and calculator schema
- Static generation where possible

---

## Phase 4 — Authentication (Week 3)

### Pages

```
/login
/register
/forgot-password
/reset-password
/verify-email
```

### Features

- JWT with **httpOnly refresh cookie** + short-lived access token (don't put access tokens in localStorage — XSS risk)
- Route protection via middleware, not per-page guards
- Logout clears cookie + TanStack Query cache
- `/settings/profile` for user profile
- Rate-limit registration and password reset (backend concern, but plan the UX)

### The Auth-Wall Pattern

Calculators work anonymously. When the user hits "Save", show a modal: *"Sign up to save this calculation — takes 15 seconds."* Preserve the calculation across the auth redirect (session storage or query param).

---

## Phase 5 — Dashboard (Week 4)

```
/dashboard
```

Contains:

- Recent projects (last 5)
- Recent calculations (last 10)
- Saved reports
- Quick actions (New Project · New Quote · New Invoice)
- Statistics (total projects, total quoted, this month)

Loading and error states are non-negotiable — use `loading.tsx` and `error.tsx` at the route level.

---

## Phase 6 — Calculator Components (Weeks 4–5)

Reusable pieces so each new calculator is mostly configuration.

```
InputNumber          (with unit + validation)
UnitSelector         (metric/imperial, m/ft, kg/lb)
ResultCard           (primary + breakdown)
FormulaCard          (LaTeX or plain-text formula display)
CalculationHistory   (per-user, per-calculator)
PDFButton
ShareButton          (copy link, WhatsApp, email)
SaveButton           (save to project — triggers auth-wall if needed)
```

### Calculator Configuration Pattern

Each calculator becomes a config object:

```ts
{
  slug: "concrete",
  title: "Concrete Calculator",
  inputs: [...],       // field definitions
  formula: (i) => ...,
  units: {...},
  faq: [...],
}
```

A single `<CalculatorPage config={...}>` renders all of them.

---

## Phase 7 — Projects (Weeks 5–6)

```
/projects                    List
/projects/new                Create
/projects/[id]               Details
/projects/[id]/edit          Edit
/projects/[id]/delete        (dialog, not a page)
```

### Example: Villa Project

- Concrete · Steel · Tiles · Paint (calculation items)
- Total cost (derived, not stored)
- Notes, attachments, client info

Optimistic updates via TanStack Query mutations. Deleting requires a typed-name confirmation for destructive intent.

---

## Phase 8 — BOQ / Bill of Quantities (Week 7)

### Pages

```
/projects/[id]/boq
```

### Features

- Editable table (add / remove / reorder rows)
- Material list, quantity, unit, rate, total
- Auto-total footer, per-section subtotals
- Import calculation results as BOQ rows
- Autosave (debounced) with "Saved" indicator

### Export

- PDF (react-pdf or server-rendered)
- Excel (`xlsx` or server-generated)

---

## Phase 9 — Quotations (Week 8)

Quotation Builder:

- Company header (auto-filled from Settings)
- Client details
- Line items (from BOQ or manual)
- GST breakdown (CGST/SGST/IGST per Indian tax rules)
- Discount (flat or %)
- Terms & conditions (template + per-quote override)
- Live preview
- Download PDF · Send via email · Share link

### GST Handling

- Intra-state → CGST + SGST
- Inter-state → IGST
- User's state (from Settings) vs client's state determines this

---

## Phase 10 — Invoices (Week 9)

Almost identical to quotations. **Extract the shared logic** into `features/documents/` before duplicating.

Extras vs quotations:

- Invoice number sequence (per financial year, per company)
- Payment status (paid / partial / unpaid / overdue)
- Payment recording

---

## Phase 11 — Company Settings (Week 10)

```
/settings/company
  Company Profile   (name, contact, addresses)
  Logo              (upload + crop)
  GST Number
  Bank Details      (account, IFSC, UPI)
  Signature         (image or drawn)
  Invoice Template  (choose 1 of 3)
  Number Sequences  (invoice, quotation prefix + starting number)
```

Auto-applied to every PDF.

---

## Phase 12 — Nice UX Features

Add only after the slice is working end-to-end.

- Dark mode
- Autosave + draft recovery
- Keyboard shortcuts (cmd-K search palette)
- Recent projects (in navbar)
- Notifications (toast + persistent center)
- Global search
- Breadcrumbs
- Empty-state onboarding tips
- Animations (subtle — Framer Motion for page transitions and modals only)

---

## Cross-Cutting Concerns

These are not phases — they get attention **in every phase**.

### Error Handling

- API errors normalized to `{ code, message, details }` in the Axios interceptor
- User-visible errors always human-readable (never "Error 500")
- Route-level `error.tsx` for uncaught errors
- Sentry (or equivalent) in production

### Loading States

- Skeletons for content, spinners for actions
- Optimistic updates where safe
- `loading.tsx` at every route

### Forms

- React Hook Form + Zod resolver, always
- Server-side validation errors mapped back to fields
- Disable submit while pending, show inline errors, focus first error

### Performance

- Server Components by default
- Dynamic imports for heavy client components (PDF preview, charts)
- Image optimization via `next/image`
- Lighthouse ≥ 90 on public pages before Phase 4

### Testing

- Unit: calculator formulas, currency/GST math, Zod schemas (Vitest)
- Component: forms, tables, complex UI (Testing Library)
- E2E: the vertical slice from §0 (Playwright), runs in CI

### Accessibility

- Axe checks in E2E
- Keyboard navigation works for the entire vertical slice
- Screen-reader labels on icon-only buttons

### Analytics

- Plausible or PostHog (privacy-friendly)
- Track: signup, first calculation, first save, first PDF export

---

## Folder Structure

```
src/
  app/               Next.js routes (pages, layouts, route handlers)
  components/        Shared UI primitives (design system)
  features/          Feature modules — each owns UI, hooks, API, schemas
  hooks/             Shared hooks (used across features)
  lib/               Config, env, third-party clients (axios, query client)
  services/          API service layer (thin wrappers over axios)
  types/             Shared TS types (API contracts, domain models)
  utils/             Pure helpers (formatters, math, date)
  styles/            Global CSS, Tailwind entry
```

### Inside `features/`

```
features/
  auth/
    components/
    hooks/
    api.ts           TanStack Query hooks
    schemas.ts       Zod schemas
    types.ts
    index.ts         Public exports only
  projects/
  calculators/
  quotes/
  boq/
  invoices/
  documents/         Shared between quotes + invoices
  settings/
  dashboard/
```

### Import Rules

- `features/*` may import from `components/`, `lib/`, `utils/`, `types/`
- `features/*` may **not** import from another `features/*` directly — go through its `index.ts`
- `components/` never imports from `features/`
- `app/` composes features and components; it doesn't own business logic

---

## Backend Contract (Assumptions)

The frontend expects the API to provide:

- REST or JSON-RPC, versioned (`/api/v1/...`)
- JWT auth: `POST /auth/login` returns access + sets httpOnly refresh cookie
- Standard error shape: `{ code, message, details? }`
- Pagination: `{ items, page, pageSize, total }`
- Timestamps in ISO-8601 UTC
- Money in **paise** (integer), formatted client-side

Document any deviations in `docs/api-contract.md` and keep Zod schemas in sync.

---

## Suggested Learning Order

1. Next.js App Router (RSC, layouts, routing)
2. TypeScript (strict mode, generics, discriminated unions)
3. Tailwind CSS + design tokens
4. shadcn/ui (copy, adapt, own the code)
5. React Hook Form
6. Zod (schema-first thinking)
7. TanStack Query (queries, mutations, invalidation)
8. Authentication with JWT (cookies vs localStorage tradeoffs)
9. API integration patterns (services layer, interceptors)
10. PDF generation (react-pdf or server-rendered)
11. Playwright for E2E
12. Charts (Recharts) — optional, Phase 5+

---

## Deployment

- **Hosting:** Vercel (native Next.js support) or self-hosted via Docker
- **Preview deploys:** every PR gets a URL
- **Environments:** local · preview · staging · production
- **Env vars:** managed in hosting UI, validated via `@/lib/env.ts` at startup
- **Rollbacks:** one-click on Vercel; keep last 3 deployments hot

---

## Weekly Cadence

- **Monday** — plan the week's phase step against the vertical slice
- **Daily** — one small PR, one review, merged same day
- **Friday** — run the E2E slice test, review the demo, note what shipped

If a phase slips, cut scope inside the phase — never skip the vertical-slice test.
