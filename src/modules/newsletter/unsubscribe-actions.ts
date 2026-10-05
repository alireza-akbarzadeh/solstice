"use server";

import { getLocale } from "next-intl/server";

import { redirect } from "@/i18n/navigation";

import { unsubscribe, verifyUnsubscribe } from "./server/unsubscribe";

/** The reader confirmed on /unsubscribe; the signed link proves the address is theirs. */
export async function confirmUnsubscribe(formData: FormData) {
  const locale = await getLocale();
  const field = (name: string) => {
    const value = formData.get(name);
    return typeof value === "string" ? value : "";
  };
  const e = field("e");
  const t = field("t");
  const email = verifyUnsubscribe(e, t);
  if (email) await unsubscribe(email);
  return redirect({ href: { pathname: "/unsubscribe", query: { e, t, done: email ? "1" : "0" } }, locale });
}
