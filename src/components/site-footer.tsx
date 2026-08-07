import Link from "next/link"

import { SiteLogo } from "@/components/site-logo"
import { googleMapsDirectionsUrl, navLinks, siteConfig } from "@/lib/site"

export function SiteFooter() {
  return (
    // Dark, like the closing band above it on the home page: the two together
    // are the black base the white pages sit on. `dark` sets the tokens on this
    // element, so bg-background here is the dark background, not the page's.
    <footer className="dark border-t-2 border-brand bg-background text-foreground">
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
            {/* The three contact links stay white so they read as text, but
                their underlines are orange — the accent marks what is clickable
                without tinting anything you actually have to read. */}
            <a
              href={siteConfig.phone.href}
              className="mt-3 block text-sm underline decoration-brand underline-offset-4 transition-colors hover:text-brand"
            >
              {siteConfig.phone.display}
            </a>
            <a
              href={`mailto:${siteConfig.email}`}
              className="mt-2 block text-sm break-all underline decoration-brand underline-offset-4 transition-colors hover:text-brand"
            >
              {siteConfig.email}
            </a>
            <a
              href={googleMapsDirectionsUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block text-sm underline decoration-brand underline-offset-4 transition-colors hover:text-brand"
            >
              Route in Google Maps
            </a>
          </div>

          <nav className="flex flex-col gap-2.5 text-sm sm:items-end">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-muted-foreground transition-colors hover:text-brand"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex flex-col gap-2 border-t border-brand-line pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {siteConfig.name}
          </p>
          <p>
            Website gemaakt door{" "}
            <a
              href="https://goldencoil.nl"
              target="_blank"
              rel="noreferrer"
              className="text-foreground underline decoration-brand underline-offset-4 transition-colors hover:text-brand"
            >
              GoldenCoil
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
