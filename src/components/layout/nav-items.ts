export const publicNavItems = [
  { href: "/", label: "home" },
  { href: "/practices", label: "practices" },
  { href: "/programs", label: "programs" },
  { href: "/journal", label: "journal" },
  { href: "/about", label: "about" },
  { href: "/membership", label: "membership" },
] as const;

export function isActivePath(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}
