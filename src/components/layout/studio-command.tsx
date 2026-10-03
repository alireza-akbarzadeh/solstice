"use client";

import {
  BookOpenIcon,
  ClockIcon,
  DownloadIcon,
  ExternalLinkIcon,
  FileTextIcon,
  Flower2Icon,
  GlobeIcon,
  LanguagesIcon,
  MailIcon,
  MegaphoneIcon,
  MessageSquareTextIcon,
  NotebookPenIcon,
  PlusIcon,
  SearchIcon,
  TagIcon,
  UserIcon,
  type LucideIcon,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { Spinner } from "@/components/ui/spinner";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { StudioSearchGroup, StudioSearchHit } from "@/modules/instructor/server/search";

import { studioNavGroups } from "./studio-nav";

type Recent = { id: string; title: string; href: string; group: StudioSearchGroup | "page" };

const RECENT_KEY = "studio-command-recent";
const groupIcons: Record<StudioSearchGroup | "page", LucideIcon> = {
  practices: Flower2Icon,
  programs: BookOpenIcon,
  journal: NotebookPenIcon,
  pages: FileTextIcon,
  plans: TagIcon,
  members: UserIcon,
  reflections: MessageSquareTextIcon,
  subscribers: MailIcon,
  page: SearchIcon,
};
const searchGroups: StudioSearchGroup[] = ["practices", "programs", "journal", "pages", "plans", "members", "reflections", "subscribers"];

/**
 * Every word typed must appear in the item (its label plus keywords), in any order. Stricter
 * than cmdk's default fuzzy match, which lets "annual" match "Journal".
 */
const matchWords = (value: string, search: string, keywords?: string[]) => {
  const haystack = `${value} ${keywords?.join(" ") ?? ""}`.toLocaleLowerCase();
  const words = search.toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return words.every((word) => haystack.includes(word)) ? 1 : 0;
};

const readRecent = (): Recent[] => {
  try {
    return (JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]") as Recent[]).slice(0, 5);
  } catch {
    return [];
  }
};

/**
 * The studio's command palette (⌘K / Ctrl K): jump to any section, start new content, open
 * the public site, switch language — and search every practice, program, essay, page, plan,
 * member, reflection and subscriber at once. Recently opened results are remembered per browser.
 */
export function StudioCommand() {
  const t = useTranslations("Studio.command");
  const tNav = useTranslations("Studio.nav");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<StudioSearchHit[]>([]);
  const [recent, setRecent] = useState<Recent[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) setRecent(readRecent());
    else {
      setQuery("");
      setHits([]);
    }
  }, [open]);

  // Search as the query settles; a newer query aborts the request still in flight.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setHits([]);
      setSearching(false);
      return;
    }
    const controller = new AbortController();
    setSearching(true);
    const timer = setTimeout(() => {
      fetch(`/api/instructor/search?${new URLSearchParams({ q, locale })}`, { signal: controller.signal })
        .then((res) => (res.ok ? (res.json() as Promise<StudioSearchHit[]>) : []))
        .then((result) => {
          setHits(result);
          setSearching(false);
        })
        .catch((error: unknown) => {
          if ((error as Error).name !== "AbortError") setSearching(false);
        });
    }, 150);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, locale]);

  const go = useCallback(
    (href: string, remember?: Omit<Recent, "href">) => {
      setOpen(false);
      if (remember) {
        const next = [{ ...remember, href }, ...readRecent().filter((r) => r.id !== remember.id)].slice(0, 5);
        try {
          localStorage.setItem(RECENT_KEY, JSON.stringify(next));
        } catch {
          // Private windows can refuse storage; recents are a convenience.
        }
      }
      if (href.startsWith("/api/") || href.startsWith("http")) window.location.assign(href);
      else router.push(href);
    },
    [router],
  );

  const otherLocale = locale === "fa" ? "en" : "fa";
  const createActions = [
    { label: t("create.practice"), href: "/instructor/videos?new=1", icon: Flower2Icon },
    { label: t("create.program"), href: "/instructor/programs?new=1", icon: BookOpenIcon },
    { label: t("create.essay"), href: "/instructor/journal?new=1", icon: NotebookPenIcon },
    { label: t("create.page"), href: "/instructor/pages?new=1", icon: FileTextIcon },
    { label: t("create.plan"), href: "/instructor/plans?new=1", icon: TagIcon },
    { label: t("create.announcement"), href: "/instructor/posts", icon: MegaphoneIcon },
  ];
  const sitePages = [
    { label: t("site.home"), href: "/" },
    { label: t("site.practices"), href: "/practices" },
    { label: t("site.programs"), href: "/programs" },
    { label: t("site.journal"), href: "/journal" },
    { label: t("site.about"), href: "/about" },
    { label: t("site.membership"), href: "/membership" },
    { label: t("site.community"), href: "/community" },
  ];
  // Server hits always match: they were found by the database, not by cmdk's fuzzy filter.
  const always = query.trim() ? [query.trim()] : undefined;

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        aria-label={t("open")}
        className="text-on-surface-variant hidden h-9 w-full max-w-sm justify-start gap-2 font-normal md:flex"
      >
        <SearchIcon data-icon="inline-start" />
        <span className="flex-1 truncate text-start">{t("trigger")}</span>
        <KbdGroup>
          <Kbd>Ctrl</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
      </Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label={t("open")} className="md:hidden">
        <SearchIcon />
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen} title={t("title")} description={t("description")} className="sm:max-w-xl">
        <Command loop filter={matchWords}>
          <CommandInput value={query} onValueChange={setQuery} placeholder={t("placeholder")} />
          <CommandList className="max-h-[min(70vh,28rem)]">
            {searching && query.trim().length >= 2 && (
              <div role="status" className="text-muted-foreground flex items-center gap-2 px-3 py-2 text-xs">
                <Spinner />
                {t("searching")}
              </div>
            )}
            <CommandEmpty>
              {searching ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner /> {t("searching")}
                </span>
              ) : (
                t("empty")
              )}
            </CommandEmpty>

            {searchGroups.map((group) => {
              const groupHits = hits.filter((hit) => hit.group === group);
              if (!groupHits.length) return null;
              const Icon = groupIcons[group];
              return (
                <CommandGroup key={group} heading={t(`groups.${group}`)}>
                  {groupHits.map((hit) => (
                    <CommandItem
                      key={hit.id}
                      value={hit.id}
                      keywords={always}
                      onSelect={() => go(hit.href, { id: hit.id, title: hit.title, group: hit.group })}
                    >
                      <Icon />
                      <span className="truncate" dir="auto">
                        {hit.title}
                      </span>
                      {(hit.detail || hit.status) && (
                        <CommandShortcut className="max-w-48 truncate tracking-normal normal-case" dir="auto">
                          {[hit.detail, hit.status && t(`status.${hit.status}`)].filter(Boolean).join(" · ")}
                        </CommandShortcut>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              );
            })}
            {hits.length > 0 && <CommandSeparator />}

            {!query && recent.length > 0 && (
              <CommandGroup heading={t("groups.recent")}>
                {recent.map((item) => {
                  const Icon = groupIcons[item.group] ?? ClockIcon;
                  return (
                    <CommandItem key={item.id} value={`recent ${item.id} ${item.title}`} onSelect={() => go(item.href, item)}>
                      <Icon />
                      <span className="truncate" dir="auto">
                        {item.title}
                      </span>
                      <CommandShortcut>
                        <ClockIcon />
                      </CommandShortcut>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}

            <CommandGroup heading={t("groups.goto")}>
              {studioNavGroups.flatMap((group) =>
                group.items.map((item) => (
                  <CommandItem
                    key={item.href}
                    value={`goto ${tNav(item.label)} ${item.label} ${item.href}`}
                    onSelect={() => go(item.href)}
                  >
                    <item.icon />
                    {tNav(item.label)}
                    {pathname === item.href && <CommandShortcut>{t("here")}</CommandShortcut>}
                  </CommandItem>
                )),
              )}
            </CommandGroup>

            <CommandGroup heading={t("groups.create")}>
              {createActions.map((action) => (
                <CommandItem key={action.href} value={`create new ${action.label}`} onSelect={() => go(action.href)}>
                  <PlusIcon />
                  {action.label}
                  <CommandShortcut>
                    <action.icon />
                  </CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandGroup heading={t("groups.site")}>
              {sitePages.map((page) => (
                <CommandItem key={page.href} value={`site public ${page.label} ${page.href}`} onSelect={() => go(page.href)}>
                  <GlobeIcon />
                  {page.label}
                  <CommandShortcut>
                    <ExternalLinkIcon />
                  </CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandGroup heading={t("groups.tools")}>
              <CommandItem
                value={`language ${t("switchLanguage")}`}
                onSelect={() => {
                  setOpen(false);
                  router.replace(pathname, { locale: otherLocale });
                }}
              >
                <LanguagesIcon />
                {t("switchLanguage")}
              </CommandItem>
              <CommandItem value={`export subscribers csv ${t("exportSubscribers")}`} onSelect={() => go("/api/instructor/subscribers")}>
                <DownloadIcon />
                {t("exportSubscribers")}
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
