// The real layout is [locale]/layout.tsx, which renders <html> in the visitor's language. This
// pass-through only exists so app/not-found.tsx can answer requests that never reach a locale
// (next-intl's recommended setup for catching unknown routes).
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
