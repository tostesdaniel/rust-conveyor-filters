import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";

interface StackedLayoutProps {
  children: React.ReactNode;
}

export default function StackedLayout({ children }: StackedLayoutProps) {
  return (
    <>
      <Header />
      <main className='flex flex-1 flex-col'>{children}</main>
      <Footer />
    </>
  );
}
