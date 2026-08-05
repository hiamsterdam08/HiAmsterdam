// Everything the salon owner can change lives in `content.yml` in the project
// root. This module is the seam between that file and the components: it takes
// the generated content and derives the shapes the pages actually render —
// grouped opening hours, a Maps URL, a `tel:` href.
//
// Nothing here is content. If you find yourself editing a price or an address
// in this file, it belongs in content.yml instead.

import { content } from "@/lib/content.generated"

export const siteConfig = {
  name: content.salon.name,
  shortName: content.salon.shortName,
  description: content.salon.description,
  address: content.contact.address,
  // `href` stays in E.164 so phones dial it correctly; `display` is the
  // readable Dutch grouping.
  phone: {
    display: content.contact.phone.display,
    href: `tel:${content.contact.phone.dial}`,
  },
  email: content.contact.email,
} as const

export const formattedAddress = `${siteConfig.address.street}, ${siteConfig.address.postalCode} ${siteConfig.address.city}`

/** Opens the address in Google Maps with directions from the visitor's location. */
export const googleMapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
  formattedAddress
)}`

/** Fallback for the reviews section: send visitors to the salon on Google. */
export const googleMapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  `${siteConfig.name} ${formattedAddress}`
)}`

// Navigation is site structure rather than content — a new entry needs a page
// to point at — so it stays here and out of content.yml.
export const navLinks = [
  { href: "/", label: "Home" },
  { href: "/over-ons", label: "Over ons" },
  { href: "/maak-een-afspraak", label: "Maak een afspraak" },
] as const

/** The salon's tarieven, as shown on the homepage and on /over-ons. Prices are
 *  written out in content.yml rather than computed, so the comma decimal
 *  separator stays exactly as it hangs on the wall. */
export const services = content.prices

/** Feeds the booking form's service dropdown, and the Server Action validates
 *  the submitted behandeling against this same list. */
export const serviceOptions = content.treatments

/** The GitHub Pages preview is served from a repo subpath, and that build turns
 *  the image optimiser off — at which point `next/image` passes `src` through
 *  untouched instead of prefixing it, so every photo would 404. Prefixing here
 *  is the one place that covers all of them. Empty string everywhere else, so
 *  the normal build is unaffected. */
const assetBasePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(
  /\/+$/,
  ""
)

function withBasePath<T extends { src: string }>(photo: T): T {
  return { ...photo, src: `${assetBasePath}${photo.src}` }
}

export const photos = {
  homeHero: withBasePath(content.photos.homeHero),
  homeGallery: content.photos.homeGallery.map(withBasePath),
  aboutPortrait: withBasePath(content.photos.aboutPortrait),
}

type OpeningHoursRow = {
  /** "Maandag", "Maandag en dinsdag" or "Maandag t/m vrijdag". */
  days: string
  /** "09:30 – 19:00", or "Gesloten". */
  hours: string
  closed: boolean
}

/** What the hours column says on a day the salon is shut. Doubles as the value
 *  consecutive closed days are grouped on. */
const CLOSED = "Gesloten"

/** "Maandag en dinsdag" for a pair, "Maandag t/m vrijdag" for a longer run.
 *  Only the first day keeps its capital — mid-sentence the rest are lowercase
 *  in Dutch. */
function labelForRun(days: string[]) {
  if (days.length === 1) return days[0]
  if (days.length === 2) return `${days[0]} en ${days[1].toLowerCase()}`
  return `${days[0]} t/m ${days[days.length - 1].toLowerCase()}`
}

/** content.yml holds one entry per day so the owner can change a single
 *  Wednesday without restructuring anything. Runs of days that share their
 *  hours collapse back into one row here, which is how a salon writes them on
 *  the door. Change one day and the row splits by itself. */
function groupOpeningHours(): OpeningHoursRow[] {
  const rows: OpeningHoursRow[] = []
  let run: string[] = []
  let previous = ""

  const flush = () => {
    if (run.length === 0) return
    rows.push({
      days: labelForRun(run),
      hours: previous,
      closed: previous === CLOSED,
    })
    run = []
  }

  for (const entry of content.openingHours) {
    const hours = entry.closed ? CLOSED : `${entry.open} – ${entry.close}`

    if (hours !== previous) {
      flush()
      previous = hours
    }
    run.push(entry.day)
  }
  flush()

  return rows
}

/** Rows for the openingstijden lists. `closed` styles the hours column as muted
 *  rather than dropping the row, so Sunday still reads as an answer instead of
 *  an omission. */
export const openingHours = groupOpeningHours()

function toMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

/** The first and last minute the salon is ever open in a week, so the booking
 *  form can offer exactly the slots the opening hours allow — and follow them
 *  when the owner changes a closing time. */
export const bookingWindow = (() => {
  // flatMap rather than filter: it narrows away the closed days, which have no
  // `open`/`close` to read.
  const open = content.openingHours.flatMap((entry) =>
    entry.closed ? [] : [entry]
  )

  return {
    earliest: Math.min(...open.map((entry) => toMinutes(entry.open))),
    latest: Math.max(...open.map((entry) => toMinutes(entry.close))),
  }
})()
