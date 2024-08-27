import type { Metadata } from "next";

import { MigrateAuthorIdsBanner } from "@/components/migrate-author-ids-banner";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

type AuthLayoutProps = {
  children: React.ReactNode;
};

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <>
      <MigrateAuthorIdsBanner />
      <div className='grid w-full flex-1 items-center px-4 sm:justify-center'>
        {children}
      </div>
    </>
  );
}
