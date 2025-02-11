import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

interface BaseProps {
  center?: boolean;
}

export function HeaderSectionContainer({
  className,
  children,
  center = false,
}: BaseProps & HTMLAttributes<HTMLElement>) {
  return (
    <section
      className={cn("py-24 sm:py-32", center && "px-6 lg:px-8", className)}
    >
      {center ? (
        children
      ) : (
        <div className='mx-auto max-w-7xl px-6 lg:px-8'>{children}</div>
      )}
    </section>
  );
}

export function HeaderSectionContent({
  className,
  children,
  center = false,
}: BaseProps & HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "mx-auto max-w-2xl",
        center ? "text-center" : "lg:mx-0",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function HeaderSectionEyebrow({
  className,
  children,
}: React.HtmlHTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-base/7 font-semibold text-blue-400", className)}>
      {children}
    </p>
  );
}

export function HeaderSectionTitle({
  className,
  children,
}: React.HtmlHTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn(
        "mt-2 text-5xl font-semibold tracking-tight sm:text-7xl",
        className,
      )}
    >
      {children}
    </h2>
  );
}

export function HeaderSectionDescription({
  className,
  children,
}: React.HtmlHTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        "mt-8 text-lg font-medium text-pretty text-muted-foreground sm:text-xl/8",
        className,
      )}
    >
      {children}
    </p>
  );
}
