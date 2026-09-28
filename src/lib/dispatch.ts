import { supabase } from "@/integrations/supabase/client";

/**
 * Booking dispatch: notify the preferred seller plus other eligible verified
 * sellers offering the same vehicle type in the same city. First acceptance wins.
 * Notifications are dashboard-based in v1; the request rows are the transport-agnostic
 * queue that SMS/WhatsApp/email senders can later read from.
 */
export async function dispatchBooking(bookingId: string, preferredSellerId: string, vehicleType: string, city: string) {
  const { data: alternates } = await supabase
    .from("vehicles")
    .select("seller_id, seller_profiles!inner(id,verification_status,status)")
    .eq("vehicle_type", vehicleType)
    .eq("city", city)
    .eq("status", "active")
    .eq("seller_profiles.verification_status", "verified")
    .eq("seller_profiles.status", "active");

  const sellerIds = new Set<string>([preferredSellerId]);
  for (const row of alternates ?? []) sellerIds.add(row.seller_id as string);

  const rows = [...sellerIds].map((seller_id) => ({ booking_id: bookingId, seller_id }));
  await supabase.from("booking_requests").insert(rows);
  await supabase.from("bookings").update({ booking_status: "seller_notified" }).eq("id", bookingId);
}

/** Seller accepts: booking is awarded to them and all other requests expire. */
export async function acceptBookingRequest(requestId: string, bookingId: string, sellerId: string) {
  const { data: booking } = await supabase
    .from("bookings")
    .select("booking_status")
    .eq("id", bookingId)
    .maybeSingle();

  if (booking && ["confirmed", "driver_assigned", "trip_started", "trip_completed", "payment_completed"].includes(booking.booking_status)) {
    throw new Error("This booking has already been taken by another operator.");
  }

  const { error } = await supabase
    .from("booking_requests")
    .update({ response_status: "accepted", responded_at: new Date().toISOString() })
    .eq("id", requestId);
  if (error) throw error;

  const { data: seller } = await supabase
    .from("seller_profiles")
    .select("commission_rate")
    .eq("id", sellerId)
    .maybeSingle();

  const { error: bErr } = await supabase
    .from("bookings")
    .update({
      seller_id: sellerId,
      booking_status: "confirmed",
      commission_rate: seller?.commission_rate ?? 10,
    })
    .eq("id", bookingId);
  if (bErr) throw bErr;

  await supabase
    .from("booking_requests")
    .update({ response_status: "expired", responded_at: new Date().toISOString() })
    .eq("booking_id", bookingId)
    .neq("id", requestId)
    .eq("response_status", "pending");
}

export async function rejectBookingRequest(requestId: string, bookingId: string) {
  const { error } = await supabase
    .from("booking_requests")
    .update({ response_status: "rejected", responded_at: new Date().toISOString() })
    .eq("id", requestId);
  if (error) throw error;

  const { count } = await supabase
    .from("booking_requests")
    .select("id", { count: "exact", head: true })
    .eq("booking_id", bookingId)
    .eq("response_status", "pending");

  if (!count) {
    await supabase.from("bookings").update({ booking_status: "seller_rejected" }).eq("id", bookingId);
  }
}
