import { UrlObject } from "url";
import Link from "next/link";
import { VariantProps } from "class-variance-authority";
import { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Typography, typographyVariants } from "@/components/shared/typography";

interface HeadingWithActionProps {
  as?: string;
  buttonLabel: string;
  label: string;
  redirectUrl: string | UrlObject;
  variant: VariantProps<typeof typographyVariants>["variant"];
  ActionIcon: LucideIcon;
}

export function HeadingWithAction({
  as,
  buttonLabel,
  label,
  redirectUrl,
  variant,
  ActionIcon,
}: HeadingWithActionProps) {
  return (
    <div className='md:flex md:items-center md:justify-between'>
      <div className='min-w-0 flex-1'>
        <Typography variant={variant} as={as}>
          {label}
        </Typography>
      </div>
      <div className='mt-4 flex md:mt-0 md:ml-4'>
        <Button type='button' asChild>
          <Link href={redirectUrl}>
            {ActionIcon && <ActionIcon aria-hidden='true' />}
            {buttonLabel}
          </Link>
        </Button>
      </div>
    </div>
  );
}
