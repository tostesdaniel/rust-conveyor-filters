import type { Metadata } from "next";
import { AboutHero } from "@/components/pages/about/about-hero";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about Rust Conveyor Filters — the tool for creating, sharing, and exporting Rust industrial conveyor filter setups.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return <AboutHero />;
}
