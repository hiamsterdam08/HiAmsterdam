import type { Metadata, Viewport } from "next"
import { Noto_Sans, Noto_Serif } from "next/font/google"

import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { siteConfig } from "@/lib/site"

import "./globals.css"

// Siblings from the same superfamily: they share a skeleton and their
// x-heights line up, so headings and body read as one system rather than two
// borrowed voices. Both are variable, so each is a single file.
const notoSerif = Noto_Serif({
  variable: "--font-noto-serif",
  subsets: ["latin"],
  display: "swap",
})

const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin"],
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s · ${siteConfig.shortName}`,
  },
  description: siteConfig.description,
}

// Matches the dark --background, so mobile browser chrome blends with the page.
export const viewport: Viewport = {
  themeColor: "#0a0a0a",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="nl"
      className={`dark ${notoSerif.variable} ${notoSans.variable} h-full antialiased`}
    >
      {/* Column layout so the footer sits at the bottom of short pages instead
          of floating mid-screen. */}
      <body className="flex min-h-full flex-col overflow-x-hidden">
        <SiteHeader />
        <div className="flex-1">{children}</div>
        <SiteFooter />
      </body>
    </html>
  )
}
