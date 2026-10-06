import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { cache } from "react";

import { db } from "@/server/db";
import { liveClasses, liveClassRsvps, user } from "@/server/db/schema";
import type { LiveClass, LiveClassRsvp, LiveClassStatus } from "../types";

export const getLiveClasses = cache(
  async (options?: { status?: LiveClassStatus; userId?: string }): Promise<LiveClass[]> => {
    try {
      const conditions = [];
      if (options?.status) {
        conditions.push(eq(liveClasses.status, options.status));
      }

      const rows = await db
        .select({
          class: liveClasses,
          rsvpCount: sql<number>`count(distinct ${liveClassRsvps.id})::int`,
          userHasRsvp: options?.userId
            ? sql<boolean>`bool_or(${liveClassRsvps.userId} = ${options.userId})`
            : sql<boolean>`false`,
        })
        .from(liveClasses)
        .leftJoin(liveClassRsvps, eq(liveClassRsvps.classId, liveClasses.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .groupBy(liveClasses.id)
        .orderBy(asc(liveClasses.scheduledAt));

      return rows.map(({ class: c, rsvpCount, userHasRsvp }) => ({
        ...c,
        rsvpCount: rsvpCount ?? 0,
        userHasRsvp: Boolean(userHasRsvp),
      }));
    } catch (err) {
      console.error("Failed to fetch live classes:", err);
      return [];
    }
  },
);

export const getUpcomingLiveClasses = cache(
  async (userId?: string): Promise<LiveClass[]> => {
    try {
      const rows = await db
        .select({
          class: liveClasses,
          rsvpCount: sql<number>`count(distinct ${liveClassRsvps.id})::int`,
          userHasRsvp: userId
            ? sql<boolean>`bool_or(${liveClassRsvps.userId} = ${userId})`
            : sql<boolean>`false`,
        })
        .from(liveClasses)
        .leftJoin(liveClassRsvps, eq(liveClassRsvps.classId, liveClasses.id))
        .where(inArray(liveClasses.status, ["scheduled", "live"]))
        .groupBy(liveClasses.id)
        .orderBy(asc(liveClasses.scheduledAt));

      return rows.map(({ class: c, rsvpCount, userHasRsvp }) => ({
        ...c,
        rsvpCount: rsvpCount ?? 0,
        userHasRsvp: Boolean(userHasRsvp),
      }));
    } catch (err) {
      console.error("Failed to fetch upcoming live classes:", err);
      return [];
    }
  },
);

export const getPastLiveClasses = cache(
  async (userId?: string): Promise<LiveClass[]> => {
    try {
      const rows = await db
        .select({
          class: liveClasses,
          rsvpCount: sql<number>`count(distinct ${liveClassRsvps.id})::int`,
          userHasRsvp: userId
            ? sql<boolean>`bool_or(${liveClassRsvps.userId} = ${userId})`
            : sql<boolean>`false`,
        })
        .from(liveClasses)
        .leftJoin(liveClassRsvps, eq(liveClassRsvps.classId, liveClasses.id))
        .where(eq(liveClasses.status, "completed"))
        .groupBy(liveClasses.id)
        .orderBy(desc(liveClasses.scheduledAt));

      return rows.map(({ class: c, rsvpCount, userHasRsvp }) => ({
        ...c,
        rsvpCount: rsvpCount ?? 0,
        userHasRsvp: Boolean(userHasRsvp),
      }));
    } catch (err) {
      console.error("Failed to fetch past live classes:", err);
      return [];
    }
  },
);

export const getLiveClassBySlug = cache(
  async (slug: string, userId?: string): Promise<LiveClass | null> => {
    try {
      const rows = await db
        .select({
          class: liveClasses,
          rsvpCount: sql<number>`count(distinct ${liveClassRsvps.id})::int`,
          userHasRsvp: userId
            ? sql<boolean>`bool_or(${liveClassRsvps.userId} = ${userId})`
            : sql<boolean>`false`,
        })
        .from(liveClasses)
        .leftJoin(liveClassRsvps, eq(liveClassRsvps.classId, liveClasses.id))
        .where(eq(liveClasses.slug, slug))
        .groupBy(liveClasses.id)
        .limit(1);

      const first = rows[0];
      if (!first) return null;
      const { class: c, rsvpCount, userHasRsvp } = first;
      return {
        ...c,
        rsvpCount: rsvpCount ?? 0,
        userHasRsvp: Boolean(userHasRsvp),
      };
    } catch (err) {
      console.error(`Failed to fetch live class ${slug}:`, err);
      return null;
    }
  },
);

export const getLiveClassById = cache(
  async (id: number, userId?: string): Promise<LiveClass | null> => {
    try {
      const rows = await db
        .select({
          class: liveClasses,
          rsvpCount: sql<number>`count(distinct ${liveClassRsvps.id})::int`,
          userHasRsvp: userId
            ? sql<boolean>`bool_or(${liveClassRsvps.userId} = ${userId})`
            : sql<boolean>`false`,
        })
        .from(liveClasses)
        .leftJoin(liveClassRsvps, eq(liveClassRsvps.classId, liveClasses.id))
        .where(eq(liveClasses.id, id))
        .groupBy(liveClasses.id)
        .limit(1);

      const first = rows[0];
      if (!first) return null;
      const { class: c, rsvpCount, userHasRsvp } = first;
      return {
        ...c,
        rsvpCount: rsvpCount ?? 0,
        userHasRsvp: Boolean(userHasRsvp),
      };
    } catch (err) {
      console.error(`Failed to fetch live class ${id}:`, err);
      return null;
    }
  },
);

export async function getClassRsvps(classId: number): Promise<LiveClassRsvp[]> {
  try {
    const rows = await db
      .select({
        id: liveClassRsvps.id,
        classId: liveClassRsvps.classId,
        userId: liveClassRsvps.userId,
        attended: liveClassRsvps.attended,
        createdAt: liveClassRsvps.createdAt,
        userName: user.name,
        userEmail: user.email,
        userImage: user.image,
      })
      .from(liveClassRsvps)
      .innerJoin(user, eq(user.id, liveClassRsvps.userId))
      .where(eq(liveClassRsvps.classId, classId))
      .orderBy(asc(liveClassRsvps.createdAt));

    return rows;
  } catch (err) {
    console.error(`Failed to fetch RSVPs for class ${classId}:`, err);
    return [];
  }
}
