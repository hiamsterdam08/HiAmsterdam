"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { MenuIcon } from "lucide-react"

import { SiteLogo } from "@/components/site-logo"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { navLinks } from "@/lib/site"

// The home page marks where its hero ends with [data-header-reveal]. Should that
// mark ever go missing, a sliver of scrolling reveals the bar rather than
// stranding it off-screen.
const FALLBACK_REVEAL_PX = 64

// The bar's own height, mirrored from the toolbar below — the spacer on pages
// that show it from the start has to reserve exactly this much.
const BAR_HEIGHT = "h-16 sm:h-18"

/**
 * True once the page has scrolled past the hero, or past a sliver without one.
 * Skipped entirely when `enabled` is false — those pages show the bar outright.
 */
function useRevealedOnScroll(enabled: boolean) {
  const [revealed, setRevealed] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    if (!enabled) return

    const sentinel = document.querySelector<HTMLElement>("[data-header-reveal]")
    let frame = 0

    const update = () => {
      frame = 0
      // Read the sentinel's position every time rather than caching it, so the
      // reveal point follows the hero when the viewport resizes or an image
      // finishes loading and reflows the page.
      const revealAt = sentinel
        ? sentinel.getBoundingClientRect().top + window.scrollY
        : FALLBACK_REVEAL_PX
      setRevealed(window.scrollY >= revealAt)
    }

    const onScroll = () => {
      frame ||= requestAnimationFrame(update)
    }

    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)

    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
    }
    // Re-measure on navigation: the next page has its own hero, or none at all.
  }, [enabled, pathname])

  return revealed
}

/** The full link set, in a sheet, for widths too narrow for a row of links. */
function MobileNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon-lg" className="-mr-2 size-11 sm:hidden">
          <MenuIcon className="size-5" />
          <span className="sr-only">Menu openen</span>
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-72 gap-0">
        <SheetHeader className="p-6">
          <SheetTitle>
            <SiteLogo />
          </SheetTitle>
        </SheetHeader>

        <nav className="flex flex-col px-6">
          {navLinks.map((link) => {
            const current = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={current ? "page" : undefined}
                onClick={() => setOpen(false)}
                className={cn(
                  "border-b py-4 text-base transition-colors last:border-b-0",
                  current
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>
      </SheetContent>
    </Sheet>
  )
}

// Fixed rather than in flow, so the home page starts at the very top of the
// window and the bar slides in over it once the hero is behind you. Every other
// page has no hero to reveal past, so there the bar is simply always there and a
// spacer keeps the content out from under it.
export function SiteHeader() {
  const pathname = usePathname()
  const isHome = pathname === "/"
  const revealed = useRevealedOnScroll(isHome)
  const shown = !isHome || revealed

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 border-b bg-band",
          "transition-[opacity,transform,visibility] duration-300 ease-out motion-reduce:transition-none",
          // `invisible` rather than opacity alone, so the links leave the tab
          // order and the screen reader while the bar is tucked away.
          shown
            ? "visible translate-y-0 opacity-100"
            : "invisible -translate-y-full opacity-0"
        )}
      >
        <div
          className={cn(
            "container-page flex items-center justify-between gap-4",
            BAR_HEIGHT
          )}
        >
          <Link href="/" className="transition-opacity hover:opacity-70">
            <SiteLogo />
          </Link>

          <nav className="hidden items-center gap-5 text-sm sm:flex sm:gap-7">
            <Link
              href="/over-ons"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Over ons
            </Link>
            <Link
              href="/maak-een-afspraak"
              className="transition-opacity hover:opacity-70"
            >
              Afspraak
            </Link>
          </nav>

          <MobileNav />
        </div>
      </header>

      {!isHome && (
        <div className={cn("shrink-0", BAR_HEIGHT)} aria-hidden="true" />
      )}
    </>
  )
}
