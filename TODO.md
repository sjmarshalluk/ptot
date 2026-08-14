# Before this site can launch

Everything below is a real-world fact that cannot be invented. Nothing here has been
guessed or filled with plausible-looking sample data — every unknown renders on the page
as a visible `[bracketed placeholder]` in italic grey so it can't ship by accident.

Almost all of it lives in one file: **`src/_data/site.json`**. Change it there and it
updates every page, the JSON-LD, the sitemap and the footer at once.

---

## Blocking — the site should not go live without these

| # | What's needed | Where it goes | Why it blocks |
|---|---|---|---|
| 1 | **Email address** | `site.json` → `email` | Currently no way to make contact. This is the single most important item. |
| 2 | **Phone number** | `site.json` → `phone` and `phoneHref` | `phoneHref` must be the `tel:` form, e.g. `+13605551234`. While it's empty the number renders as plain text rather than a broken link. |
| 3 | **Real domain** | `site.json` → `url` | Currently `https://example.com`. Canonical tags, Open Graph URLs, the sitemap and the JSON-LD all derive from it, so they're all wrong until this is set. |
| 4 | **Superbill decision** | `site.json` → `policies.superbills`, and the answer text in `src/services.njk` and `src/resources/private-pay-pediatric-ot.md` | A live editorial note currently renders on the page. It also matters competitively: Home Front Pediatric Therapy in Kenmore issues superbills, and families comparing private-pay options will ask. |
| 5 | **Exact credentials** | `site.json` → `credentials` | Currently `[MOT, OTR/L]` — a placeholder, not confirmed. |
| 6 | **Washington license number** | `site.json` → `licenseNumber` | Referring providers verify licensure before they refer. Shown on `/about/` and `/for-providers/`. |
| 7 | **Contact form endpoint** | `src/contact.njk` → the `action` attribute | The form is fully built but posts nowhere. Options: Formspree, Netlify Forms, or the intake form built into whichever scheduler you choose. |
| 8 | **Consulting session length** | `site.json` → `services[1].unit` | Currently reads `$150 / [session length]` beside `$150 / hour` for OT. Two identical prices with different units is confusing. |
| 9 | **Upper age limit** | `site.json` → `ages.to` | A parent of an eight-year-old currently cannot tell whether this practice is for them. |
| 10 | **Cancellation policy** | `site.json` → `policies.cancellation` | Referenced on `/services/`. |
| 11 | **Confirm the practice name** | `site.json` → `businessName` | Currently `Port Townsend Occupational Therapy`. It is now the nav lockup, the home-page `<title>`, `og:site_name` and the JSON-LD `MedicalBusiness.name`. It must end up **byte-identical** to the Google Business Profile listing — conflicting name signals actively reduce confidence in the listing, which is the same reason no street address is published. Julia has to confirm this is the name she's registering under. |

---

## Important — the site works without these, but is much weaker

- **Portrait photograph of Julia.** The highest-value single asset on the site. A practice
  where a stranger comes into your home and works with your child, showing no face, is the
  worst thing a competitor site in this space does (Blooming Pediatric Therapy) — don't repeat it.
  Drop it at `src/assets/img/` and replace the `.img-todo` block in `src/index.njk` and
  `src/about.njk` with a real `<img>` and descriptive alt text. Give it
  `border-radius: var(--radius-lg)` so it matches the shape the placeholder holds — a
  yellow diamond is tucked behind its top-left corner and expects a rounded photo.
- **Three to five in-context photographs** — a session in a family's living room, materials
  she brings, a community setting. No stock imagery; it reads as false immediately.
- **Booking link** (`site.json` → `bookingUrl`). While empty, every "Book a free intro call"
  button routes to `/contact/`, which is a working fallback — but a scheduler removes a step.
- **Share image** (`site.json` → `ogImage`) — 1200×630 PNG. Until it's set, the Open Graph
  image tag is deliberately not emitted, because a broken one is worse than none.
- **Apple touch icon** (`site.json` → `appleTouchIcon`) — 180×180 PNG. Same reasoning.
- **Confirmed service-area towns.** `site.json` → `serviceArea` currently lists ten East
  Jefferson County places as a starting point. **Julia must confirm which she'll actually
  drive to.** This list feeds the JSON-LD `areaServed` and should match the Google Business
  Profile service area exactly.
- **Travel radius / mileage policy** (`site.json` → `travelRadius`).
- **Current wait time** (`site.json` → `availability.waitTime`) and keep
  `availability.updated` current. Research on referral behaviour puts a dated availability
  line among the strongest factors in which provider a pediatrician names.
- **Named post-professional training** — Ayres/SI certification, feeding, DIR, handwriting
  programs. Referrers respond to specificity. Add to `/about/` and `/for-providers/`.
- **Payment methods and when payment is due** — `/services/`.
- **Records policy** — what notes are kept, what a family receives, how to request them.
- **Confidentiality / privacy notice** — confirm whether a formal HIPAA notice applies to
  this practice and link it from `/services/`.
- **Response time** — `/contact/` promises a reply within `[response time]`.
- **Provider one-pager PDF** — `/for-providers/` has a slot for a downloadable one-page
  referral summary. Produce it once items 1, 2, 5, 6 and the wait time are settled.
- **Further scope exclusions** — `/for-providers/` lists what isn't an appropriate referral.
  Confirm whether anything else belongs there (medical complexity, feeding tubes, post-surgical).
- **Program / classroom consulting rate** — `/for-providers/` currently marks it unknown.
- **Testimonials**, with **written** permission and no identifying detail about the child.
  Two or three go on the home page. A dedicated testimonials page is worth adding only once
  there are enough to fill it. Never confirm publicly that a named person is or was a client —
  that alone is a disclosure, and the same caution applies to replying to Google reviews.

---

## Not a website task, but higher impact than anything on this list

**Claim the Google Business Profile.** It carries roughly a third of local search ranking
weight — more than every on-page change in this repo combined.

- Register as a **service-area business** with the home address hidden.
- **Primary category: "Occupational Therapist."** This one field is the most influential in
  the profile. Not "Health & Wellness", not a general child-services category.
- Define the service area to match `site.json` → `serviceArea`. There's a 20-entry cap.
- List each service separately with its own description — sensory processing, feeding,
  handwriting, in-home pediatric OT — rather than one bundled entry.
- Add photos: Julia working in a family's home, materials, a headshot.
- Post roughly weekly; cadence signals activity.

Keep the name, phone and area byte-identical between the profile, `site.json` and the JSON-LD.
Conflicting location signals actively reduce confidence in the listing — which is also why the
schema here deliberately publishes no street address.

---

## Notes on decisions already made

- **US English throughout.** The previous copy used British spellings (behaviour, paediatric,
  centres, programmes, individualised) on a Washington State practice. Beyond correctness,
  US families search "pediatric OT", not "paediatric OT".
- **Prices stay on the home page.** Neither Home Front nor Blooming publishes session rates.
  Transparent pricing is a genuine advantage here, not something to hide behind a click.
- **Diagnosis vocabulary lives on `/for-providers/`, not on the family-facing pages.** The
  words need to be present for search and for referrers scanning scope, but a diagnosis list
  contradicts both the neuroaffirmative positioning and the home page's own promise of
  "not a checklist".
- **`image-slot.js` has been moved to `tools/`.** It's a 65KB development-time drag-and-drop
  placeholder utility that was loading render-blocking on every visit. It is no longer part
  of the build.

---

## Running the site

```
npm install        # once
npm start          # dev server with live reload at http://localhost:8080
npm run build      # writes _site/
```

Before launch, this should return nothing:

```
grep -rn "\[email\|\[phone\|\[MOT\|\[license\|\[form endpoint\|\[session length\|paediatric\|behaviour\|programme\|individualis" src/
```
