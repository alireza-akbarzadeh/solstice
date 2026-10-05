import {
  BookOpenIcon,
  ChartColumnIcon,
  CreditCardIcon,
  FileTextIcon,
  Flower2Icon,
  LayoutGridIcon,
  MailIcon,
  MegaphoneIcon,
  MessagesSquareIcon,
  NotebookPenIcon,
  SettingsIcon,
  ShapesIcon,
  TagIcon,
  UsersIcon,
  WalletIcon,
  type LucideIcon,
} from "lucide-react";

/** Unread-style counts the sidebar surfaces, so the instructor sees work without opening pages. */
export type StudioBadges = { drafts: number; awaiting: number; review: number; community: number };

/** A key in the `Studio.nav` messages. */
export type StudioNavLabel = keyof Messages["Studio"]["nav"];

export type StudioNavItem = {
  href: string;
  label: StudioNavLabel;
  icon: LucideIcon;
  exact?: true;
  badge?: keyof StudioBadges;
};

/**
 * The studio's sections, shared by the sidebar, the header breadcrumb and the command
 * palette so the three never disagree.
 */
export const studioNavGroups: readonly { label: StudioNavLabel; items: readonly StudioNavItem[] }[] = [
  {
    label: "studio",
    items: [
      { href: "/instructor", label: "overview", icon: LayoutGridIcon, exact: true },
      { href: "/instructor/insights", label: "insights", icon: ChartColumnIcon },
      { href: "/instructor/settings", label: "settings", icon: SettingsIcon },
    ],
  },
  {
    label: "content",
    items: [
      { href: "/instructor/videos", label: "practices", icon: Flower2Icon, badge: "drafts" },
      { href: "/instructor/programs", label: "programs", icon: BookOpenIcon },
      { href: "/instructor/journal", label: "journal", icon: NotebookPenIcon },
      { href: "/instructor/categories", label: "categories", icon: ShapesIcon },
      { href: "/instructor/pages", label: "pages", icon: FileTextIcon },
    ],
  },
  {
    label: "people",
    items: [
      { href: "/instructor/members", label: "members", icon: UsersIcon },
      { href: "/instructor/community", label: "community", icon: MessagesSquareIcon, badge: "community" },
      { href: "/instructor/posts", label: "announcements", icon: MegaphoneIcon },
      { href: "/instructor/subscribers", label: "subscribers", icon: MailIcon },
    ],
  },
  {
    label: "business",
    items: [
      { href: "/instructor/plans", label: "plans", icon: TagIcon },
      { href: "/instructor/payments", label: "payments", icon: WalletIcon },
      { href: "/instructor/revenue", label: "revenue", icon: CreditCardIcon },
    ],
  },
];

const allItems = studioNavGroups.flatMap((group) => group.items);

/** The section a studio path belongs to; the longest matching prefix wins. */
export function studioSectionFor(pathname: string) {
  return [...allItems]
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => pathname === item.href || (!item.exact && pathname.startsWith(`${item.href}/`)));
}
