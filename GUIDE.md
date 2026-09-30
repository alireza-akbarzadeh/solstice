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

**Fonts.** English: Playfair Display (headings) + Plus Jakarta Sans (body). Persian:
[Vazirmatn](https://rastikerdar.github.io/vazirmatn/fa) for everything. This is switched
in `globals.css` via `--app-font-*` under `html:lang(fa)`. Never hard-code a font family
in a component; use the `font-*` utilities so the swap keeps working.

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

| Material | lucide | Material | lucide |
| --- | --- | --- | --- |
| `play_arrow` | `Play` | `arrow_forward` | `ArrowRight` (+ `rtl:rotate-180`) |
| `check_circle` | `CircleCheck` | `verified` | `BadgeCheck` |
| `spa` | `Flower2` | `auto_stories` | `BookOpen` |
| `groups` | `Users` | `explore` | `Compass` |
| `volume_up` | `Volume2` | `tune` | `SlidersHorizontal` |
| `water_drop` | `Droplets` | `graphic_eq` | `AudioLines` |
| `air` | `Wind` | `star` | `Star` (fill-current) |
| `wb_twilight` | `Sunrise` | `psychology_alt` | `Brain` |
| `lock` | `Lock` | `favorite` | `Heart` |
| `search` | `Search` | `menu` | `Menu` |
| `schedule` | `Clock` | `calendar_today` | `Calendar` |

**Images.** `next/image` with local files from `public/images/…`; always set `sizes`.
Alt text: short and descriptive (the manifest's prompts are too long — condense them).

**Links.** `Link` from `@/i18n/navigation` (locale-aware), never `next/link`.
Routes that don't exist yet still link to their final path.

**Components.** Server Components by default; `"use client"` only for real
interactivity (menus, players, forms). Use shadcn primitives (`Button`, `Input`, …)
styled with Stitch classes rather than hand-rolled equivalents when one fits.

**Motion.** Keep Stitch's restraint: color/shadow transitions ~300ms, image hover
`scale-105` over 500ms, `ease-sanctuary`. Respect `motion-reduce:`.

## 5. Definition of done (per page)

- [ ] `/<route>` and `/fa/<route>` return 200 and render without console errors
- [ ] Matches the Stitch screen at ~1440px wide and ~390px wide
- [ ] RTL checked in `fa`: alignment, icon direction, no clipped text
- [ ] `pnpm typecheck` and `pnpm lint` pass
- [ ] `PROGRESS.md` row updated and **Next up** moved to the next page, with a log line

## 6. Build order

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
