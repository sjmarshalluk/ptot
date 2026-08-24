# Before this site can launch

Everything below is a real-world fact that cannot be invented. Nothing here has been
guessed or filled with plausible-looking sample data — every unknown renders on the page
as a visible `[bracketed placeholder]` in italic grey so it can't ship by accident.

Almost all of it lives in one file: **`src/_data/site.json`**. Change it there and it
updates every page, the JSON-LD, the sitemap and the footer at once.

---

## Blocking — the site should not go live without these

**Nothing.** The site is live at https://www.porttownsendot.com and every launch blocker is closed.

Verified against production on 24 Aug 2026: all 8 pages 200; bare domain 308s to www; `/what-to-expect/` 308s to `/in-home-ot/`; JSON-LD parses with 10 in-person towns and 5 remote counties; sitemap (11 urls) and robots.txt serve.

> Vercel returns **308** for `"permanent": true`, not 301. That is correct and Google treats the two identically — don't "fix" it. If a literal 301 is ever needed, swap `permanent` for `"statusCode": 301`.

### Worth doing next

- **Deployment Protection is on.** The `*.vercel.app` URLs 302 to a Vercel SSO login. The custom domain serves publicly, so this isn't urgent — but confirm the protection scope is *Preview only*, or a future settings change could gate the live site.
- The four remaining `[bracketed placeholders]` are all on `/for-providers/`: current wait time, further scope exclusions, the classroom consulting rate, and the one-page referral PDF. None block launch; see the Important list below.

### Resolved 2026-08-24

| Was blocking | Now |
|---|---|
| Real domain | `https://www.porttownsendot.com` — www is canonical. |
| Upper age limit | **12**, with older children up to 18 by arrangement. Stated in the ages FAQ, the home-page fit list and the providers scope box. |
| Practice name | Confirmed as `Port Townsend Occupational Therapy`, exactly as-is. Must stay byte-identical to the Google Business Profile. |
| Hosting / the `/what-to-expect/` 301 | Vercel. Deployed and verified live: `/what-to-expect/` → 308 → `/in-home-ot/`. |
| Mileage policy | Confirmed: no charge anywhere in the service area, absorbed into the hourly rate. |
| Remote pricing | Confirmed: same $150/hour as in person. |
| Remote area | Confirmed: Jefferson, Clallam, Mason, Kitsap and Grays Harbor counties. |

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
| Booking an intro call | Removed entirely — see the Aug 24 note below. Families phone or email. |
| Contact form endpoint | No longer blocking — the form is hidden (`site.json` → `contactFormEnabled: false`). It becomes blocking again the moment that flag is flipped back on. |

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
- **The `/contact/` message form**, if Julia wants it back. The markup is intact in
  `src/contact.njk` behind `site.json` → `contactFormEnabled`. Turning it on needs a form
  endpoint set at the same time (Formspree or Netlify Forms), or it renders its own
  placeholder warning where the form should be. Families currently reach her three ways —
  the portal, email and phone — which is why it could come out without leaving a gap.
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
- **`vercel.json` cannot carry comments.** Vercel validates it against
  `https://openapi.vercel.sh/vercel.json` with `additionalProperties: false`, at the top level
  *and* inside each redirect object. A `"//"` key — the usual JSON comment trick — fails the
  whole deploy with "should NOT have additional property `//`", before the build runs, in 0ms
  and with no build log. Vercel then keeps serving the previous deployment, so the site looks
  fine and simply doesn't update. That is exactly what happened on 24 Aug. Keep explanations
  here, not in that file.
- **Redirect sources must carry the trailing slash.** With `trailingSlash: true`, Vercel
  normalises `/what-to-expect` to `/what-to-expect/` with a 308 *before* matching redirects,
  so a source written without the slash never fires — the normalised URL then hits the static
  stub and returns **200**. Both forms are now listed. The stub is why this looked fine in a
  browser; verify with `curl -sI`, not by clicking.
- **`cleanUrls` is deliberately not set.** Eleventy already emits directory URLs
  (`/about/index.html` served at `/about/`), and combining `cleanUrls` with `trailingSlash`
  can produce a redirect loop.
- **There is no bookable intro call (Aug 2026).** Julia doesn't want families booking a
  15-minute slot; she wants them to phone or email. Every CTA now reads **"Get in touch"** and
  goes to `/contact/`. A free first conversation still happens — it just has no fixed length
  and isn't booked in advance. The word "free" used to appear 20 times across 11 files and
  every single one was about the intro call; the promise now reads "costs nothing", which
  attaches to a conversation better than "free" attached to a product. Two arguments rested
  on it — the private-pay FAQ on `/services/` and the same argument restated in
  `/resources/private-pay-pediatric-ot/` — and both were rewritten rather than word-swapped.
- **SimplePractice is now a footer link for existing clients only.** `bookingUrl` was renamed
  `clientPortalUrl` so nobody wires it back into a CTA. There is no public SimplePractice API
  on the standard plans, and their appointment-request widget is a third-party JavaScript
  embed that renders a modal this design system can't style — neither matters any more, but
  both are worth knowing before anyone reaches for it again.
- **Remote sessions are a second delivery mode, not a second practice.** In-person stays East
  Jefferson County; remote reaches the Olympic Peninsula. Both services, same rate. The
  argument on `/in-home-ot/` ("Why not a clinic room?") had to be reframed rather than
  softened: it was never an argument for Julia being physically present, it's an argument
  against a room the child doesn't live in — and on video the session is still in their own
  kitchen. Keep that distinction if you edit that page.
- **The JSON-LD keeps two areas deliberately separate.** Top-level `areaServed` lists only the
  ten towns she drives to, because it has to stay byte-aligned with the Google Business
  Profile. Remote reach lives on a separate `availableService` node with its own
  `areaServed` and an `availableChannel`. Merging them would create exactly the conflicting
  location signal the schema file exists to avoid.
- **The `/contact/` form is hidden, not deleted.** `contactFormEnabled` is false: with the
  portal, email and phone all live there were three working routes to Julia and no endpoint
  behind the form, so it was the one thing on the page that couldn't do its job. The markup
  and its styling stay in the repo untouched.
- **When it comes back, it is deliberately not an intake form.** It posts to a third party,
  so it asks only what's needed to make contact and its help text tells families to keep
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
grep -rn "\[email\|\[phone\|\[MOT\|\[license\|\[form endpoint\|\[session length\|\[cancellation\|introCall\|intro call\|15-minute\|fifteen-minute\|bookingUrl\|paediatric\|behaviour\|programme\|individualis" src/
```
