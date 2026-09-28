import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeCheck, IndianRupee, Bell, Car } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/become-a-seller")({
  head: () => ({
    meta: [
      { title: "Become a partner — RideConnect" },
      {
        name: "description",
        content: "List your taxis, chauffeur cars and rental vehicles on RideConnect and keep 90% of every fare.",
      },
      { property: "og:title", content: "Become a RideConnect partner" },
      { property: "og:description", content: "Receive booking requests from travellers in your city. 10% platform commission." },
    ],
  }),
  component: BecomeSeller,
});

function BecomeSeller() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold">Grow your travel business with RideConnect</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Vehicle owners, taxi operators, travel agencies and drivers use RideConnect to receive booking requests from
        travellers across Madhya Pradesh. You keep 90% of the fare — the platform commission is a flat 10%.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {[
          [Car, "List your fleet", "Add vehicles with photos, seats, fuel, transmission and your own pricing."],
          [Bell, "Get booking requests", "Requests appear in your dashboard. First operator to accept wins the trip."],
          [IndianRupee, "Clear earnings", "Every booking shows fare, platform commission and your payout."],
          [BadgeCheck, "Verified badge", "Once our team verifies you, travellers see a verified badge on your listings."],
        ].map(([Icon, title, body]) => {
          const I = Icon as typeof Car;
          return (
            <div key={title as string} className="card-elevated p-5">
              <I className="size-5 text-accent-foreground" />
              <h2 className="mt-3 text-base font-semibold">{title as string}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{body as string}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild variant="hero" size="lg">
          <Link to="/auth" search={{ mode: "register", role: "seller" }}>
            Register as a partner
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link to="/seller">Go to partner dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
