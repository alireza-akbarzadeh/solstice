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
| Fonts: Geist (Latin) + Vazirmatn (Persian) | ✅ | Replace if the Stitch design specifies other fonts |
| Stitch theme → `globals.css` tokens | ⬜ | Blocked: Stitch MCP tools need a session restart |
| Site header / footer / nav | ⬜ | Locale switcher exists: `src/components/layout/locale-switcher.tsx` |
| Module structure (`src/modules/*`) | ⬜ | Per README |

## Public (SEO) — `src/app/[locale]/(public)`

| Route | Status | Stitch | Notes |
| --- | --- | --- | --- |
| `/` Home | 🟡 | ? | Placeholder with Google sign-in, awaiting design |
| `/practices` | ⬜ | ? | |
| `/practices/[slug]` | ⬜ | ? | |
| `/programs` | ⬜ | ? | |
| `/programs/[slug]` | ⬜ | ? | |
| `/journal` | ⬜ | ? | |
| `/journal/[slug]` | ⬜ | ? | |
| `/about` | ⬜ | ? | |
| `/membership` | ⬜ | ? | |

## Auth — `src/app/[locale]/(auth)`

| Route | Status | Stitch | Notes |
| --- | --- | --- | --- |
| `/sign-in` | ⬜ | ? | Email/password + Google |
| `/sign-up` | ⬜ | ? | |
| `/forgot-password` | ⬜ | ? | |
| `/reset-password` | ⬜ | ? | |
| `/verify-email` | ⬜ | ? | |

## Member — `src/app/[locale]/(member)`

| Route | Status | Stitch | Notes |
| --- | --- | --- | --- |
| `/dashboard` | ⬜ | ? | |
| `/my-practices` | ⬜ | ? | Favorites / saved |
| `/progress` | ⬜ | ? | |
| `/community` | ⬜ | ? | |
| `/profile` | ⬜ | ? | Membership + profile |

## Instructor — `src/app/[locale]/(instructor)/instructor`

| Route | Status | Stitch | Notes |
| --- | --- | --- | --- |
| `/instructor` | ⬜ | ? | Overview |
| `/instructor/videos` | ⬜ | ? | Upload/manage (via `VideoProvider`) |
| `/instructor/programs` | ⬜ | ? | |
| `/instructor/members` | ⬜ | ? | |
| `/instructor/posts` | ⬜ | ? | Announcements |
| `/instructor/community` | ⬜ | ? | Moderation |

---

## Log

- **2026-09-30** — Neon linked; Better Auth pointed at Neon; Google provider; shadcn
  (RTL) initialized; next-intl with `en`/`fa`; placeholder home verified at `/` and
  `/fa`. Stitch MCP added but not yet readable in-session.
