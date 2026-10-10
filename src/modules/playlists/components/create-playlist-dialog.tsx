"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { createPlaylistAction, updatePlaylistAction } from "../actions";

export function CreatePlaylistDialog({
  trigger,
  initialData,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  onSuccess,
}: {
  trigger?: React.ReactNode;
  initialData?: { id: string; title: string; description?: string | null };
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: (id: string) => void;
}) {
  const t = useTranslations("Playlists");
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = (val: boolean) => {
    if (isControlled) {
      controlledOnOpenChange?.(val);
    } else {
      setInternalOpen(val);
    }
    if (!val) {
      setError(null);
      if (!initialData) {
        setTitle("");
        setDescription("");
      }
    }
  };

  const isEditing = Boolean(initialData?.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError(t("titleLabel"));
      return;
    }

    startTransition(async () => {
      setError(null);
      if (isEditing && initialData?.id) {
        const res = await updatePlaylistAction(initialData.id, title, description);
        if (res.success) {
          setOpen(false);
          router.refresh();
          onSuccess?.(initialData.id);
        } else {
          setError(t("titleLabel"));
        }
      } else {
        const res = await createPlaylistAction(title, description);
        if (res.success && res.id) {
          setOpen(false);
          router.refresh();
          onSuccess?.(res.id);
        } else {
          setError(t("titleLabel"));
        }
      }
    });
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <ResponsiveDialogTrigger asChild>{trigger}</ResponsiveDialogTrigger>
      ) : !isControlled ? (
        <ResponsiveDialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5 rounded-full border-primary/30">
            <PlusIcon className="size-4 text-primary" />
            <span>{t("createButton")}</span>
          </Button>
        </ResponsiveDialogTrigger>
      ) : null}

      <ResponsiveDialogContent className="max-w-md">
        <form onSubmit={handleSubmit} className="flex flex-col gap-space-md">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>
              {isEditing ? t("editPlaylist") : t("newPlaylist")}
            </ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              {t("descriptionPlaceholder")}
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="playlist-title" className="font-label-md text-label-md text-on-surface">
                {t("titleLabel")}
              </Label>
              <Input
                id="playlist-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("titlePlaceholder")}
                maxLength={80}
                required
                className="bg-surface"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="playlist-desc" className="font-label-md text-label-md text-on-surface">
                {t("descriptionLabel")}
              </Label>
              <Textarea
                id="playlist-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("descriptionPlaceholder")}
                maxLength={300}
                rows={3}
                className="bg-surface resize-none"
              />
            </div>

            {error && <p className="font-body-sm text-body-sm text-tertiary">{error}</p>}
          </div>

          <ResponsiveDialogFooter className="flex gap-2 sm:justify-end">
            <ResponsiveDialogClose asChild>
              <Button type="button" variant="ghost" disabled={isPending}>
                {t("cancel")}
              </Button>
            </ResponsiveDialogClose>
            <Button type="submit" disabled={isPending || !title.trim()}>
              {isPending ? t("saveChanges") : isEditing ? t("saveChanges") : t("createPlaylist")}
            </Button>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
