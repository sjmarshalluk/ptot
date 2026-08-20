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
| 1 | **Real domain** | `site.json` → `url` | Currently `https://example.com`. Canonical tags, Open Graph URLs, the sitemap and the JSON-LD all derive from it, so they're all wrong until this is set. |
| 2 | **Contact form endpoint** | `src/contact.njk` → the `action` attribute | The form is fully built but posts nowhere. Formspree or Netlify Forms. It is now deliberately scoped as a low-stakes "get in touch" form — the clinical detail goes through SimplePractice instead — so a standard handler is fine. |
| 3 | **A free 15-minute consultation appointment type in SimplePractice** | SimplePractice → Settings → Scheduling and inquiries | Every CTA on this site says "Book a free intro call" and now lands on the Client Portal. If the new-client request flow doesn't offer a free 15-minute option, the promise breaks at the exact moment a family is converting. Test it signed out, in a private window. |
| 4 | **Upper age limit** | `site.json` → `ages.to` | A parent of an eight-year-old currently cannot tell whether this practice is for them. |
| 5 | **Confirm the practice name** | `site.json` → `businessName` | Currently `Port Townsend Occupational Therapy`. It is now the nav lockup, the home-page `<title>`, `og:site_name` and the JSON-LD `MedicalBusiness.name`. It must end up **byte-identical** to the Google Business Profile listing — conflicting name signals actively reduce confidence in the listing, which is the same reason no street address is published. Julia has to confirm this is the name she's registering under. |
| 6 | **A real 301 for `/what-to-expect/`** | host config — `_redirects` (Netlify), `vercel.json`, or server rules | That page was absorbed into `/in-home-ot/`; the URL now serves a stub with a canonical, `noindex,follow` and a meta refresh. That is a client-side substitute. Search engines pass authority properly only through a server 301, and the URL has been published. |
| 7 | **Confirm the no-mileage-charge policy** | `site.json` → `travelRadius` | Supplied as "no additional mileage charge I don't think?" and published on `/services/` and `/in-home-ot/` as a firm commitment. A fees page is where families will hold her to it, so it needs a yes or a no. |

### Resolved 2026-08-20 (from Julia's notes)

| Was blocking | Now |
|---|---|
| Email address | `julia@porttownsendot.com` — live `mailto:` in the footer, on `/contact/`, and in the JSON-LD. |
| Phone number | `360-207-1711` / `tel:+13602071711` — live everywhere and in the JSON-LD. |
| Superbill decision | **Yes, on request.** Answered on `/services/` (policy box and FAQ) and in `/resources/private-pay-pediatric-ot/`. |
| Exact credentials | `OTR/L`. Now emits a `hasCredential` node in the JSON-LD. |
| Washington license number | `OT.OT.60823135`. Shown on `/about/` and `/for-providers/`. |
| Consulting session length | Hourly, and may run longer — both services now read `$150 / hour`. |
| Cancellation policy | 24 hours' notice, or the full fee is due. |
| Payment methods | Check, credit card, HSA and FSA. |
| Records policy | Section deleted from `/services/` at Julia's request. |
| Booking link | `https://julia-comstock-ross.clientsecure.me/` — her SimplePractice Client Portal. Drives every CTA on the site. |

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
- **Share image** (`site.json` → `ogImage`) — 1200×630 PNG. Until it's set, the Open Graph
  image tag is deliberately not emitted, because a broken one is worse than none.
- **Apple touch icon** (`site.json` → `appleTouchIcon`) — 180×180 PNG. Same reasoning.
- **Confirm whether HIPAA formally applies to this practice.** A private-pay practice that
  hands superbills to families, rather than transmitting claims itself, is often not a
  "covered entity" — but that is Julia's call to confirm, not an assumption to build on. It
  decides whether the `/contact/` form needs a signed BAA with its handler. The form is
  written to steer health detail toward the portal and the phone either way.
- **A formal HIPAA / privacy notice**, if one applies to this practice. `/services/` now
  states the confidentiality position and the mandated-reporter duty in plain English, which
  is the part families actually need; a formal notice would sit alongside it, not replace it.
- **Confirmed service-area towns.** `site.json` → `serviceArea` currently lists ten East
  Jefferson County places as a starting point. **Julia must confirm which she'll actually
  drive to.** This list feeds the JSON-LD `areaServed` and should match the Google Business
  Profile service area exactly.
- **Current wait time** (`site.json` → `availability.waitTime`) and keep
  `availability.updated` current. Research on referral behaviour puts a dated availability
  line among the strongest factors in which provider a pediatrician names.
- **Named post-professional training** — Ayres/SI certification, feeding, DIR, handwriting
  programs. Referrers respond to specificity. Add to `/about/` and `/for-providers/`.
- **Response time** — `/contact/` promises a reply within `[response time]`.
- **Provider one-pager PDF** — `/for-providers/` has a slot for a downloadable one-page
  referral summary. Contact details, credentials and license number are settled now;
  the current wait time is the last piece outstanding.
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
- **The hero carries a "Pediatric occupational therapy · Port Townsend, WA" eyebrow.**
  Answering Julia's question about where a "pediatric services" descriptor should go: above
  the h1 rather than under the nav lockup. The lockup is a wordmark and gets diluted by a
  second line; the hero had no words above the fold saying what the practice is or where.
  It uses the same label register as every other section eyebrow. Easy to move or drop —
  one paragraph in `src/index.njk`.
- **No promises about written reports.** `/for-providers/` previously committed to a written
  summary after every initial evaluation plus progress updates. It now offers coordination
  on request, agreed case by case. The matching promise in the `/in-home-ot/` FAQ ("Do you
  write reports?") was changed to match — the two must not drift apart again.
- **Siblings and pets are a judgement call, not a blanket yes.** Stated that way in the
  practical-things list on `/in-home-ot/` and in the FAQ on the same page.
- **SimplePractice is linked, not embedded.** There is no public SimplePractice API on the
  standard plans, so a custom form cannot post into it — the only options are their hosted
  flows. Their appointment-request *widget* is a third-party JavaScript embed that renders a
  modal this design system can't style; a plain link to the Client Portal reaches the same
  place with no script, no CSP exception and no visual seam. `bookingUrl` points at the
  portal root rather than `/request` so it stays valid whatever gets configured inside
  SimplePractice.
- **The `/contact/` form is deliberately not an intake form.** It posts to a third party, so
  it asks only what's needed to make contact and tells families in the help text to keep
  health details for the call or the portal. Everything clinical goes through SimplePractice,
  which lands on its Inquiries page.
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
grep -rn "\[email\|\[phone\|\[MOT\|\[license\|\[form endpoint\|\[session length\|\[cancellation\|paediatric\|behaviour\|programme\|individualis" src/
```
