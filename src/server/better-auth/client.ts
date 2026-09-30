import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import type { auth } from "./config";

export const authClient = createAuthClient({
  // Types the app's user fields (role, practiceRhythm, marketingOptIn) on the client.
  plugins: [inferAdditionalFields<typeof auth>()],
});

export type Session = typeof authClient.$Infer.Session;
