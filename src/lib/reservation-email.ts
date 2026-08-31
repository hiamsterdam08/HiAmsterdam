// Delivers a booking request to the salon's mailbox, through Resend.
//
// Resend's send endpoint is a single POST with a JSON body, so this calls it
// with `fetch` rather than pulling in their SDK: one less dependency to keep
// up to date, and the whole contract stays readable in this one file.
//
// Like `reservation.ts`, this lives outside the "use server" module because
// those may only export async functions — the two helpers below could not live
// there.

import type { Reservation } from "@/lib/reservation"
import { serviceOptions, siteConfig } from "@/lib/site"

const RESEND_ENDPOINT = "https://api.resend.com/emails"

// A Netlify function is killed after ten seconds. Giving up at eight turns a
// hanging request into a "bel ons even" message instead of a dead page.
const SEND_TIMEOUT_MS = 8_000

/** Where the aanvraag lands. Defaults to the address in `content.yml`, so
 *  handing the site over is a matter of removing the override rather than
 *  editing code. While testing, `RESERVATION_TO` points at whoever is
 *  testing. */
function recipient() {
  return process.env.RESERVATION_TO?.trim() || siteConfig.email
}

/** Resend only accepts a `from` on a domain that has been verified in the
 *  account. Until `hiamsterdamkapsalon.nl` is verified their shared
 *  `onboarding@resend.dev` stands in — with the catch that it can only deliver
 *  to the Resend account's own address, which is exactly enough to test. */
function sender() {
  return (
    process.env.RESERVATION_FROM?.trim() ||
    `${siteConfig.name} <onboarding@resend.dev>`
  )
}

function formatDate(date: string) {
  const parsed = new Date(`${date}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return date

  return parsed.toLocaleDateString("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

function subjectFor(reservation: Reservation) {
  // Everything the owner needs to triage sits in the subject: a phone glance is
  // often all a booking request gets.
  return `Afspraakaanvraag — ${reservation.name}, ${formatDate(reservation.date)} om ${reservation.time}`
}

/** The tarief the chosen behandeling carries in content.yml. Looked up here
 *  rather than read off the submission: the price beside the behandeling in the
 *  form is display only and never leaves the browser, so this is the one copy
 *  that cannot have been edited on the way in. Empty for a behandeling with no
 *  matching tarief, and the mail then just names the behandeling. */
function priceFor(service: string) {
  return serviceOptions.find((option) => option.title === service)?.price ?? ""
}

function bodyFor(reservation: Reservation) {
  const price = priceFor(reservation.service)

  const lines = [
    ["Naam", reservation.name],
    ["E-mail", reservation.email],
    ["Telefoon", reservation.phone],
    ["Behandeling", price ? `${reservation.service} — ${price}` : reservation.service],
    ["Datum", formatDate(reservation.date)],
    ["Tijd", reservation.time],
  ]

  // Plain text rather than HTML: it renders identically in every mail client,
  // on a phone as well as on a desktop, and there is nothing here to style.
  const details = lines.map(([label, value]) => `${label}: ${value}`).join("\n")

  const notes = reservation.notes
    ? `\n\nOpmerkingen:\n${reservation.notes}`
    : ""

  return `Nieuwe afspraakaanvraag via de website.

${details}${notes}

Deze aanvraag is nog niet bevestigd. Antwoord op deze mail om ${reservation.name} te bereiken.`
}

/** Sends the aanvraag. Throws when it does not go out — the caller turns that
 *  into a message telling the visitor to phone instead, because a request the
 *  salon never received must not look like a confirmed one. */
export async function sendReservationEmail(reservation: Reservation) {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) {
    throw new Error(
      "RESEND_API_KEY ontbreekt. Zet hem in .env.local (lokaal) of in de omgevingsvariabelen van de host."
    )
  }

  const response = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: sender(),
      to: [recipient()],
      // The owner reads the mail and hits Reply; that should reach the client
      // rather than the salon's own inbox.
      reply_to: reservation.email,
      subject: subjectFor(reservation),
      text: bodyFor(reservation),
    }),
    signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
  })

  if (!response.ok) {
    // Resend answers with a JSON error body; it names the actual problem — an
    // unverified domain, a bad key — where a bare status code would not.
    throw new Error(`Resend gaf ${response.status}: ${await response.text()}`)
  }
}
