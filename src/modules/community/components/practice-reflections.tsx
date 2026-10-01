import { getFormatter } from "next-intl/server";

import type { Viewer } from "@/modules/memberships/server/viewer";
import type { PracticeDetail } from "@/modules/practices/types";

import { reflectAccess } from "../server/access";
import { getPracticeReflections } from "../server/reflections";
import type { Reflection } from "../types";
import { ReflectionsPanel, type ReflectionView } from "./reflections-panel";

// "Practice Reflections & Inquiries" beside the player (Stitch: practice-detail-player-desktop).
export async function PracticeReflections({
  practice,
  viewer,
  signInHref,
  membershipHref,
}: {
  practice: PracticeDetail;
  viewer: Viewer;
  signInHref: string;
  membershipHref: string;
}) {
  const reader = viewer.user
    ? { id: viewer.user.id, isInstructor: viewer.user.role === "instructor" }
    : null;
  const [reflections, format] = await Promise.all([
    getPracticeReflections(practice.slug, reader),
    getFormatter(),
  ]);
  const now = new Date();

  const chapterAt = (seconds: number) =>
    practice.chapters.reduce<string | null>(
      (found, c) => (c.startSeconds <= seconds ? c.title : found),
      null,
    );

  const toView = (r: Reflection): ReflectionView => ({
    practice: { slug: practice.slug, title: practice.title },
    id: r.id,
    author: r.author,
    body: r.body,
    tag: r.tag,
    atSeconds: r.atSeconds,
    atChapter: r.atSeconds === null ? null : chapterAt(r.atSeconds),
    private: r.visibility === "private",
    pinned: r.pinned,
    hidden: r.hidden,
    ago: format.relativeTime(r.createdAt, now),
    likes: r.likes,
    liked: r.likedByViewer,
    canDelete: !!reader && (reader.isInstructor || reader.id === r.author.id),
    replies: r.replies.map(toView),
  });

  return (
    <ReflectionsPanel
      practiceSlug={practice.slug}
      reflections={reflections.map(toView)}
      total={reflections.reduce((n, r) => n + 1 + r.replies.length, 0)}
      access={reflectAccess(practice, viewer)}
      isInstructor={!!reader?.isInstructor}
      signInHref={signInHref}
      membershipHref={membershipHref}
    />
  );
}
