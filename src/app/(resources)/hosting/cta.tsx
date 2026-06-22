import { buildPineUrl, type PinePlacement } from "@/config/pine";
import { cn } from "@/lib/utils";

export function PineCta({
  children,
  className,
  placement = "hosting-page",
}: {
  children: React.ReactNode;
  className?: string;
  placement?: PinePlacement;
}) {
  return (
    <a
      href={buildPineUrl()}
      target='_blank'
      rel='sponsored noopener'
      data-umami-event='pine-click'
      data-umami-event-placement={placement}
      className={cn(
        "group inline-flex items-center justify-center gap-2 rounded-md font-medium transition-all",
        className,
      )}
    >
      {children}
    </a>
  );
}
