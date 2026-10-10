"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import { ClockIcon, LoaderCircleIcon, PlayIcon, Trash2Icon, XIcon } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Link } from "@/i18n/navigation";
import { getPlaylistDetailsAction, togglePlaylistItemAction } from "../actions";
import type { PlaylistWithPractices } from "../types";

export function PlaylistDetailDialog({
  playlistId,
  open,
  onOpenChange,
}: {
  playlistId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("Playlists");
  const tPractice = useTranslations("Practice");
  const locale = useLocale() as "en" | "fa";
  const router = useRouter();

  const [playlist, setPlaylist] = useState<PlaylistWithPractices | null>(null);
  const [loading, setLoading] = useState(false);
  const [removingSlug, setRemovingSlug] = useState<string | null>(null);
  const [, startRemove] = useTransition();

  useEffect(() => {
    if (open && playlistId) {
      setLoading(true);
      getPlaylistDetailsAction(playlistId, locale)
        .then((data) => setPlaylist(data))
        .finally(() => setLoading(false));
    } else {
      setPlaylist(null);
    }
  }, [open, playlistId, locale]);

  const handleRemoveItem = (practiceSlug: string) => {
    if (!playlistId) return;
    setRemovingSlug(practiceSlug);
    startRemove(async () => {
      await togglePlaylistItemAction(playlistId, practiceSlug, false);
      setPlaylist((prev) => {
        if (!prev) return null;
        const remaining = prev.practices.filter((p) => p.slug !== practiceSlug);
        const totalMinutes = remaining.reduce((acc, cur) => acc + cur.durationMinutes, 0);
        return {
          ...prev,
          practices: remaining,
          practicesCount: remaining.length,
          totalMinutes,
          previewImages: remaining.slice(0, 4).map((p) => p.image),
        };
      });
      setRemovingSlug(null);
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto p-space-lg sm:p-space-xl">
        <DialogHeader>
          <DialogTitle className="font-headline-md text-headline-md text-on-surface">
            {playlist ? playlist.title : t("loading")}
          </DialogTitle>
          {playlist?.description && (
            <DialogDescription className="font-body-md text-body-md text-on-surface-variant">
              {playlist.description}
            </DialogDescription>
          )}
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-space-2xl text-clay">
            <LoaderCircleIcon className="size-8 animate-spin" />
          </div>
        ) : !playlist || playlist.practices.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl bg-surface-container-low py-space-xl text-center">
            <p className="font-body-md text-body-md text-on-surface-variant">
              {t("emptyDetail")}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => onOpenChange(false)}
            >
              {t("close")}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-hairline pb-2 font-label-sm text-label-sm text-on-surface-variant">
              <span>{t("itemCount", { count: playlist.practicesCount })}</span>
              <span className="flex items-center gap-1 font-medium">
                <ClockIcon className="size-3.5 text-clay" />
                {t("minutesShort", { count: playlist.totalMinutes })}
              </span>
            </div>

            <ul className="divide-y divide-hairline overflow-hidden rounded-xl bg-surface-container-low">
              {playlist.practices.map((practice) => {
                const isRemoving = removingSlug === practice.slug;
                return (
                  <li
                    key={practice.slug}
                    className="flex items-center justify-between gap-3 p-3 transition-colors hover:bg-surface-container"
                  >
                    <Link
                      href={`/practices/${practice.slug}`}
                      onClick={() => onOpenChange(false)}
                      className="flex min-w-0 flex-1 items-center gap-3.5"
                    >
                      <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-md bg-surface-container-high">
                        <Image
                          src={practice.image}
                          alt=""
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-label-lg text-label-lg font-medium text-on-surface hover:text-primary">
                          {practice.title}
                        </p>
                        <p className="truncate font-body-sm text-body-sm text-on-surface-variant">
                          {practice.series ? `${practice.series} · ` : ""}{tPractice("minutes", { count: practice.durationMinutes })}
                        </p>
                      </div>
                    </Link>

                    <div className="flex shrink-0 items-center gap-1">
                      <Link
                        href={`/practices/${practice.slug}`}
                        onClick={() => onOpenChange(false)}
                        className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors hover:bg-primary/20"
                        title={t("playPractice")}
                      >
                        <PlayIcon className="size-4 fill-current ms-0.5" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(practice.slug)}
                        disabled={isRemoving}
                        title={t("removeItem")}
                        className="flex size-9 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-highest hover:text-tertiary"
                      >
                        {isRemoving ? (
                          <LoaderCircleIcon className="size-4 animate-spin" />
                        ) : (
                          <Trash2Icon className="size-4" />
                        )}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
