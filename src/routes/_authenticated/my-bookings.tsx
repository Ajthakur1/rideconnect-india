import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/lib/auth";
import { CustomerNav, useCustomerGuard } from "@/components/CustomerNav";
import { BOOKING_TYPE_LABEL, STATUS_LABEL, inr } from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/my-bookings")({
  head: () => ({
    meta: [
      { title: "My bookings — RideConnect" },
      { name: "description", content: "Track your upcoming, completed and cancelled RideConnect rides." },
      { property: "og:title", content: "My bookings — RideConnect" },
      { property: "og:description", content: "Track your upcoming, completed and cancelled RideConnect rides." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MyBookings,
});

const TABS = [
  { key: "all", label: "All" },
  { key: "upcoming", label: "Upcoming" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
] as const;
const COMPLETED = ["trip_completed", "payment_completed"];
const CANCELLED = ["cancelled", "seller_rejected"];

function MyBookings() {
  const { session, data, isLoading } = useProfile() as any;
  const ok = useCustomerGuard(data?.role, isLoading);
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("all");
  const q = useQuery({
    queryKey: ["my-bookings", session?.user.id],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*, vehicles(brand, model)")
        .eq("customer_id", session.user.id)
        .order("pickup_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  if (!ok) return null;
  const list = (q.data ?? []).filter((b) =>
    tab === "all" ? true
      : tab === "completed" ? COMPLETED.includes(b.booking_status)
      : tab === "cancelled" ? CANCELLED.includes(b.booking_status)
      : !COMPLETED.includes(b.booking_status) && !CANCELLED.includes(b.booking_status),
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 pb-24">
      <h1 className="text-2xl font-bold">Hi{data?.profile?.name ? `, ${data.profile.name.split(" ")[0]}` : ""}</h1>
      <div className="mt-3"><CustomerNav /></div>
      <div className="mt-5 grid grid-cols-4 gap-1 rounded-xl bg-secondary p-1 text-sm">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`rounded-lg py-2 font-medium ${tab === t.key ? "bg-background shadow-sm" : "text-muted-foreground"}`}>
            {t.label}
          </button>
        ))}
      </div>
      {q.isLoading && <p className="mt-4 text-muted-foreground">Loading…</p>}
      {!q.isLoading && list.length === 0 && (
        <p className="mt-6 text-center text-muted-foreground">
          No bookings here. <Link to="/search" className="underline">Find a ride</Link>
        </p>
      )}
      <div className="mt-4 space-y-3">
        {list.map((b) => (
          <div key={b.id} className="card-elevated p-4 text-sm">
            <div className="flex justify-between">
              <span className="font-semibold">{b.booking_number}</span>
              <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">{STATUS_LABEL[b.booking_status] ?? b.booking_status}</span>
            </div>
            <p className="mt-1">{b.vehicles?.brand} {b.vehicles?.model} · {BOOKING_TYPE_LABEL[b.booking_type]}</p>
            <p className="text-muted-foreground">{b.pickup_location}{b.drop_location ? ` → ${b.drop_location}` : ""} · {b.pickup_date} {b.pickup_time?.slice(0, 5)}</p>
            <p className="mt-1 font-semibold">{inr(b.final_fare)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
