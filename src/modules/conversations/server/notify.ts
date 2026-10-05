import { getTranslations } from "next-intl/server";

import { env } from "@/env";
import { getPathname } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { sendEmail } from "@/infrastructure/email";
import { isPushConfigured } from "@/infrastructure/push/web-push";
import { notifyUser, type Notification } from "@/modules/notifications/server/send";
import type { conversations } from "@/server/db/schema";

import { getStaff, getUserContact } from "./conversations";

// Telling people a conversation needs them: the studio when a question starts waiting, the
// member (or visitor, by email) when the studio replies. Push to signed-in devices, plus email.
// Failures are logged and never stop the message itself from being saved.

type Conversation = typeof conversations.$inferSelect;

const absolute = (href: string, locale: Locale) => new URL(getPathname({ href, locale }), env.BETTER_AUTH_URL).toString();

/** Where the member reads a conversation: the guidance room, or the quick-help chat reopened. */
const memberHref = (row: Conversation) => (row.kind === "guidance" ? `/guidance?c=${row.id}` : "/?chat=open");

const preview = (text: string) => (text.length > 160 ? `${text.slice(0, 157)}…` : text);

const notifyT = (locale: Locale) => getTranslations({ locale, namespace: "Conversations.notify" });

/** Push copy in every language; each device gets the one it subscribed in. */
async function pushCopy(build: (t: Awaited<ReturnType<typeof notifyT>>, locale: Locale) => Notification[Locale]): Promise<Notification> {
  const entries = await Promise.all(routing.locales.map(async (locale) => [locale, build(await notifyT(locale), locale)] as const));
  return Object.fromEntries(entries) as Notification;
}

/** A question is now waiting for the studio (new guidance thread, follow-up, or a visitor asking for a person). */
export async function notifyStaffWaiting(row: Conversation, body: string, from: string) {
  try {
    const staff = await getStaff();
    if (!staff.length) return;
    const kind = row.kind === "guidance" ? "guidance" : "assistant";
    const href = `/instructor/inbox?c=${row.id}`;
    if (isPushConfigured()) {
      const copy = await pushCopy((t, locale) => ({
        title: t(`staff.${kind}Title`, { name: from }),
        body: preview(body),
        url: getPathname({ href, locale }),
        tag: `conversation-${row.id}`,
      }));
      await Promise.all(staff.map((s) => notifyUser(s.id, copy).catch(() => undefined)));
    }
    const locale = routing.defaultLocale;
    const t = await notifyT(locale);
    const url = absolute(href, locale);
    await Promise.all(
      staff.map((s) =>
        sendEmail({
          to: s.email,
          subject: t(`staff.${kind}Title`, { name: from }),
          text: t("staff.email", { name: from, body: preview(body), url }),
          actionUrl: url,
        }).catch((error) => console.error("Inbox notice email failed.", error)),
      ),
    );
  } catch (error) {
    console.error("Could not notify the studio about a waiting conversation.", error);
  }
}

/** The instructor's name as the studio writes it in each language (Brand messages). */
const instructorIn = async (locale: Locale) => (await getTranslations({ locale, namespace: "Brand" }))("instructor");

/** The studio replied: the member (push + email) or the visitor (email, if they left one). */
export async function notifyMemberReply(row: Conversation, body: string) {
  try {
    const locale = (routing.locales as readonly string[]).includes(row.locale) ? (row.locale as Locale) : routing.defaultLocale;
    const href = memberHref(row);
    if (row.userId && isPushConfigured()) {
      const names = Object.fromEntries(await Promise.all(routing.locales.map(async (l) => [l, await instructorIn(l)] as const)));
      const copy = await pushCopy((t, l) => ({
        title: t("member.title", { name: names[l] ?? "" }),
        body: preview(body),
        url: getPathname({ href, locale: l }),
        tag: `conversation-${row.id}`,
      }));
      await notifyUser(row.userId, copy).catch(() => undefined);
    }
    const contact = row.userId ? await getUserContact(row.userId) : row.guestEmail ? { name: row.guestName ?? "", email: row.guestEmail } : null;
    if (!contact) return;
    const [t, instructorName] = await Promise.all([notifyT(locale), instructorIn(locale)]);
    const url = absolute(href, locale);
    await sendEmail({
      to: contact.email,
      subject: t("member.title", { name: instructorName }),
      text: t("member.email", { name: contact.name || t("member.friend"), instructor: instructorName, body: preview(body), url }),
      actionUrl: url,
    });
  } catch (error) {
    console.error("Could not notify the member about a reply.", error);
  }
}
