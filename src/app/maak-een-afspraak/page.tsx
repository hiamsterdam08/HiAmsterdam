import type { Metadata } from "next"
import { MapPin } from "lucide-react"

import { ReservationForm } from "@/components/reservation-form"
import {
  formattedAddress,
  googleMapsDirectionsUrl,
  siteConfig,
} from "@/lib/site"

export const metadata: Metadata = {
  title: "Maak een afspraak",
  description: `Reserveer online een plek bij ${siteConfig.name} aan de ${siteConfig.address.street} in Amsterdam.`,
}

export default function MaakEenAfspraakPage() {
  return (
    <main className="container-page py-14 sm:py-20">
      <p className="text-xs font-medium tracking-[0.22em] text-brand uppercase">
        Reserveren
      </p>
      <h1 className="mt-4 max-w-2xl text-3xl font-medium tracking-tight text-balance sm:text-5xl">
        Maak een afspraak
      </h1>

      <div className="mt-12 grid gap-12 sm:mt-14 lg:grid-cols-[minmax(0,1fr)_260px] lg:gap-16">
        <ReservationForm />

        <aside className="lg:border-l lg:pl-10">
          <h2 className="font-sans text-xs font-medium tracking-[0.22em] text-brand uppercase">
            Waar vind je ons
          </h2>
          <p className="mt-4 flex gap-3 text-sm leading-relaxed">
            <MapPin
              className="mt-0.5 size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <span>
              {siteConfig.address.street}
              <br />
              {siteConfig.address.postalCode} {siteConfig.address.city}
            </span>
          </p>
          <a
            href={googleMapsDirectionsUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-block text-sm underline underline-offset-4 transition-opacity hover:opacity-70"
          >
            Route naar {formattedAddress}
          </a>
        </aside>
      </div>
    </main>
  )
}
