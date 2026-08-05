import Image from "next/image"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  formattedAddress,
  openingHours,
  photos,
  services,
  siteConfig,
} from "@/lib/site"

// A booking CTA sized up from the default button scale. Full width on phones so
// it stays an easy target, hugging its label from sm up.
const ctaClassName = "h-14 w-full rounded-xl px-8 text-base sm:w-auto sm:px-10"

export default function HomePage() {
  return (
    <main>
      {/* Holds the whole first screen, so nothing below it shows until you
          scroll. On phones and portrait tablets the photo takes the leftover
          height above the copy so both fit that screen and the copy stays
          legible; from md up both children share one grid cell and the copy sits
          on top of the image as a full-bleed hero. */}
      <section className="relative grid min-h-svh grid-rows-[1fr_auto] overflow-hidden md:grid-rows-1">
        <div className="relative min-h-[260px] md:[grid-area:1/1]">
          <Image
            src={photos.homeHero.src}
            alt={photos.homeHero.alt}
            fill
            preload
            sizes="100vw"
            className="object-cover object-center"
          />
          {/* Scrim weighted to the bottom, where the copy sits — the top of the
              frame stays clear so the photo itself reads. */}
          <div
            className="absolute inset-0 bg-gradient-to-t from-background via-transparent via-35% to-transparent md:via-background/75 md:via-55% md:to-background/15"
            aria-hidden="true"
          />
        </div>

        <div className="container-page relative pt-8 pb-14 sm:pt-10 sm:pb-16 md:[grid-area:1/1] md:self-end md:pt-32 md:pb-28">
          <p className="text-xs font-medium tracking-[0.22em] text-brand uppercase">
            Welkom bij
          </p>

          <h1 className="mt-4 max-w-3xl text-4xl leading-[1.05] font-medium tracking-tight text-balance sm:mt-6 sm:text-6xl sm:leading-[1.02] lg:text-7xl">
            {siteConfig.name}
          </h1>

          <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground sm:mt-6 sm:text-lg">
            Uw kapsalon in Amsterdam-Oost. Met een afspraak of loop
            gewoon binnen. {formattedAddress}.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:items-center">
            <Button asChild className={ctaClassName}>
              <Link href="/maak-een-afspraak">Maak een afspraak</Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              className="h-14 w-full rounded-xl px-6 text-base text-muted-foreground sm:w-auto"
            >
              <Link href="/over-ons">Over ons</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Marks the end of the hero: the header stays hidden above this line and
          slides in below it. Zero-height, so it costs the layout nothing. */}
      <div data-header-reveal aria-hidden="true" />

      {/* Tarieven. The three prices are the thing most visitors come for, so they
          get their own full-width band right under the hero. */}
      <section className="border-t bg-band">
        <div className="container-page py-16 sm:py-24">
          <p className="text-xs font-medium tracking-[0.22em] text-brand uppercase">
            Tarieven
          </p>

          {/* Stacked rows on phones, three columns from md. Each row keeps the
              service and its price on one baseline, with a rule between them. */}
          <ul className="mt-8 grid gap-0 sm:mt-10 md:grid-cols-3 md:gap-8">
            {services.map((service) => (
              <li
                key={service.title}
                className="flex items-baseline justify-between gap-4 border-t py-5 md:flex-col md:items-start md:gap-3 md:py-0 md:pt-6"
              >
                <h2 className="text-lg font-medium tracking-tight text-balance sm:text-xl">
                  {service.title}
                </h2>
                <p className="shrink-0 text-2xl font-medium tracking-tight tabular-nums sm:text-3xl">
                  {service.price}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Openingstijden. Its own band under the tarieven, same rhythm — the two
          questions a walk-in has, answered back to back. */}
      <section className="border-t">
        <div className="container-page py-16 sm:py-20">
          <p className="text-xs font-medium tracking-[0.22em] text-brand uppercase">
            Openingstijden
          </p>

          {/* <dl> so the days really are labels for the hours. The rows stay
              two-column at every width; only the type scale grows. */}
          <dl className="mt-8 max-w-xl sm:mt-10">
            {openingHours.map((entry) => (
              <div
                key={entry.days}
                className="flex items-baseline justify-between gap-6 border-t py-4 sm:py-5"
              >
                <dt className="text-base font-medium tracking-tight sm:text-lg">
                  {entry.days}
                </dt>
                <dd
                  className={`shrink-0 text-base tracking-tight tabular-nums sm:text-lg ${
                    entry.closed ? "text-muted-foreground" : "font-medium"
                  }`}
                >
                  {entry.hours}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="border-t">
        <div className="container-page py-16 sm:py-20">

          {/* Two up on phones, four across from lg — however many photos
              content.yml lists, the grid wraps them. A fixed 3:4 frame keeps the
              row even even though the source photos differ in height. */}
          <ul className="mt-10 grid grid-cols-2 gap-3 sm:mt-12 sm:gap-4 lg:grid-cols-4">
            {photos.homeGallery.map((photo, index) => (
              <li
                // Keyed by position: the same photo may legitimately be listed
                // twice, so `src` is not unique.
                key={index}
                className="relative aspect-3/4 overflow-hidden rounded-xl bg-muted"
              >
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  sizes="(min-width: 1024px) 25vw, 50vw"
                  className="object-cover transition-transform duration-500 hover:scale-105"
                />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-t">
        <div className="container-page flex flex-col items-center gap-6 py-16 text-center sm:gap-7 sm:py-20">
          <h2 className="max-w-lg text-2xl font-medium tracking-tight text-balance sm:text-3xl">
            Boek online een afspraak!
          </h2>
          <Button asChild className={ctaClassName}>
            <Link href="/maak-een-afspraak">Maak een afspraak</Link>
          </Button>
        </div>
      </section>
    </main>
  )
}
