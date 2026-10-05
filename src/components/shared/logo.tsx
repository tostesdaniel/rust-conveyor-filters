import { cn } from "@/lib/utils";

export function LogoMark({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='54 26 150 206'
      aria-hidden='true'
      className={cn("h-10 w-auto shrink-0", className)}
      {...props}
    >
      <path
        fill='currentColor'
        d='M64 212V68a32 32 0 0 1 32-32h88v48h-64a8 8 0 0 0-8 8v20h50v40h-50v60z'
      />
      <g className='fill-brand'>
        <rect x='188' y='26' width='16' height='68' rx='3' />
        <rect x='166' y='102' width='16' height='60' rx='3' />
        <rect x='54' y='216' width='68' height='16' rx='3' />
      </g>
    </svg>
  );
}

export function Logo({
  className,
  markClassName,
  ...props
}: React.ComponentProps<"span"> & { markClassName?: string }) {
  return (
    <span
      className={cn(
        "flex items-start gap-[0.375em] text-[40px] leading-none",
        className,
      )}
      {...props}
    >
      <LogoMark className={cn("h-[1em]", markClassName)} />
      <span className='mt-[0.08em] flex flex-col font-brand uppercase'>
        <span className='text-[0.447em] leading-none font-medium tracking-[0.02em]'>
          Rust Conveyor
        </span>
        <span className='-mt-[0.11em] text-[0.728em] leading-none font-bold tracking-[0.01em]'>
          Filters
        </span>
      </span>
    </span>
  );
}
