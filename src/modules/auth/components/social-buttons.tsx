"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { getPathname } from "@/i18n/navigation";
import type { SocialProvider } from "@/server/better-auth/config";
import { authClient } from "@/server/better-auth/client";

const GoogleIcon = () => (
  <svg aria-hidden className="size-4" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" fill="#34A853" />
    <path d="M5.84 14.09a6.6 6.6 0 0 1 0-4.18V7.07H2.18a11 11 0 0 0 0 9.86z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A11 11 0 0 0 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" fill="#EA4335" />
  </svg>
);

const GitHubIcon = () => (
  <svg aria-hidden className="size-4 fill-current" viewBox="0 0 24 24">
    <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.87-1.37-3.87-1.37-.53-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.42-2.7 5.39-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5z" />
  </svg>
);

const icons: Record<SocialProvider, () => React.JSX.Element> = { google: GoogleIcon, github: GitHubIcon };

// OAuth returns to `next` (a locale-less path) in the current locale.
export function SocialButtons({ providers, next }: { providers: SocialProvider[]; next: string }) {
  const t = useTranslations("Auth");
  const locale = useLocale();
  const [pending, setPending] = useState<SocialProvider | null>(null);

  if (providers.length === 0) return null;

  const signIn = async (provider: SocialProvider) => {
    setPending(provider);
    const { error } = await authClient.signIn.social({
      provider,
      callbackURL: getPathname({ href: next, locale }),
    });
    if (error) {
      setPending(null);
      toast.error(t("errors.generic"));
    }
  };

  return (
    <div className={providers.length > 1 ? "grid grid-cols-2 gap-3" : "grid grid-cols-1"}>
      {providers.map((provider) => {
        const Icon = icons[provider];
        return (
          <button
            key={provider}
            type="button"
            onClick={() => signIn(provider)}
            disabled={pending !== null}
            className="group flex items-center justify-center gap-2.5 rounded-lg bg-surface-container px-4 py-3 font-label-md text-label-md text-on-surface transition-all hover:bg-surface-container-high disabled:opacity-60"
          >
            <Icon />
            {t(provider)}
          </button>
        );
      })}
    </div>
  );
}
