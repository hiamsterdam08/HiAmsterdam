// Stand-in for `actions.ts` in the GitHub Pages preview build.
//
// A static export has no server, so it cannot run a Server Action — Next.js
// refuses to build one. `next.config.ts` swaps this module in whenever
// NEXT_PUBLIC_STATIC_EXPORT is set, which keeps the booking form on the preview
// looking and behaving like the real thing: it validates against the very same
// rules and shows the same messages, all in the browser.
//
// What it does not do is deliver the request anywhere. That is the honest
// difference between the preview and the live site, and the reason the preview
// is for reviewing the design rather than for taking bookings.

import {
  readReservation,
  reservationReceived,
  validateReservation,
  type ReservationState,
} from "@/lib/reservation"

export async function createReservation(
  _prevState: ReservationState,
  formData: FormData
): Promise<ReservationState> {
  const reservation = readReservation(formData)

  const errors = validateReservation(reservation)
  if (errors) return errors

  console.warn(
    "[afspraakaanvraag] Dit is de preview-versie van de site: de aanvraag is nergens naartoe verstuurd.",
    reservation
  )

  return reservationReceived(reservation)
}
