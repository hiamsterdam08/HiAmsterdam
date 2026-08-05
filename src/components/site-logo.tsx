import { Scissors } from "lucide-react"

import { cn } from "@/lib/utils"
import { siteConfig } from "@/lib/site"

/**
 * The salon's lockup: the scissors from the shop window, then the wordmark. It
 * lives in one component so the header, the mobile menu and the footer can't
 * drift apart, and so the mark only ever has to be swapped in one place.
 *
 * The scissors are decorative — the name beside them already carries the
 * meaning, so a screen reader announcing both would only stutter.
 */
export function SiteLogo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <Scissors className="size-4 shrink-0 text-brand" aria-hidden="true" />
      <span className="text-sm font-medium tracking-[0.14em] uppercase">
        {siteConfig.shortName}
      </span>
    </span>
  )
}
