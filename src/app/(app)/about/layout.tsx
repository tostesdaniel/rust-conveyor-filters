import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Daniel Tostes - ohTostt | Software Developer & Gamer",
  description:
    "Learn more about Daniel, also known as ohTostt in the gaming world. Discover his passion for software development and gaming, especially Rust.",
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className='container'>{children}</div>;
}
