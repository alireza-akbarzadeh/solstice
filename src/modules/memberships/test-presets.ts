// Account states the test panel can switch to. Client-safe (no server imports).
export const membershipPresets = ["none", "trial", "active", "canceling", "pastDue", "expired"] as const;
export type MembershipPreset = (typeof membershipPresets)[number];
