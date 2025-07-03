import { Footer } from "@/components/footer";
import { Header } from "@/components/header";

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
