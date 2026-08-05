import { Navigation } from "lucide-react"

import { Button } from "@/components/ui/button"
import { formattedAddress, googleMapsDirectionsUrl, siteConfig } from "@/lib/site"

// The keyless Google Maps embed: same iframe you get from "Delen → Kaart
// insluiten" on maps.google.com, but built from the address instead of a
// copy-pasted URL, so it follows siteConfig. No API key, no billing account.
const embedSrc = `https://maps.google.com/maps?q=${encodeURIComponent(
  formattedAddress
)}&z=16&hl=nl&output=embed`

export function GoogleMap() {
  return (
    <div className="overflow-hidden rounded-xl border border-brand-line">
      <div className="relative aspect-4/3 w-full bg-muted sm:aspect-16/9">
        <iframe
          title={`Kaart met de locatie van ${siteConfig.name}`}
          src={embedSrc}
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          className="absolute inset-0 size-full border-0"
        />
      </div>

      <div className="flex flex-col gap-4 border-t border-brand-line bg-brand-soft p-5 sm:flex-row sm:items-center sm:justify-between">
        <address className="text-sm leading-relaxed not-italic">
          {siteConfig.address.street}
          <br />
          <span className="text-muted-foreground">
            {siteConfig.address.postalCode} {siteConfig.address.city}
          </span>
        </address>

        {/* Outline rather than filled: the booking button is the orange one on
            this page, and a second fill would put them in competition. The
            arrow carries the accent instead. */}
        <Button
          asChild
          variant="outline"
          className="h-10 rounded-lg border-brand-line bg-background px-4 hover:bg-brand-soft"
        >
          <a href={googleMapsDirectionsUrl} target="_blank" rel="noreferrer">
            <Navigation className="text-brand-ink" aria-hidden="true" />
            Route plannen
          </a>
        </Button>
      </div>
    </div>
  )
}
