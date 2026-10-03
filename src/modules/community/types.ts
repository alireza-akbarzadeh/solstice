export const reflectionTags = [
  "epiphany",
  "breath",
  "release",
  "inquiry",
] as const;
export type ReflectionTag = (typeof reflectionTags)[number];

/** Tags that make a reflection a "somatic note" (as opposed to a question). */
export const somaticTags: ReflectionTag[] = ["epiphany", "breath", "release"];

export type ReflectionVisibility = "circle" | "private";

/** Moderation: members' circle reflections wait for the instructor before anyone else sees them. */
export const reflectionStatuses = ["pending", "approved", "rejected"] as const;
export type ReflectionStatus = (typeof reflectionStatuses)[number];

export type Reflection = {
  id: number;
  /** Null for posts made in the community circle itself. */
  practiceSlug: string | null;
  author: {
    id: string;
    name: string;
    image: string | null;
    isInstructor: boolean;
  };
  body: string;
  tag: ReflectionTag | null;
  atSeconds: number | null;
  visibility: ReflectionVisibility;
  pinned: boolean;
  /** Taken off the circle by the instructor; the author still sees their own. */
  hidden: boolean;
  status: ReflectionStatus;
  createdAt: Date;
  likes: number;
  likedByViewer: boolean;
  replies: Reflection[];
};
