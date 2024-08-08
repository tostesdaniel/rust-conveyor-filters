import { Footer } from "@/components/footer";
import { Header } from "@/components/header";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className='container max-w-screen-sm flex-1'>{children}</main>
      <Footer />
    </>
  );
}
