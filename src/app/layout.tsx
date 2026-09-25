import type { Metadata } from "next";
import { Inter, Teko } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";

import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/shared/theme-provider";

import "./globals.css";

import { siteConfig } from "@/config/site";
import { Nitro } from "@/lib/nitro";
import { Analytics } from "@/components/features/analytics/analytics";
import { PathnamePageviews } from "@/components/features/analytics/pathname-pageviews";
import { SiteJsonLd } from "@/components/shared/site-json-ld";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const teko = Teko({ subsets: ["latin"], variable: "--font-brand" });

export const metadata: Metadata = {
  title: {
    template: `%s - ${siteConfig.name}`,
    default: siteConfig.name,
  },
  description: siteConfig.description,
  metadataBase: new URL(siteConfig.url),
  keywords: [
    "Rust",
    "Conveyor",
    "Industrial Conveyor",
    "Conveyor Filters",
    "Automation",
  ],
  authors: {
    name: "Daniel Tostes",
    url: "https://github.com/tostesdaniel",
  },
  creator: "Daniel Tostes",
  publisher: siteConfig.name,
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: siteConfig.name,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
    creator: "@RustFiltersApp",
    site: "@RustFiltersApp",
  },
  manifest: "/manifest.webmanifest",
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' suppressHydrationWarning>
      <head>
        <SiteJsonLd />
        <Analytics />
        <GoogleAnalytics gaId='G-BGERZ3ES1R' />
        <Nitro />
      </head>
      <body
        className={cn(
          "min-h-svh overflow-x-clip bg-background font-sans antialiased",
          inter.variable,
          teko.variable,
        )}
      >
        <ThemeProvider
          attribute='class'
          defaultTheme='system'
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            <NuqsAdapter>{children}</NuqsAdapter>
            <Toaster richColors />
          </TooltipProvider>
        </ThemeProvider>
        <PathnamePageviews />
      </body>
    </html>
  );
}
