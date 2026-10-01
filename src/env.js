import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here.
   * This ensures the app isn't built with invalid environment variables.
   */
  server: {
    BETTER_AUTH_SECRET:
      process.env.NODE_ENV === "production"
        ? z.string().min(1)
        : z.string().optional(),

    BETTER_AUTH_API_KEY: z.string().min(1),

    BETTER_AUTH_URL: z.string().url(),

    BETTER_AUTH_GOOGLE_CLIENT_ID: z.string().optional(),

    BETTER_AUTH_GOOGLE_CLIENT_SECRET: z.string().optional(),

    BETTER_AUTH_GITHUB_CLIENT_ID: z.string().optional(),

    BETTER_AUTH_GITHUB_CLIENT_SECRET: z.string().optional(),

    // Which PaymentProvider handles checkout. "mock" grants memberships without charging.
    PAYMENT_PROVIDER: z.enum(["mock"]).default("mock"),

    // Which EmailProvider sends mail. "outbox" stores messages for the test mailbox instead.
    EMAIL_PROVIDER: z.enum(["outbox"]).default("outbox"),

    // Which VideoProvider serves practice video. "mock" plays a media URL with our own
    // player; "youtube"/"aparat" embed the platform's player. None of them can gate
    // members-only video — that needs a paid provider with signed URLs.
    VIDEO_PROVIDER: z.enum(["mock", "youtube", "aparat"]).default("mock"),

    // Stand-in video used by the "mock" provider when a practice has none attached.
    MOCK_VIDEO_URL: z.string().url().optional(),

    DATABASE_URL: z.string().url(),

    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),

    // Web Push (VAPID). Push is disabled when these are unset.
    VAPID_PRIVATE_KEY: z.string().optional(),
    VAPID_SUBJECT: z.string().optional(),
  },

  /**
   * Specify your client-side environment variables schema here.
   * Variables exposed to the client must use the NEXT_PUBLIC_ prefix.
   */
  client: {
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().optional(),

    // One id per deployment, injected by next.config.js. The service worker is registered as
    // /sw.js?v=<id>, which is what makes a new deployment visible to an installed PWA.
    NEXT_PUBLIC_BUILD_ID: z.string().default("development"),
  },

  /**
   * Runtime environment variables.
   */
  runtimeEnv: {
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,

    BETTER_AUTH_API_KEY: process.env.BETTER_AUTH_API_KEY,

    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,

    BETTER_AUTH_GOOGLE_CLIENT_ID: process.env.BETTER_AUTH_GOOGLE_CLIENT_ID,

    BETTER_AUTH_GOOGLE_CLIENT_SECRET:
      process.env.BETTER_AUTH_GOOGLE_CLIENT_SECRET,

    BETTER_AUTH_GITHUB_CLIENT_ID: process.env.BETTER_AUTH_GITHUB_CLIENT_ID,

    BETTER_AUTH_GITHUB_CLIENT_SECRET:
      process.env.BETTER_AUTH_GITHUB_CLIENT_SECRET,

    PAYMENT_PROVIDER: process.env.PAYMENT_PROVIDER,

    EMAIL_PROVIDER: process.env.EMAIL_PROVIDER,

    VIDEO_PROVIDER: process.env.VIDEO_PROVIDER,

    MOCK_VIDEO_URL: process.env.MOCK_VIDEO_URL,

    DATABASE_URL: process.env.DATABASE_URL,

    NODE_ENV: process.env.NODE_ENV,

    VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY,

    VAPID_SUBJECT: process.env.VAPID_SUBJECT,

    NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,

    NEXT_PUBLIC_BUILD_ID: process.env.NEXT_PUBLIC_BUILD_ID,
  },

  /**
   * Skip environment validation when explicitly requested.
   * Useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,

  /**
   * Treat empty strings as undefined.
   */
  emptyStringAsUndefined: true,
});
