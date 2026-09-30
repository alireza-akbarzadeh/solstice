"use client";

import {
  ChevronDownIcon,
  ClockIcon,
  EllipsisIcon,
  GlobeIcon,
  HeartIcon,
  LoaderCircleIcon,
  LockIcon,
  PinIcon,
  PinOffIcon,
  Trash2Icon,
} from "lucide-react";
import Image from "next/image";
import { useFormatter, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { usePracticeStage } from "@/modules/practices/components/practice-stage";

import {
  likeReflection,
  pinReflection,
  postReflection,
  removeReflection,
} from "../actions";
import { REFLECTION_MAX_LENGTH } from "../schemas";
import type { ReflectAccess } from "../server/access";
import { type ReflectionTag, reflectionTags, somaticTags } from "../types";

export type ReflectionView = {
  id: number;
  author: {
    id: string;
    name: string;
    image: string | null;
    isInstructor: boolean;
  };
  body: string;
  tag: ReflectionTag | null;
  atSeconds: number | null;
  atChapter: string | null;
  private: boolean;
  pinned: boolean;
  ago: string;
  likes: number;
  liked: boolean;
  canDelete: boolean;
  replies: ReflectionView[];
};

type Filter = "all" | "guide" | "notes";

const COLLAPSED_COUNT = 4;
const tagEmoji: Record<ReflectionTag, string> = {
  epiphany: "✨",
  breath: "🌿",
  release: "🕊️",
  inquiry: "❓",
};
const INSTRUCTOR_IMAGE = "/images/brand/elena-closeup.jpg";

function useClock() {
  const format = useFormatter();
  return (seconds: number) => {
    const s = Math.max(0, Math.floor(seconds));
    const two = (n: number) =>
      format.number(n, { minimumIntegerDigits: 2, useGrouping: false });
    return `${two(Math.floor(s / 60))}:${two(s % 60)}`;
  };
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

function Avatar({
  author,
  size,
}: {
  author: ReflectionView["author"];
  size: "sm" | "md";
}) {
  const src = author.image ?? (author.isInstructor ? INSTRUCTOR_IMAGE : null);
  const box = size === "md" ? "size-7" : "size-5";
  if (src) {
    return (
      <Image
        src={src}
        alt=""
        width={28}
        height={28}
        className={cn(
          box,
          "shrink-0 rounded-full object-cover",
          author.isInstructor && "ring-primary ring-2",
        )}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={cn(
        box,
        "bg-secondary-fixed text-on-secondary-fixed flex shrink-0 items-center justify-center rounded-full font-semibold",
        size === "md" ? "text-[10px]" : "text-[8px]",
      )}
    >
      {initials(author.name)}
    </span>
  );
}

export function ReflectionsPanel({
  practiceSlug,
  reflections,
  total,
  access,
  isInstructor,
  signInHref,
  membershipHref,
}: {
  practiceSlug: string;
  reflections: ReflectionView[];
  total: number;
  access: ReflectAccess;
  isInstructor: boolean;
  signInHref: string;
  membershipHref: string;
}) {
  const t = useTranslations("Reflections");
  const [filter, setFilter] = useState<Filter>("all");
  const [expanded, setExpanded] = useState(false);

  const visible = reflections.filter((r) => {
    if (filter === "guide")
      return (
        r.author.isInstructor ||
        r.replies.some((reply) => reply.author.isInstructor)
      );
    if (filter === "notes")
      return r.tag !== null && somaticTags.includes(r.tag);
    return true;
  });
  const shown = expanded ? visible : visible.slice(0, COLLAPSED_COUNT);

  return (
    <section
      id="reflections"
      className="gap-space-md bg-surface-container-low p-space-lg flex scroll-mt-28 flex-col rounded-xl shadow-sm"
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="font-label-md text-label-md text-clay mb-1 block tracking-wider uppercase">
              {t("eyebrow")}
            </span>
            <h2 className="font-headline-sm text-headline-sm text-on-surface">
              {t("title")}
            </h2>
          </div>
          <span className="bg-surface font-label-sm text-label-sm text-primary shrink-0 rounded-full px-2.5 py-1 font-semibold shadow-2xs">
            {t("count", { count: total })}
          </span>
        </div>
        <div
          role="tablist"
          aria-label={t("filtersLabel")}
          className="flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {(["all", "guide", "notes"] as const).map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={filter === id}
              onClick={() => setFilter(id)}
              className={cn(
                "font-label-sm text-label-sm shrink-0 rounded-full px-2.5 py-1 transition-colors",
                filter === id
                  ? "bg-primary text-on-primary font-medium shadow-2xs"
                  : "bg-surface text-on-surface-variant hover:text-primary",
              )}
            >
              {t(`filters.${id}`)}
            </button>
          ))}
        </div>
      </div>

      {access === "ok" ? (
        <Composer practiceSlug={practiceSlug} />
      ) : (
        <div className="bg-surface flex flex-col gap-3 rounded-xl p-4 shadow-2xs">
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            {t(access === "signIn" ? "gate.signIn" : "gate.members")}
          </p>
          <Link
            href={access === "signIn" ? signInHref : membershipHref}
            className="bg-primary font-label-sm text-label-sm text-on-primary hover:bg-primary-container self-start rounded-lg px-3.5 py-1.5 font-semibold tracking-wider uppercase shadow-2xs transition-colors"
          >
            {t(access === "signIn" ? "gate.signInCta" : "gate.membersCta")}
          </Link>
        </div>
      )}

      {visible.length === 0 ? (
        <p className="bg-surface/70 font-body-sm text-body-sm text-on-surface-variant rounded-xl p-4 text-center">
          {t(filter === "all" ? "empty" : "emptyFiltered")}
        </p>
      ) : (
        <ul className="space-y-3">
          {shown.map((reflection) => (
            <li key={reflection.id}>
              <ReflectionItem
                reflection={reflection}
                practiceSlug={practiceSlug}
                canReply={access === "ok"}
                canLike={access !== "signIn"}
                isInstructor={isInstructor}
              />
            </li>
          ))}
        </ul>
      )}

      {visible.length > COLLAPSED_COUNT && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="bg-surface font-label-sm text-label-sm text-primary hover:bg-surface-container flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 font-semibold tracking-wider uppercase shadow-2xs transition-colors"
        >
          {expanded ? t("showLess") : t("showAll", { count: visible.length })}
          <ChevronDownIcon
            className={cn(
              "size-4 transition-transform",
              expanded && "rotate-180",
            )}
          />
        </button>
      )}
    </section>
  );
}

function errorMessage(
  t: ReturnType<typeof useTranslations<"Reflections">>,
  error: string,
) {
  return error === "signIn" || error === "members" || error === "forbidden"
    ? t(`errors.${error}`)
    : t("errors.generic");
}

function Composer({ practiceSlug }: { practiceSlug: string }) {
  const t = useTranslations("Reflections");
  const clock = useClock();
  const { hasVideo, currentTime } = usePracticeStage();
  const [body, setBody] = useState("");
  const [tag, setTag] = useState<ReflectionTag | null>(null);
  const [withTime, setWithTime] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [pending, startTransition] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    startTransition(async () => {
      const result = await postReflection({
        practiceSlug,
        body,
        tag,
        atSeconds: hasVideo && withTime ? Math.floor(currentTime) : null,
        visibility: isPrivate ? "private" : "circle",
        parentId: null,
      });
      if (result.ok) {
        setBody("");
        setTag(null);
        setWithTime(false);
        toast.success(t(isPrivate ? "sharedPrivately" : "shared"));
      } else toast.error(errorMessage(t, result.error));
    });
  };

  return (
    <form
      onSubmit={submit}
      className="bg-surface flex flex-col gap-2.5 rounded-xl p-3.5 shadow-2xs"
    >
      <label className="sr-only" htmlFor="reflection-body">
        {t("composer.label")}
      </label>
      <textarea
            dir="auto"
        id="reflection-body"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={REFLECTION_MAX_LENGTH}
        rows={3}
        placeholder={t("composer.placeholder")}
        className="font-body-sm text-body-sm text-on-surface placeholder:text-outline w-full resize-none bg-transparent leading-relaxed focus:outline-none"
      />
      <div
        className="flex flex-wrap items-center gap-1.5 pt-1"
        role="group"
        aria-label={t("composer.tagsLabel")}
      >
        {reflectionTags.map((id) => (
          <button
            key={id}
            type="button"
            aria-pressed={tag === id}
            onClick={() => setTag((current) => (current === id ? null : id))}
            className={cn(
              "font-label-sm inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs transition-colors",
              tag === id
                ? "bg-primary text-on-primary"
                : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high",
            )}
          >
            <span aria-hidden>{tagEmoji[id]}</span>
            {t(`tags.${id}`)}
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between gap-2 pt-2">
        <div className="flex items-center gap-2">
          {hasVideo && (
            <button
              type="button"
              aria-pressed={withTime}
              onClick={() => setWithTime((v) => !v)}
              title={t("composer.timeHint")}
              className={cn(
                "font-label-sm inline-flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors",
                withTime
                  ? "bg-primary/10 text-primary hover:bg-primary/20"
                  : "text-outline hover:text-on-surface",
              )}
            >
              <ClockIcon className="size-3.5" />
              <span dir="ltr" className="tabular-nums">
                {clock(currentTime)}
              </span>
            </button>
          )}
          <button
            type="button"
            aria-pressed={isPrivate}
            onClick={() => setIsPrivate((v) => !v)}
            title={t("composer.privacyHint")}
            className="font-label-sm text-outline hover:text-on-surface inline-flex items-center gap-1 text-xs transition-colors"
          >
            {isPrivate ? (
              <LockIcon className="size-3.5" />
            ) : (
              <GlobeIcon className="size-3.5" />
            )}
            <span>{t(isPrivate ? "composer.private" : "composer.circle")}</span>
          </button>
        </div>
        <button
          type="submit"
          disabled={pending || !body.trim()}
          className="bg-primary font-label-sm text-label-sm text-on-primary hover:bg-primary-container inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 font-semibold tracking-wider uppercase shadow-2xs transition-colors disabled:opacity-60"
        >
          {pending && <LoaderCircleIcon className="size-3.5 animate-spin" />}
          {t("composer.submit")}
        </button>
      </div>
    </form>
  );
}

function ReflectionItem({
  reflection,
  practiceSlug,
  canReply,
  canLike,
  isInstructor,
  nested = false,
}: {
  reflection: ReflectionView;
  practiceSlug: string;
  canReply: boolean;
  canLike: boolean;
  isInstructor: boolean;
  nested?: boolean;
}) {
  const t = useTranslations("Reflections");
  const clock = useClock();
  const { hasVideo, seek } = usePracticeStage();
  const [replying, setReplying] = useState(false);
  const [reply, setReply] = useState("");
  const [liked, setLiked] = useState(reflection.liked);
  const [likes, setLikes] = useState(reflection.likes);
  const [pending, startTransition] = useTransition();

  const { author } = reflection;
  const featured = reflection.pinned && !nested;

  const toggleLike = () => {
    if (!canLike) return toast.error(t("errors.signIn"));
    setLiked(!liked);
    setLikes((n) => n + (liked ? -1 : 1));
    startTransition(async () => {
      const result = await likeReflection(reflection.id);
      if (!result.ok) {
        setLiked(liked);
        setLikes(reflection.likes);
        toast.error(errorMessage(t, result.error));
      }
    });
  };

  const sendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim()) return;
    startTransition(async () => {
      const result = await postReflection({
        practiceSlug,
        body: reply,
        tag: null,
        atSeconds: null,
        visibility: "circle",
        parentId: reflection.id,
      });
      if (result.ok) {
        setReply("");
        setReplying(false);
      } else toast.error(errorMessage(t, result.error));
    });
  };

  const run = (work: () => Promise<{ ok: boolean; error?: string }>) =>
    startTransition(async () => {
      const result = await work();
      if (!result.ok) toast.error(errorMessage(t, result.error ?? "generic"));
    });

  const canPin = isInstructor && !nested;
  const moment =
    reflection.atSeconds !== null ? (
      <span dir="ltr" className="tabular-nums">
        {clock(reflection.atSeconds)}
      </span>
    ) : null;

  return (
    <article
      className={cn(
        "space-y-2 rounded-xl",
        nested ? "bg-surface-container/60 ms-3 p-2.5" : "p-3.5 shadow-2xs",
        !nested && (featured ? "bg-primary-fixed/30" : "bg-surface/70"),
        pending && "opacity-70",
      )}
    >
      <header className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <Avatar author={author} size={nested ? "sm" : "md"} />
          <span
            dir="auto"
            className={cn(
              "font-label-sm font-semibold",
              nested ? "text-xs" : "text-label-sm",
              author.isInstructor ? "text-primary" : "text-on-surface",
            )}
          >
            {author.name}
          </span>
          {author.isInstructor && (
            <span className="bg-primary font-label-sm text-on-primary rounded px-1.5 text-[10px] font-semibold tracking-wider uppercase">
              {t("leadGuide")}
            </span>
          )}
          {moment &&
            (hasVideo ? (
              <button
                type="button"
                onClick={() => seek(reflection.atSeconds!, { play: true })}
                aria-label={t("jumpTo", { time: clock(reflection.atSeconds!) })}
                className="bg-surface-container font-label-sm text-on-surface-variant hover:bg-primary/10 hover:text-primary inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] transition-colors"
              >
                {moment}
                {reflection.atChapter && (
                  <span className="max-w-32 truncate">
                    {reflection.atChapter}
                  </span>
                )}
              </button>
            ) : (
              <span className="bg-surface-container font-label-sm text-on-surface-variant inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px]">
                {moment}
                {reflection.atChapter && (
                  <span className="max-w-32 truncate">
                    {reflection.atChapter}
                  </span>
                )}
              </span>
            ))}
          {reflection.tag && (
            <span
              className={cn(
                "font-label-sm rounded px-1.5 py-0.5 text-[10px]",
                reflection.tag === "inquiry"
                  ? "bg-tertiary-fixed text-on-tertiary-fixed-variant"
                  : "bg-surface-container text-on-surface-variant",
              )}
            >
              <span aria-hidden>{tagEmoji[reflection.tag]} </span>
              {t(`tags.${reflection.tag}`)}
            </span>
          )}
          {reflection.private && (
            <span className="font-label-sm text-outline inline-flex items-center gap-1 text-[10px]">
              <LockIcon className="size-3" />
              {t("privateBadge")}
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {featured ? (
            <span className="font-label-sm text-label-sm text-clay flex items-center gap-1 font-medium">
              <PinIcon className="size-3" />
              {t("pinned")}
            </span>
          ) : (
            <span
              className={cn(
                "font-label-sm text-outline",
                nested ? "text-[10px]" : "text-label-sm",
              )}
            >
              {reflection.ago}
            </span>
          )}
          {(canPin || reflection.canDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label={t("more")}
                className="text-outline hover:bg-surface-container hover:text-on-surface flex size-6 items-center justify-center rounded transition-colors"
              >
                <EllipsisIcon className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canPin && (
                  <DropdownMenuItem
                    onSelect={() =>
                      run(() =>
                        pinReflection(reflection.id, !reflection.pinned),
                      )
                    }
                  >
                    {reflection.pinned ? <PinOffIcon /> : <PinIcon />}
                    {t(reflection.pinned ? "unpin" : "pin")}
                  </DropdownMenuItem>
                )}
                {reflection.canDelete && (
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={() => run(() => removeReflection(reflection.id))}
                  >
                    <Trash2Icon />
                    {t("delete")}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>

      {/* Members write in either language: let each reflection pick its own direction. */}
      <p
        dir="auto"
        className={cn(
          "font-body-sm text-on-surface-variant leading-relaxed whitespace-pre-line",
          nested ? "text-xs" : "text-body-sm",
        )}
      >
        {reflection.body}
      </p>

      {!nested && (
        <div className="text-outline flex items-center gap-3 pt-0.5 text-xs">
          <button
            type="button"
            onClick={toggleLike}
            aria-pressed={liked}
            className={cn(
              "hover:text-primary flex items-center gap-1 font-medium transition-colors",
              liked && "text-primary",
            )}
          >
            <HeartIcon className={cn("size-3.5", liked && "fill-current")} />
            {t("held", { count: likes })}
          </button>
          {canReply && (
            <button
              type="button"
              onClick={() => setReplying((v) => !v)}
              className="hover:text-primary font-medium transition-colors"
            >
              {reflection.replies.length > 0
                ? t("replyCount", { count: reflection.replies.length })
                : t("reply")}
            </button>
          )}
        </div>
      )}

      {reflection.replies.map((child) => (
        <ReflectionItem
          key={child.id}
          reflection={child}
          practiceSlug={practiceSlug}
          canReply={canReply}
          canLike={canLike}
          isInstructor={isInstructor}
          nested
        />
      ))}

      {replying && (
        <form
          onSubmit={sendReply}
          className="bg-surface ms-3 flex flex-col gap-2 rounded-lg p-2.5"
        >
          <label className="sr-only" htmlFor={`reply-${reflection.id}`}>
            {t("replyLabel", { name: author.name })}
          </label>
          <textarea
            dir="auto"
            id={`reply-${reflection.id}`}
            autoFocus
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            maxLength={REFLECTION_MAX_LENGTH}
            rows={2}
            placeholder={t("replyPlaceholder", { name: author.name })}
            className="font-body-sm text-on-surface placeholder:text-outline w-full resize-none bg-transparent text-xs leading-relaxed focus:outline-none"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setReplying(false)}
              className="font-label-sm text-outline hover:text-on-surface px-2 py-1 text-xs"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={pending || !reply.trim()}
              className="bg-primary font-label-sm text-on-primary hover:bg-primary-container rounded px-2.5 py-1 text-xs font-semibold transition-colors disabled:opacity-60"
            >
              {t("sendReply")}
            </button>
          </div>
        </form>
      )}
    </article>
  );
}
