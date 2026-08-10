"use server"

import {
  honeypotField,
  readReservation,
  reservationFailed,
  reservationReceived,
  validateReservation,
  type ReservationState,
} from "@/lib/reservation"
import { sendReservationEmail } from "@/lib/reservation-email"

export async function createReservation(
  _prevState: ReservationState,
  formData: FormData
): Promise<ReservationState> {
  const reservation = readReservation(formData)

  // Answer a bot the way it expects and send nothing. Showing it an error would
  // only tell whoever wrote it what to change.
  if (formData.get(honeypotField)) return reservationReceived(reservation)

  const errors = validateReservation(reservation)
  if (errors) return errors

  try {
    await sendReservationEmail(reservation)
  } catch (error) {
    // The whole aanvraag is gone if this mail does not go out, so it belongs in
    // the host's function log with the reason attached — an unverified sending
    // domain and a missing API key look identical from the outside otherwise.
    console.error("[afspraakaanvraag] versturen mislukt", error)
    return reservationFailed()
  }

  return reservationReceived(reservation)
}
