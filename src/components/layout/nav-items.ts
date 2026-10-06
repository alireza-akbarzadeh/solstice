export const publicNavItems = [
  { href: "/", label: "home" },
  { href: "/practices", label: "practices" },
  { href: "/classes", label: "classes" },
  { href: "/programs", label: "programs" },
  { href: "/journal", label: "journal" },
  { href: "/about", label: "about" },
  { href: "/membership", label: "membership" },
] as const;

// The signed-in area: account menu, mobile menu and the member tabs.
export const memberNavItems = [
  { href: "/dashboard", label: "today" },
  { href: "/my-practices", label: "myPractices" },
  { href: "/progress", label: "progress" },
  { href: "/community", label: "community" },
  // 1:1 guidance; without a guidance plan the page explains which plan includes it.
  { href: "/guidance", label: "messages" },
  { href: "/profile", label: "profile" },
] as const;

export function isActivePath(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}
