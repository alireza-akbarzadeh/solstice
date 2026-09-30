# Build Progress

Tracks what's built and what's left. Update this file whenever a page or piece of
foundation work changes status.

**Legend:** ✅ done · 🟡 in progress / placeholder · ⬜ not started · 🎨 Stitch design available

Every page is localized (`en`, `fa` RTL) under `src/app/[locale]/…`.
English lives at `/`, Persian at `/fa/…`.

---

## Foundation

| Item | Status | Notes |
| --- | --- | --- |
| Neon project linked (`production` branch) | ✅ | `.neon`, `neon.ts` |
| Better Auth on Neon Postgres (self-hosted) | 🟡 | Schema not pushed yet — run `pnpm db:push` |
| Google OAuth provider | 🟡 | Code done; needs `BETTER_AUTH_GOOGLE_CLIENT_ID/SECRET` in `.env` |
| Email/password auth | 🟡 | Enabled in config; UI not built |
| Email verification / password reset | ⬜ | Needs an `EmailProvider` in `infrastructure/email` |
| `member` / `instructor` roles | ⬜ | |
| shadcn/ui (radix-nova, RTL) | ✅ | `components.json`, `src/components/ui` |
| next-intl (`en`, `fa`) + RTL direction | ✅ | `src/i18n`, `messages/`, `src/middleware.ts` |
| Fonts: Playfair Display + Plus Jakarta Sans (Latin), Vazirmatn (Persian) | ✅ | From Stitch; `src/app/[locale]/layout.tsx` |
| Stitch theme → `globals.css` tokens | ✅ | Stitch tokens exposed 1:1 (`bg-surface-container-low`, `font-headline-sm text-headline-sm`, `px-margin`…); Stitch `secondary` → `clay` |
| Stitch screens pulled locally | ✅ | `design/stitch/`: DESIGN.md, 23 screens (HTML + PNG), `screens.json` |
| Better Auth Dash (`@better-auth/infra`) | ⬜ | Needs `pnpm add @better-auth/infra zod@^4` + `dash()` plugin, then redeploy |
| Site header / footer / nav | ⬜ | Locale switcher exists: `src/components/layout/locale-switcher.tsx` |
| Module structure (`src/modules/*`) | ⬜ | Per README |

## Public (SEO) — `src/app/[locale]/(public)`

| Route | Status | Stitch | Notes |
| --- | --- | --- | --- |
| `/` Home | 🟡 | 🎨 | Placeholder; design: `solstice-studio-desktop-home` |
| `/practices` | ⬜ | 🎨 | `practice-library-desktop`, `practice-library` (mobile) |
| `/practices/[slug]` | ⬜ | 🎨 | `practice-detail-player-desktop`, `practice-player`, plus locked variants |
| `/programs` | ⬜ | ? | |
| `/programs/[slug]` | ⬜ | ? | |
| `/journal` | ⬜ | 🎨 | `the-solstice-chronicle-editorial-journal` |
| `/journal/[slug]` | ⬜ | ? | |
| `/about` | ⬜ | 🎨 | `about-elena-vance-desktop` |
| `/membership` | ⬜ | 🎨 | `sanctuary-checkout-pricing-desktop`, `sanctuary-checkout-access-pass` |

## Auth — `src/app/[locale]/(auth)`

| Route | Status | Stitch | Notes |
| --- | --- | --- | --- |
| `/sign-in` | ⬜ | 🎨 | Email/password + Google; `member-sign-in-desktop` / `-mobile` |
| `/sign-up` | ⬜ | 🎨 | `member-registration-desktop`, `create-account-mobile` |
| `/forgot-password` | ⬜ | ? | |
| `/reset-password` | ⬜ | ? | |
| `/verify-email` | ⬜ | ? | |

## Member — `src/app/[locale]/(member)`

| Route | Status | Stitch | Notes |
| --- | --- | --- | --- |
| `/dashboard` | ⬜ | 🎨 | `today-sanctuary` (mobile) |
| `/my-practices` | ⬜ | ? | Favorites / saved |
| `/progress` | ⬜ | ? | |
| `/community` | ⬜ | 🎨 | `community-reflections`, `live-sangha-virtual-sanctuary-room` |
| `/profile` | ⬜ | ? | Membership + profile |

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
