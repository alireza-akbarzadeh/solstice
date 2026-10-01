import Image from "next/image";

type Props = { name: string; studio: string; logoAlt: string };

export function BrandLockup({ name, studio, logoAlt }: Props) {
  return (
    <span className="inline-flex shrink-0 items-center gap-2.5">
      <Image
        src="/images/brand/logo.svg"
        alt={logoAlt}
        width={36}
        height={42}
        className="h-[42px] w-9 shrink-0 object-contain"
        sizes="36px"
        priority
        unoptimized
      />
      <span className="flex flex-col gap-1">
        <span className="font-heading text-[1.875rem] leading-none font-semibold tracking-[-0.02em] text-primary rtl:text-[1.5rem] rtl:leading-[1.2] rtl:font-medium">
          {name}
        </span>
        <span className="font-sans text-[0.625rem] leading-none font-medium tracking-[0.08em] text-primary/65 rtl:text-[0.6875rem] rtl:leading-[1.3]">
          {studio}
        </span>
      </span>
    </span>
  );
}
