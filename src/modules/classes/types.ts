import type { Localized } from "@/lib/localized";
import type { LiveClassAccess, LiveClassStatus } from "@/server/db/schema/classes";

export type { LiveClassAccess, LiveClassStatus };

export type LiveClass = {
  id: number;
  slug: string;
  status: LiveClassStatus;
  title: Localized;
  description: Localized;
  instructorName: Localized;
  locationName: Localized;
  scheduledAt: Date;
  durationMinutes: number;
  joinUrl: string;
  capacity: number | null;
  access: LiveClassAccess;
  replayPracticeSlug: string | null;
  coverImage: string;
  soundscapeDetails: string | null;
  rsvpCount?: number;
  userHasRsvp?: boolean;
  createdAt: Date;
  updatedAt: Date | null;
};

export type LiveClassRsvp = {
  id: number;
  classId: number;
  userId: string;
  userName?: string | null;
  userEmail?: string | null;
  userImage?: string | null;
  attended: boolean;
  createdAt: Date;
};
