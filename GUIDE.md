# Page Build Guide

How pages get built from the Stitch designs. Read this, then open `PROGRESS.md` and
pick up at **Next up**. Product and architecture rules live in `README.md`.

---

## 1. Start of a session

1. Read `PROGRESS.md`. The **Next up** line names the page to build next.
2. If the designs may have changed in Stitch, run `pnpm stitch:pull`. It prints any
   new screens; add them to the route tables in `PROGRESS.md`.
3. Start the dev server: `pnpm dev` (or `pnpm exec next dev --turbo -p 3123` if 3000 is busy).

## 2. Design sources

```text
design/stitch/
├── DESIGN.md        design-system notes (tone, color roles, components)
├── screens.json     every screen: id, title, device, file
└── screens/
    ├── <slug>.html  exact Stitch markup (Tailwind classes) — the source of truth
    └── <slug>.png   preview screenshot
```

- `pnpm stitch:pull` — refresh everything above from Stitch (project `8229975157933039003`).
  Uses the Stitch MCP config in `~/.claude.json`; no key is stored in the repo.
- `pnpm stitch:images <screen-slug> <name>` — download that screen's images into
  `public/images/<name>/` at full resolution, with a `manifest.json` of alt texts.
- Where a screen exists for both desktop and mobile, build one responsive page: desktop
  markup for `lg:` and up, the mobile screen for the base styles.
- Where `DESIGN.md` prose and the screen HTML disagree, follow the HTML.

## 3. Porting a page — steps

1. Read the screen HTML end to end and note its sections.
2. `pnpm stitch:images <slug> <page>`; move anything shared (logo, portrait) to
   `public/images/brand/`.
3. Put the copy in `messages/en.json` **and** `messages/fa.json` under the page's
   namespace. Persian is a real translation, not a transliteration.
4. Put content that will later come from the database (practices, programs, posts…)
   behind a function in `src/modules/<module>/server/`, returning typed sample data
   for now. Pages call that function; swapping in Drizzle later doesn't touch the UI.
5. Build the route in `src/app/[locale]/<group>/…`. Split sections into components in
   `src/modules/<module>/components/` (or `src/components/marketing/` for one-off
   marketing sections).
6. Verify (section 5), then update `PROGRESS.md`.

## 4. Conventions

**Classes.** Stitch token classes work unchanged: `bg-surface-container-low`,
`text-on-surface-variant`, `font-headline-sm text-headline-sm`, `px-margin`,
`gap-gutter`, `py-space-2xl`. One rename: Stitch `text-secondary` / `bg-secondary`
→ `text-clay` / `bg-clay` (shadcn owns `secondary`). `max-w-[1320px]` → `max-w-content`.

**Container.** `mx-auto w-full max-w-content px-margin-mobile md:px-margin`
(Stitch uses `px-margin` everywhere; add the mobile margin).

**RTL.** Everything must work in `fa` (RTL). Use logical utilities: `ps-/pe-`,
`ms-/me-`, `start-/end-`, `text-start`, `border-s-4`, `rounded-s-…`. Never `left/right`,
`pl/pr`, `ml/mr`, `text-left`. Flip directional icons with `rtl:rotate-180`.

**Fonts.** English: Cormorant Garamond (headings) + Manrope (body). Persian:
[Vazirmatn](https://rastikerdar.github.io/vazirmatn/fa) for everything. This is switched
in `globals.css` via `--app-font-*` under `html:lang(fa)`. Never hard-code a font family
in a component; use the `font-*` utilities so the swap keeps working. Editable controls
(inputs, textareas, selects, combobox/options and contenteditable text) use Vazirmatn
in both locales via the global rule in `src/styles/globals.css`. Placeholders inherit it.

**Type.** Always pair family and size as Stitch does: `font-label-md text-label-md`.
Keep Stitch's `uppercase` + `tracking-*` on labels: Persian has no case, and
`globals.css` resets letter-spacing under `:lang(fa)` because tracking breaks joined
letters. Italics are English-only: `italic rtl:not-italic`.

**Numbers in messages.** Type every numeric placeholder: `{count, number}`, not `{count}`.
Untyped placeholders print Latin digits in Persian. Years: `{year, number, ::group-off}`.
Numbers rendered outside messages go through `format.number()` (`useFormatter` /
`getFormatter`). After editing `messages/*.json`, restart the dev server if a page still
shows old text: Turbopack can keep a stale render.

**Icons.** Stitch uses Material Symbols; this app uses `lucide-react`. Common mappings:

| Material       | lucide        | Material         | lucide                            |
| -------------- | ------------- | ---------------- | --------------------------------- |
| `play_arrow`   | `Play`        | `arrow_forward`  | `ArrowRight` (+ `rtl:rotate-180`) |
| `check_circle` | `CircleCheck` | `verified`       | `BadgeCheck`                      |
| `spa`          | `Flower2`     | `auto_stories`   | `BookOpen`                        |
| `groups`       | `Users`       | `explore`        | `Compass`                         |
| `volume_up`    | `Volume2`     | `tune`           | `SlidersHorizontal`               |
| `water_drop`   | `Droplets`    | `graphic_eq`     | `AudioLines`                      |
| `air`          | `Wind`        | `star`           | `Star` (fill-current)             |
| `wb_twilight`  | `Sunrise`     | `psychology_alt` | `Brain`                           |
| `lock`         | `Lock`        | `favorite`       | `Heart`                           |
| `search`       | `Search`      | `menu`           | `Menu`                            |
| `schedule`     | `Clock`       | `calendar_today` | `Calendar`                        |

**Images.** `next/image` with local files from `public/images/…`; always set `sizes`.
Alt text: short and descriptive (the manifest's prompts are too long — condense them).

**Links.** `Link` from `@/i18n/navigation` (locale-aware), never `next/link`.
Routes that don't exist yet still link to their final path.

**Mobile navigation.** Public pages show the bottom bar to everyone below `lg`:
guests get Home, Library, Programs, Journal and Sign In; signed-in members get
Today, Library, Programs, Community and My Space. Keep the five columns shrinkable
with `min-w-0` and allow labels to wrap. Public and member footers both use
`pb-safe-nav lg:pb-0` so the last links clear the bar and iPhone home indicator.
Keep decorative elements inside the phone width rather than hiding page overflow.

**Components.** Server Components by default; `"use client"` only for real
interactivity (menus, players, forms). Use shadcn primitives (`Button`, `Input`, …)
styled with Stitch classes rather than hand-rolled equivalents when one fits.

**Motion.** Keep Stitch's restraint: color/shadow transitions ~300ms, image hover
`scale-105` over 500ms, `ease-sanctuary`. Respect `motion-reduce:`.

## 5. PWA and push notifications

Self-hosted; no paid push or PWA service.

- **Service worker:** `public/sw.js`, hand-written. Pages are network-first; public pages
  you've visited are kept for offline use (at most 40). Personal areas (`/dashboard`,
  `/profile`, `/instructor`, auth pages, …) are **never** cached — add new private
  routes to `PRIVATE_PATH`. Static build files, `/images` and `/icons` are cache-first.
  Unvisited pages fall back to `/offline` or `/fa/offline`.
- **Bump `VERSION`** in `sw.js` whenever its caching rules change. In development it's
  registered as `/sw.js?mode=development` and caches nothing.
- **Manifest:** `src/app/manifest.ts`. Icons are generated from `public/images/brand/logo.svg`
  with `pnpm icons`.
- **Push:** the browser subscribes with our VAPID public key (the header bell,
  `modules/notifications/components/push-toggle.tsx`). The subscription is stored in
  `solstice_push_subscription`, and we send with `web-push` to the browser vendor's free
  push service. Send from server code with `notifyUser(userId, copy)` or
  `notifyEveryone(copy)`, passing copy per locale. Expired devices are removed automatically.
- **Keys:** `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (see
  `.env.example`). Use the same keys in every environment: new keys invalidate all
  existing subscriptions.
- **iPhone:** web push only works after the member adds Arte Yoga Studio to the Home Screen
  (iOS 16.4+).
- **Testing:** headless Playwright Chromium can subscribe, but never receives real pushes.
  Test delivery in a real browser, or inject one via DevTools → Application → Service
  Workers → Push.

## 6. Definition of done (per page)

- [ ] `/<route>` and `/fa/<route>` return 200 and render without console errors
- [ ] Matches the Stitch screen at ~1440px wide and ~390px wide
- [ ] RTL checked in `fa`: alignment, icon direction, no clipped text
- [ ] `pnpm typecheck` and `pnpm lint` pass
- [ ] `PROGRESS.md` row updated and **Next up** moved to the next page, with a log line

## 7. Build order

1. Site shell — header (desktop nav + mobile sheet), footer, `(public)` layout
2. Home `/`
3. Practices `/practices`
4. Practice detail `/practices/[slug]` (open + locked states)
5. Program `/programs/[slug]` (30-day immersion hub)
6. About `/about`
7. Journal `/journal`
8. Journal article `/journal/[slug]`
9. Membership `/membership`
10. Sign in `/sign-in`, Sign up `/sign-up`
11. Member: `/dashboard`, `/community` (+ live room), `/profile`
12. Instructor: `/instructor/videos`, `/instructor/members`, revenue

Pages without a Stitch screen (`/programs`, `/my-practices`, `/progress`, forgot/reset
password, …) are built last, composed from existing sections in the same language.

## 8. Instructor CMS

- Practices: `/instructor/videos`; use **New practice**, paste a YouTube URL, fill both languages, save the draft, then publish. A blank cover uses the YouTube thumbnail. Existing covers also accept public HTTPS URLs or local `/images/…` paths.
- Programs: `/instructor/programs`; create a draft, add weeks and practice days, then publish. Every week must contain published practices. The instructor can feature a published program on Home.
- Videos may be public or unlisted on YouTube with embedding enabled. Members-only access controls the website; it does not make the YouTube source private. No paid video service is required.
- Program deletion removes enrollments but keeps practice completion history. A practice used by a program cannot be deleted until removed from its curriculum. Day order and pacing are fixed once members enroll; copy remains editable.
- On a new database, run `pnpm db:seed:programs` after the practice seed. This creates the program table and imports sample curricula without replacing edited rows. The additive SQL is also registered for `pnpm db:migrate`.
- Node 22+: `pnpm test:cms` checks URL parsing and curriculum validation. `pnpm test:cms:db` creates isolated fixtures in the configured database, checks CMS mutations and progress guards, and cleans up those fixtures.


### Website pages and offers

Open `/instructor/pages` (or `/fa/instructor/pages`). The **Website and app pages** section edits 16 existing content templates, including About, Home, Membership, legal text, brand/navigation/footer and member-facing copy. Expand a section to edit the English and Persian fields together. About also exposes its photos, story, credentials, milestones and FAQs; repeatable items can be added, moved and removed. Collection items still use their practice, program or journal editor.

Use **New page** to create a workshop, retreat or offer landing page. Choose an unused address, add bilingual copy, an optional cover/YouTube video and structured content, then save the draft. A button can link to `/membership` or an HTTPS booking page. The address stays fixed after creation. **Preview saved draft** requires instructor access. New pages can appear in the main menu or footer when published.

**Save draft** does not change the live website. **Publish changes** replaces the live snapshot. Custom pages can return to draft or be deleted with confirmation; existing app routes can only be edited, protecting sign-in and navigation. Content editing does not change payment amounts, membership rules or member records. A button to an external booking page does not implement booking or payment processing itself.

On a new database, run `pnpm db:seed:pages`. It creates the additive page table and imports the current website content without replacing existing edits. The SQL is also registered for `pnpm db:migrate`. Node 22+: `pnpm test:pages` checks all templates, validation, private drafts, publishing, menu/footer links and deletion using disposable fixtures. With a running local preview, `CMS_CHECK_URL=http://127.0.0.1:3131 pnpm test:pages` also checks public English/Persian rendering and draft 404s.

The footer and journal signup forms now both store subscriber addresses in `solstice_newsletter_subscriber`. Sending a newsletter still requires an email provider.
