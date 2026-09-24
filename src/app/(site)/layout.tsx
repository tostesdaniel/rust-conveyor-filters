import { TRPCReactProvider } from "@/trpc/react";
import { ClerkProvider } from "@clerk/nextjs";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import { SessionTick } from "@/components/features/donation/session-tick";
import { BannerWrapper } from "@/components/layout/banner-wrapper";

interface SiteLayoutProps {
  children: React.ReactNode;
}

export default function SiteLayout({ children }: SiteLayoutProps) {
  return (
    <ClerkProvider>
      <TRPCReactProvider>
        <div className='isolate flex min-h-svh flex-col'>{children}</div>
        <SessionTick />
        <BannerWrapper />
        <ReactQueryDevtools initialIsOpen={false} />
      </TRPCReactProvider>
    </ClerkProvider>
  );
}
