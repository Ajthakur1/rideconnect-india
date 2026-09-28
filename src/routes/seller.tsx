import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/lib/auth";
import { acceptBookingRequest, rejectBookingRequest } from "@/lib/dispatch";
import { CITIES, FUEL_TYPES, STATUS_LABEL, TRANSMISSIONS, VEHICLE_TYPES, inr } from "@/lib/domain";

export const Route = createFileRoute("/seller")({
  head: () => ({
    meta: [
      { title: "Seller dashboard — RideConnect" },
      { name: "description", content: "Manage vehicles, booking requests and earnings on RideConnect." },
      { property: "og:title", content: "Seller dashboard — RideConnect" },
      { property: "og:description", content: "Manage vehicles, booking requests and earnings on RideConnect." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SellerDashboard,
});

function SellerDashboard() {
  const { session, data, isLoading } = useProfile() as any;
  const qc = useQueryClient();
  const seller = data?.seller;

  const requests = useQuery({
    queryKey: ["seller-requests", seller?.id],
    enabled: !!seller,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("booking_requests")
        .select("*, bookings(*, vehicles(brand, model))")
        .eq("seller_id", seller.id)
        .eq("response_status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const bookings = useQuery({
    queryKey: ["seller-bookings", seller?.id],
    enabled: !!seller,
    queryFn: async () => {
      const { data, error } = await supabase.from("bookings").select("*, vehicles(brand, model)").eq("seller_id", seller.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const vehicles = useQuery({
    queryKey: ["seller-vehicles", seller?.id],
    enabled: !!seller,
    queryFn: async () => {
      const { data, error } = await supabase.from("vehicles").select("*").eq("seller_id", seller.id);
      if (error) throw error;
      return data ?? [];
    },
  });

  if (isLoading) return <p className="p-6 text-muted-foreground">Loading…</p>;
  if (!session) return <div className="p-6"><Link to="/auth" className="underline">Sign in</Link> as a seller.</div>;
  if (!seller) return <p className="p-6">This dashboard is for seller accounts only.</p>;

  const refresh = () => qc.invalidateQueries();
  const done = (bookings.data ?? []).filter((b) => ["trip_completed", "payment_completed", "confirmed", "driver_assigned", "trip_started"].includes(b.booking_status));
  const earnings = done.reduce((a, b) => a + Number(b.seller_amount), 0);
  const commission = done.reduce((a, b) => a + Number(b.commission_amount), 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 pb-24">
      <h1 className="text-2xl font-bold">{seller.business_name}</h1>
      <p className="text-sm text-muted-foreground">Verification: {seller.verification_status} · Commission {Number(seller.commission_rate)}%</p>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Pending requests" value={requests.data?.length ?? 0} />
        <Stat label="Confirmed trips" value={done.length} />
        <Stat label="Your earnings" value={inr(earnings)} />
        <Stat label="Platform commission" value={inr(commission)} />
      </div>

      <h2 className="mt-8 text-lg font-semibold">Booking requests</h2>
      {requests.data?.length === 0 && <p className="text-sm text-muted-foreground">No pending requests.</p>}
      <div className="mt-2 space-y-3">
        {requests.data?.map((r: any) => {
          const b = r.bookings;
          return (
            <div key={r.id} className="card-elevated p-4 text-sm">
              <p className="font-semibold">{b?.booking_number} · {b?.vehicles?.brand} {b?.vehicles?.model}</p>
              <p className="text-muted-foreground">{b?.pickup_location}{b?.drop_location ? ` → ${b.drop_location}` : ""} · {b?.pickup_date} {b?.pickup_time?.slice(0, 5)} · {b?.passengers} pax</p>
              <p>Fare {inr(b?.final_fare)} · Commission {inr(b?.commission_amount)} · You earn {inr(b?.seller_amount)}</p>
              <div className="mt-2 flex gap-2">
                <Button variant="success" onClick={async () => {
                  try { await acceptBookingRequest(r.id, r.booking_id, seller.id); toast.success("Booking confirmed"); refresh(); }
                  catch (e: any) { toast.error(e.message); }
                }}>Accept</Button>
                <Button variant="outline" onClick={async () => {
                  try { await rejectBookingRequest(r.id, r.booking_id); toast("Request rejected"); refresh(); }
                  catch (e: any) { toast.error(e.message); }
                }}>Reject</Button>
              </div>
            </div>
          );
        })}
      </div>

      <h2 className="mt-8 text-lg font-semibold">My bookings</h2>
      <div className="mt-2 space-y-2">
        {bookings.data?.map((b) => (
          <div key={b.id} className="card-elevated flex justify-between p-3 text-sm">
            <span>{b.booking_number} · {b.vehicles?.brand} {b.vehicles?.model}</span>
            <span>{STATUS_LABEL[b.booking_status] ?? b.booking_status} · {inr(b.seller_amount)}</span>
          </div>
        ))}
      </div>

      <h2 className="mt-8 text-lg font-semibold">My vehicles</h2>
      <div className="mt-2 space-y-2">
        {vehicles.data?.map((v) => (
          <div key={v.id} className="card-elevated flex items-center justify-between p-3 text-sm">
            <span>{v.brand} {v.model} · {v.registration_number} · {v.status}</span>
            <Button size="sm" variant="outline" onClick={async () => {
              const { error } = await supabase.from("vehicles").update({ status: v.status === "inactive" ? "pending" : "inactive" }).eq("id", v.id);
              if (error) toast.error(error.message); else refresh();
            }}>{v.status === "inactive" ? "Reactivate" : "Deactivate"}</Button>
          </div>
        ))}
      </div>
      <AddVehicle sellerId={seller.id} city={seller.city} onDone={refresh} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card-elevated p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}

function AddVehicle({ sellerId, city, onDone }: { sellerId: string; city: string; onDone: () => void }) {
  const [f, setF] = useState({
    vehicle_type: "Sedan", brand: "Maruti", model: "Dzire", registration_number: "", seats: 4, fuel_type: "Petrol",
    transmission: "Manual", city: city || "Indore", local_price: 1800, outstation_price_per_km: 12, airport_price: 900,
    rental_price_per_day: 2500, image: "",
  });
  const set = (k: string, v: any) => setF((p) => ({ ...p, [k]: v }));
  async function submit() {
    if (!f.registration_number.trim()) { toast.error("Registration number required"); return; }
    const { image, ...rest } = f;
    const { error } = await supabase.from("vehicles").insert({ ...rest, seller_id: sellerId, images: image ? image.split(",").map((s) => s.trim()) : [] });
    if (error) { toast.error(error.message); return; }
    toast.success("Vehicle submitted for admin approval");
    onDone();
  }
  const cls = "rounded-md border bg-background px-2 py-2";
  return (
    <div className="card-elevated mt-6 p-4 text-sm">
      <h3 className="font-semibold">Add vehicle</h3>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <select className={cls} value={f.vehicle_type} onChange={(e) => set("vehicle_type", e.target.value)}>{VEHICLE_TYPES.map((t) => <option key={t}>{t}</option>)}</select>
        <select className={cls} value={f.city} onChange={(e) => set("city", e.target.value)}>{CITIES.map((c) => <option key={c}>{c}</option>)}</select>
        <input className={cls} placeholder="Brand" value={f.brand} onChange={(e) => set("brand", e.target.value)} />
        <input className={cls} placeholder="Model" value={f.model} onChange={(e) => set("model", e.target.value)} />
        <input className={cls} placeholder="Registration no." value={f.registration_number} onChange={(e) => set("registration_number", e.target.value)} />
        <input className={cls} type="number" placeholder="Seats" value={f.seats} onChange={(e) => set("seats", Number(e.target.value))} />
        <select className={cls} value={f.fuel_type} onChange={(e) => set("fuel_type", e.target.value)}>{FUEL_TYPES.map((t) => <option key={t}>{t}</option>)}</select>
        <select className={cls} value={f.transmission} onChange={(e) => set("transmission", e.target.value)}>{TRANSMISSIONS.map((t) => <option key={t}>{t}</option>)}</select>
        <label>Local ₹<input className={cls + " w-full"} type="number" value={f.local_price} onChange={(e) => set("local_price", Number(e.target.value))} /></label>
        <label>Per km ₹<input className={cls + " w-full"} type="number" value={f.outstation_price_per_km} onChange={(e) => set("outstation_price_per_km", Number(e.target.value))} /></label>
        <label>Airport ₹<input className={cls + " w-full"} type="number" value={f.airport_price} onChange={(e) => set("airport_price", Number(e.target.value))} /></label>
        <label>Per day ₹<input className={cls + " w-full"} type="number" value={f.rental_price_per_day} onChange={(e) => set("rental_price_per_day", Number(e.target.value))} /></label>
        <input className={cls + " col-span-2"} placeholder="Image URLs (comma separated)" value={f.image} onChange={(e) => set("image", e.target.value)} />
      </div>
      <Button className="mt-3 w-full" onClick={submit}>Add vehicle</Button>
    </div>
  );
}
