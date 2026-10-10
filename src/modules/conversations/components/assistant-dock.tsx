import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { unstable_rethrow } from "next/navigation";

import { testModeEnabled } from "@/modules/memberships/server/test-mode";
import { getViewer } from "@/modules/memberships/server/viewer";

import { getStudioContact } from "@/modules/contact/server/contact";

import { countUnreadForMember, getThread, latestAssistantConversation } from "../server/conversations";
import { getChatSettings } from "../server/settings";
import { chatOwner } from "../server/visitor";
import { AssistantWidget } from "./assistant-widget";

/**
 * Quick help in the corner of public and member pages. Shown while the assistant is on, or
 * while this visitor has a chat a person is answering (so the reply still reaches them).
 */
export async function AssistantDock() {
  try {
    const [viewer, settings, tBrand, raised, contact] = await Promise.all([
      getViewer(),
      getChatSettings(),
      getTranslations("Brand"),
      testModeEnabled(),
      getStudioContact(),
    ]);
    if (viewer.user?.role === "instructor") return null;
    const { owner } = await chatOwner(viewer);
    const current = owner ? await latestAssistantConversation(owner) : null;
    if (!settings.assistantOn && (!current || current.status === "open")) return null;

    let unread = false;
    if (viewer.user) unread = (await countUnreadForMember(viewer.user.id, "assistant")) > 0;
    else if (current) unread = (await getThread(current, current.locale as "en", "member")).unread;

    const telegramUrl = contact.socials.find((s) => s.network === "telegram")?.url ?? "https://t.me/solstice_yoga";
    const instagramUrl = contact.socials.find((s) => s.network === "instagram")?.url ?? "https://instagram.com/solstice_yoga";

    return (
      <Suspense>
        <AssistantWidget
          instructorName={tBrand("instructor")}
          signedIn={!!viewer.user}
          unread={unread}
          raised={raised}
          telegramUrl={telegramUrl}
          instagramUrl={instagramUrl}
        />
      </Suspense>
    );
  } catch (error) {
    // Next signals "this page reads the request" by throwing; let that through.
    unstable_rethrow(error);
    // No conversations table yet (migration not run): no widget, page unaffected.
    console.error("Quick help could not load.", error);
    return null;
  }
}
