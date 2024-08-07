import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

type MyFiltersLayoutProps = {
  children: React.ReactNode;
};

export default function MyFiltersLayout({ children }: MyFiltersLayoutProps) {
  return <div className='container'>{children}</div>;
}
