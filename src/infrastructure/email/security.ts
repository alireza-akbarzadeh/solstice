// Safe to import from client components (the studio's email form): no server code here.

export const smtpSecurities = ["ssl", "starttls", "none"] as const;
export type SmtpSecurity = (typeof smtpSecurities)[number];
