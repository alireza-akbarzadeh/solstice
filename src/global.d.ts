import type { Locale } from "@/i18n/routing";
import type en from "../messages/en.json";

type Messages = typeof en;

declare global {
  // Used by src/i18n/request.ts for the dynamic messages import.
  type Messages = typeof en;
}

declare module "next-intl" {
  interface AppConfig {
    Locale: Locale;
    Messages: Messages;
  }
}
