import { UrlObject } from "url";
import Link from "next/link";
import { VariantProps } from "class-variance-authority";
import { LucideIcon } from "lucide-react";

import { Button } from "./button";
import { Typography, typographyVariants } from "./typography";

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
      <div className='mt-4 flex md:ml-4 md:mt-0'>
        <Button type='button' size='sm' asChild>
          <Link href={redirectUrl}>
            {ActionIcon && (
              <ActionIcon
                className='-ml-0.5 mr-1.5 h-5 w-5'
                aria-hidden='true'
              />
            )}
            {buttonLabel}
          </Link>
        </Button>
      </div>
    </div>
  );
}
