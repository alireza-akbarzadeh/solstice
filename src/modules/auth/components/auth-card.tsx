import { Container } from "@/components/layout/container";

// A single centered card for the smaller account pages (recovery, verification, mailbox).
export function AuthCard({
  eyebrow,
  title,
  lede,
  children,
  wide = false,
}: {
  eyebrow: string;
  title: string;
  lede?: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <Container className="py-8 md:py-16">
      <div className={`mx-auto flex flex-col gap-6 rounded-2xl bg-surface-container-low p-6 shadow-ambient md:p-10 ${wide ? "max-w-3xl" : "max-w-md"}`}>
        <header>
          <p className="mb-2 font-label-md text-label-md tracking-widest text-clay uppercase">{eyebrow}</p>
          <h1 className="font-headline-md text-headline-md text-primary">{title}</h1>
          {lede && <p className="mt-2 font-body-md text-body-md text-on-surface-variant">{lede}</p>}
        </header>
        {children}
      </div>
    </Container>
  );
}
