import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className='container max-w-(--breakpoint-sm) flex-1'>
        {children}
      </main>
      <Footer />
    </>
  );
}
