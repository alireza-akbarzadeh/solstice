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

    DATABASE_URL: process.env.DATABASE_URL,

    NODE_ENV: process.env.NODE_ENV,

    VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY,

    VAPID_SUBJECT: process.env.VAPID_SUBJECT,

    NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
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
