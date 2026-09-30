import { dash } from "@better-auth/infra";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";

import { env } from "@/env";
import { sendAuthEmail } from "@/modules/auth/server/emails";
import { db } from "@/server/db";

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    autoSignIn: true,
    // Verification is sent but not required to sign in: members can practice right away.
    requireEmailVerification: false,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => sendAuthEmail("reset", user, url),
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => sendAuthEmail("verify", user, url),
  },
  session: {
    // "Keep me signed in" = 30 days; unchecked sign-ins get a browser-session cookie.
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },
  user: {
    // Members can close their account from /profile (password confirmed). App rows cascade.
    deleteUser: { enabled: true },
    additionalFields: {
      // Never settable from sign-up; promote instructors in the database.
      role: { type: "string", defaultValue: "member", input: false },
      practiceRhythm: { type: "string", required: false, input: true },
      marketingOptIn: { type: "boolean", defaultValue: false, input: true },
    },
  },
  socialProviders: {
    // Each provider is enabled only once both of its OAuth credentials are set.
    ...(env.BETTER_AUTH_GOOGLE_CLIENT_ID && env.BETTER_AUTH_GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: env.BETTER_AUTH_GOOGLE_CLIENT_ID,
            clientSecret: env.BETTER_AUTH_GOOGLE_CLIENT_SECRET,
          },
        }
      : {}),
    ...(env.BETTER_AUTH_GITHUB_CLIENT_ID && env.BETTER_AUTH_GITHUB_CLIENT_SECRET
      ? {
          github: {
            clientId: env.BETTER_AUTH_GITHUB_CLIENT_ID,
            clientSecret: env.BETTER_AUTH_GITHUB_CLIENT_SECRET,
          },
        }
      : {}),
  },
  plugins: [
    // Better Auth Dash (dashboard + analytics); reads BETTER_AUTH_API_KEY.
    dash({ apiKey: env.BETTER_AUTH_API_KEY }),
    // Lets server actions set auth cookies. Must stay last.
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;

/** Social providers that are configured, for rendering sign-in buttons. */
export const enabledSocialProviders = (["google", "github"] as const).filter((p) =>
  p === "google"
    ? !!(env.BETTER_AUTH_GOOGLE_CLIENT_ID && env.BETTER_AUTH_GOOGLE_CLIENT_SECRET)
    : !!(env.BETTER_AUTH_GITHUB_CLIENT_ID && env.BETTER_AUTH_GITHUB_CLIENT_SECRET),
);
export type SocialProvider = (typeof enabledSocialProviders)[number];
