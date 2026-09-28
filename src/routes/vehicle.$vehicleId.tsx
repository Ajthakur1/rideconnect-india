import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/lib/auth";
import { dispatchBooking } from "@/lib/dispatch";
import {
  BOOKING_TYPES, BOOKING_TYPE_LABEL, CANCELLATION_POLICY, CITIES, calculateFare, inr, priceForType, type BookingType,
} from "@/lib/domain";

const schema = z.object({
  type: z.string().optional(),
  pickup: z.string().optional(),
  drop: z.string().optional(),
  date: z.string().optional(),
  time: z.string().optional(),
  passengers: z.coerce.number().optional(),
  vehicleType: z.string().optional(),
  book: z.coerce.boolean().optional(),
});

export const Route = createFileRoute("/vehicle/$vehicleId")({
  validateSearch: (s) => schema.parse(s),
  head: () => ({
    meta: [
      { title: "Vehicle details — RideConnect" },
      { name: "description", content: "View vehicle details, pricing and book a ride with a verified operator." },
      { property: "og:title", content: "Vehicle details — RideConnect" },
      { property: "og:description", content: "View vehicle details, pricing and book a ride with a verified operator." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VehiclePage,
});

function VehiclePage() {
  const { vehicleId } = Route.useParams();
  const s = Route.useSearch();
  const navigate = useNavigate();
  const { session, profile } = useProfile() as any;
  const [type, setType] = useState<BookingType>((BOOKING_TYPES.includes(s.type as BookingType) ? s.type : "local") as BookingType);
  const [pickup, setPickup] = useState(s.pickup ?? "Indore");
  const [drop, setDrop] = useState(s.drop ?? "");
  const [date, setDate] = useState(s.date ?? new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState(s.time ?? "09:00");
  const [passengers, setPassengers] = useState(s.passengers ?? 1);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const q = useQuery({
    queryKey: ["vehicle", vehicleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*, seller_profiles(id, business_name, city, verification_status, rating)")
        .eq("id", vehicleId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (q.isLoading) return <p className="p-6 text-muted-foreground">Loading…</p>;
  const v = q.data;
  if (!v) return <p className="p-6">Vehicle not found.</p>;
  const fare = calculateFare(v, type, pickup, drop || pickup);
  const p = priceForType(v, type);

  async function book() {
    if (!session) {
      navigate({ to: "/auth" });
      return;
    }
    if (!pickup.trim()) { toast.error("Enter a pickup location."); return; }
    setBusy(true);
    try {
      const { data, error } = await supabase
        .from("bookings")
        .insert({
          customer_id: session.user.id,
          vehicle_id: v!.id,
          booking_type: type,
          pickup_location: pickup,
          drop_location: drop || null,
          pickup_date: date,
          pickup_time: time,
          passengers,
          trip_distance: fare.distanceKm,
          estimated_fare: fare.total,
          final_fare: fare.total,
          customer_notes: notes || null,
        })
        .select("id, booking_number")
        .single();
      if (error) throw error;
      await dispatchBooking(data.id, v!.seller_id, v!.vehicle_type, v!.city);
      toast.success(`Booking ${data.booking_number} created. Waiting for seller confirmation.`);
      navigate({ to: "/my-bookings" });
    } catch (e: any) {
      toast.error(e.message ?? "Could not create booking");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 pb-24">
      <Link to="/search" search={{ type, pickup, drop }} className="text-sm text-muted-foreground">← Back to results</Link>
      <div className="mt-3 grid gap-6 lg:grid-cols-2">
        <div>
          {v.images?.[0] && <img src={v.images[0]} alt={`${v.brand} ${v.model}`} className="h-64 w-full rounded-xl object-cover" />}
          <div className="mt-2 flex gap-2 overflow-x-auto">
            {v.images?.slice(1).map((src: string) => <img key={src} src={src} alt="" loading="lazy" className="h-16 w-24 rounded-md object-cover" />)}
          </div>
          <h1 className="mt-4 text-2xl font-bold">{v.brand} {v.model}</h1>
          <p className="text-muted-foreground">
            {v.vehicle_type} · {v.seats} seats · {v.air_conditioned ? "AC" : "Non-AC"} · {v.fuel_type} · {v.transmission} · ★ {Number(v.rating).toFixed(1)}
          </p>
          {v.description && <p className="mt-3 text-sm">{v.description}</p>}
          <div className="mt-4 card-elevated p-4 text-sm">
            <p className="font-semibold">{v.seller_profiles?.business_name}</p>
            <p className="text-muted-foreground">{v.seller_profiles?.city} · ★ {Number(v.seller_profiles?.rating ?? 0).toFixed(1)}</p>
            {v.seller_profiles?.verification_status === "verified" && <p className="text-primary">✓ Verified operator</p>}
            <p className="mt-1 text-xs text-muted-foreground">Contact details are shared after the booking is confirmed.</p>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <div className="card-elevated p-3">Local: {inr(v.local_price)}</div>
            <div className="card-elevated p-3">Outstation: {inr(v.outstation_price_per_km)}/km</div>
            <div className="card-elevated p-3">Airport: {inr(v.airport_price)}</div>
            <div className="card-elevated p-3">Rental: {inr(v.rental_price_per_day)}/day</div>
          </div>
        </div>

        <div className="card-elevated h-fit p-4">
          <h2 className="text-lg font-semibold">Book this vehicle</h2>
          <div className="mt-3 grid grid-cols-4 gap-1">
            {BOOKING_TYPES.map((t) => (
              <button key={t} onClick={() => setType(t)} className={`rounded-md border px-2 py-2 text-xs ${t === type ? "bg-primary text-primary-foreground" : ""}`}>
                {BOOKING_TYPE_LABEL[t]}
              </button>
            ))}
          </div>
          <div className="mt-3 grid gap-2 text-sm">
            <input list="cities" className="rounded-md border bg-background px-3 py-2" placeholder="Pickup" value={pickup} onChange={(e) => setPickup(e.target.value)} />
            <input list="cities" className="rounded-md border bg-background px-3 py-2" placeholder="Drop" value={drop} onChange={(e) => setDrop(e.target.value)} />
            <datalist id="cities">{CITIES.map((c) => <option key={c} value={c} />)}</datalist>
            <div className="grid grid-cols-3 gap-2">
              <input type="date" className="rounded-md border bg-background px-2 py-2" value={date} onChange={(e) => setDate(e.target.value)} />
              <input type="time" className="rounded-md border bg-background px-2 py-2" value={time} onChange={(e) => setTime(e.target.value)} />
              <input type="number" min={1} max={v.seats} className="rounded-md border bg-background px-2 py-2" value={passengers} onChange={(e) => setPassengers(Number(e.target.value))} />
            </div>
            <textarea className="rounded-md border bg-background px-3 py-2" placeholder="Notes for the operator (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="mt-4 space-y-1 text-sm">
            <div className="flex justify-between"><span>Rate</span><span>{inr(p.amount)}{p.unit}</span></div>
            <div className="flex justify-between"><span>Estimated fare ({fare.basis})</span><span>{inr(fare.baseFare)}</span></div>
            <div className="flex justify-between"><span>Platform service fee</span><span>{inr(fare.serviceFee)}</span></div>
            <div className="flex justify-between border-t pt-2 text-base font-bold"><span>Estimated total</span><span>{inr(fare.total)}</span></div>
          </div>
          <ul className="mt-3 list-disc pl-5 text-xs text-muted-foreground">
            {CANCELLATION_POLICY.map((c) => <li key={c}>{c}</li>)}
          </ul>
          <Button variant="hero" size="xl" className="mt-4 w-full" disabled={busy} onClick={book}>
            {session ? (busy ? "Booking…" : "Confirm booking") : "Sign in to book"}
          </Button>
          {profile && profile.role !== "customer" && <p className="mt-2 text-xs text-muted-foreground">Bookings are made from a customer account.</p>}
        </div>
      </div>
    </div>
  );
}
