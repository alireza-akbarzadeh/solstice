"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2Icon, PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { LocalizedField } from "@/modules/instructor/components/localized-field";
import type { Localized } from "@/lib/localized";
import type { LiveClass, LiveClassAccess, LiveClassStatus } from "../../types";
import { createLiveClassAction, updateLiveClassAction } from "../../server/actions";

export function ClassEditorDialog({
  liveClass,
  availablePractices = [],
  trigger,
}: {
  liveClass?: LiveClass | null;
  availablePractices?: { slug: string; title: Localized }[];
  trigger?: React.ReactNode;
}) {
  const t = useTranslations("Studio.classes");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isEditing = Boolean(liveClass);

  // Form state
  const [title, setTitle] = useState<Localized>(liveClass?.title ?? { en: "", fa: "" });
  const [description, setDescription] = useState<Localized>(liveClass?.description ?? { en: "", fa: "" });
  const [locationName, setLocationName] = useState<Localized>(
    liveClass?.locationName ?? { en: "Kyoto Pavilion · Pavilion Main", fa: "پاویون کیوتو · تالار اصلی" },
  );

  const defaultDate = liveClass
    ? new Date(liveClass.scheduledAt).toISOString().slice(0, 16)
    : new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 16);

  const [scheduledAt, setScheduledAt] = useState(defaultDate);
  const [durationMinutes, setDurationMinutes] = useState(liveClass?.durationMinutes ?? 60);
  const [joinUrl, setJoinUrl] = useState(liveClass?.joinUrl ?? "https://meet.jit.si/ArteYogaSanctuary-Session");
  const [capacity, setCapacity] = useState<string>(liveClass?.capacity ? String(liveClass.capacity) : "");
  const [access, setAccess] = useState<LiveClassAccess>(liveClass?.access ?? "members_only");
  const [status, setStatus] = useState<LiveClassStatus>(liveClass?.status ?? "scheduled");
  const [replayPracticeSlug, setReplayPracticeSlug] = useState(liveClass?.replayPracticeSlug ?? "");
  const [soundscapeDetails, setSoundscapeDetails] = useState(liveClass?.soundscapeDetails ?? "Elena + 432Hz Bowls · Voice 70% · Chimes 30%");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.en || !title.fa) {
      toast.error("Please enter a title in both English and Persian.");
      return;
    }

    if (!description.en || !description.fa) {
      toast.error("Please enter a description in both English and Persian.");
      return;
    }

    if (!joinUrl) {
      toast.error("Please provide a valid meeting link.");
      return;
    }

    startTransition(async () => {
      const payload = {
        titleEn: title.en,
        titleFa: title.fa,
        descriptionEn: description.en,
        descriptionFa: description.fa,
        locationNameEn: locationName.en,
        locationNameFa: locationName.fa,
        scheduledAt,
        durationMinutes,
        joinUrl,
        capacity: capacity ? Number(capacity) : null,
        access,
        status,
        replayPracticeSlug: replayPracticeSlug || null,
        coverImage: liveClass?.coverImage ?? "/images/classes/kyoto-pavilion-stage.jpg",
        soundscapeDetails: soundscapeDetails || null,
      };

      const res = isEditing && liveClass
        ? await updateLiveClassAction(liveClass.id, payload)
        : await createLiveClassAction(payload);

      if (res.ok) {
        toast.success(isEditing ? t("successUpdate") : t("successCreate"));
        setOpen(false);
        router.refresh();
      } else {
        toast.error("Failed to save live session. Please check all fields.");
      }
    });
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={setOpen}>
      <ResponsiveDialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <PlusIcon className="size-4 me-1.5" />
            <span>{t("newClass")}</span>
          </Button>
        )}
      </ResponsiveDialogTrigger>

      <ResponsiveDialogContent className="max-w-2xl">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>
            {isEditing ? t("editClass") : t("newClass")}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {t("description")}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <form onSubmit={handleSubmit} className="space-y-space-md py-space-xs">
          {/* Title in both languages */}
          <LocalizedField
            label="Title"
            value={title}
            onChange={setTitle}
          />

          {/* Description in both languages */}
          <LocalizedField
            label="Description"
            multiline
            rows={2}
            value={description}
            onChange={setDescription}
          />

          {/* Location in both languages */}
          <LocalizedField
            label="Location / Pavilion"
            value={locationName}
            onChange={setLocationName}
          />

          {/* Date, Duration & Capacity */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-space-sm">
            <div>
              <label className="font-label-sm text-label-sm text-clay block mb-1">
                {t("scheduledAt")}
              </label>
              <Input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="font-label-sm text-label-sm text-clay block mb-1">
                {t("durationMinutes")}
              </label>
              <Input
                type="number"
                min={15}
                max={360}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                required
              />
            </div>

            <div>
              <label className="font-label-sm text-label-sm text-clay block mb-1">
                {t("capacity")}
              </label>
              <Input
                type="number"
                min={1}
                placeholder="Unlimited"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
              />
            </div>
          </div>

          {/* Meeting Link & Soundscape */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-space-sm">
            <div>
              <label className="font-label-sm text-label-sm text-clay block mb-1">
                {t("joinUrl")}
              </label>
              <Input
                type="url"
                placeholder="https://meet.jit.si/Arte..."
                value={joinUrl}
                onChange={(e) => setJoinUrl(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="font-label-sm text-label-sm text-clay block mb-1">
                {t("soundscapeDetails")}
              </label>
              <Input
                type="text"
                placeholder="Elena + 432Hz Bowls"
                value={soundscapeDetails}
                onChange={(e) => setSoundscapeDetails(e.target.value)}
              />
            </div>
          </div>

          {/* Access, Status & Replay Attachment */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-space-sm">
            <div>
              <label className="font-label-sm text-label-sm text-clay block mb-1">
                {t("access")}
              </label>
              <select
                value={access}
                onChange={(e) => setAccess(e.target.value as LiveClassAccess)}
                className="w-full h-10 px-3 rounded-lg bg-surface-container border border-outline-variant/40 text-on-surface text-body-sm font-body-sm focus:outline-none"
              >
                <option value="members_only">{t("accessMembers")}</option>
                <option value="open">{t("accessOpen")}</option>
              </select>
            </div>

            <div>
              <label className="font-label-sm text-label-sm text-clay block mb-1">
                {t("status")}
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as LiveClassStatus)}
                className="w-full h-10 px-3 rounded-lg bg-surface-container border border-outline-variant/40 text-on-surface text-body-sm font-body-sm focus:outline-none"
              >
                <option value="scheduled">Scheduled</option>
                <option value="live">Live in Broadcast</option>
                <option value="completed">Completed</option>
                <option value="canceled">Canceled</option>
              </select>
            </div>

            <div>
              <label className="font-label-sm text-label-sm text-clay block mb-1">
                {t("replayPractice")}
              </label>
              <select
                value={replayPracticeSlug}
                onChange={(e) => setReplayPracticeSlug(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-surface-container border border-outline-variant/40 text-on-surface text-body-sm font-body-sm focus:outline-none"
              >
                <option value="">{t("noneReplay")}</option>
                {availablePractices.map((p) => (
                  <option key={p.slug} value={p.slug}>
                    {p.title.en}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <ResponsiveDialogFooter className="pt-space-sm border-t border-outline-variant/30">
            <ResponsiveDialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </ResponsiveDialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2Icon className="size-4 animate-spin me-2" />}
              <span>{isPending ? t("saving") : t("save")}</span>
            </Button>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
