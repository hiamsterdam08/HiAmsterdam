// Shape and validation shared between the booking form and its Server Action.
// It lives outside the "use server" module on purpose: those files may only
// export async functions, so neither a plain value like the initial state nor a
// synchronous validator can live there.
//
// Keeping the rules here also means the static preview build (see
// `actions.static.ts`) checks a submission exactly the way the server does,
// instead of drifting into a second, laxer copy.

import { serviceOptions, siteConfig } from "@/lib/site"

export type ReservationState = {
  status: "idle" | "success" | "error"
  message: string
  fieldErrors: Record<string, string>
}

export const initialReservationState: ReservationState = {
  status: "idle",
  message: "",
  fieldErrors: {},
}

export type Reservation = {
  name: string
  email: string
  phone: string
  service: string
  date: string
  time: string
  notes: string
}

/** Name of the field the booking form hides from people. The Server Action is
 *  a public POST endpoint that now sends mail, so it needs a cheap way to tell
 *  a bot from a visitor: anything that arrives with this field filled in was
 *  not typed by someone who could see the page. */
export const honeypotField = "website"

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// Dutch numbers with optional +31, spaces, dashes or parentheses.
const phonePattern = /^[+0-9][0-9\s\-()]{7,}$/

function asTrimmedString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : ""
}

/** Today at midnight, so a booking for later today still validates. */
function startOfToday() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

export function readReservation(formData: FormData): Reservation {
  return {
    name: asTrimmedString(formData.get("name")),
    email: asTrimmedString(formData.get("email")),
    phone: asTrimmedString(formData.get("phone")),
    service: asTrimmedString(formData.get("service")),
    date: asTrimmedString(formData.get("date")),
    time: asTrimmedString(formData.get("time")),
    notes: asTrimmedString(formData.get("notes")),
  }
}

/** Returns `null` when the submission is good. The browser checks most of this
 *  too, but a Server Action is reachable by direct POST, so nothing here may
 *  rely on the client having run. */
export function validateReservation(
  reservation: Reservation
): ReservationState | null {
  const fieldErrors: Record<string, string> = {}

  if (reservation.name.length < 2) {
    fieldErrors.name = "Vul je naam in."
  }

  if (!emailPattern.test(reservation.email)) {
    fieldErrors.email = "Vul een geldig e-mailadres in."
  }

  if (!reservation.phone) {
    fieldErrors.phone = "Vul je telefoonnummer in."
  } else if (!phonePattern.test(reservation.phone)) {
    fieldErrors.phone = "Vul een geldig telefoonnummer in."
  }

  // Matched on the title alone. The price shown next to it in the dropdown is
  // display only — it never rides along in the submission, so it cannot be
  // tampered with on the way here.
  if (!serviceOptions.some((option) => option.title === reservation.service)) {
    fieldErrors.service = "Kies een behandeling."
  }

  const parsedDate = new Date(`${reservation.date}T00:00:00`)
  if (!reservation.date || Number.isNaN(parsedDate.getTime())) {
    fieldErrors.date = "Kies een datum."
  } else if (parsedDate < startOfToday()) {
    fieldErrors.date = "Kies een datum vanaf vandaag."
  }

  if (!/^\d{2}:\d{2}$/.test(reservation.time)) {
    fieldErrors.time = "Kies een tijd."
  }

  if (reservation.notes.length > 500) {
    fieldErrors.notes = "Houd het bij maximaal 500 tekens."
  }

  if (Object.keys(fieldErrors).length === 0) return null

  return {
    status: "error",
    message: "Er ontbreekt nog iets. Check de gemarkeerde velden.",
    fieldErrors,
  }
}

/** The mail did not go out, so nobody at the salon has seen the aanvraag.
 *  Say that, and point at the phone — a confirmation for a request that never
 *  arrived is the one outcome worse than an error. */
export function reservationFailed(): ReservationState {
  return {
    status: "error",
    message: `Het versturen is helaas mislukt. Probeer het nog een keer, of bel ons op ${siteConfig.phone.display}.`,
    fieldErrors: {},
  }
}

export function reservationReceived(reservation: Reservation): ReservationState {
  return {
    status: "success",
    message: `Bedankt ${reservation.name}, we hebben je aanvraag ontvangen. Je hoort van ons zodra we de afspraak hebben bevestigd.`,
    fieldErrors: {},
  }
}
