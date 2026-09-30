// Same options as sign-up (auth/components/sign-up-form.tsx).
export const practiceRhythms = ["morning", "evening", "breath"] as const;
export type PracticeRhythm = (typeof practiceRhythms)[number];
