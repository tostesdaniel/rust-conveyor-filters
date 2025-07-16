import type { Metadata } from "next";
import { Inter, Teko } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { GoogleAnalytics } from "@next/third-parties/google";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { NuqsAdapter } from "nuqs/adapters/next/app";

import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { QueryProvider } from "@/providers/QueryProvider";

import "./globals.css";

import { siteConfig } from "@/config/site";
import { OutboundLinkTracker } from "@/components/analytics/outbound-link-tracker";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const teko = Teko({ subsets: ["latin"], variable: "--font-brand" });

export const metadata: Metadata = {
  title: {
    template: `%s - ${siteConfig.name}`,
    default: siteConfig.name,
  },
  description: "Generate Rust conveyor filters with ease",
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
    <ClerkProvider>
      <html lang='en' suppressHydrationWarning>
        <head>
          <script
            defer
            src='https://umami.rustconveyorfilters.com/script.js'
            data-website-id='0c163345-6b1c-45ed-ab99-f8411b8fa1cb'
          />
          <GoogleAnalytics gaId='G-BGERZ3ES1R' />
        </head>
        <body
          className={cn(
            "min-h-svh bg-background font-sans antialiased",
            inter.variable,
            teko.variable,
          )}
        >
          <QueryProvider>
            <ThemeProvider
              attribute='class'
              defaultTheme='system'
              enableSystem
              disableTransitionOnChange
            >
              <NuqsAdapter>
                <div className='flex min-h-svh flex-col'>{children}</div>
              </NuqsAdapter>
              <Toaster richColors />
            </ThemeProvider>
            <ReactQueryDevtools initialIsOpen={false} />
          </QueryProvider>
          <OutboundLinkTracker />
        </body>
      </html>
    </ClerkProvider>
  );
}
