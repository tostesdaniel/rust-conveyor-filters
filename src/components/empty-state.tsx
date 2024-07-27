import { UrlObject } from "url";
import Link from "next/link";
import { type LucideIcon } from "lucide-react";

import { Button } from "./ui/button";

interface EmptyStateProps {
  Icon: LucideIcon;
  title: string;
  description: string;
  label: string;
  ButtonIcon: LucideIcon;
  redirectUrl: string | UrlObject;
}

export function EmptyState({
  Icon,
  title,
  description,
  label,
  ButtonIcon,
  redirectUrl,
}: EmptyStateProps) {
  return (
    <div className='mt-6 text-center'>
      <Icon className='mx-auto h-12 w-12' />
      <h3 className='mt-2 text-sm font-semibold'>{title}</h3>
      <p className='mt-1 text-sm'>{description}</p>
      <div className='mt-6'>
        <Button size='sm' asChild>
          <Link href={redirectUrl}>
            <ButtonIcon className='-ml-0.5 mr-1.5 h-5 w-5' aria-hidden='true' />
            {label}
          </Link>
        </Button>
      </div>
    </div>
  );
}
