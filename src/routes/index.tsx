import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  ShieldCheck,
  Search as SearchIcon,
  Car,
  Plane,
  MapPin,
  Users,
  Star,
  BadgeCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { BOOKING_TYPES, BOOKING_TYPE_LABEL, inr, priceForType } from "@/lib/domain";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RideConnect — Book taxis, chauffeur cars & rentals in Madhya Pradesh" },
      {
        name: "description",
        content:
          "Compare trusted local taxis, rental cars and travel vehicles from verified local operators in Indore, Ujjain, Dewas, Bhopal and Sehore.",
      },
      { property: "og:title", content: "RideConnect — Book Your Ride. Your Way." },
      {
        property: "og:description",
        content: "Compare trusted local taxis, rental cars and travel vehicles from verified local operators.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const CATEGORIES = [
  { label: "Taxi", type: "local", Icon: Car },
  { label: "Outstation", type: "outstation", Icon: MapPin },
  { label: "Airport Transfer", type: "airport", Icon: Plane },
  { label: "Car Rental", type: "rental", Icon: Car },
  { label: "SUV", type: "local", vt: "SUV", Icon: Car },
  { label: "Tempo Traveller", type: "local", vt: "Tempo Traveller", Icon: Users },
  { label: "Luxury Cars", type: "local", vt: "Luxury", Icon: Sparkles },
] as const;

function Home() {
  const navigate = useNavigate();
  const [tripType, setTripType] = useState<string>("local");
  const [pickup, setPickup] = useState("Indore");
  const [drop, setDrop] = useState("Ujjain");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState("09:00");
  const [passengers, setPassengers] = useState(2);

  const featured = useQuery({
    queryKey: ["featured-vehicles"],
    queryFn: async () => {
      const { data } = await supabase
        .from("vehicles")
        .select("*, seller_profiles(business_name, verification_status, city)")
        .eq("status", "active")
        .order("rating", { ascending: false })
        .limit(6);
      return data ?? [];
    },
  });

  const reviews = useQuery({
    queryKey: ["home-reviews"],
    queryFn: async () => {
      const { data } = await supabase
        .from("reviews")
        .select("id, rating, review_text, customer_name")
        .order("created_at", { ascending: false })
        .limit(3);
      return data ?? [];
    },
  });

  const sellers = useQuery({
    queryKey: ["home-sellers"],
    queryFn: async () => {
      const { data } = await supabase
        .from("seller_profiles")
        .select("id, business_name, city, rating, verification_status")
        .eq("verification_status", "verified")
        .limit(4);
      return data ?? [];
    },
  });

  function search(extra?: { type?: string; vt?: string }) {
    navigate({
      to: "/search",
      search: {
        type: extra?.type ?? tripType,
        pickup,
        drop,
        date,
        time,
        passengers,
        ...(extra?.vt ? { vehicleType: extra.vt } : {}),
      },
    });
  }

  return (
    <div>
      <section className="bg-hero px-4 pb-28 pt-12 text-primary-foreground sm:pb-32">
        <div className="mx-auto max-w-6xl">
          <p className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 px-3 py-1 text-xs font-medium">
            <ShieldCheck className="size-3.5" /> Verified local operators
          </p>
          <h1 className="mt-4 max-w-2xl text-4xl font-bold leading-tight sm:text-5xl">
            Book Your Ride. Your Way.
          </h1>
          <p className="mt-3 max-w-xl text-base text-primary-foreground/80">
            Compare trusted local taxis, rental cars and travel vehicles from verified local operators.
          </p>
        </div>
      </section>

      <section className="px-4">
        <div className="mx-auto -mt-20 max-w-4xl card-elevated p-4 sm:p-6">
          <div className="flex flex-wrap gap-2">
            {BOOKING_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setTripType(t)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  tripType === t ? "bg-accent-gradient text-accent-foreground" : "bg-secondary text-secondary-foreground"
                }`}
              >
                {BOOKING_TYPE_LABEL[t]}
              </button>
            ))}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="pickup">Pickup location</Label>
              <Input id="pickup" value={pickup} onChange={(e) => setPickup(e.target.value)} placeholder="e.g. Indore" />
            </div>
            <div>
              <Label htmlFor="drop">Drop location</Label>
              <Input
                id="drop"
                value={drop}
                onChange={(e) => setDrop(e.target.value)}
                placeholder={tripType === "rental" ? "Not required for rentals" : "e.g. Ujjain"}
                disabled={tripType === "rental"}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="date">Date</Label>
                <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="time">Time</Label>
                <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
              </div>
            </div>
            <div>
              <Label htmlFor="pax">Passengers</Label>
              <Input
                id="pax"
                type="number"
                min={1}
                max={20}
                value={passengers}
                onChange={(e) => setPassengers(Number(e.target.value))}
              />
            </div>
          </div>

          <Button variant="hero" size="xl" className="mt-4 w-full" onClick={() => search()}>
            <SearchIcon className="size-5" /> Search Vehicles
          </Button>
        </div>
      </section>

      <section className="mx-auto mt-12 max-w-6xl px-4">
        <h2 className="text-xl font-bold">Browse by category</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {CATEGORIES.map((c) => (
            <button
              key={c.label}
              onClick={() => search("vt" in c ? { type: c.type, vt: c.vt as string } : { type: c.type })}
              className="card-elevated flex flex-col items-center gap-2 p-4 text-center transition-transform hover:-translate-y-0.5"
            >
              <span className="flex size-10 items-center justify-center rounded-xl bg-secondary">
                <c.Icon className="size-5" />
              </span>
              <span className="text-xs font-semibold">{c.label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-14 max-w-6xl px-4">
        <h2 className="text-xl font-bold">How it works</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {[
            ["Search", "Tell us your trip type, route, date and passengers."],
            ["Compare & book", "Pick a vehicle from a verified operator and confirm your booking."],
            ["Ride", "The operator accepts, assigns a driver and you get a confirmed booking."],
          ].map(([t, d], i) => (
            <div key={t} className="card-elevated p-5">
              <span className="flex size-8 items-center justify-center rounded-lg bg-accent-gradient text-sm font-bold text-accent-foreground">
                {i + 1}
              </span>
              <h3 className="mt-3 text-base font-semibold">{t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-14 max-w-6xl px-4">
        <h2 className="text-xl font-bold">Why RideConnect</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Verified operators", "Every partner is checked and approved before going live."],
            ["Transparent fares", "See the estimated fare and fees before you confirm."],
            ["Local expertise", "Operators who actually know Indore, Ujjain, Dewas, Bhopal and Sehore."],
            ["Support that answers", "One place to track every booking you make."],
          ].map(([t, d]) => (
            <div key={t} className="card-elevated p-5">
              <BadgeCheck className="size-5 text-success" />
              <h3 className="mt-3 text-base font-semibold">{t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-14 max-w-6xl px-4">
        <div className="flex items-end justify-between">
          <h2 className="text-xl font-bold">Featured vehicles</h2>
          <Link to="/search" search={{ type: "local" }} className="text-sm font-medium underline-offset-4 hover:underline">
            View all
          </Link>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.data?.map((v) => (
            <Link
              key={v.id}
              to="/vehicle/$vehicleId"
              params={{ vehicleId: v.id }}
              className="card-elevated overflow-hidden transition-transform hover:-translate-y-0.5"
            >
              <img
                src={v.images?.[0] ?? ""}
                alt={`${v.brand} ${v.model}`}
                loading="lazy"
                className="h-40 w-full bg-secondary object-cover"
              />
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">
                    {v.brand} {v.model}
                  </h3>
                  <span className="flex items-center gap-1 text-sm">
                    <Star className="size-3.5 fill-current text-warning" /> {Number(v.rating).toFixed(1)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {v.vehicle_type} · {v.seats} seats · {v.air_conditioned ? "AC" : "Non-AC"} · {v.city}
                </p>
                <p className="mt-2 text-sm font-semibold">
                  {inr(priceForType(v, "local").amount)}
                  <span className="text-xs font-normal text-muted-foreground"> {priceForType(v, "local").unit}</span>
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-14 max-w-6xl px-4">
        <h2 className="text-xl font-bold">Verified sellers</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {sellers.data?.map((s) => (
            <div key={s.id} className="card-elevated p-5">
              <BadgeCheck className="size-5 text-success" />
              <h3 className="mt-2 font-semibold">{s.business_name}</h3>
              <p className="text-xs text-muted-foreground">{s.city}</p>
              <p className="mt-2 flex items-center gap-1 text-sm">
                <Star className="size-3.5 fill-current text-warning" /> {Number(s.rating).toFixed(1)}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-14 max-w-6xl px-4">
        <h2 className="text-xl font-bold">Customer reviews</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {reviews.data?.map((r) => (
            <div key={r.id} className="card-elevated p-5">
              <div className="flex gap-0.5">
                {Array.from({ length: r.rating }).map((_, i) => (
                  <Star key={i} className="size-4 fill-current text-warning" />
                ))}
              </div>
              <p className="mt-3 text-sm">{r.review_text}</p>
              {r.customer_name && <p className="mt-3 text-sm font-semibold">{r.customer_name}</p>}
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-14 max-w-6xl px-4">
        <div className="bg-hero rounded-2xl p-8 text-primary-foreground">
          <h2 className="text-2xl font-bold">Own a taxi, cab fleet or travel agency?</h2>
          <p className="mt-2 max-w-xl text-primary-foreground/80">
            List your vehicles on RideConnect and receive booking requests from travellers in your city. You keep
            90% of every fare.
          </p>
          <Button asChild variant="hero" size="lg" className="mt-5">
            <Link to="/become-a-seller">Become a seller</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
