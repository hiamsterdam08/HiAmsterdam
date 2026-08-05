// Turns `content.yml` — the one file the salon owner edits — into
// `src/lib/content.generated.ts`, a plain typed module the app imports.
//
// It runs as a build step rather than the app reading the YAML at runtime,
// because `src/lib/site.ts` is imported by Client Components too: anything that
// needs `fs` or a YAML parser cannot live there. Generating TypeScript keeps the
// content in the browser bundle with no parser shipped alongside it, and lets
// `tsc` check every field the components read.
//
//   node scripts/generate-content.mjs            generate once
//   node scripts/generate-content.mjs --watch     regenerate on every save
//
// Bad content fails here with a plain-language error rather than a stack trace
// three layers deep in the app, so the message in the GitHub Actions log is
// something the owner can act on.

import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { watchFile } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { parse } from "yaml"

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..")
const sourcePath = join(projectRoot, "content.yml")
const outputPath = join(projectRoot, "src", "lib", "content.generated.ts")
const publicDir = join(projectRoot, "public")

/** Monday first, so the generated array is already in reading order. */
const DAYS = [
  "maandag",
  "dinsdag",
  "woensdag",
  "donderdag",
  "vrijdag",
  "zaterdag",
  "zondag",
]

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/

class ContentError extends Error {}

/** Collects every problem instead of stopping at the first, so one run tells
 *  the owner everything that needs fixing. */
const problems = []

function problem(where, message) {
  problems.push(`  ${where}\n    ${message}`)
}

function capitalise(word) {
  return word[0].toUpperCase() + word.slice(1)
}

function requireText(value, where) {
  if (typeof value !== "string" || value.trim() === "") {
    problem(where, "moet ingevuld zijn, tussen \"aanhalingstekens\".")
    return ""
  }
  return value.trim()
}

/** Photos are the field most likely to be wrong: a file renamed on the desktop
 *  but not in `public/`, or `.jpg` written where the file is `.jpeg`. */
function requirePhoto(value, where) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    problem(where, "moet een `bestand:` en een `beschrijving:` hebben.")
    return { src: "", alt: "" }
  }

  const file = requireText(value.bestand, `${where} → bestand`)
  const alt = requireText(value.beschrijving, `${where} → beschrijving`)

  if (file && !existsSync(join(publicDir, file))) {
    problem(
      `${where} → bestand`,
      `"${file}" staat niet in de map public/. Zet de foto daar neer, en let op hoofdletters en de extensie (.jpg of .jpeg).`
    )
  }

  return { src: `/${file}`, alt }
}

function readSalon(raw) {
  const salon = raw?.salon ?? {}
  return {
    name: requireText(salon.naam, "salon → naam"),
    shortName: requireText(salon.korte_naam, "salon → korte_naam"),
    description: requireText(salon.omschrijving, "salon → omschrijving"),
  }
}

function readContact(raw) {
  const contact = raw?.contact ?? {}
  const telefoon = contact.telefoon ?? {}

  const dial = requireText(telefoon.bellen, "contact → telefoon → bellen")
  if (dial && !/^\+[0-9]+$/.test(dial)) {
    problem(
      "contact → telefoon → bellen",
      `"${dial}" kan de telefoon niet bellen. Schrijf het als +31 gevolgd door alleen cijfers, zonder spaties of streepjes.`
    )
  }

  const email = requireText(contact.email, "contact → email")
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    problem("contact → email", `"${email}" is geen geldig e-mailadres.`)
  }

  return {
    address: {
      street: requireText(contact.straat, "contact → straat"),
      postalCode: requireText(contact.postcode, "contact → postcode"),
      city: requireText(contact.plaats, "contact → plaats"),
    },
    phone: {
      display: requireText(telefoon.weergave, "contact → telefoon → weergave"),
      dial,
    },
    email,
  }
}

/** One entry per day, Monday first. Grouping consecutive days that share their
 *  hours into "Maandag t/m vrijdag" is a display concern and happens in
 *  `src/lib/site.ts` — the data stays per-day so the booking form can read the
 *  real earliest and latest hour off it. */
function readOpeningHours(raw) {
  const hours = raw?.openingstijden ?? {}

  for (const key of Object.keys(hours)) {
    if (!DAYS.includes(key)) {
      problem(
        `openingstijden → ${key}`,
        `"${key}" is geen dag. Gebruik: ${DAYS.join(", ")}.`
      )
    }
  }

  const week = DAYS.map((day) => {
    const where = `openingstijden → ${day}`
    const entry = hours[day]

    if (entry === undefined) {
      problem(where, "ontbreekt. Vul open- en sluitingstijd in, of schrijf: gesloten")
      return { day: capitalise(day), closed: true }
    }

    // `zondag: gesloten` parses to the string "gesloten" — the shorthand the
    // comments in content.yml tell the owner to use.
    if (typeof entry === "string") {
      if (entry.trim().toLowerCase() !== "gesloten") {
        problem(
          where,
          `"${entry}" snap ik niet. Schrijf óf het woord gesloten, óf een open- en sluitingstijd onder elkaar.`
        )
      }
      return { day: capitalise(day), closed: true }
    }

    if (entry === null || typeof entry !== "object") {
      problem(where, "moet een `open:` en een `dicht:` hebben, of het woord gesloten.")
      return { day: capitalise(day), closed: true }
    }

    const open = String(entry.open ?? "")
    const close = String(entry.dicht ?? "")

    for (const [label, value] of [
      ["open", open],
      ["dicht", close],
    ]) {
      if (!TIME_PATTERN.test(value)) {
        problem(
          `${where} → ${label}`,
          `"${value}" is geen tijd. Schrijf hem als "09:30" — twee cijfers, dubbele punt, twee cijfers, tussen aanhalingstekens.`
        )
      }
    }

    if (TIME_PATTERN.test(open) && TIME_PATTERN.test(close) && close <= open) {
      problem(
        where,
        `de salon gaat om ${close} dicht en om ${open} open. De sluitingstijd moet later zijn dan de openingstijd.`
      )
    }

    return { day: capitalise(day), closed: false, open, close }
  })

  // The booking form derives its list of times from these hours, so a week
  // without a single open day would leave it with nothing to offer.
  if (week.every((entry) => entry.closed)) {
    problem("openingstijden", "elke dag staat op gesloten. Vul minstens één dag in.")
  }

  return week
}

function readPrices(raw) {
  const list = raw?.tarieven

  if (!Array.isArray(list) || list.length === 0) {
    problem("tarieven", "moet minstens één dienst met een prijs bevatten.")
    return []
  }

  return list.map((entry, index) => {
    const where = `tarieven → nummer ${index + 1}`
    if (entry === null || typeof entry !== "object" || Array.isArray(entry)) {
      problem(where, "moet een `dienst:` en een `prijs:` hebben.")
      return { title: "", price: "" }
    }
    return {
      title: requireText(entry.dienst, `${where} → dienst`),
      price: requireText(entry.prijs, `${where} → prijs`),
    }
  })
}

function readTreatments(raw) {
  const list = raw?.behandelingen

  if (!Array.isArray(list) || list.length === 0) {
    problem(
      "behandelingen",
      "moet minstens één behandeling bevatten, anders kan niemand een afspraak maken."
    )
    return []
  }

  return list.map((entry, index) =>
    requireText(entry, `behandelingen → nummer ${index + 1}`)
  )
}

function readPhotos(raw) {
  const photos = raw?.fotos ?? {}
  const strip = photos.homepage_strook

  if (!Array.isArray(strip) || strip.length === 0) {
    problem("fotos → homepage_strook", "moet minstens één foto bevatten.")
  }

  return {
    homeHero: requirePhoto(photos.homepage_groot, "fotos → homepage_groot"),
    homeGallery: (Array.isArray(strip) ? strip : []).map((entry, index) =>
      requirePhoto(entry, `fotos → homepage_strook → nummer ${index + 1}`)
    ),
    aboutPortrait: requirePhoto(photos.over_ons, "fotos → over_ons"),
  }
}

function build() {
  if (!existsSync(sourcePath)) {
    throw new ContentError(`content.yml niet gevonden op ${sourcePath}`)
  }

  let raw
  try {
    raw = parse(readFileSync(sourcePath, "utf8"))
  } catch (error) {
    // A YAML syntax error means indentation or a stray quote. Say so, because
    // the parser's own message assumes you know what YAML is.
    throw new ContentError(
      `content.yml kon niet gelezen worden. Meestal klopt de inspringing niet, of ` +
        `staat er een aanhalingsteken te veel of te weinig.\n\n${error.message}`
    )
  }

  if (raw === null || typeof raw !== "object") {
    throw new ContentError("content.yml is leeg.")
  }

  problems.length = 0

  const content = {
    salon: readSalon(raw),
    contact: readContact(raw),
    openingHours: readOpeningHours(raw),
    prices: readPrices(raw),
    treatments: readTreatments(raw),
    photos: readPhotos(raw),
  }

  if (problems.length > 0) {
    throw new ContentError(
      `Er klopt iets niet in content.yml:\n\n${problems.join("\n\n")}`
    )
  }

  return content
}

function write(content) {
  const source = `// GEGENEREERD BESTAND — NIET met de hand aanpassen.
//
// Dit bestand komt uit content.yml in de hoofdmap. Wijzig je het hier, dan is
// die wijziging weg zodra de site opnieuw gebouwd wordt. Pas content.yml aan.
//
// Opnieuw genereren: npm run content

export const content = ${JSON.stringify(content, null, 2)} as const
`

  // Only touch the file when something actually changed, so `next dev` does not
  // reload on every keystroke in an unrelated file during a watch run.
  if (existsSync(outputPath) && readFileSync(outputPath, "utf8") === source) {
    return false
  }

  writeFileSync(outputPath, source, "utf8")
  return true
}

function run({ tolerateErrors }) {
  try {
    const changed = write(build())
    if (changed) {
      console.log("[content] src/lib/content.generated.ts bijgewerkt")
    }
    return true
  } catch (error) {
    if (!(error instanceof ContentError)) throw error

    console.error(`\n[content] ${error.message}\n`)

    // In watch mode the next save is the fix, so keep the dev server alive.
    if (!tolerateErrors) process.exit(1)
    return false
  }
}

const watching = process.argv.includes("--watch")

run({ tolerateErrors: watching })

if (watching) {
  console.log("[content] let op wijzigingen in content.yml")
  // `watchFile` polls. It is slower to notice a change than `watch`, but it
  // survives the save-to-temp-then-rename that editors do — which `watch` does
  // not, leaving it silently watching a file that no longer exists.
  watchFile(sourcePath, { interval: 300 }, () => {
    run({ tolerateErrors: true })
  })
}
