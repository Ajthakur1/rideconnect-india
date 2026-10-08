import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProfile } from "@/lib/auth";
import { BOOKING_STATUSES, STATUS_LABEL, inr } from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin dashboard — RideConnect" },
      { name: "description", content: "Manage customers, sellers, vehicles, bookings, payments and commissions on RideConnect." },
      { property: "og:title", content: "Admin dashboard — RideConnect" },
      { property: "og:description", content: "Manage customers, sellers, vehicles, bookings, payments and commissions on RideConnect." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminDashboard,
});

const TABS = ["Dashboard", "Customers", "Sellers", "Vehicles", "Bookings", "Payments", "Commissions", "Reviews", "Reports", "Settings"] as const;
type Tab = (typeof TABS)[number];
const DONE = ["trip_completed", "payment_completed"];

function AdminDashboard() {
  const { data, isLoading } = useProfile() as any;
  const isAdmin = data?.role === "admin";
  const [tab, setTab] = useState<Tab>("Dashboard");
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["admin-all"],
    enabled: isAdmin,
    queryFn: async () => {
      const [users, roles, sellers, vehicles, bookings, payments, commissions, reviews, settings] = await Promise.all([
        supabase.from("users").select("id,name,phone,email,status,created_at,is_demo"),
        supabase.from("user_roles").select("user_id,role"),
        supabase.from("seller_profiles").select("*"),
        supabase.from("vehicles").select("*"),
        supabase.from("bookings").select("*").order("created_at", { ascending: false }),
        supabase.from("payments").select("*").order("created_at", { ascending: false }),
        supabase.from("commissions").select("*").order("created_at", { ascending: false }),
        supabase.from("reviews").select("*").order("created_at", { ascending: false }),
        supabase.from("platform_settings").select("*"),
      ]);
      const roleOf: Record<string, string[]> = {};
      for (const r of roles.data ?? []) (roleOf[r.user_id] ??= []).push(r.role);
      return {
        users: users.data ?? [], roleOf, sellers: sellers.data ?? [], vehicles: vehicles.data ?? [],
        bookings: bookings.data ?? [], payments: payments.data ?? [], commissions: commissions.data ?? [],
        reviews: reviews.data ?? [], settings: settings.data ?? [],
      };
    },
  });

  if (isLoading) return <p className="p-6 text-muted-foreground">Loading…</p>;
  if (!isAdmin) return <div className="p-6">This area is for RideConnect admins only. <Link to="/" className="underline">Go home</Link></div>;
  const d = q.data;
  if (!d) return <p className="p-6 text-muted-foreground">Loading data…</p>;

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-all"] });
  const act = async (p: PromiseLike<{ error: any }>, ok = "Saved") => {
    const { error } = await p;
    if (error) toast.error(error.message); else { toast.success(ok); refresh(); }
  };
  const userName = (id?: string | null) => d.users.find((u) => u.id === id)?.name ?? "—";
  const sellerName = (id?: string | null) => d.sellers.find((s) => s.id === id)?.business_name ?? "—";
  const vehName = (id?: string | null) => { const v = d.vehicles.find((x) => x.id === id); return v ? `${v.brand} ${v.model}` : "—"; };
  const bookingNo = (id?: string | null) => d.bookings.find((b) => b.id === id)?.booking_number ?? "—";
  const customers = d.users.filter((u) => !(d.roleOf[u.id] ?? []).some((r) => r === "seller" || r === "admin"));

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 pb-24">
      <h1 className="text-2xl font-bold">Admin dashboard</h1>
      <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`shrink-0 rounded-full border px-3 py-1.5 text-sm ${t === tab ? "bg-primary text-primary-foreground" : ""}`}>{t}</button>
        ))}
      </div>

      <div className="mt-4">
        {tab === "Dashboard" && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <Stat label="Total customers" value={customers.length} />
            <Stat label="Total sellers" value={d.sellers.length} />
            <Stat label="Verified sellers" value={d.sellers.filter((s) => s.verification_status === "verified").length} />
            <Stat label="Total vehicles" value={d.vehicles.length} />
            <Stat label="Total bookings" value={d.bookings.length} />
            <Stat label="Completed bookings" value={d.bookings.filter((b) => DONE.includes(b.booking_status)).length} />
            <Stat label="Cancelled bookings" value={d.bookings.filter((b) => b.booking_status === "cancelled").length} />
            <Stat label="Total booking value" value={inr(d.bookings.filter((b) => b.booking_status !== "cancelled").reduce((a, b) => a + Number(b.final_fare), 0))} />
            <Stat label="Platform commission" value={inr(d.commissions.reduce((a, c) => a + Number(c.commission_amount), 0))} />
            <Stat label="Pending seller approvals" value={d.sellers.filter((s) => s.verification_status === "pending").length} />
          </div>
        )}

        {tab === "Customers" && (
          <List>{customers.map((u) => (
            <Card key={u.id}>
              <p className="font-semibold">{u.name} {u.is_demo && <Badge>demo</Badge>}</p>
              <p className="text-muted-foreground">{u.email} · {u.phone ?? "—"} · {u.status}</p>
              <p className="text-muted-foreground">{d.bookings.filter((b) => b.customer_id === u.id).length} bookings</p>
              <div className="mt-2">
                {u.status === "suspended"
                  ? <Button size="sm" variant="outline" onClick={() => act(supabase.from("users").update({ status: "active" }).eq("id", u.id), "Reactivated")}>Reactivate</Button>
                  : <Button size="sm" variant="outline" onClick={() => act(supabase.from("users").update({ status: "suspended" }).eq("id", u.id), "Suspended")}>Suspend</Button>}
              </div>
            </Card>
          ))}</List>
        )}

        {tab === "Sellers" && <Sellers d={d} act={act} vehName={vehName} />}

        {tab === "Vehicles" && (
          <List>{d.vehicles.map((v) => (
            <Card key={v.id}>
              <div className="flex gap-3">
                {v.images?.[0] && <img src={v.images[0]} alt="" loading="lazy" className="h-16 w-24 rounded-md object-cover" />}
                <div>
                  <p className="font-semibold">{v.brand} {v.model} · {v.vehicle_type}</p>
                  <p className="text-muted-foreground">{v.registration_number} · {v.city} · {v.seats} seats · {sellerName(v.seller_id)}</p>
                  <p>Status: <b>{v.status}</b> · Local {inr(v.local_price)} · {inr(v.outstation_price_per_km)}/km</p>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <Link to="/vehicle/$vehicleId" params={{ vehicleId: v.id }} className="text-sm underline self-center">View</Link>
                <Button size="sm" variant="success" onClick={() => act(supabase.from("vehicles").update({ status: "active" }).eq("id", v.id), "Approved")}>Approve</Button>
                <Button size="sm" variant="outline" onClick={() => act(supabase.from("vehicles").update({ status: "rejected" }).eq("id", v.id), "Rejected")}>Reject</Button>
                <Button size="sm" variant="outline" onClick={() => act(supabase.from("vehicles").update({ status: "inactive" }).eq("id", v.id), "Deactivated")}>Deactivate</Button>
              </div>
            </Card>
          ))}</List>
        )}

        {tab === "Bookings" && <Bookings d={d} act={act} userName={userName} sellerName={sellerName} vehName={vehName} />}

        {tab === "Payments" && (
          <List>{d.payments.length === 0 && <p className="text-sm text-muted-foreground">No payments yet.</p>}
            {d.payments.map((p) => (
              <Card key={p.id}>
                <p className="font-semibold">{bookingNo(p.booking_id)} · {inr(p.amount)}</p>
                <p className="text-muted-foreground">{userName(p.customer_id)} · {p.payment_method} · {p.payment_status} · {p.paid_at?.slice(0, 10) ?? "unpaid"}</p>
              </Card>
            ))}</List>
        )}

        {tab === "Commissions" && (
          <List>{d.commissions.map((c) => (
            <Card key={c.id}>
              <p className="font-semibold">{bookingNo(c.booking_id)} · {sellerName(c.seller_id)}</p>
              <div className="grid grid-cols-2 gap-x-3 sm:grid-cols-5">
                <span>Booking value {inr(c.booking_amount)}</span>
                <span>Rate {Number(c.commission_rate)}%</span>
                <span>Commission {inr(c.commission_amount)}</span>
                <span>Seller amount {inr(Number(c.booking_amount) - Number(c.commission_amount))}</span>
                <span>Settlement: <b>{c.settlement_status}</b></span>
              </div>
              {c.settlement_status !== "settled" && (
                <Button size="sm" variant="outline" className="mt-2" onClick={() => act(supabase.from("commissions").update({ settlement_status: "settled", settled_at: new Date().toISOString() }).eq("id", c.id), "Marked settled")}>Mark settled</Button>
              )}
            </Card>
          ))}</List>
        )}

        {tab === "Reviews" && (
          <List>{d.reviews.map((r) => (
            <Card key={r.id}>
              <p className="font-semibold">★ {r.rating} · {vehName(r.vehicle_id)} · {sellerName(r.seller_id)}</p>
              <p>{r.review_text}</p>
              <p className="text-muted-foreground">by {userName(r.customer_id)}</p>
              <Button size="sm" variant="outline" className="mt-2" onClick={() => act(supabase.from("reviews").delete().eq("id", r.id), "Review removed")}>Remove</Button>
            </Card>
          ))}</List>
        )}

        {tab === "Reports" && <Reports d={d} />}
        {tab === "Settings" && <Settings d={d} act={act} />}
      </div>
    </div>
  );
}

function Sellers({ d, act, vehName }: any) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <List>{d.sellers.map((s: any) => (
      <Card key={s.id}>
        <p className="font-semibold">{s.business_name} {s.is_demo && <Badge>demo</Badge>}</p>
        <p className="text-muted-foreground">{s.owner_name} · {s.city} · {s.phone ?? "—"} · {s.email ?? "—"}</p>
        <p>Verification: <b>{s.verification_status}</b> · Status: <b>{s.status}</b> · Commission {Number(s.commission_rate)}%</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => setOpen(open === s.id ? null : s.id)}>{open === s.id ? "Hide" : "View"}</Button>
          <Button size="sm" variant="success" onClick={() => act(supabase.from("seller_profiles").update({ verification_status: "verified", status: "active" }).eq("id", s.id), "Seller approved")}>Approve</Button>
          <Button size="sm" variant="outline" onClick={() => act(supabase.from("seller_profiles").update({ verification_status: "rejected" }).eq("id", s.id), "Seller rejected")}>Reject</Button>
          {s.status === "suspended"
            ? <Button size="sm" variant="outline" onClick={() => act(supabase.from("seller_profiles").update({ status: "active" }).eq("id", s.id), "Reactivated")}>Reactivate</Button>
            : <Button size="sm" variant="outline" onClick={() => act(supabase.from("seller_profiles").update({ status: "suspended" }).eq("id", s.id), "Seller suspended")}>Suspend</Button>}
          <Button size="sm" variant="outline" onClick={() => {
            const r = prompt("Commission % for this seller", String(s.commission_rate));
            if (r !== null && !isNaN(Number(r)) && Number(r) >= 0 && Number(r) <= 100) act(supabase.from("seller_profiles").update({ commission_rate: Number(r) }).eq("id", s.id));
          }}>Set commission</Button>
        </div>
        {open === s.id && (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div><p className="font-semibold">Vehicles</p>
              {d.vehicles.filter((v: any) => v.seller_id === s.id).map((v: any) => <p key={v.id}>{v.brand} {v.model} · {v.registration_number} · {v.status}</p>)}
            </div>
            <div><p className="font-semibold">Bookings</p>
              {d.bookings.filter((b: any) => b.seller_id === s.id).map((b: any) => <p key={b.id}>{b.booking_number} · {vehName(b.vehicle_id)} · {STATUS_LABEL[b.booking_status]} · {inr(b.final_fare)}</p>)}
            </div>
          </div>
        )}
      </Card>
    ))}</List>
  );
}

function Bookings({ d, act, userName, sellerName, vehName }: any) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const rows = d.bookings.filter((b: any) =>
    (!search || (b.booking_number ?? "").toLowerCase().includes(search.toLowerCase())) &&
    (status === "all" || b.booking_status === status) &&
    (!from || b.pickup_date >= from) && (!to || b.pickup_date <= to));
  return (
    <div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Input placeholder="Booking number" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="rounded-md border bg-background px-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All statuses</option>
          {BOOKING_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </select>
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From date" />
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-label="To date" />
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{rows.length} bookings</p>
      <List>{rows.map((b: any) => (
        <Card key={b.id}>
          <p className="font-semibold">{b.booking_number} · {STATUS_LABEL[b.booking_status] ?? b.booking_status}</p>
          <p>Customer: {userName(b.customer_id)} · Seller: {sellerName(b.seller_id)} · Vehicle: {vehName(b.vehicle_id)}</p>
          <p className="text-muted-foreground">{b.pickup_location}{b.drop_location ? ` → ${b.drop_location}` : ""} · {b.pickup_date} {b.pickup_time?.slice(0, 5)}</p>
          <p>Fare {inr(b.final_fare)} · Commission {inr(b.commission_amount)} ({Number(b.commission_rate)}%) · Seller {inr(b.seller_amount)}</p>
          <select className="mt-2 rounded-md border bg-background px-2 py-1 text-sm" value={b.booking_status}
            onChange={(e) => act(supabase.from("bookings").update({ booking_status: e.target.value }).eq("id", b.id), "Status updated")}>
            {BOOKING_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </select>
        </Card>
      ))}</List>
    </div>
  );
}

function Reports({ d }: any) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const rows = useMemo(() => d.bookings.filter((b: any) => {
    const day = b.created_at.slice(0, 10);
    return (!from || day >= from) && (!to || day <= to);
  }), [d, from, to]);
  const group = (len: number) => {
    const m: Record<string, { n: number; v: number; c: number }> = {};
    for (const b of rows) {
      const k = b.created_at.slice(0, len);
      m[k] ??= { n: 0, v: 0, c: 0 };
      m[k].n++; m[k].v += Number(b.final_fare); m[k].c += Number(b.commission_amount);
    }
    return Object.entries(m).sort((a, b) => b[0].localeCompare(a[0]));
  };
  const live = rows.filter((b: any) => b.booking_status !== "cancelled");
  const sum = (k: string) => live.reduce((a: number, b: any) => a + Number(b[k]), 0);
  return (
    <div>
      <div className="flex gap-2">
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From date" />
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-label="To date" />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Stat label="Gross booking value" value={inr(sum("final_fare"))} />
        <Stat label="Commission earned" value={inr(sum("commission_amount"))} />
        <Stat label="Seller earnings" value={inr(sum("seller_amount"))} />
        <Stat label="Completed trips" value={rows.filter((b: any) => DONE.includes(b.booking_status)).length} />
        <Stat label="Cancelled trips" value={rows.filter((b: any) => b.booking_status === "cancelled").length} />
      </div>
      {[["Daily bookings", 10], ["Monthly bookings", 7]].map(([title, len]) => (
        <div key={title as string} className="mt-5">
          <h3 className="font-semibold">{title}</h3>
          <List>{group(len as number).map(([k, g]) => (
            <Card key={k}><div className="flex justify-between"><span>{k}</span><span>{g.n} bookings · {inr(g.v)} · comm {inr(g.c)}</span></div></Card>
          ))}</List>
        </div>
      ))}
    </div>
  );
}

function Settings({ d, act }: any) {
  const cur = d.settings.find((s: any) => s.key === "default_commission_rate")?.value ?? "10";
  const [rate, setRate] = useState(cur);
  return (
    <Card>
      <p className="font-semibold">Default commission rate</p>
      <p className="text-muted-foreground">Applies to sellers who join from now on, and so to their future bookings. Existing bookings keep their rate; change an existing seller's rate under Sellers.</p>
      <div className="mt-2 flex gap-2">
        <Input type="number" min={0} max={100} step="0.5" value={rate} onChange={(e) => setRate(e.target.value)} className="w-32" />
        <Button onClick={() => {
          const n = Number(rate);
          if (isNaN(n) || n < 0 || n > 100) { toast.error("Enter a rate between 0 and 100."); return; }
          act(supabase.from("platform_settings").upsert({ key: "default_commission_rate", value: String(n), updated_at: new Date().toISOString() }), "Default commission updated");
        }}>Save</Button>
      </div>
    </Card>
  );
}

function List({ children }: { children: React.ReactNode }) { return <div className="mt-2 space-y-2">{children}</div>; }
function Card({ children }: { children: React.ReactNode }) { return <div className="card-elevated p-3 text-sm">{children}</div>; }
function Badge({ children }: { children: React.ReactNode }) { return <span className="ml-1 rounded bg-secondary px-1.5 text-xs text-muted-foreground">{children}</span>; }
function Stat({ label, value }: { label: string; value: string | number }) {
  return <div className="card-elevated p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="text-lg font-bold">{value}</p></div>;
}
