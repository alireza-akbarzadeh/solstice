# Arte Yoga Studio — Feature Catalogue

Everything the platform does today, in one place. For build history see `PROGRESS.md`; for
what to build next see `ROADMAP.md`.

**Status:** ✅ live · 🟡 works with a limit (noted) · ⛔ waiting on a paid provider or a decision

Every page exists in English (`/…`) and Persian (`/fa/…`, right-to-left, Vazirmatn font,
Persian digits). Every piece of text a visitor reads can be edited in both languages from the
studio.

---

## 1. Switches (environment flags)

These are set in `.env` (and on Vercel). They decide which provider each feature uses.

| Flag | Values today | Default | What it controls |
| ---- | ------------ | ------- | ---------------- |
| `PAYMENT_PROVIDER` | `mock` | `mock` | Checkout. `mock` charges nothing and turns on **test mode** (test checkout, test panel, test accounts). A real gateway is not built yet ⛔ |
| `EMAIL_PROVIDER` | `outbox` | `outbox` | Emails are stored in the database and read at `/test/mailbox`; nothing is really sent ⛔ |
| `VIDEO_PROVIDER` | `mock`, `youtube`, `aparat` | `mock` | Default provider for new practices. YouTube and Aparat links are detected automatically whatever this is set to |
| `MOCK_VIDEO_URL` | any media URL | — | Optional stand-in video file for practices with no video |
| `BETTER_AUTH_GOOGLE_CLIENT_ID/SECRET` | keys | — | Shows "Continue with Google" only when set 🟡 |
| `BETTER_AUTH_GITHUB_CLIENT_ID/SECRET` | keys | — | Shows "Continue with GitHub" only when set 🟡 |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | keys | — | Web push notifications (free, self-hosted) |
| `BETTER_AUTH_API_KEY` | key | required | Better Auth dashboard |
| `DATABASE_URL` | Neon Postgres | required | All data |

Studio settings that behave like switches, with no code needed:

- **Currency** (USD, EUR, GBP, toman). Set in `/instructor/plans`.
- **Plan on sale / hidden / recommended.** Set per plan.
- **Practice access** (free or members-only), **published / draft**, **featured on Home**. Set per practice.
- **Program pacing** (one day per day, or self-paced), **published**, **featured**. Set per program.
- **Category shown in filters.** Set per category.
- **Custom page in menu / footer**, **published**. Set per page.
- **Contact details and social links**: whatever is filled in appears, and empty fields hide.

---

## 2. Visitors (public website)

| Feature | Status | Notes |
| ------- | ------ | ----- |
| Home | ✅ | Photo hero, featured practices and programs, instructor, membership call to action. Signed-in members go to their dashboard |
| Practice library `/practices` | ✅ | Search, category pills, filters for duration, props and intensity, pagination. Filters live in the URL, so they can be shared |
| Practice page `/practices/[slug]` | ✅ | Video, chapters, related practices, share, save, mark complete, reflections |
| Programs `/programs`, `/programs/[slug]` | ✅ | Multi-week journeys, enrolment, daily unlocking or self-paced, progress and streak |
| Journal `/journal`, `/journal/[slug]` | ✅ | Essays with search and categories, featured essay, reading progress, print, related essays and practices |
| About `/about` | ✅ | Story, credentials, milestones, pillars, studio photos, letter, FAQ, **Get in touch** (contact + socials) |
| Membership `/membership` | ✅ | Plans from the database: price, billing period, trial, features, recommended plan |
| Custom pages `/[slug]` | ✅ | Workshops, retreats, offers: bilingual, cover, YouTube video, button to membership or an external booking link |
| Footer | ✅ | Newsletter signup, menu links, custom pages, social links, email, phone, address, policies |
| Newsletter signup | 🟡 | Addresses are stored and exportable. **Sending** needs an email provider ⛔ |
| Legal pages `/privacy`, `/terms`, `/ethics` | 🟡 | Written from what the app really does. **Not reviewed by a lawyer** |
| Localized 404 | 🟡 | Works for missing practices/essays. Completely unknown paths still show Next.js's 404 in production |
| SEO metadata | 🟡 | Titles, descriptions, canonical and language alternates. No `sitemap.xml` / `robots.txt` yet (roadmap #4) |

## 3. Video playback

| Feature | Status | Notes |
| ------- | ------ | ----- |
| YouTube | ✅ | Paste a YouTube link. It plays **inside the site** (privacy-friendly `youtube-nocookie` embed) and never redirects to YouTube. A blank cover uses the YouTube thumbnail |
| Aparat | ✅ | Paste an Aparat link. Same embedded experience. Supported in code, but **not recommended** for this content: it's an Iranian platform tied to national ID (see `ROADMAP.md`, *Privacy & safety*) |
| Direct media file | ✅ | Any public `.mp4`/stream URL plays in **our own player** |
| Our player (file videos only) | ✅ | Play, ±10 s, seek, volume, speed, mirror, fullscreen, chapters, timestamps in reflections, auto-complete at the end, preview cut-off, touch-friendly |
| Members-only protection | 🟡 | Non-members get a locked screen, never the embed. But a YouTube/Aparat video is still public on that platform to anyone with its link. Real protection needs a paid provider ⛔ |
| Chapters / timestamps / auto-complete on YouTube | ⬜ | Not yet: embeds hand control to YouTube's player. Can be added free with the YouTube player API (see `ROADMAP.md`) |
| Upload from the studio, transcoding | ⛔ | Needs a video provider (roadmap #8) |

## 4. Accounts & membership

| Feature | Status | Notes |
| ------- | ------ | ----- |
| Sign up / sign in (email + password) | ✅ | 8-character minimum, "keep me signed in" (30 days), safe redirects back to where you were |
| Google / GitHub sign-in | 🟡 | Built. Appears when the keys are set |
| Email verification, forgot / reset password | 🟡 | Built end to end; emails land in the outbox until a real email provider exists |
| Roles: member / instructor | ✅ | Studio hidden from members (404). First instructor: `pnpm role <email>` |
| Membership states | ✅ | Free, trial, active, canceled (access until period end), past due, expired |
| Checkout | 🟡 | Real flow (plan choice, sign-up first, back to the practice). Payment is **mocked**: test cards `4242…` succeed, `4000…0002` decline |
| Switch plan / cancel / resume | ✅ | From `/profile` and `/membership` |
| Comped passes | ✅ | Instructor gives 1/3/6/12 months free from the member dossier |
| Delete account | ✅ | From `/profile` |
| Test mode | ✅ | While payments are mocked: floating **Test** pill switches your account between guest, free, trial, member, canceled, past due, expired, instructor |

## 5. Members (signed-in area)

| Feature | Status | Notes |
| ------- | ------ | ----- |
| Today `/dashboard` | ✅ | Greeting by local time, continue card, weekly rhythm, suggestions, programs, membership notice |
| Saved practices `/my-practices` | ✅ | Favorites + recent sessions |
| Progress `/progress` | ✅ | Sessions, minutes, current/longest streak, 12-week calendar, programs, minutes by style |
| Community `/community` | ✅ | Feed of reflections and circle posts; pinned instructor post = weekly intention |
| Reflections (comments) | ✅ | On practices: tags, video moments, private-to-instructor notes, replies, likes. **Moderated:** members' posts wait for approval |
| Profile `/profile` | ✅ | Membership, profile and practice rhythm, password, delete account |
| Push notifications | 🟡 | Free web push: reply notices, approval notices, announcements. iPhone requires "Add to Home Screen" (iOS 16.4+) |
| Installable app (PWA) | ✅ | Install to home screen, offline page, visited pages work offline, update prompt after each deploy |
| Mobile app shell | ✅ | Bottom tab bar, safe areas, drag-to-dismiss sheets |

## 6. Instructor studio `/instructor`

| Page | Status | What the instructor can do |
| ---- | ------ | -------------------------- |
| Overview | ✅ | Accounts, projected monthly revenue, minutes practised, reflections, newest members, content pipeline |
| Insights | ✅ | Pick 4/12/26/52 weeks: new accounts, active members, sessions, minutes, reflections, subscribers (each vs the previous period); weekly charts; when members practise (heatmap, local time); most-practised practices; minutes by category; program progress; trials ending soon; members who stopped practising (links to their dossier) |
| Settings | ✅ | Contact email, phone, bilingual address, any number of social links (Instagram, Telegram, WhatsApp, YouTube, Aparat, X, Facebook, TikTok, LinkedIn, Pinterest, Threads, website) |
| Practices | ✅ | Create, edit, publish, feature, delete. Bilingual text, video link, cover, duration, props, intensity, access. (Chapters are stored and shown but can't be edited here yet) |
| Programs | ✅ | Weeks and days of practices, pacing, publish, feature. Order locks once members enrol |
| Journal | ✅ | Block editor (paragraph, heading, quote, picture, steps) in both languages, publish, feature |
| Categories | ✅ | Practice and journal categories: bilingual names, order, show in filters, delete only when unused |
| Pages | ✅ | Edit 16 site templates (Home, About, Membership, legal, brand/menu/footer, app text) with draft → preview → publish; create custom landing pages |
| Members | ✅ | Directory, search, tiers, dossier: comped pass, stop/resume renewal, end access, change role, send reset link |
| Community | ✅ | Approve / reject reflections, approve all, answer questions, pin, hide |
| Announcements | ✅ | Post to the circle as the studio, pin as weekly intention, optionally push to every device |
| Subscribers | ✅ | Newsletter list, search, remove, **CSV export** for any mailing tool |
| Plans | ✅ | Any number of plans: price, period (1/3/6/12 months), trial, features, badge, recommended, hide; site currency |
| Revenue | 🟡 | MRR/ARR, subscribers, retention, ledger. **Projected** from memberships, because nothing is charged yet |
| Search & shortcuts | ✅ | **Ctrl/⌘ K**: jump anywhere, create content, search practices, programs, essays, pages, plans, members, reflections, subscribers |
| Works on a phone | ✅ | Tables become card lists, editors open first, selects become sheets |

## 7. Not built yet (by design or blocked)

| Missing | Why | Where it's planned |
| ------- | --- | ------------------ |
| Real payments | Needs a gateway decision (see `ROADMAP.md`, phase C) | `PROGRESS.md` roadmap #9 |
| Real email sending (verification, reset, newsletter) | Needs a provider | #10 |
| Image and video upload, media library | Needs a storage/video provider (costs money) | #8 |
| Editable email templates | Free, next in line | #3 |
| `sitemap.xml`, `robots.txt` | Free | #4 |
| Show/hide and reorder Home sections | Free | #5 |
| Editing practice chapters in the studio | Free | `ROADMAP.md` |
| Live classes, booking, events, coupons, referrals, … | Business features | `ROADMAP.md` |
| Soundscape audio, audio narration | No audio files or storage yet | `ROADMAP.md` |
