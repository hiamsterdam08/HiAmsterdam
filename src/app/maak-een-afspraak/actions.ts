"use server"

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

  // TODO: hook this up to the salon's mailbox or booking system. Until then the
  // request only lands in the server log, so an aanvraag is not yet a booking —
  // the confirmation copy says exactly that on purpose.
  console.log("[afspraakaanvraag]", reservation)

  return reservationReceived(reservation)
}
