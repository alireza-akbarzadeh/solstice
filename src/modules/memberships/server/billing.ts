import { randomBytes } from "node:crypto";

import { and, desc, eq, gte, sql } from "drizzle-orm";

import type { Locale } from "@/i18n/routing";
import { providerFor, RefundUnsupportedError, type Charge, type PaymentEvent, type PaymentProvider } from "@/infrastructure/payment";
import { db } from "@/server/db";
import { checkouts, membershipPlans, memberships, paymentEvents, payments, user } from "@/server/db/schema";

import { addBillingPeriod, addDays } from "../plans";

export type Checkout = typeof checkouts.$inferSelect;
export type Payment = typeof payments.$inferSelect;
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

// ── Checkouts ────────────────────────────────────────────────────────────────────────

export async function createCheckout(input: {
  userId: string;
  plan: { id: string; price: number; intervalMonths: number; trialDays: number };
  currency: string;
  provider: string;
  locale: Locale;
  nextPath: string;
  /** Pays the next period of the member's current membership instead of starting one. */
  renewal?: boolean;
}) {
  const id = `co_${randomBytes(12).toString("hex")}`;
  const [row] = await db
    .insert(checkouts)
    .values({
      id,
      userId: input.userId,
      planId: input.plan.id,
      provider: input.provider,
      amount: input.plan.price,
      currency: input.currency,
      intervalMonths: input.plan.intervalMonths,
      trialDays: input.renewal ? 0 : input.plan.trialDays,
      renewal: input.renewal ?? false,
      locale: input.locale,
      nextPath: input.nextPath,
    })
    .returning();
  return row!;
}

export async function setCheckoutReference(id: string, reference: string) {
  await db.update(checkouts).set({ providerReference: reference }).where(eq(checkouts.id, id));
}

export async function getCheckout(id: string) {
  const [row] = await db.select().from(checkouts).where(eq(checkouts.id, id)).limit(1);
  return row ?? null;
}

// ── Events ───────────────────────────────────────────────────────────────────────────

/**
 * Applies what a provider reported. Each event runs in its own transaction together with its
 * row in solstice_payment_event, so an event seen before is skipped and a failed one can be
 * retried by the provider.
 */
export async function applyPaymentEvents(provider: string, events: PaymentEvent[]) {
  for (const event of events) {
    await db.transaction(async (tx) => {
      const [fresh] = await tx
        .insert(paymentEvents)
        .values({ provider, eventId: event.id, type: event.type, payload: event })
        .onConflictDoNothing()
        .returning({ id: paymentEvents.eventId });
      if (!fresh) return;
      await applyEvent(tx, provider, event);
    });
  }
}

async function membershipBySubscription(tx: Tx, provider: string, subscriptionId: string) {
  const [row] = await tx
    .select()
    .from(memberships)
    .where(and(eq(memberships.provider, provider), eq(memberships.providerSubscriptionId, subscriptionId)))
    .limit(1);
  return row ?? null;
}

async function recordCharge(
  tx: Tx,
  input: { userId: string; provider: string; charge: Charge; planId: string; kind: "first" | "renewal"; checkoutId?: string; periodStart: Date; periodEnd: Date },
) {
  const [owner] = await tx.select({ email: user.email }).from(user).where(eq(user.id, input.userId)).limit(1);
  await tx
    .insert(payments)
    .values({
      userId: input.userId,
      email: owner?.email ?? "",
      checkoutId: input.checkoutId,
      provider: input.provider,
      providerPaymentId: input.charge.providerPaymentId,
      planId: input.planId,
      kind: input.kind,
      amount: input.charge.amount,
      currency: input.charge.currency,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
    })
    .onConflictDoNothing();
}

async function applyEvent(tx: Tx, provider: string, event: PaymentEvent) {
  const now = new Date();
  switch (event.type) {
    case "checkout.completed": {
      const [checkout] = await tx.select().from(checkouts).where(eq(checkouts.id, event.checkoutId)).limit(1);
      if (checkout?.provider !== provider || checkout.status === "completed") return;
      if (checkout.renewal) return renewByCheckout(tx, provider, checkout, event.charge, now);
      // With a free trial nothing is charged yet; otherwise the first period is paid now.
      const trialEndsAt = !event.charge && checkout.trialDays > 0 ? addDays(now, checkout.trialDays) : null;
      const periodEnd = trialEndsAt ?? addBillingPeriod(now, checkout.intervalMonths);
      const values = {
        plan: checkout.planId,
        status: trialEndsAt ? ("trialing" as const) : ("active" as const),
        provider,
        providerSubscriptionId: event.subscriptionId ?? `${provider}_${checkout.id}`,
        trialEndsAt,
        currentPeriodEnd: periodEnd,
        // Nothing is set to end: with a provider that doesn't renew by itself (Zarinpal) the
        // member renews by hand, which the UI derives from the provider (renewsByHand).
        cancelAtPeriodEnd: false,
        renewalReminderFor: null,
      };
      await tx.insert(memberships).values({ userId: checkout.userId, ...values }).onConflictDoUpdate({ target: memberships.userId, set: values });
      if (event.charge) {
        await recordCharge(tx, {
          userId: checkout.userId,
          provider,
          charge: event.charge,
          planId: checkout.planId,
          kind: "first",
          checkoutId: checkout.id,
          periodStart: now,
          periodEnd,
        });
      }
      await tx.update(checkouts).set({ status: "completed", completedAt: now }).where(eq(checkouts.id, checkout.id));
      return;
    }
    case "checkout.failed": {
      await tx
        .update(checkouts)
        .set({ status: "failed", completedAt: now })
        .where(and(eq(checkouts.id, event.checkoutId), eq(checkouts.status, "open")));
      return;
    }
    case "payment.succeeded": {
      const membership = await membershipBySubscription(tx, provider, event.subscriptionId);
      if (!membership) return;
      // A renewal continues from the paid-through date, or from now if it had lapsed.
      const start = membership.currentPeriodEnd > now ? membership.currentPeriodEnd : now;
      const [plan] = await tx
        .select({ intervalMonths: membershipPlans.intervalMonths })
        .from(membershipPlans)
        .where(eq(membershipPlans.id, membership.plan))
        .limit(1);
      const periodEnd = event.periodEnd ?? addBillingPeriod(start, plan?.intervalMonths ?? 1);
      await tx.update(memberships).set({ status: "active", currentPeriodEnd: periodEnd }).where(eq(memberships.id, membership.id));
      await recordCharge(tx, {
        userId: membership.userId,
        provider,
        charge: event.charge,
        planId: membership.plan,
        kind: "renewal",
        periodStart: start,
        periodEnd,
      });
      return;
    }
    case "payment.failed": {
      const membership = await membershipBySubscription(tx, provider, event.subscriptionId);
      if (membership) await tx.update(memberships).set({ status: "past_due" }).where(eq(memberships.id, membership.id));
      return;
    }
    case "subscription.ended": {
      const membership = await membershipBySubscription(tx, provider, event.subscriptionId);
      if (membership) await tx.update(memberships).set({ status: "canceled", cancelAtPeriodEnd: false }).where(eq(memberships.id, membership.id));
      return;
    }
    case "payment.refunded": {
      const [payment] = await tx
        .select()
        .from(payments)
        .where(and(eq(payments.provider, provider), eq(payments.providerPaymentId, event.providerPaymentId)))
        .limit(1);
      if (!payment) return;
      const refunded = Math.min(payment.amount, payment.refundedAmount + event.amount);
      await tx
        .update(payments)
        .set({ refundedAmount: refunded, status: refunded >= payment.amount ? "refunded" : "partially_refunded", refundedAt: now })
        .where(eq(payments.id, payment.id));
      return;
    }
  }
}

/**
 * A paid renewal checkout: the next period starts where the current one ends (or now, if it has
 * lapsed), so renewing early never loses days.
 */
async function renewByCheckout(tx: Tx, provider: string, checkout: Checkout, charge: Charge | null, now: Date) {
  const [membership] = await tx.select().from(memberships).where(eq(memberships.userId, checkout.userId)).limit(1);
  const start = membership && membership.currentPeriodEnd > now ? membership.currentPeriodEnd : now;
  const periodEnd = addBillingPeriod(start, checkout.intervalMonths);
  const values = {
    plan: checkout.planId,
    status: "active" as const,
    provider,
    providerSubscriptionId: membership?.providerSubscriptionId ?? `${provider}_${checkout.id}`,
    trialEndsAt: null,
    currentPeriodEnd: periodEnd,
    cancelAtPeriodEnd: false,
    renewalReminderFor: null,
  };
  await tx.insert(memberships).values({ userId: checkout.userId, ...values }).onConflictDoUpdate({ target: memberships.userId, set: values });
  if (charge) {
    await recordCharge(tx, {
      userId: checkout.userId,
      provider,
      charge,
      planId: checkout.planId,
      kind: "renewal",
      checkoutId: checkout.id,
      periodStart: start,
      periodEnd,
    });
  }
  await tx.update(checkouts).set({ status: "completed", completedAt: now }).where(eq(checkouts.id, checkout.id));
}

// ── Reading the ledger ───────────────────────────────────────────────────────────────

export async function getMemberPayments(userId: string) {
  return db.select().from(payments).where(eq(payments.userId, userId)).orderBy(desc(payments.createdAt)).limit(100);
}

export async function getPayment(id: number) {
  const [row] = await db.select().from(payments).where(eq(payments.id, id)).limit(1);
  return row ?? null;
}

export async function listPayments(limit = 50) {
  return db.select().from(payments).orderBy(desc(payments.createdAt)).limit(limit);
}

/** Money collected per calendar month (UTC), net of refunds, for the last `months` months. */
export async function getCollectedByMonth(months: number) {
  const since = new Date();
  since.setUTCDate(1);
  since.setUTCHours(0, 0, 0, 0);
  since.setUTCMonth(since.getUTCMonth() - (months - 1));
  const month = sql<string>`to_char(${payments.createdAt} at time zone 'UTC', 'YYYY-MM')`;
  const rows = await db
    .select({
      month,
      currency: payments.currency,
      gross: sql<string>`sum(${payments.amount})`,
      refunded: sql<string>`sum(${payments.refundedAmount})`,
      count: sql<number>`count(*)::int`,
    })
    .from(payments)
    .where(gte(payments.createdAt, since))
    .groupBy(month, payments.currency);
  return rows.map((r) => ({ ...r, gross: Number(r.gross), refunded: Number(r.refunded), net: Number(r.gross) - Number(r.refunded) }));
}

// ── Refunds (studio) ─────────────────────────────────────────────────────────────────

export type RefundResult = { ok: true } | { ok: false; error: "notFound" | "alreadyRefunded" | "unsupported" | "manual" };

/**
 * Refunds what is left of a payment through the provider that took it. `endAccess` also ends
 * the membership now, for "refund and close"; otherwise access runs to the paid-through date.
 */
export async function refundPayment(id: number, endAccess: boolean): Promise<RefundResult> {
  const payment = await getPayment(id);
  if (!payment) return { ok: false, error: "notFound" };
  const remaining = payment.amount - payment.refundedAmount;
  if (remaining <= 0) return { ok: false, error: "alreadyRefunded" };
  const provider: PaymentProvider | undefined = providerFor(payment.provider);
  if (!provider) return { ok: false, error: "unsupported" };

  let events: PaymentEvent[];
  try {
    events = await provider.refund({ providerPaymentId: payment.providerPaymentId, amount: remaining, currency: payment.currency });
  } catch (error) {
    if (error instanceof RefundUnsupportedError) return { ok: false, error: "manual" };
    throw error;
  }
  await applyPaymentEvents(provider.id, events);
  if (endAccess && payment.userId) {
    await db
      .update(memberships)
      .set({ status: "canceled", cancelAtPeriodEnd: false, currentPeriodEnd: new Date() })
      .where(eq(memberships.userId, payment.userId));
  }
  return { ok: true };
}
