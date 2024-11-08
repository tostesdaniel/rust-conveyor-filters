import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const bannerVariants = cva(
  "flex items-center justify-center gap-x-6 px-6 py-2.5 text-sm leading-6 sm:px-3.5",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        warning: "bg-secondary text-secondary-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const Banner = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof bannerVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role='alert'
    className={cn(bannerVariants({ variant }), className)}
    {...props}
  />
));
Banner.displayName = "Banner";

const BannerTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5 ref={ref} className={cn("font-bold", className)} {...props} />
));
BannerTitle.displayName = "BannerTitle";

const BannerDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn(className)} {...props} />
));
BannerDescription.displayName = "BannerDescription";

const BannerDismiss = React.forwardRef<
  HTMLButtonElement,
  React.HTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => (
  <div className='flex flex-1 justify-end'>
    <button
      ref={ref}
      type='button'
      className={cn("-m-3 p-3 focus-visible:outline-offset-[-4px]", className)}
      {...props}
    >
      <span className='sr-only'>Dismiss</span>
      <svg
        className='h-5 w-5 text-foreground'
        viewBox='0 0 20 20'
        fill='currentColor'
        aria-hidden='true'
      >
        <path d='M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z' />
      </svg>
    </button>
  </div>
));
BannerDismiss.displayName = "BannerDismiss";

export { Banner, BannerDescription, BannerDismiss, BannerTitle };
