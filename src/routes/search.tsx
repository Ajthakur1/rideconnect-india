import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { BOOKING_TYPES, BOOKING_TYPE_LABEL, VEHICLE_TYPES, inr, priceForType, type BookingType } from "@/lib/domain";

const searchSchema = z.object({
  type: z.string().optional(),
  pickup: z.string().optional(),
  drop: z.string().optional(),
  date: z.string().optional(),
  time: z.string().optional(),
  passengers: z.coerce.number().optional(),
  vehicleType: z.string().optional(),
});

export const Route = createFileRoute("/search")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Search rides — RideConnect" },
      { name: "description", content: "Compare taxis, rental cars and travel vehicles from verified local operators." },
      { property: "og:title", content: "Search rides — RideConnect" },
      { property: "og:description", content: "Compare taxis, rental cars and travel vehicles from verified local operators." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const s = Route.useSearch();
  const tripType = (BOOKING_TYPES.includes(s.type as BookingType) ? s.type : "local") as BookingType;
  const [vt, setVt] = useState(s.vehicleType ?? "");
  const [minSeats, setMinSeats] = useState(s.passengers ?? 1);
  const [acOnly, setAcOnly] = useState(false);
  const [trans, setTrans] = useState("");
  const [sort, setSort] = useState("recommended");

  const q = useQuery({
    queryKey: ["search-vehicles", s.pickup],
    queryFn: async () => {
      let query = supabase
        .from("vehicles")
        .select("*, seller_profiles(business_name, verification_status, rating)")
        .eq("status", "active");
      if (s.pickup) query = query.eq("city", s.pickup);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });

  const list = useMemo(() => {
    let r = (q.data ?? []).filter(
      (v) =>
        (!vt || v.vehicle_type === vt) &&
        v.seats >= minSeats &&
        (!acOnly || v.air_conditioned) &&
        (!trans || v.transmission === trans),
    );
    const price = (v: (typeof r)[number]) => priceForType(v, tripType).amount;
    if (sort === "low") r = [...r].sort((a, b) => price(a) - price(b));
    if (sort === "high") r = [...r].sort((a, b) => price(b) - price(a));
    if (sort === "rating") r = [...r].sort((a, b) => Number(b.rating) - Number(a.rating));
    return r;
  }, [q.data, vt, minSeats, acOnly, trans, sort, tripType]);

  const bookSearch = { ...s, type: tripType };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 pb-24">
      <h1 className="text-2xl font-bold">
        {BOOKING_TYPE_LABEL[tripType]} {s.pickup ? `from ${s.pickup}` : ""} {s.drop ? `to ${s.drop}` : ""}
      </h1>
      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        <select className="rounded-md border bg-background px-2 py-2" value={vt} onChange={(e) => setVt(e.target.value)}>
          <option value="">All types</option>
          {VEHICLE_TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
        <select className="rounded-md border bg-background px-2 py-2" value={minSeats} onChange={(e) => setMinSeats(Number(e.target.value))}>
          {[1, 4, 6, 7, 12].map((n) => <option key={n} value={n}>{n}+ seats</option>)}
        </select>
        <select className="rounded-md border bg-background px-2 py-2" value={trans} onChange={(e) => setTrans(e.target.value)}>
          <option value="">Any transmission</option><option>Manual</option><option>Automatic</option>
        </select>
        <label className="flex items-center gap-1 rounded-md border px-2 py-2">
          <input type="checkbox" checked={acOnly} onChange={(e) => setAcOnly(e.target.checked)} /> AC only
        </label>
        <select className="rounded-md border bg-background px-2 py-2" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="recommended">Recommended</option><option value="low">Price: low to high</option>
          <option value="high">Price: high to low</option><option value="rating">Rating</option>
        </select>
      </div>
      {q.isLoading && <p className="mt-6 text-muted-foreground">Loading vehicles…</p>}
      {!q.isLoading && list.length === 0 && <p className="mt-6 text-muted-foreground">No vehicles match your search.</p>}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((v) => {
          const p = priceForType(v, tripType);
          return (
            <div key={v.id} className="card-elevated overflow-hidden">
              {v.images?.[0] && <img src={v.images[0]} alt={`${v.brand} ${v.model}`} loading="lazy" className="h-44 w-full object-cover" />}
              <div className="p-4">
                <p className="text-xs text-muted-foreground">{v.vehicle_type}</p>
                <h3 className="font-semibold">{v.brand} {v.model}</h3>
                <p className="text-sm text-muted-foreground">
                  {v.seats} seats · {v.air_conditioned ? "AC" : "Non-AC"} · {v.fuel_type} · ★ {Number(v.rating).toFixed(1)}
                </p>
                <p className="mt-1 text-sm">
                  {v.seller_profiles?.business_name}
                  {v.seller_profiles?.verification_status === "verified" && <span className="ml-1 text-xs font-medium text-primary">✓ Verified</span>}
                </p>
                <p className="mt-2 text-lg font-bold">{inr(p.amount)}<span className="text-sm font-normal text-muted-foreground">{p.unit}</span></p>
                <div className="mt-3 flex gap-2">
                  <Button asChild variant="outline" className="flex-1">
                    <Link to="/vehicle/$vehicleId" params={{ vehicleId: v.id }} search={bookSearch}>View Details</Link>
                  </Button>
                  <Button asChild variant="hero" className="flex-1">
                    <Link to="/vehicle/$vehicleId" params={{ vehicleId: v.id }} search={{ ...bookSearch, book: true }}>Book Now</Link>
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
