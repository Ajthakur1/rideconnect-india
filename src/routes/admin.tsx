import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/lib/auth";
import { STATUS_LABEL, inr } from "@/lib/domain";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin dashboard — RideConnect" },
      { name: "description", content: "Manage sellers, vehicles, bookings and commissions on RideConnect." },
      { property: "og:title", content: "Admin dashboard — RideConnect" },
      { property: "og:description", content: "Manage sellers, vehicles, bookings and commissions on RideConnect." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const { session, data, isLoading } = useProfile() as any;
  const qc = useQueryClient();
  const isAdmin = data?.role === "admin";

  const all = useQuery({
    queryKey: ["admin-all"],
    enabled: isAdmin,
    queryFn: async () => {
      const [sellers, vehicles, bookings, commissions] = await Promise.all([
        supabase.from("seller_profiles").select("id, business_name, city, verification_status, commission_rate, status"),
        supabase.from("vehicles").select("id, brand, model, registration_number, status, city"),
        supabase.from("bookings").select("id, booking_number, booking_status, final_fare, commission_amount, created_at").order("created_at", { ascending: false }),
        supabase.from("commissions").select("commission_amount, settlement_status"),
      ]);
      return { sellers: sellers.data ?? [], vehicles: vehicles.data ?? [], bookings: bookings.data ?? [], commissions: commissions.data ?? [] };
    },
  });

  if (isLoading) return <p className="p-6 text-muted-foreground">Loading…</p>;
  if (!session) return <div className="p-6"><Link to="/auth" className="underline">Sign in</Link> as admin.</div>;
  if (!isAdmin) return <p className="p-6">Admins only.</p>;

  const d = all.data;
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-all"] });
  const act = async (p: PromiseLike<{ error: any }>) => {
    const { error } = await p;
    if (error) toast.error(error.message); else refresh();
  };
  const gbv = d?.bookings.reduce((a, b) => a + Number(b.final_fare), 0) ?? 0;
  const comm = d?.commissions.reduce((a, c) => a + Number(c.commission_amount), 0) ?? 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 pb-24">
      <h1 className="text-2xl font-bold">Admin</h1>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Sellers" value={d?.sellers.length ?? 0} />
        <Stat label="Vehicles" value={d?.vehicles.length ?? 0} />
        <Stat label="Gross booking value" value={inr(gbv)} />
        <Stat label="Total commission" value={inr(comm)} />
      </div>

      <h2 className="mt-8 text-lg font-semibold">Sellers</h2>
      <div className="mt-2 space-y-2">
        {d?.sellers.map((s) => (
          <div key={s.id} className="card-elevated flex flex-wrap items-center justify-between gap-2 p-3 text-sm">
            <span>{s.business_name} · {s.city} · {s.verification_status} · {Number(s.commission_rate)}%</span>
            <div className="flex gap-2">
              <Button size="sm" variant="success" onClick={() => act(supabase.from("seller_profiles").update({ verification_status: "verified" }).eq("id", s.id))}>Verify</Button>
              <Button size="sm" variant="outline" onClick={() => act(supabase.from("seller_profiles").update({ verification_status: "rejected" }).eq("id", s.id))}>Reject</Button>
              <Button size="sm" variant="outline" onClick={() => {
                const r = prompt("New commission %", String(s.commission_rate));
                if (r && !isNaN(Number(r))) act(supabase.from("seller_profiles").update({ commission_rate: Number(r) }).eq("id", s.id));
              }}>Commission</Button>
            </div>
          </div>
        ))}
      </div>

      <h2 className="mt-8 text-lg font-semibold">Vehicles</h2>
      <div className="mt-2 space-y-2">
        {d?.vehicles.map((v) => (
          <div key={v.id} className="card-elevated flex items-center justify-between gap-2 p-3 text-sm">
            <span>{v.brand} {v.model} · {v.registration_number} · {v.city} · {v.status}</span>
            <div className="flex gap-2">
              <Button size="sm" variant="success" onClick={() => act(supabase.from("vehicles").update({ status: "active" }).eq("id", v.id))}>Approve</Button>
              <Button size="sm" variant="outline" onClick={() => act(supabase.from("vehicles").update({ status: "rejected" }).eq("id", v.id))}>Reject</Button>
            </div>
          </div>
        ))}
      </div>

      <h2 className="mt-8 text-lg font-semibold">Bookings</h2>
      <div className="mt-2 space-y-2">
        {d?.bookings.map((b) => (
          <div key={b.id} className="card-elevated flex justify-between p-3 text-sm">
            <span>{b.booking_number} · {STATUS_LABEL[b.booking_status] ?? b.booking_status}</span>
            <span>{inr(b.final_fare)} · comm {inr(b.commission_amount)}</span>
          </div>
        ))}
      </div>
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
