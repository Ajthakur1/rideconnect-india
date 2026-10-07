import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { BOOKING_TYPE_LABEL, STATUS_LABEL, inr } from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/booking/$bookingId")({
  head: () => ({
    meta: [
      { title: "Booking confirmation — RideConnect" },
      { name: "description", content: "Your RideConnect booking details and status." },
      { property: "og:title", content: "Booking confirmation — RideConnect" },
      { property: "og:description", content: "Your RideConnect booking details and status." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BookingConfirmation,
});

function BookingConfirmation() {
  const { bookingId } = Route.useParams();
  const q = useQuery({
    queryKey: ["booking", bookingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*, vehicles(brand, model, vehicle_type), seller_profiles(business_name)")
        .eq("id", bookingId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (q.isLoading) return <p className="p-6 text-muted-foreground">Loading…</p>;
  const b = q.data as any;
  if (!b) return <p className="p-6">Booking not found.</p>;

  const rows: [string, string][] = [
    ["Booking number", b.booking_number],
    ["Vehicle", `${b.vehicles?.brand ?? ""} ${b.vehicles?.model ?? ""} (${b.vehicles?.vehicle_type ?? ""})`],
    ["Seller", b.seller_profiles?.business_name ?? "Assigned operator"],
    ["Trip type", BOOKING_TYPE_LABEL[b.booking_type] ?? b.booking_type],
    ["Pickup", b.pickup_location],
    ["Drop", b.drop_location ?? "—"],
    ["Date", b.pickup_date],
    ["Time", b.pickup_time?.slice(0, 5)],
    ["Passengers", String(b.passengers)],
    ["Estimated fare", inr(b.estimated_fare)],
    ["Booking status", STATUS_LABEL[b.booking_status] ?? b.booking_status],
  ];

  return (
    <div className="mx-auto max-w-lg px-4 py-8 pb-24">
      <div className="text-center">
        <CheckCircle2 className="mx-auto size-12 text-primary" />
        <h1 className="mt-3 text-2xl font-bold">Booking received</h1>
        <p className="text-sm text-muted-foreground">We've sent your request to the operator. You'll see it confirmed here once they accept.</p>
      </div>
      <div className="card-elevated mt-6 divide-y text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 p-3">
            <span className="text-muted-foreground">{k}</span>
            <span className="text-right font-medium">{v}</span>
          </div>
        ))}
      </div>
      {b.customer_notes && <p className="mt-3 text-sm text-muted-foreground">Notes: {b.customer_notes}</p>}
      <div className="mt-6 flex gap-2">
        <Button asChild variant="outline" className="flex-1"><Link to="/search">Book another</Link></Button>
        <Button asChild variant="hero" className="flex-1"><Link to="/my-bookings">My bookings</Link></Button>
      </div>
    </div>
  );
}
