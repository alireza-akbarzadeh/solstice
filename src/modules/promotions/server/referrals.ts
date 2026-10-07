import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/server/db";
import { referrals, user } from "@/server/db/schema";
import { grantAccess } from "@/modules/instructor/server/members";
import type { MemberReferralSummary, Referral } from "../types";

export function getReferralCodeForUser(userId: string): string {
  // Deterministic clean referral code from user ID
  const clean = userId.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  return `ARTE-${clean.slice(0, 6)}`;
}

export async function getMemberReferralSummary(userId: string): Promise<MemberReferralSummary> {
  const referralCode = getReferralCodeForUser(userId);

  const rows = await db
    .select()
    .from(referrals)
    .where(eq(referrals.referrerId, userId));

  const totalInvited = rows.length;
  const totalRewarded = rows.filter((r) => r.status === "rewarded").length;
  const freeMonthsEarned = totalRewarded;

  return {
    referralCode,
    referralLink: `/membership?ref=${referralCode}`,
    totalInvited,
    totalRewarded,
    freeMonthsEarned,
  };
}

export async function findReferrerByCode(code: string): Promise<string | null> {
  const normalized = code.trim().toUpperCase();
  // Check all users whose generated referral code matches, or query referrals
  const users = await db.select({ id: user.id }).from(user);
  for (const u of users) {
    if (getReferralCodeForUser(u.id) === normalized) {
      return u.id;
    }
  }
  return null;
}

export async function recordReferral(
  referralCode: string,
  referredUserId: string,
): Promise<boolean> {
  const referrerId = await findReferrerByCode(referralCode);
  if (!referrerId || referrerId === referredUserId) {
    return false;
  }

  try {
    await db
      .insert(referrals)
      .values({
        referrerId,
        referredUserId,
        referralCode: referralCode.trim().toUpperCase(),
        status: "pending",
      })
      .onConflictDoNothing();
    return true;
  } catch (err) {
    console.error("Failed to record referral:", err);
    return false;
  }
}

export async function rewardReferralIfEligible(
  referredUserId: string,
  planId = "monthly",
): Promise<boolean> {
  const [existing] = await db
    .select()
    .from(referrals)
    .where(eq(referrals.referredUserId, referredUserId))
    .limit(1);

  if (!existing || existing.status === "rewarded") {
    return false;
  }

  try {
    // Reward referrer with 1 free month via comped pass
    await grantAccess(existing.referrerId, planId, 1);

    // Update referral status to rewarded
    await db
      .update(referrals)
      .set({
        status: "rewarded",
        rewardedAt: new Date(),
      })
      .where(eq(referrals.id, existing.id));

    return true;
  } catch (err) {
    console.error("Failed to reward referral:", err);
    return false;
  }
}

export async function listStudioReferrals(): Promise<{
  referrals: Referral[];
  stats: {
    totalReferrals: number;
    totalRewarded: number;
    activeReferrers: number;
  };
}> {
  const rows = await db
    .select({
      id: referrals.id,
      referrerId: referrals.referrerId,
      referrerName: sql<string | null>`(SELECT name FROM "user" WHERE id = ${referrals.referrerId})`,
      referrerEmail: sql<string | null>`(SELECT email FROM "user" WHERE id = ${referrals.referrerId})`,
      referredUserId: referrals.referredUserId,
      referredUserName: sql<string | null>`(SELECT name FROM "user" WHERE id = ${referrals.referredUserId})`,
      referredUserEmail: sql<string | null>`(SELECT email FROM "user" WHERE id = ${referrals.referredUserId})`,
      referralCode: referrals.referralCode,
      status: referrals.status,
      rewardedAt: referrals.rewardedAt,
      createdAt: referrals.createdAt,
    })
    .from(referrals)
    .orderBy(desc(referrals.createdAt));

  const totalReferrals = rows.length;
  const totalRewarded = rows.filter((r) => r.status === "rewarded").length;
  const uniqueReferrers = new Set(rows.map((r) => r.referrerId));

  return {
    referrals: rows,
    stats: {
      totalReferrals,
      totalRewarded,
      activeReferrers: uniqueReferrers.size,
    },
  };
}
