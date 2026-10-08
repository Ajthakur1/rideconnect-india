import { supabase } from "@/integrations/supabase/client";

/**
 * Booking dispatch: the selected seller gets a booking request. If they reject,
 * the database offers it to the next eligible verified seller (same type/city).
 * Request rows are the transport-agnostic queue that SMS/WhatsApp/email senders can read later.
 */
export async function dispatchBooking(bookingId: string, sellerId: string, _vehicleType?: string, _city?: string) {
  const { error } = await supabase.from("booking_requests").insert({ booking_id: bookingId, seller_id: sellerId });
  if (error) console.error("dispatch failed", error.message);
}

/** Only the assigned seller can respond; enforced in the database. */
export async function acceptBookingRequest(requestId: string, _bookingId?: string, _sellerId?: string) {
  const { error } = await (supabase as any).rpc("respond_booking_request", { _request_id: requestId, _accept: true });
  if (error) throw error;
}

export async function rejectBookingRequest(requestId: string, _bookingId?: string) {
  const { data, error } = await (supabase as any).rpc("respond_booking_request", { _request_id: requestId, _accept: false });
  if (error) throw error;
  return data as string;
}
