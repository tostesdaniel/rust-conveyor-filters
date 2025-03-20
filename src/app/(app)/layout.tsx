import { Footer } from "@/components/footer";
import { Header } from "@/components/header";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <>
      <Header />
      <main className='flex flex-1 flex-col'>{children}</main>
      <Footer />
    </>
  );
}
