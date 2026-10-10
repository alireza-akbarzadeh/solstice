import type { WorkshopRegistration } from "./types";

/** RFC 4180 CSV with a BOM so Excel opens Persian text and dates correctly. */
export function workshopAttendeesToCsv(
  rows: WorkshopRegistration[],
  _pageTitle?: string,
): string {
  const cell = (value: string) => {
    // Guard against spreadsheet formula injection from hostile content.
    const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
    return /[",\r\n]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe;
  };

  const lines = [
    ["id", "name", "email", "phone", "status", "notes", "registered_at"],
    ...rows.map((row) => [
      String(row.id),
      row.name,
      row.email,
      row.phone,
      row.status,
      row.notes || "",
      row.createdAt.toISOString(),
    ]),
  ];

  return `\uFEFF${lines.map((line) => line.map(cell).join(",")).join("\r\n")}\r\n`;
}
