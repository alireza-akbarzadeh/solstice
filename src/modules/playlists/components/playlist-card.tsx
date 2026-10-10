"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import Image from "next/image";
import { ClockIcon, FolderIcon, MoreVerticalIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreatePlaylistDialog } from "./create-playlist-dialog";
import { deletePlaylistAction } from "../actions";
import type { PlaylistSummary } from "../types";

export function PlaylistCard({
  playlist,
  onSelect,
}: {
  playlist: PlaylistSummary;
  onSelect?: () => void;
}) {
  const t = useTranslations("Playlists");
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [isDeleting, startDelete] = useTransition();

  const handleDelete = () => {
    if (window.confirm(t("deleteConfirm", { title: playlist.title }))) {
      startDelete(async () => {
        await deletePlaylistAction(playlist.id);
        router.refresh();
      });
    }
  };

  const images = playlist.previewImages;

  return (
    <>
      <div className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-low transition-all hover:border-outline-variant hover:shadow-md">
        {/* Visual Cover Collage */}
        <div
          onClick={onSelect}
          className="relative aspect-video w-full cursor-pointer overflow-hidden bg-surface-container"
        >
          {images.length === 0 ? (
            <div className="flex size-full items-center justify-center text-outline">
              <FolderIcon className="size-10 opacity-60" />
            </div>
          ) : images.length === 1 ? (
            <Image
              src={images[0]!}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="grid size-full grid-cols-2 grid-rows-2 gap-0.5">
              {images.map((img, i) => (
                <div key={i} className="relative size-full overflow-hidden">
                  <Image src={img} alt="" fill sizes="160px" className="object-cover" />
                </div>
              ))}
            </div>
          )}

          {/* Quick badge */}
          <div className="absolute bottom-2 end-2 flex items-center gap-1.5 rounded-full bg-surface/90 px-2.5 py-1 font-label-sm text-label-sm font-medium text-on-surface shadow backdrop-blur-sm">
            <ClockIcon className="size-3 text-clay" />
            <span>{t("minutesShort", { count: playlist.totalMinutes })}</span>
          </div>
        </div>

        {/* Card Body */}
        <div className="flex flex-1 flex-col justify-between p-space-md">
          <div className="flex items-start justify-between gap-2">
            <div onClick={onSelect} className="cursor-pointer min-w-0 flex-1">
              <h3 className="truncate font-headline-sm text-headline-sm text-on-surface transition-colors group-hover:text-primary">
                {playlist.title}
              </h3>
              {playlist.description ? (
                <p className="line-clamp-2 mt-1 font-body-sm text-body-sm text-on-surface-variant">
                  {playlist.description}
                </p>
              ) : (
                <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
                  {t("itemCount", { count: playlist.practicesCount })}
                </p>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-full text-on-surface-variant hover:text-on-surface"
                >
                  <MoreVerticalIcon className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditOpen(true)} className="gap-2">
                  <PencilIcon className="size-4 text-outline" />
                  <span>{t("edit")}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="gap-2 text-tertiary focus:text-tertiary"
                >
                  <Trash2Icon className="size-4" />
                  <span>{t("delete")}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="mt-space-md flex items-center justify-between border-t border-outline-variant/20 pt-2.5">
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              {t("itemCount", { count: playlist.practicesCount })}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onSelect}
              className="gap-1 font-label-sm text-label-sm text-primary hover:text-primary"
            >
              <span>{t("viewCollection")}</span>
            </Button>
          </div>
        </div>
      </div>

      <CreatePlaylistDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        initialData={{
          id: playlist.id,
          title: playlist.title,
          description: playlist.description,
        }}
      />
    </>
  );
}
