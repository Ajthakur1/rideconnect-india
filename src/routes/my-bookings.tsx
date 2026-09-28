import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { BOOKING_TYPE_LABEL, STATUS_LABEL, inr } from "@/lib/domain";

export const Route = createFileRoute("/my-bookings")({
  head: () => ({
    meta: [
      { title: "My bookings — RideConnect" },
      { name: "description", content: "Track your RideConnect ride bookings and their status." },
      { property: "og:title", content: "My bookings — RideConnect" },
      { property: "og:description", content: "Track your RideConnect ride bookings and their status." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MyBookings,
});

function MyBookings() {
  const { session, isLoading } = useSession() as any;
  const q = useQuery({
    queryKey: ["my-bookings", session?.user.id],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*, vehicles(brand, model)")
        .eq("customer_id", session.user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  if (isLoading) return <p className="p-6 text-muted-foreground">Loading…</p>;
  if (!session)
    return (
      <div className="p-6">
        <Link to="/auth" className="underline">Sign in</Link> to see your bookings.
      </div>
    );

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 pb-24">
      <h1 className="text-2xl font-bold">My bookings</h1>
      {q.data?.length === 0 && <p className="mt-4 text-muted-foreground">No bookings yet.</p>}
      <div className="mt-4 space-y-3">
        {q.data?.map((b) => (
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
