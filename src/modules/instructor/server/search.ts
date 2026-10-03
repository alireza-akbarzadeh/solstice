import { desc, eq, ilike, or, sql, type AnyColumn } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/server/db";
import {
  comments,
  journalArticles,
  membershipPlans,
  newsletterSubscribers,
  practices,
  programs,
  sitePages,
  user,
} from "@/server/db/schema";

export type StudioSearchGroup =
  | "practices"
  | "programs"
  | "journal"
  | "pages"
  | "plans"
  | "members"
  | "reflections"
  | "subscribers";

export type StudioSearchStatus = "draft" | "published" | "active" | "hidden" | "pending" | "approved" | "rejected";

export type StudioSearchHit = {
  group: StudioSearchGroup;
  /** Stable key for the list. */
  id: string;
  title: string;
  /** Secondary text: an email, a reflection's author… */
  detail: string;
  /** Publishing or moderation state, translated by the palette. */
  status?: StudioSearchStatus;
  href: string;
};

const PER_GROUP = 5;

/** `%q%` with LIKE wildcards in the query escaped. */
const pattern = (q: string) => `%${q.replace(/[\\%_]/g, "\\$&")}%`;
/** Matches either language of a `{ en, fa }` jsonb column. */
const localizedLike = (column: AnyColumn | ReturnType<typeof sql>, like: string) =>
  or(sql`${column}->>'en' ilike ${like}`, sql`${column}->>'fa' ilike ${like}`);
/** The title in the reader's language, falling back to the other one when it is blank. */
const pick = (value: unknown, locale: string) => {
  const v = value as { en?: string; fa?: string } | null;
  const order = locale === "fa" ? [v?.fa, v?.en] : [v?.en, v?.fa];
  return order.find((text) => !!text?.trim()) ?? "";
};

/**
 * The studio command palette's search: one query fans out across every kind of content the
 * instructor manages and returns a few hits per kind, each linking straight to its editor.
 * Callers must check the reader is the instructor (see /api/instructor/search).
 */
export async function searchStudio(input: unknown, locale: string): Promise<StudioSearchHit[]> {
  const parsed = z.string().trim().min(2).max(100).safeParse(input);
  if (!parsed.success) return [];

  const like = pattern(parsed.data);
  const enc = encodeURIComponent;

  const [practiceRows, programRows, essayRows, pageRows, planRows, memberRows, reflectionRows, subscriberRows] = await Promise.all([
    db
      .select({ slug: practices.slug, title: practices.title, status: practices.status })
      .from(practices)
      .where(or(localizedLike(practices.title, like), ilike(practices.slug, like)))
      .limit(PER_GROUP),
    db
      .select({ slug: programs.slug, title: programs.title, status: programs.status })
      .from(programs)
      .where(or(localizedLike(programs.title, like), ilike(programs.slug, like)))
      .limit(PER_GROUP),
    db
      .select({ slug: journalArticles.slug, title: journalArticles.title, status: journalArticles.status })
      .from(journalArticles)
      .where(or(localizedLike(journalArticles.title, like), ilike(journalArticles.slug, like)))
      .limit(PER_GROUP),
    db
      .select({ slug: sitePages.slug, title: sql<unknown>`${sitePages.draftContent}->'title'`, published: sitePages.publishedAt })
      .from(sitePages)
      .where(or(localizedLike(sql`${sitePages.draftContent}->'title'`, like), ilike(sitePages.slug, like)))
      .limit(PER_GROUP),
    db
      .select({ id: membershipPlans.id, name: membershipPlans.name, status: membershipPlans.status })
      .from(membershipPlans)
      .where(or(localizedLike(membershipPlans.name, like), ilike(membershipPlans.id, like)))
      .limit(PER_GROUP),
    db
      .select({ id: user.id, name: user.name, email: user.email, role: user.role })
      .from(user)
      .where(or(ilike(user.name, like), ilike(user.email, like)))
      .orderBy(desc(user.createdAt))
      .limit(PER_GROUP),
    db
      .select({ id: comments.id, body: comments.body, status: comments.status, author: user.name })
      .from(comments)
      .innerJoin(user, eq(user.id, comments.userId))
      .where(ilike(comments.body, like))
      .orderBy(desc(comments.createdAt))
      .limit(PER_GROUP),
    db
      .select({ id: newsletterSubscribers.id, email: newsletterSubscribers.email })
      .from(newsletterSubscribers)
      .where(ilike(newsletterSubscribers.email, like))
      .limit(PER_GROUP),
  ]);

  return [
    ...practiceRows.map((r) => ({
      group: "practices" as const,
      id: `practice:${r.slug}`,
      title: pick(r.title, locale) || r.slug,
      detail: "",
      status: r.status,
      href: `/instructor/videos?edit=${enc(r.slug)}`,
    })),
    ...programRows.map((r) => ({
      group: "programs" as const,
      id: `program:${r.slug}`,
      title: pick(r.title, locale) || r.slug,
      detail: "",
      status: r.status,
      href: `/instructor/programs?edit=${enc(r.slug)}`,
    })),
    ...essayRows.map((r) => ({
      group: "journal" as const,
      id: `essay:${r.slug}`,
      title: pick(r.title, locale) || r.slug,
      detail: "",
      status: r.status,
      href: `/instructor/journal?edit=${enc(r.slug)}`,
    })),
    ...pageRows.map((r) => ({
      group: "pages" as const,
      id: `page:${r.slug}`,
      title: pick(r.title, locale) || r.slug,
      detail: "",
      status: r.published ? ("published" as const) : ("draft" as const),
      href: `/instructor/pages?edit=${enc(r.slug)}`,
    })),
    ...planRows.map((r) => ({
      group: "plans" as const,
      id: `plan:${r.id}`,
      title: pick(r.name, locale) || r.id,
      detail: "",
      status: r.status,
      href: `/instructor/plans?edit=${enc(r.id)}`,
    })),
    ...memberRows.map((r) => ({
      group: "members" as const,
      id: `member:${r.id}`,
      title: r.name,
      detail: r.email,
      href: `/instructor/members?member=${enc(r.id)}`,
    })),
    ...reflectionRows.map((r) => ({
      group: "reflections" as const,
      id: `reflection:${r.id}`,
      title: r.body.length > 90 ? `${r.body.slice(0, 90)}…` : r.body,
      detail: r.author,
      status: r.status,
      href: `/instructor/community?view=${r.status === "pending" ? "review" : r.status === "rejected" ? "rejected" : "all"}`,
    })),
    ...subscriberRows.map((r) => ({
      group: "subscribers" as const,
      id: `subscriber:${r.id}`,
      title: r.email,
      detail: "",
      href: `/instructor/subscribers?q=${enc(r.email)}`,
    })),
  ];
}
