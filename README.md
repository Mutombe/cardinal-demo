# Silverbrook Estate — Cardinal Properties

A cinematic, image-led marketing site + **Interactive Master-Plan engine** for
Cardinal Properties, built around their real **Silverbrook Estate** (Ruwa).

Instead of a static PDF or a generic contact form, a buyer lands on a film of the
estate, scrolls through the story, then:

- **Explores the live master plan** — every stand is clickable, colour-coded
  available / reserved / sold, with exact dimensions on hover
- **Calculates a 36-month instalment plan** instantly (deposit, term, interest)
- Switches between a crisp **vector site plan** and a **geographic (Leaflet) map**
- **Reserves online** — the flow that, in production, posts to the trust-accounting ledger

## Brand system (verified from cardinalproperties.co.zw)

- **Maroon** `#75191b` (primary) · dark `#5a1315`
- **Taupe / sand** `#b4a887` (accent)
- **Cream** `#f5f0eb` / `#faf9f6` backgrounds · near-black `#1a1a1a` ink
- **Silverbrook** sub-brand greens (`#016630`) for "available"
- Type: **Cormorant Garamond** (serif display) + **Inter** (sans)
- Real assets live in `cardinal-brand/` (staged to `public/brand/`): drone video,
  aerials, on-site infrastructure photography, and the Cardinal + Silverbrook logos

## Stack

Vite · React · TypeScript · Tailwind CSS · Leaflet

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # typecheck + production build → dist/
npm run preview  # serve the production build
```

## Page structure

`Hero` (drone video) → `Estate` (positioning + stats) → `PlanSection`
(interactive map + stand detail + instalment calculator) → `ImageBreak` →
`Gallery` (on-site progress) → `HowItWorks` (the CMS + trust-accounting story) →
`Enquire` → `Footer`.

```
src/
  data/stands.ts     Mock Silverbrook subdivision (coords, sizes, prices, status, geo)
  lib/finance.ts     Instalment maths + currency formatting
  lib/status.ts      Available/reserved/sold styling
  lib/useReveal.ts   Scroll-into-view animation hook
  components/        Hero, Estate, PlanSection, MasterPlanMap, GeoMap,
                     StandDetailPanel, InstallmentCalculator, Gallery,
                     HowItWorks, ImageBreak, Enquire, Nav, Footer
scripts/shoot.mjs    Dev-only: CDP screenshotter for visual QA
```

## Demo data — real vs. mocked

The photography, video, logos, location and brand are **real**. Cardinal does not
publish stand-level dimensions or pricing, so the plot layout, sizes, prices and
statuses are **realistic placeholder data**. In production these come from a CMS
(projects + stands) and the trust-accounting backend (payments → reconciliation
ledger → live availability). Those are the next phases; this is Phase 1 — the
deal-closing experience.
