import type { Localized } from "@/lib/localized";

export type WorkshopRegistrationStatus =
  | "registered"
  | "waitlist"
  | "confirmed"
  | "canceled";

export type WorkshopLocationType = "in_person" | "online" | "hybrid";

export type WorkshopEventDetails = {
  enabled: boolean;
  startDate: string; // ISO string, e.g. "2026-11-20T10:00"
  endDate?: string; // optional ISO string, e.g. "2026-11-22T17:00"
  timezone: string; // e.g. "Asia/Tehran"
  locationType: WorkshopLocationType;
  location: Localized;
  capacity?: number | null; // null or 0 means unlimited
  priceLabel: Localized;
  paymentInstructions?: Localized;
  registrationOpen: boolean;
};

export type WorkshopRegistration = {
  id: number;
  pageSlug: string;
  userId: string | null;
  name: string;
  email: string;
  phone: string;
  status: WorkshopRegistrationStatus;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type WorkshopAttendeeStats = {
  total: number;
  registered: number;
  confirmed: number;
  waitlist: number;
  canceled: number;
  capacity: number | null;
  spotsRemaining: number | null;
  isFull: boolean;
};

export type WorkshopRegistrationInput = {
  pageSlug: string;
  name: string;
  email: string;
  phone: string;
  notes?: string;
};
