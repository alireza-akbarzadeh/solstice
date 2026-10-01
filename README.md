# Arte Yoga Studio — AI Project Context

## Product

A private digital yoga studio and community built around **one yoga instructor**.

Members can:

- Browse and watch yoga practices
- Follow structured programs
- Track progress
- Save/favorite practices
- Join a lightweight community
- Manage their membership/profile

The instructor can:

- Create, edit, publish and delete practices using YouTube, Aparat or direct media URLs
- Create, edit, publish and delete programs with weeks and practice days
- Manage members
- Publish announcements/posts
- Moderate community content

Roles:

- `instructor`
- `member`

This is **not** a multi-instructor marketplace or generic LMS.

---

## Stack

- Next.js App Router
- TypeScript
- React
- Tailwind CSS
- shadcn/ui
- Better Auth
- Drizzle ORM
- Neon PostgreSQL
- Zod

External infrastructure should remain replaceable:

- Video provider
- Payment provider
- Storage provider
- Email provider

Do **not** store video files in Neon/PostgreSQL.

---

## Architecture

This is a **single Next.js full-stack application**.

Do NOT introduce a separate backend, NestJS server, tRPC, oRPC, GraphQL, or another API layer unless a real requirement appears.

Prefer:

```text
Server Component / Server Action / Route Handler
                ↓
          Domain service
                ↓
             Drizzle
                ↓
           Neon Postgres
```

Use:

- Server Components for server-side data fetching
- Server Actions for application mutations/forms
- Route Handlers for webhooks, external integrations, and endpoints that genuinely need HTTP
- Domain/service functions for business logic

---

## Project Structure

```text
src/
├── app/
│   ├── (public)/
│   ├── (auth)/
│   ├── (member)/
│   └── (instructor)/
│
├── modules/
│   ├── auth/
│   ├── users/
│   ├── videos/
│   ├── programs/
│   ├── memberships/
│   ├── progress/
│   └── community/
│
├── infrastructure/
│   ├── payment/
│   ├── video/
│   ├── storage/
│   └── email/
│
├── db/
│   ├── schema/
│   └── client.ts
│
└── lib/
```

Example module:

```text
modules/videos/
├── components/
├── server/
│   ├── get-video.ts
│   ├── get-videos.ts
│   ├── create-video.ts
│   └── update-video.ts
├── schemas.ts
└── types.ts
```

Keep business logic out of React components.

---

## Authentication

Use **Better Auth**.

V1:

- Email/password
- Email verification
- Login/logout
- Password reset
- Sessions
- `member` / `instructor` roles

Do not build complex authentication infrastructure unless required.

Authentication and authorization are separate:

```text
Authentication → Who is the user?
Authorization  → What can this user access?
Membership     → What content is this user entitled to?
```

---

## Database

Use **Drizzle + Neon PostgreSQL**.

Core entities:

```text
User
Profile
MembershipPlan
Membership
Video
VideoCategory
Program
ProgramVideo
VideoProgress
Favorite
Post
Comment
Like
Notification
Payment
Order
```

Better Auth tables live in the same database.

Keep the initial schema lean. Do not create speculative tables/features.

---

## Provider Abstraction

External providers must be replaceable without rewriting domain logic.

Example:

```text
modules/memberships/
        ↓
infrastructure/payment/
        ↓
PaymentProvider
        ↓
Current payment provider
```

Use interfaces for:

```text
PaymentProvider
VideoProvider
StorageProvider
EmailProvider
```

Store provider IDs/metadata in the database, not provider-specific assumptions throughout the application.

---

## Video

Video is the core content type.

The video provider handles:

- Upload
- Processing
- Playback
- Thumbnails
- Video status
- Deletion

Database stores metadata such as:

```text
provider
providerAssetId
title
description
duration
thumbnail
visibility
status
```

Never store video binaries in Neon.

---

## Access Control

V1 should remain simple:

```text
FREE
MEMBERS_ONLY
```

Typical flow:

```text
User
 ↓
Authentication
 ↓
Active Membership?
 ↓
Video visibility/access rules
 ↓
Allow / Deny
```

Being authenticated does not automatically mean the user has access to paid content.

---

## Public SEO Pages

Public content should be SEO-friendly:

```text
/
 /practices
 /practices/[slug]
 /programs
 /programs/[slug]
 /journal
 /journal/[slug]
 /about
 /membership
```

Private application pages do not need to be SEO targets:

```text
/dashboard
/my-practices
/progress
/community
/profile
/instructor/*
```

Prefer Next.js Server Components for public content and metadata.

---

## Product Principles

1. Keep V1 simple.
2. Avoid premature abstractions.
3. Do not add tRPC/oRPC just because they are popular.
4. Do not create a separate backend.
5. Keep external providers replaceable.
6. Keep domain logic independent from infrastructure providers.
7. Prefer Server Components and Server Actions where appropriate.
8. Use Route Handlers for webhooks/external HTTP integrations.
9. Do not store videos in PostgreSQL.
10. Do not pay for infrastructure before the product has real usage.
11. Build only features required by the current product.
12. Favor maintainable production code over over-engineered architecture.

## AI Coding Rules

Before implementing a feature:

1. Understand the existing architecture.
2. Reuse existing patterns.
3. Do not introduce a new library when existing Next.js/React functionality is sufficient.
4. Do not create unnecessary API layers.
5. Keep server-only code on the server.
6. Validate external/user input with Zod.
7. Keep database access inside server/domain code.
8. Keep components focused on UI.
9. Do not leak secrets or provider credentials to the client.
10. Prefer complete, production-ready implementations over temporary hacks.
11. When modifying a file, preserve existing conventions and unrelated functionality.
12. Avoid speculative features and abstractions.

The goal is a **small, elegant, production-ready Next.js application that can grow gradually with real users.**

## Instructor CMS

Practice management lives at `/instructor/videos` and program management at `/instructor/programs`, with English and Persian editors. Content is stored in PostgreSQL; only published rows appear publicly. Paste a YouTube URL when creating a practice to save its provider and video ID with the draft. A blank cover uses its YouTube thumbnail.

For a new database, seed practices first, then run `pnpm db:seed:programs`. This creates the program table and imports the original sample programs without replacing existing rows. See [GUIDE.md](GUIDE.md#8-instructor-cms) for publishing, deletion and test commands.
