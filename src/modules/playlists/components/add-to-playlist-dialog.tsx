"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState, useTransition } from "react";
import { CheckIcon, FolderPlusIcon, ListPlusIcon, Loader2Icon, PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  ResponsiveDialog,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from "@/components/ui/responsive-dialog";
import { getPlaylistsForPracticeAction, togglePlaylistItemAction } from "../actions";
import { CreatePlaylistDialog } from "./create-playlist-dialog";
import type { PlaylistSummary } from "../types";

export function AddToPlaylistDialog({
  practiceSlug,
  practiceTitle,
  trigger,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: {
  practiceSlug: string;
  practiceTitle: string;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const t = useTranslations("Playlists");
  const isControlled = controlledOpen !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = (next: boolean) => {
    if (isControlled) {
      setControlledOpen?.(next);
    } else {
      setInternalOpen(next);
    }
  };
  const [loading, setLoading] = useState(false);
  const [playlists, setPlaylists] = useState<PlaylistSummary[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [, startTransition] = useTransition();

  const loadPlaylists = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPlaylistsForPracticeAction(practiceSlug);
      setPlaylists(data.playlists);
      setSelectedIds(new Set(data.containing));
    } finally {
      setLoading(false);
    }
  }, [practiceSlug]);

  useEffect(() => {
    if (open) {
      void loadPlaylists();
    }
  }, [open, loadPlaylists]);

  const handleToggle = (playlistId: string) => {
    const isCurrentlyIncluded = selectedIds.has(playlistId);
    const nextSet = new Set(selectedIds);
    if (isCurrentlyIncluded) {
      nextSet.delete(playlistId);
    } else {
      nextSet.add(playlistId);
    }
    setSelectedIds(nextSet);

    startTransition(async () => {
      await togglePlaylistItemAction(playlistId, practiceSlug, !isCurrentlyIncluded);
    });
  };

  return (
    <>
      <ResponsiveDialog open={open} onOpenChange={setOpen}>
        <ResponsiveDialogTrigger asChild>
          {trigger ?? (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 rounded-full border-outline-variant/40 bg-surface-container-low/60 hover:bg-surface-container"
            >
              <ListPlusIcon className="size-4 text-primary" />
              <span>{t("addToPlaylist")}</span>
            </Button>
          )}
        </ResponsiveDialogTrigger>

        <ResponsiveDialogContent className="max-w-md">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>{t("addToPlaylist")}</ResponsiveDialogTitle>
            <ResponsiveDialogDescription className="truncate">
              {practiceTitle}
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>

          <div className="flex flex-col gap-2 py-2">
            {loading ? (
              <div className="flex items-center justify-center py-8 text-on-surface-variant">
                <Loader2Icon className="size-5 animate-spin text-primary" />
              </div>
            ) : playlists.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-xl bg-surface p-6 text-center">
                <FolderPlusIcon className="size-8 text-outline" />
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  {t("noPlaylistsYet")}
                </p>
                <Button
                  size="sm"
                  onClick={() => setCreateDialogOpen(true)}
                  className="mt-2 gap-1.5 rounded-full"
                >
                  <PlusIcon className="size-4" />
                  {t("createFirst")}
                </Button>
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-1 pe-1">
                {playlists.map((pl) => {
                  const isChecked = selectedIds.has(pl.id);
                  return (
                    <button
                      key={pl.id}
                      type="button"
                      onClick={() => handleToggle(pl.id)}
                      className="flex w-full items-center justify-between gap-3 rounded-lg p-2.5 text-start transition-colors hover:bg-surface-container"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-label-md text-label-md font-medium text-on-surface">
                          {pl.title}
                        </div>
                        <div className="font-body-sm text-body-sm text-on-surface-variant">
                          {t("itemCount", { count: pl.practicesCount })}
                        </div>
                      </div>
                      <div
                        className={`flex size-5 items-center justify-center rounded border transition-colors ${
                          isChecked
                            ? "border-primary bg-primary text-on-primary"
                            : "border-outline bg-surface"
                        }`}
                      >
                        {isChecked && <CheckIcon className="size-3.5 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <ResponsiveDialogFooter className="flex items-center justify-between gap-2 border-t border-outline-variant/20 pt-3">
            {playlists.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setCreateDialogOpen(true)}
                className="gap-1 text-primary hover:text-primary"
              >
                <PlusIcon className="size-4" />
                <span>{t("newPlaylist")}</span>
              </Button>
            )}
            <ResponsiveDialogClose asChild>
              <Button type="button" variant="outline" size="sm">
                {t("done")}
              </Button>
            </ResponsiveDialogClose>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>

      <CreatePlaylistDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={async (newId) => {
          await togglePlaylistItemAction(newId, practiceSlug, true);
          await loadPlaylists();
        }}
      />
    </>
  );
}
