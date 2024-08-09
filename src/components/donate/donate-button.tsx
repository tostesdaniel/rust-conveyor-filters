import { Button, type ButtonProps } from "@/components/ui/button";

interface DonateButtonProps extends ButtonProps {
  icon?: React.ReactNode;
  children: React.ReactNode;
  href: string;
}

export function DonateButton({
  icon,
  href,
  children,
  ...props
}: DonateButtonProps) {
  return (
    <Button asChild {...props}>
      <a href={href} target='_blank' rel='noopener noreferrer'>
        {icon && <span className='mr-2 h-5 w-5'>{icon}</span>}
        {children}
      </a>
    </Button>
  );
}
