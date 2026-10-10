import Image from "next/image";

type Props = { name: string; studio: string; logoAlt: string; logoUrl?: string };

export function BrandLockup({ name, studio, logoAlt, logoUrl }: Props) {
  return (
    <span className="group inline-flex min-w-0 max-w-full items-center gap-2 sm:gap-2.5">
      <Image
        src={logoUrl ?? "/images/brand/logo.svg"}
        alt={logoAlt}
        width={36}
        height={42}
        className="h-9 w-auto shrink-0 object-contain transition-transform duration-300 group-hover:scale-105 sm:h-[40px] dark:brightness-125 dark:contrast-105"
        sizes="36px"
        priority
        unoptimized
      />
      <span className="flex min-w-0 flex-col gap-0.5 sm:gap-1">
        <span className="truncate font-heading text-[1.625rem] sm:text-[1.875rem] leading-none font-semibold tracking-[-0.02em] text-primary rtl:text-[1.375rem] sm:rtl:text-[1.5rem] rtl:leading-[1.2] rtl:font-medium">
          {name}
        </span>
        <span className="truncate font-sans text-[0.5625rem] sm:text-[0.625rem] leading-none font-semibold tracking-[0.12em] uppercase text-primary/70 rtl:text-[0.6875rem] rtl:leading-[1.3] rtl:tracking-normal rtl:normal-case">
          {studio}
        </span>
      </span>
    </span>
  );
}
