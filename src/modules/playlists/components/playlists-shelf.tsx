"use client";

import { useState } from "react";
import { FolderPlusIcon, PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { CreatePlaylistDialog } from "./create-playlist-dialog";
import { PlaylistCard } from "./playlist-card";
import { PlaylistDetailDialog } from "./playlist-detail-dialog";
import type { PlaylistSummary } from "../types";

export function PlaylistsShelf({
  playlists,
}: {
  playlists: PlaylistSummary[];
}) {
  const t = useTranslations("Playlists");
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);

  return (
    <section aria-labelledby="playlists-title" className="mb-space-2xl">
      <div className="mb-space-md flex items-center justify-between gap-3">
        <div>
          <h2 id="playlists-title" className="font-headline-sm text-headline-sm text-on-surface">
            {t("title")}
          </h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            {t("description")}
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          size="sm"
          className="gap-1.5 rounded-lg bg-primary font-label-md text-label-md text-on-primary hover:bg-primary-container"
        >
          <PlusIcon className="size-4" />
          <span>{t("createButton")}</span>
        </Button>
      </div>

      {playlists.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl bg-surface-container-low p-space-xl text-center">
          <FolderPlusIcon className="size-8 text-outline" />
          <p className="max-w-md font-body-md text-body-md text-on-surface-variant">
            {t("emptyShelf")}
          </p>
          <Button
            onClick={() => setCreateOpen(true)}
            variant="outline"
            size="sm"
            className="rounded-lg"
          >
            {t("createFirst")}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-gutter md:grid-cols-2 lg:grid-cols-3">
          {playlists.map((playlist) => (
            <PlaylistCard
              key={playlist.id}
              playlist={playlist}
              onSelect={() => setSelectedPlaylistId(playlist.id)}
            />
          ))}
        </div>
      )}

      <CreatePlaylistDialog open={createOpen} onOpenChange={setCreateOpen} />
      <PlaylistDetailDialog
        playlistId={selectedPlaylistId}
        open={selectedPlaylistId !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedPlaylistId(null);
        }}
      />
    </section>
  );
}
