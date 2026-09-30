import { HeartIcon, MegaphoneIcon, PinIcon, ReplyIcon } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { hasLocale } from "next-intl";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { routing } from "@/i18n/routing";
import { isPushConfigured } from "@/infrastructure/push/web-push";
import { AnnouncementComposer } from "@/modules/instructor/components/announcement-composer";
import { StudioPageHeader } from "@/modules/instructor/components/studio-page-header";
import { listAnnouncements } from "@/modules/instructor/server/posts";
import { getSubscriptionCount } from "@/modules/notifications/server/subscriptions";
import { requireInstructor } from "@/modules/memberships/server/viewer";

export async function generateMetadata({ params }: PageProps<"/[locale]/instructor/posts">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "Studio.posts" });
  return { title: t("metaTitle"), robots: { index: false } };
}

// No Stitch screen. An announcement is a circle post by the instructor; pinning it makes it
// the week's intention the member area shows at the top of /community.
export default async function StudioPostsPage({ params }: PageProps<"/[locale]/instructor/posts">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  await requireInstructor(locale, "/instructor/posts");
  const canPush = isPushConfigured();
  const [t, format, posts, devices] = await Promise.all([
    getTranslations("Studio.posts"),
    getFormatter(),
    listAnnouncements(),
    canPush ? getSubscriptionCount() : Promise.resolve(0),
  ]);

  return (
    <div className="flex flex-col gap-space-lg">
      <StudioPageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        lede={canPush ? t("lede", { devices }) : t("ledeNoPush")}
      />

      <div className="grid grid-cols-1 items-start gap-gutter xl:grid-cols-12">
        <div className="xl:col-span-7">
          <AnnouncementComposer canPush={canPush} />
        </div>

        <section className="flex flex-col gap-space-md xl:col-span-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-headline-sm text-headline-sm text-on-surface">{t("history")}</h2>
            <Badge variant="outline">{t("count", { count: posts.length })}</Badge>
          </div>

          {posts.length === 0 ? (
            <Empty className="rounded-xl bg-surface-container-low">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <MegaphoneIcon />
                </EmptyMedia>
                <EmptyTitle className="font-headline-sm text-headline-sm">{t("emptyTitle")}</EmptyTitle>
                <EmptyDescription>{t("emptyBody")}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <ul className="flex flex-col gap-space-sm">
              {posts.map((post) => (
                <li key={post.id} className="rounded-xl bg-surface-container-low p-space-md shadow-sm">
                  <div className="mb-2 flex items-center gap-2.5">
                    {post.authorImage && (
                      <Image src={post.authorImage} alt="" width={32} height={32} className="size-8 rounded-full object-cover" unoptimized />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-label-md text-label-md text-on-surface">{post.authorName}</p>
                      <p className="font-label-sm text-label-sm text-outline">{format.relativeTime(post.createdAt, new Date())}</p>
                    </div>
                    {post.pinned && (
                      <Badge className="shrink-0 gap-1">
                        <PinIcon />
                        {t("pinned")}
                      </Badge>
                    )}
                  </div>
                  <p dir="auto" className="font-body-md text-body-md whitespace-pre-line text-on-surface">
                    {post.body}
                  </p>
                  <div className="mt-2.5 flex items-center gap-4 font-label-sm text-label-sm text-on-surface-variant">
                    <span className="flex items-center gap-1.5">
                      <HeartIcon className="size-3.5" />
                      {format.number(post.likes)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <ReplyIcon className="size-3.5" />
                      {format.number(post.replies)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
