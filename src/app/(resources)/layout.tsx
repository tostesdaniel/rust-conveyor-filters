import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";

export default function ResourcesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className='container flex-1 px-0 sm:px-8'>{children}</main>
      <Footer />
    </>
  );
}
