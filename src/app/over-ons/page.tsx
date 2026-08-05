import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"

import { GoogleMap } from "@/components/google-map"
import { Button } from "@/components/ui/button"
import { photos, services, siteConfig } from "@/lib/site"

export const metadata: Metadata = {
  title: "Over ons",
  description: `Over ${siteConfig.name}: waar we zitten en wat we doen.`,
}

export default function OverOnsPage() {
  return (
    <main>
      <section className="container-page py-14 sm:py-20">
        <p className="eyebrow">Over ons</p>
        <h1 className="mt-4 max-w-2xl text-3xl font-medium tracking-tight text-balance sm:text-5xl">
          Een vaste stoel in Amsterdam
        </h1>

        {/* Placeholder copy — replace with the real thing. */}
        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)] lg:gap-16">
          <div className="flex flex-col gap-5 text-base leading-relaxed text-muted-foreground">
            <p>Uw text hier</p>

            <div className="mt-2">
              <Button
                asChild
                variant="brand"
                className="h-12 rounded-xl px-7 text-base"
              >
                <Link href="/maak-een-afspraak">Maak een afspraak</Link>
              </Button>
            </div>
          </div>

          <div className="relative aspect-3/4 overflow-hidden rounded-xl bg-muted lg:aspect-4/5">
            <Image
              src={photos.aboutPortrait.src}
              alt={photos.aboutPortrait.alt}
              fill
              sizes="(min-width: 1024px) 340px, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* Same three services as the homepage tarieven, so they wear the same
          orange rule and the same orange price — a visitor arriving here first
          should recognise the block when they meet it there. */}
      <section className="border-t border-brand-line">
        <div className="container-page py-14 sm:py-16">
          <h2 className="eyebrow">Wat we doen</h2>
          <div className="mt-8 grid gap-8 sm:grid-cols-3 sm:gap-10">
            {services.map((service) => (
              <div
                key={service.title}
                className="border-t border-brand-line pt-4 sm:pt-5"
              >
                <h3 className="text-lg font-medium tracking-tight text-balance">
                  {service.title}
                </h3>
                <p className="mt-2 text-xl font-medium tracking-tight text-brand-ink tabular-nums">
                  {service.price}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-brand-line">
        <div className="container-page py-14 sm:py-20">
          <h2 className="text-2xl font-medium tracking-tight sm:text-3xl">
            Zo vind je ons
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
            We zitten op loopafstand van tramhalte Zeeburgerstraat. Fiets kwijt
            voor de deur, en je staat binnen.
          </p>

          <div className="mt-8">
            <GoogleMap />
          </div>
        </div>
      </section>
    </main>
  )
}
