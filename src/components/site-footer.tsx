import Link from "next/link"

import { SiteLogo } from "@/components/site-logo"
import { googleMapsDirectionsUrl, navLinks, siteConfig } from "@/lib/site"

export function SiteFooter() {
  return (
    // Dark, like the closing band above it on the home page: the two together
    // are the black base the white pages sit on. `dark` sets the tokens on this
    // element, so bg-background here is the dark background, not the page's.
    <footer className="dark border-t bg-background text-foreground">
      <div className="container-page flex flex-col gap-10 py-12 sm:py-14">
        <div className="flex flex-col gap-8 sm:flex-row sm:justify-between sm:gap-12">
          <div>
            <SiteLogo />
            {/* itemProp-free but still machine-readable: <address> marks this as
                the contact address for the page. */}
            <address className="mt-3 text-sm leading-relaxed text-muted-foreground not-italic">
              {siteConfig.address.street}
              <br />
              {siteConfig.address.postalCode} {siteConfig.address.city}
            </address>
            <a
              href={siteConfig.phone.href}
              className="mt-3 block text-sm underline underline-offset-4 transition-opacity hover:opacity-70"
            >
              {siteConfig.phone.display}
            </a>
            <a
              href={`mailto:${siteConfig.email}`}
              className="mt-2 block text-sm break-all underline underline-offset-4 transition-opacity hover:opacity-70"
            >
              {siteConfig.email}
            </a>
            <a
              href={googleMapsDirectionsUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block text-sm underline underline-offset-4 transition-opacity hover:opacity-70"
            >
              Route in Google Maps
            </a>
          </div>

          <nav className="flex flex-col gap-2.5 text-sm sm:items-end">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex flex-col gap-2 border-t pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {siteConfig.name}
          </p>
          <p>
            Website gemaakt door{" "}
            <span className="text-foreground">GoldenCoil</span>
          </p>
        </div>
      </div>
    </footer>
  )
}
