# Build Progress

Tracks what's built and what's left. Update this file whenever a page or piece of
foundation work changes status.

**Legend:** ✅ done · 🟡 in progress / placeholder · ⬜ not started · 🎨 Stitch design available

Every page is localized (`en`, `fa` RTL) under `src/app/[locale]/…`.
English lives at `/`, Persian at `/fa/…`. How to build a page: `GUIDE.md`.

> **Next up:** Program `/programs/[slug]` — `30-day-awakening-immersion-hub-desktop`.
> (Sign-up → mock checkout → members-only playback still wants one hands-on run with a real account.)

---

## Foundation

| Item | Status | Notes |
| --- | --- | --- |
| Neon project linked (`production` branch) | ✅ | `.neon`, `neon.ts` |
| Better Auth on Neon Postgres (self-hosted) | ✅ | Schema pushed (`user` app fields, `solstice_membership`, `solstice_push_subscription`) |
| Google OAuth provider | 🟡 | Code done; needs `BETTER_AUTH_GOOGLE_CLIENT_ID/SECRET` in `.env` |
| GitHub OAuth provider | 🟡 | Code done; needs `BETTER_AUTH_GITHUB_CLIENT_ID/SECRET`. Buttons render only for configured providers (`enabledSocialProviders`) |
| Email/password auth | ✅ | `/sign-in`, `/sign-up`; 8-char minimum, "keep me signed in" (30 days), safe `?next=` redirects (`src/lib/safe-next.ts`). No email verification yet |
| Email verification / password reset | ⬜ | Needs an `EmailProvider` in `infrastructure/email` |
| `member` / `instructor` roles | 🟡 | `user.role` column (not settable at sign-up; promote in the DB). Instructors get full access. No instructor routes/guards yet |
| shadcn/ui (radix-nova, RTL) | ✅ | `components.json`, `src/components/ui` |
| next-intl (`en`, `fa`) + RTL direction | ✅ | `src/i18n`, `messages/`, `src/middleware.ts` |
| Fonts: Playfair Display + Plus Jakarta Sans (en), Vazirmatn for all Persian text (fa) | ✅ | `src/app/[locale]/layout.tsx`; per-locale switch in `globals.css` (`html:lang(fa)`) |
| Stitch theme → `globals.css` tokens | ✅ | Stitch tokens exposed 1:1 (`bg-surface-container-low`, `font-headline-sm text-headline-sm`, `px-margin`…); Stitch `secondary` → `clay` |
| Stitch screens pulled locally | ✅ | `design/stitch/`: DESIGN.md, 27 screens (HTML + PNG), `screens.json`; refresh with `pnpm stitch:pull` |
| Build guide | ✅ | `GUIDE.md`; `CLAUDE.md` points sessions at it |
| Better Auth Dash (`@better-auth/infra`) | ✅ | `dash()` plugin; `BETTER_AUTH_API_KEY` is required — add it to Vercel before deploying |
| Site header / footer / nav | ✅ | `src/components/layout/` — sticky header, mobile sheet menu, footer; `(public)/layout.tsx` |
| Module structure (`src/modules/*`) | 🟡 | `practices`, `programs` started: `types.ts`, `sample-data.ts`, `server/`, `components/` |
| Sample content → database | ⬜ | `src/modules/*/sample-*.ts` + `TODO(db)` in `server/` functions |
| Video provider | 🟡 | `VideoProvider` boundary in `infrastructure/video` with a mock (`MOCK_VIDEO_URL` or a default clip). Previews are cut client-side only — a real provider must enforce them server-side |
| Membership entitlement | ✅ | `solstice_membership` (one row per user, trial → period end); `getViewer()` resolves session + access once per request; `resolvePracticeAccess` → full / preview / locked |
| Payment provider | 🟡 | `PaymentProvider` boundary in `infrastructure/payment`; only `mock` (grants the membership without charging, shown as test mode). Real provider + webhooks not built |
| Pricing source | 🟡 | `src/modules/memberships/plans.ts` ($24/mo, $220/yr). Stitch screens disagree ($24 vs $48) — confirm the real price |
| Newsletter signup (footer) | ⬜ | Form renders, not wired; needs `EmailProvider` |
| Soundscape audio | ⬜ | Home atmosphere bar selects only; no audio assets/player yet |
| Legal pages `/privacy`, `/terms`, `/ethics` | ⬜ | Linked from footer, no content yet |
| PWA (installable, offline fallback) | ✅ | `public/sw.js`, `src/app/manifest.ts`, `/offline` + `/fa/offline`, icons via `pnpm icons`. Offline tested in a production build (cached pages, localized offline page, Persian font offline) |
| Push notifications (self-hosted Web Push) | 🟡 | Built: VAPID keys in `.env`, `web-push` sender, `solstice_push_subscription` table (now in Neon), server actions, SW push/click handlers, header bell. Verified: real FCM subscription + send (201) and SW handler. Left: try the bell end to end while signed in. Add the VAPID vars to Vercel before deploying |
| Localized 404 page | ⬜ | Unknown routes show Next's default English 404 |

## Public (SEO) — `src/app/[locale]/(public)`

| Route | Status | Stitch | Notes |
| --- | --- | --- | --- |
| `/` Home | ✅ | 🎨 | `solstice-studio-desktop-home`; sections in `src/components/marketing/home/`. Sign-in lives in the header account menu (`account-menu.tsx`) |
| `/practices` | ✅ | 🎨 | Search, category pills, duration/props/intensity filters, pagination — all in the URL (`src/modules/practices/filters.ts`). Bookmark icon waits for favorites |
| `/practices/[slug]` | ✅ | 🎨 | Custom player (play, ±10s, seek, volume, speed, mirror, fullscreen), seekable chapters, related, share. Members-only practices: full for members, a `previewSeconds` preview or locked state otherwise. Not yet: Save / Mark complete (favorites + progress tables), program progress card, reflections (community), soundscape chips |
| `/programs` | ⬜ | ? | |
| `/programs/[slug]` | ⬜ | 🎨 | `30-day-awakening-immersion-hub-desktop` |
| `/journal` | ⬜ | 🎨 | `the-solstice-chronicle-editorial-journal` |
| `/journal/[slug]` | ⬜ | 🎨 | `the-vagus-nerve-in-movement-essay-reader` |
| `/about` | ⬜ | 🎨 | `about-elena-vance-desktop` |
| `/membership` | ✅ | 🎨 | `sanctuary-checkout-pricing-desktop`, `sanctuary-checkout-access-pass`. Monthly/annual checkout (signed-out → `/sign-up` first, plan kept); members see status + cancel/resume |
| `/membership/welcome` | ✅ | — | Post-checkout confirmation; non-members are sent back to `/membership` |

## Auth — `src/app/[locale]/(auth)`

| Route | Status | Stitch | Notes |
| --- | --- | --- | --- |
| `/sign-in` | ✅ | 🎨 | Email/password + Google/GitHub; `member-sign-in-desktop` / `-mobile` |
| `/sign-up` | ✅ | 🎨 | `member-registration-desktop`, `create-account-mobile`. Collects practice rhythm + marketing opt-in |
| `/forgot-password` | ⬜ | ? | |
| `/reset-password` | ⬜ | ? | |
| `/verify-email` | ⬜ | ? | |

## Member — `src/app/[locale]/(member)`

| Route | Status | Stitch | Notes |
| --- | --- | --- | --- |
| `/dashboard` | ⬜ | 🎨 | `today-sanctuary` (mobile) |
| `/my-practices` | ⬜ | ? | Favorites / saved |
| `/progress` | ⬜ | ? | |
| `/community` | ⬜ | 🎨 | `community-reflections`, `live-sangha-virtual-sanctuary-room`, `live-satsang-sanctuary-room-mobile` |
| `/profile` | ⬜ | 🎨 | Membership + profile; `member-sanctuary-account-rhythm-settings` |

## Instructor — `src/app/[locale]/(instructor)/instructor`

| Route | Status | Stitch | Notes |
| --- | --- | --- | --- |
| `/instructor` | ⬜ | ? | Overview |
| `/instructor/videos` | ⬜ | 🎨 | Upload/manage (via `VideoProvider`); `studio-admin-content-video-publisher` |
| `/instructor/programs` | ⬜ | ? | |
| `/instructor/members` | ⬜ | 🎨 | `studio-admin-members-access`; `studio-admin-transactions-revenue` has no route yet |
| `/instructor/posts` | ⬜ | ? | Announcements |
| `/instructor/community` | ⬜ | ? | Moderation |

---

## Log

- **2026-09-30** — Neon linked; Better Auth pointed at Neon; Google provider; shadcn
  (RTL) initialized; next-intl with `en`/`fa`; placeholder home verified at `/` and
  `/fa`. Stitch MCP added but not yet readable in-session.
- **2026-09-30** — Pulled Stitch project "Sanctuary Yoga Studio" into `design/stitch/`;
  theme tokens and fonts applied to `globals.css` and the locale layout; verified `/`
  and `/fa` render.
- **2026-09-30** — Pulled 4 new screens (27 total); added `pnpm stitch:pull` /
  `pnpm stitch:images`, `GUIDE.md`, `CLAUDE.md`. Built site shell + Home (en/fa,
  1440px + 390px checked). Fixed: middleware matcher skipped every route but `/`
  (`\.` vs `\\.`), so `/fa` rendered English; `cn` taught the Stitch type/spacing
  names (it was dropping `text-body-sm`); letter-spacing reset for Persian.
- **2026-09-30** — Persian now uses Vazirmatn for all text, headings included. Before,
  Vazirmatn never loaded: the Playfair/Jakarta system fallbacks rendered Persian first.
- **2026-09-30** — Built `/practices` (filters, search, pagination, upsell) and
  `/practices/[slug]` (player tested with a sample clip, chapters, locked state, related).
  Fixed Latin digits in Persian (typed `{x, number}` placeholders). Installed the `arena`
  skill in `.claude/skills/` (needs Python 3 on this machine). PWA + push planned next.
- **2026-09-30** — PWA + self-hosted Web Push. Header now uses the redrawn sun mark
  (`public/icons/mark.svg`) instead of the squeezed wordmark. `public/` excluded from
  tsc/eslint (service worker globals).
- **2026-09-30** — Auth + memberships: `/sign-in`, `/sign-up` (email/password, Google,
  GitHub), header account menu, `/membership` checkout through a mock `PaymentProvider`,
  `/membership/welcome`, membership entitlement for members-only practices (full / preview /
  locked), mock `VideoProvider`, Better Auth Dash. Schema is in Neon. Build, tsc and lint
  pass; every new route answers in `en` and `fa` (RTL). The full sign-up → checkout flow
  still needs a hands-on run.
