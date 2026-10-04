# Arte Yoga Studio — Business Roadmap

What to build next, and in what order, to turn the platform into a complete yoga studio
business. What exists today is in `FEATURES.md`; the short technical to-do list is the
**Handover roadmap** in `PROGRESS.md`.

## The rule: spend nothing until the studio earns

Build in this order:

1. **Free features first.** Everything that needs only our own code and the database we
   already have.
2. **Then payments.** A payment gateway normally has no monthly fee; it takes a small cut of
   each sale. It is the first "paid" service, and it is the one that brings money in.
3. **Then email.** Several providers have free tiers that cover a small studio.
4. **Last, storage and video hosting.** These cost money every month whether or not anyone
   buys, so they wait until memberships pay for them.

Until then: videos go on **YouTube (unlisted)**, and you paste the link. The video plays
**inside our website** and never sends anyone to YouTube. That already works.

**Keep the studio on services based outside Iran.** Iranian platforms (Aparat, ArvanCloud,
local payment gateways) are tied to your national identity and must follow local authorities,
who may treat this content as a problem. They can remove content, freeze income or expose who
runs the site. Aparat support exists in the code, but this plan does not rely on it. See
*Privacy & safety checklist* at the end.

---

## Your next steps (in order)

| # | Step | Cost | Size | Why now |
| - | ---- | ---- | ---- | ------- |
| 1 | Finish handover items **3–7** in `PROGRESS.md` (email templates, sitemap, Home sections, page editor cleanup, editable logo/photos) | Free | S–M each | Already planned; makes the studio fully self-managed |
| 2 | **Video upgrade, stage 1** (below): YouTube player API, plus video sources stored as a list so a second version can be added later | Free | M | Video is the product: chapters, timestamps and auto-complete for YouTube videos |
| 3 | **Live classes**: schedule, join link, RSVP, reminders | Free | M | The strongest reason people pay a yoga studio monthly |
| 4 | **Onboarding + "Start here" path + practice reminders** | Free | M | New members who don't practise in week one cancel |
| 5 | **Workshops & retreats registration** (capacity, waitlist, "pay directly" for now) | Free | M | Events are the highest-value sales for one instructor |
| 6 | **Payment gateway**: a decision for you, see phase C | Per sale only | L | Turns everything above into revenue |

If you only do one thing this month, do **#2**: it's free and it improves every practice page.

---

## Video strategy: YouTube now, our own player later, both side by side

### Today (already working)

- The instructor uploads to YouTube as **Unlisted**, with embedding allowed, and pastes the link in `/instructor/videos`.
- The practice page shows YouTube's player inside our page (privacy-friendly `youtube-nocookie`). No redirect.
- Non-members see a locked screen on members-only practices, never the video.
- **Limits:**
  - An unlisted video can still be watched by anyone who has its link.
  - Visitors inside Iran need a VPN to play YouTube videos.
  - Chapters, timestamped reflections and auto-complete don't work on YouTube videos, because YouTube's player is in control.
- **Why YouTube is the right choice for now:** it's free and hosted outside Iran. Unlisted videos don't appear in search or on your channel page. And it is easy to move away from later, because each practice only stores a link.

### Stage 1 — free, build now

1. **YouTube player API.** YouTube offers a free JavaScript API for its embedded player. With it we can:
   - make chapters seek the YouTube video;
   - stamp reflections with the current time;
   - mark the practice complete when the video ends;
   - stop a preview after N seconds (a soft limit, fine for marketing).

   The embed stays inside our site.
2. **Prepare for two versions.** A practice stores a list of video sources instead of one link. Today the list holds just the YouTube link, and existing practices move over automatically. Stage 2 then adds our own version without touching the practice pages again.

### Stage 2 — when memberships pay for it

3. **Our own video provider**, hosted outside Iran (for example Bunny Stream, Cloudflare Stream or Mux; compare current prices when the time comes). It slots into the existing `VideoProvider` boundary as one more source:
   - **Upload from the studio.** No more YouTube step; the provider makes the versions and the thumbnail.
   - **Real members-only protection.** Short-lived signed links, so a copied link stops working.
   - **Both versions on the page.** The player shows a small switch, `Arte · YouTube`. Members start on the Arte player; YouTube stays as a backup and as public trailers for free practices. The choice is remembered, and visitors always stay on our site.
   - **Less dependence on YouTube.** If YouTube ever removes a video or the account, the Arte version keeps playing.
4. **Storage provider for images and audio**, hosted outside Iran (for example Cloudflare R2 or Vercel Blob): an upload button on every image field, a media library page, soundscapes, guided meditations and audio narration for essays.

```text
Practice
 └─ video sources (ordered)
     ├─ arte     (own provider, signed playback, members)  ← stage 2
     └─ youtube  (unlisted embed, backup / public trailer) ← today
Player: shows a source switch, picks a default by membership, remembers the choice.
```

---

## Business features, by phase

**Priority:** Must = needed to run the business · Should = clearly grows revenue or retention · Nice = polish
**Size:** S = a day or two · M = about a week · L = more

### Phase A — Finish self-management (free)

| Feature | Priority | Size | Notes |
| ------- | -------- | ---- | ----- |
| Handover items 3–7, 11 in `PROGRESS.md` | Must | S–M | Email templates, sitemap/robots, Home sections, page editor cleanup, editable logo/photos, pre-launch checklist |
| Chapters editor for practices | Should | S | Chapters are stored and shown but can't be edited in the studio yet |
| Testimonials manager | Should | S | Add/hide/order member quotes on Home and Membership |
| Private instructor notes on a member | Should | S | Injuries, goals, conversations; only the instructor sees them |
| Structured data for Google (practices as videos, programs as courses, FAQ, studio) | Should | S | Richer search results, free traffic |

### Phase B — Grow and keep members (free)

| Feature | Priority | Size | Notes |
| ------- | -------- | ---- | ----- |
| Video upgrade, stage 1 | Must | M | See above |
| Live classes | Must | M | Weekly schedule (repeating sessions), join link (Google Meet, Zoom or Jitsi: all have free plans; avoid Iranian services such as Skyroom for this content), members-only, RSVP, push reminder 1 hour before, "add to calendar", replay linked to a practice afterwards |
| Onboarding questions | Must | S | Level, goals, time available, injuries → personal "Start here" suggestions on Today |
| Practice reminders | Should | S | The member picks days and a time; we send a push. Push is already built |
| "We miss you" nudges | Should | S | Push after 7 / 14 days without practice; studio list of inactive members to contact personally |
| Workshops & retreats registration | Should | M | Turn custom pages into events: date, capacity, register, waitlist, attendee list/export, reminder. "Pay directly" until payments exist |
| Referral programme | Should | S | Invite link; when the friend joins, both get a free month (uses the existing comped pass) |
| Content insights | Should | S | Most-watched practices, completion rate, where people stop. Tells the instructor what to record next |
| Milestones & certificates | Nice | S | Celebrate 10/50/100 sessions; shareable certificate image when a program is finished |
| Member collections | Nice | S | Members group saved practices into their own playlists |
| Telegram channel / bot notices | Nice | M | Widely used by Iranian audiences and hosted outside Iran; announcements also posted to the studio's channel |

### Phase C — Start earning (pay per sale, no monthly fee) ★★★★★

**Top priority once a country and gateway are settled** (most likely Stripe, PayPal or
similar after moving abroad). The plan is to build the whole payment *behaviour* now against the
test provider, so switching to a real one later means adding one provider file and its keys:

- **Hosted checkout, by redirect.** We create a checkout, send the member to the provider's
  own payment page, and they come back to us. We never handle card numbers. Stripe Checkout,
  PayPal and Paddle all work this way, and our test checkout already does.
- **The webhook decides.** Membership starts, renews, goes past due or is refunded only when the
  provider's signed webhook says so, not when the browser comes back. The test checkout will send
  the same events, so the real flow is tested before any provider exists.
- **A payment record for every charge**, so we can show receipts in the profile, base the revenue
  page on real charges instead of projections, and manage refunds.
- **Active provider chosen in Studio settings:** Test, Stripe, PayPal, … Only providers whose
  keys are set on the server can be chosen. **API keys stay in environment variables** (Vercel),
  never in a studio form, so a stolen instructor session can't steal or swap them.
- **Manage billing** links to the provider's own customer portal for card changes and invoices.

**Choosing a gateway is your decision, and it needs care.** Iranian gateways (Zarinpal and
similar) require registration with your national ID and a licensed business. That links the
studio's income to your identity, under authorities that may object to the content.
International processors (Stripe, PayPal, …) generally do not serve people living in Iran. Talk
to someone you trust about the legal and personal risk before you pick. Until then, test mode
stays on, and the instructor can give access by hand with comped passes, for example after a
direct payment.

| Feature | Priority | Size | Notes |
| ------- | -------- | ---- | ----- |
| Real payment gateway | Must | L | `PaymentProvider` is ready for whichever gateway you choose. Webhooks, renewals, failed-payment retries |
| Receipts & invoices in the profile | Must | S | Members download what they paid |
| Coupons & discount codes | Should | S | Launch offers, holiday sales, "first month 50%" |
| Gift memberships | Should | S | Buy 1/3/12 months for someone else (great for holidays) |
| Paid workshops / drop-ins / class packs | Should | M | One-off purchases next to memberships (e.g. a retreat deposit, a 10-class pack for live classes) |
| Pause membership | Nice | S | "Pause 1 month" instead of cancel, which saves members you would otherwise lose |
| Revenue page from real payments | Must | S | Switch from "projected" to actual charges and refunds |

### Phase D — Email (free tier to start)

| Feature | Priority | Size | Notes |
| ------- | -------- | ---- | ----- |
| Real email provider | Must | S | `EmailProvider` is ready. Resend, Brevo and others have free tiers |
| Welcome series | Should | S | Day 0 / 3 / 7 emails that guide new members to their first practices |
| Newsletter sending from the studio | Should | M | Write once in both languages; send to subscribers by language |
| Trial-ending and payment reminders | Must | S | Fewer surprise charges, fewer failed renewals |

### Phase E — Media (when revenue covers it)

| Feature | Priority | Size | Notes |
| ------- | -------- | ---- | ----- |
| Own video provider (stage 2 above) | Must | L | Upload from the studio, signed playback, `Arte · YouTube` switch, hosted outside Iran |
| Image upload & media library | Must | M | `StorageProvider`; upload button on every image field |
| Audio: soundscapes, guided meditations, essay narration | Nice | M | Needs storage; the player controls were removed until then |
| Offline downloads in the app | Nice | M | Members save a practice to watch without internet |

### Later, only if the business asks for it

- **In-person class booking** (if there is a physical studio): timetable, capacity, check-in.
- **1-on-1 private sessions**: the instructor's free hours, booking, reminders, payment.
- **Drag-and-drop page builder** (Puck) for marketing pages.

### Out of scope (by design)

- Multiple instructors or a marketplace. The product is built around **one** instructor (`README.md`).
- A separate native app. The installable web app (PWA) already covers phones.

---

## Privacy & safety checklist

The content is healthy, but local authorities may see it differently. These choices keep the
studio running and keep you safer.

| Topic | Status / advice |
| ----- | --------------- |
| Hosting, database, video | ✅ All outside Iran today (Vercel, Neon, YouTube). Keep new providers outside Iran too |
| Iranian platforms (Aparat, ArvanCloud, Skyroom, local SMS services, local gateways) | Avoid for this content. They are tied to national ID and must follow local authorities |
| Domain | Use an international domain (`.com`, `.studio`, …), not `.ir`, which requires Iranian registration |
| YouTube videos | Upload as **Unlisted**. Consider a channel and Google account dedicated to the studio, separate from your personal accounts |
| Who runs the site | The site shows only what you put in Pages and Settings. Leave the address empty if you don't want it public; email can be a studio address rather than a personal one |
| Members' data | Collect only what's needed (already the case). Reflections can be private to the instructor |
| Members in Iran | Need a VPN for YouTube. Our own provider (stage 2) is the long-term answer for smooth playback |
| Toman pricing, Persian dates | ✅ built (dates in `fa` show like ۱۲ مهر ۱۴۰۵) |
| Payments | ⛔ your decision; see phase C |
