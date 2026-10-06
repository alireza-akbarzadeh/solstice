"use client";

import { useState, useTransition } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { toast } from "sonner";
import { LockIcon, PlusIcon, Trash2Icon, Loader2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { MemberNote } from "@/modules/onboarding/types";
import {
  addMemberNoteAction,
  deleteMemberNoteAction,
} from "@/modules/onboarding/server/actions";

export function DossierNotesSection({
  userId,
  initialNotes = [],
}: {
  userId: string;
  initialNotes?: MemberNote[];
}) {
  const t = useTranslations("Studio.members.dossier");
  const format = useFormatter();
  const [notes, setNotes] = useState<MemberNote[]>(initialNotes);
  const [isAdding, setIsAdding] = useState(false);
  const [newNoteText, setNewNoteText] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    startTransition(async () => {
      const res = await addMemberNoteAction({
        userId,
        body: newNoteText,
      });

      if (res.ok && res.data) {
        setNotes([res.data, ...notes]);
        setNewNoteText("");
        setIsAdding(false);
        toast.success(t("noteAdded"));
      } else {
        toast.error(t("failed"));
      }
    });
  };

  const handleDelete = (noteId: number) => {
    if (!window.confirm(t("deleteNoteConfirm"))) return;

    startTransition(async () => {
      const res = await deleteMemberNoteAction(noteId);
      if (res.ok) {
        setNotes(notes.filter((n) => n.id !== noteId));
        toast.success(t("noteDeleted"));
      } else {
        toast.error(t("failed"));
      }
    });
  };

  return (
    <section className="flex flex-col gap-space-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <LockIcon className="size-3 text-clay" />
          <span className="font-label-sm text-label-sm tracking-wider text-on-surface-variant uppercase font-semibold">
            {t("notesTitle")}
          </span>
        </div>

        {!isAdding && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsAdding(true)}
            className="h-7 text-xs px-2"
          >
            <PlusIcon className="size-3 me-1" />
            <span>{t("addNote")}</span>
          </Button>
        )}
      </div>

      {isAdding && (
        <form
          onSubmit={handleCreate}
          className="p-3 rounded-lg bg-surface space-y-2 border border-outline-variant/40 shadow-xs"
        >
          <Textarea
            value={newNoteText}
            onChange={(e) => setNewNoteText(e.target.value)}
            placeholder={t("notePlaceholder")}
            rows={2}
            className="resize-none text-xs bg-surface-container-low"
            autoFocus
          />
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsAdding(false);
                setNewNoteText("");
              }}
              disabled={isPending}
              className="h-7 text-xs"
            >
              {t("cancelAction")}
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isPending || !newNoteText.trim()}
              className="h-7 text-xs"
            >
              {isPending && <Loader2Icon className="size-3 animate-spin me-1" />}
              <span>{t("saveNote")}</span>
            </Button>
          </div>
        </form>
      )}

      {notes.length === 0 && !isAdding ? (
        <p className="text-xs text-outline italic px-1 py-1">
          {t("noNotes")}
        </p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {notes.map((note) => (
            <li
              key={note.id}
              className="group rounded-lg bg-surface p-2.5 shadow-sm space-y-1 relative"
            >
              <div className="flex items-center justify-between text-[11px] text-on-surface-variant">
                <span className="font-semibold text-on-surface font-label-sm">
                  {note.instructorName ?? "Instructor"}
                </span>
                <span className="text-outline">
                  {format.dateTime(new Date(note.createdAt), {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
              </div>

              <p className="font-body-sm text-xs text-on-surface leading-relaxed whitespace-pre-wrap">
                {note.body}
              </p>

              <button
                onClick={() => handleDelete(note.id)}
                disabled={isPending}
                className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 end-2 text-outline hover:text-error p-1"
                title={t("deleteNote")}
                aria-label={t("deleteNote")}
              >
                <Trash2Icon className="size-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
