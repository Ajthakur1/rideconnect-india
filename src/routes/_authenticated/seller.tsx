import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  LayoutDashboard, Car, PlusCircle, Bell, CalendarCheck, Users, CalendarDays, IndianRupee, UserCircle, Trash2, Pencil, X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProfile } from "@/lib/auth";
import { acceptBookingRequest, rejectBookingRequest } from "@/lib/dispatch";
import { CITIES, FUEL_TYPES, STATUS_LABEL, TRANSMISSIONS, VEHICLE_TYPES, BOOKING_TYPE_LABEL, inr } from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/seller")({
  head: () => ({
    meta: [
      { title: "Seller dashboard — RideConnect" },
      { name: "description", content: "Manage vehicles, booking requests, drivers, availability and earnings on RideConnect." },
      { property: "og:title", content: "Seller dashboard — RideConnect" },
      { property: "og:description", content: "Manage vehicles, booking requests, drivers, availability and earnings on RideConnect." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  beforeLoad: async ({ context }) => {
    const uid = (context as any).user?.id;
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", uid);
    const roles = (data ?? []).map((r) => r.role);
    if (!roles.includes("seller") && !roles.includes("admin")) throw redirect({ to: "/my-bookings" });
  },
  component: SellerDashboard,
});

const TABS = [
  ["overview", "Overview", LayoutDashboard],
  ["vehicles", "My Vehicles", Car],
  ["add", "Add Vehicle", PlusCircle],
  ["requests", "Requests", Bell],
  ["bookings", "My Bookings", CalendarCheck],
  ["drivers", "Drivers", Users],
  ["availability", "Availability", CalendarDays],
  ["earnings", "Earnings", IndianRupee],
  ["profile", "Profile", UserCircle],
] as const;
type Tab = (typeof TABS)[number][0];

const CONFIRMED = ["seller_accepted", "confirmed", "driver_assigned", "trip_started"];
const COMPLETED = ["trip_completed", "payment_completed"];
const sel = "flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm";

function SellerDashboard() {
  const { data, isLoading } = useProfile() as any;
  const qc = useQueryClient();
  const seller = data?.seller;
  const [tab, setTab] = useState<Tab>("overview");
  const [editing, setEditing] = useState<any | null>(null);
  const sid = seller?.id;

  const requests = useQuery({
    queryKey: ["seller-requests", sid],
    enabled: !!sid,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("booking_requests")
        .select("*, bookings(*, vehicles(brand, model))")
        .eq("seller_id", sid)
        .eq("response_status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const rows = data ?? [];
      const ids = [...new Set(rows.map((r: any) => r.bookings?.customer_id).filter(Boolean))];
      let names: Record<string, string> = {};
      if (ids.length) {
        const { data: u } = await supabase.from("users").select("id,name").in("id", ids as string[]);
        names = Object.fromEntries((u ?? []).map((x) => [x.id, (x.name || "").replace(/^Demo:\s*/, "").split(" ")[0] ?? ""]));
      }
      return rows.map((r: any) => ({ ...r, customerFirst: names[r.bookings?.customer_id] ?? "Customer" }));
    },
  });
  const bookings = useQuery({
    queryKey: ["seller-bookings", sid],
    enabled: !!sid,
    queryFn: async () => {
      const { data, error } = await supabase.from("bookings").select("*, vehicles(brand, model)").eq("seller_id", sid).order("pickup_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const vehicles = useQuery({
    queryKey: ["seller-vehicles", sid],
    enabled: !!sid,
    queryFn: async () => {
      const { data, error } = await supabase.from("vehicles").select("*").eq("seller_id", sid).order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  if (isLoading) return <p className="p-6 text-muted-foreground">Loading…</p>;
  if (!seller) return <p className="p-6">This dashboard is for seller accounts only.</p>;

  const refresh = () => qc.invalidateQueries();
  const all = bookings.data ?? [];
  const confirmed = all.filter((b) => CONFIRMED.includes(b.booking_status));
  const completed = all.filter((b) => COMPLETED.includes(b.booking_status));
  const earning = [...confirmed, ...completed];
  const sum = (k: string) => earning.reduce((a, b: any) => a + Number(b[k] || 0), 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 pb-28">
      <h1 className="text-2xl font-bold">{seller.business_name}</h1>
      <p className="text-sm text-muted-foreground">
        Verification: {seller.verification_status} · Commission {Number(seller.commission_rate)}% (set by RideConnect)
      </p>
      {seller.verification_status === "pending" && (
        <div className="mt-4 rounded-xl border border-accent bg-secondary p-4 text-sm font-medium">
          Your seller account has been created and is awaiting verification.
        </div>
      )}

      <nav className="-mx-4 mt-5 flex gap-2 overflow-x-auto px-4 pb-2">
        {TABS.map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => { setTab(id); if (id !== "add") setEditing(null); }}
            className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-2 text-sm font-medium ${tab === id ? "border-accent bg-secondary" : "border-border"}`}
          >
            <Icon className="size-4" /> {label}
            {id === "requests" && (requests.data?.length ?? 0) > 0 && (
              <span className="rounded-full bg-accent px-1.5 text-xs text-accent-foreground">{requests.data?.length}</span>
            )}
          </button>
        ))}
      </nav>

      <div className="mt-4">
        {tab === "overview" && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Total vehicles" value={vehicles.data?.length ?? 0} />
            <Stat label="Pending requests" value={requests.data?.length ?? 0} />
            <Stat label="Confirmed bookings" value={confirmed.length} />
            <Stat label="Completed trips" value={completed.length} />
            <Stat label="Total booking value" value={inr(sum("final_fare"))} />
            <Stat label="Your earnings" value={inr(sum("seller_amount"))} />
            <Stat label="Platform commission" value={inr(sum("commission_amount"))} />
          </div>
        )}

        {tab === "vehicles" && (
          <div className="grid gap-3 sm:grid-cols-2">
            {vehicles.data?.length === 0 && <p className="text-sm text-muted-foreground">No vehicles yet. Use Add Vehicle to list one.</p>}
            {vehicles.data?.map((v) => (
              <div key={v.id} className="card-elevated overflow-hidden text-sm">
                {v.images?.[0] && <img src={v.images[0]} alt={`${v.brand} ${v.model}`} loading="lazy" className="h-40 w-full object-cover" />}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{v.brand} {v.model}</p>
                      <p className="text-muted-foreground">{v.vehicle_type} · {v.registration_number} · {v.seats} seats · {v.fuel_type} · {v.air_conditioned ? "AC" : "Non-AC"}</p>
                    </div>
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold">{v.status}</span>
                  </div>
                  <p className="mt-2 text-muted-foreground">Local {inr(v.local_price)} · {inr(v.outstation_price_per_km)}/km · Airport {inr(v.airport_price)} · {inr(v.rental_price_per_day)}/day</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => { setEditing(v); setTab("add"); }}><Pencil className="size-4" /> Edit</Button>
                    {v.status !== "pending" && (
                      <Button size="sm" variant="outline" onClick={async () => {
                        const { error } = await supabase.from("vehicles").update({ status: v.status === "inactive" ? "active" : "inactive" }).eq("id", v.id);
                        if (error) toast.error(error.message); else refresh();
                      }}>{v.status === "inactive" ? "Reactivate" : "Deactivate"}</Button>
                    )}
                    <Button size="sm" variant="outline" onClick={async () => {
                      if (!confirm("Delete this vehicle? Vehicles with bookings can only be deactivated.")) return;
                      const { error } = await supabase.from("vehicles").delete().eq("id", v.id);
                      if (error) toast.error("This vehicle has bookings — deactivate it instead."); else { toast.success("Vehicle deleted"); refresh(); }
                    }}><Trash2 className="size-4" /> Delete</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "add" && (
          <VehicleForm
            key={editing?.id ?? "new"}
            sellerId={sid}
            city={seller.city}
            vehicle={editing}
            onDone={() => { setEditing(null); setTab("vehicles"); refresh(); }}
            onCancel={() => { setEditing(null); setTab("vehicles"); }}
          />
        )}

        {tab === "requests" && (
          <div className="space-y-3">
            {requests.data?.length === 0 && <p className="text-sm text-muted-foreground">No pending requests.</p>}
            {requests.data?.map((r: any) => {
              const b = r.bookings;
              return (
                <div key={r.id} className="card-elevated p-4 text-sm">
                  <p className="font-semibold">{b?.booking_number} · {BOOKING_TYPE_LABEL[b?.booking_type] ?? b?.booking_type}</p>
                  <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
                    <dt className="text-muted-foreground">Customer</dt><dd>{r.customerFirst}</dd>
                    <dt className="text-muted-foreground">Pickup</dt><dd>{b?.pickup_location}</dd>
                    <dt className="text-muted-foreground">Drop</dt><dd>{b?.drop_location || "—"}</dd>
                    <dt className="text-muted-foreground">Date</dt><dd>{b?.pickup_date}</dd>
                    <dt className="text-muted-foreground">Time</dt><dd>{b?.pickup_time?.slice(0, 5)}</dd>
                    <dt className="text-muted-foreground">Passengers</dt><dd>{b?.passengers}</dd>
                    <dt className="text-muted-foreground">Vehicle</dt><dd>{b?.vehicles?.brand} {b?.vehicles?.model}</dd>
                    <dt className="text-muted-foreground">Estimated fare</dt><dd>{inr(b?.estimated_fare)}</dd>
                    <dt className="text-muted-foreground">Platform commission</dt><dd>{inr(b?.commission_amount)}</dd>
                    <dt className="text-muted-foreground">Your amount</dt><dd className="font-bold">{inr(b?.seller_amount)}</dd>
                  </dl>
                  <div className="mt-3 flex gap-2">
                    <Button variant="success" className="flex-1" onClick={async () => {
                      try { await acceptBookingRequest(r.id); toast.success("Booking confirmed"); refresh(); }
                      catch (e: any) { toast.error(e.message); }
                    }}>ACCEPT BOOKING</Button>
                    <Button variant="outline" className="flex-1" onClick={async () => {
                      try { await rejectBookingRequest(r.id); toast("Request rejected"); refresh(); }
                      catch (e: any) { toast.error(e.message); }
                    }}>REJECT BOOKING</Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === "bookings" && <BookingsList rows={all} />}
        {tab === "drivers" && <Drivers sellerId={sid} />}
        {tab === "availability" && <Availability vehicles={vehicles.data ?? []} />}
        {tab === "earnings" && (
          <div>
            <div className="grid grid-cols-3 gap-3">
              <Stat label="Booking value" value={inr(sum("final_fare"))} />
              <Stat label="Commission" value={inr(sum("commission_amount"))} />
              <Stat label="Your earnings" value={inr(sum("seller_amount"))} />
            </div>
            <div className="mt-4 space-y-2">
              {earning.length === 0 && <p className="text-sm text-muted-foreground">No earnings yet.</p>}
              {earning.map((b) => (
                <div key={b.id} className="card-elevated p-3 text-sm">
                  <div className="flex justify-between"><span className="font-semibold">{b.booking_number}</span><span>{STATUS_LABEL[b.booking_status] ?? b.booking_status}</span></div>
                  <p className="text-muted-foreground">{b.pickup_date} · Fare {inr(b.final_fare)} − {Number(b.commission_rate)}% {inr(b.commission_amount)} = <b className="text-foreground">{inr(b.seller_amount)}</b></p>
                </div>
              ))}
            </div>
          </div>
        )}
        {tab === "profile" && <SellerProfile seller={seller} onDone={refresh} />}
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

function BookingsList({ rows }: { rows: any[] }) {
  const [filter, setFilter] = useState("all");
  const f = rows.filter((b) =>
    filter === "all" ? true : filter === "upcoming" ? CONFIRMED.includes(b.booking_status) : filter === "completed" ? COMPLETED.includes(b.booking_status) : ["cancelled", "seller_rejected"].includes(b.booking_status),
  );
  return (
    <div>
      <div className="flex gap-2 overflow-x-auto">
        {["all", "upcoming", "completed", "cancelled"].map((k) => (
          <button key={k} onClick={() => setFilter(k)} className={`rounded-full border px-3 py-1 text-sm capitalize ${filter === k ? "border-accent bg-secondary" : ""}`}>{k}</button>
        ))}
      </div>
      <div className="mt-3 space-y-2">
        {f.length === 0 && <p className="text-sm text-muted-foreground">No bookings.</p>}
        {f.map((b) => (
          <div key={b.id} className="card-elevated p-3 text-sm">
            <div className="flex justify-between gap-2"><span className="font-semibold">{b.booking_number}</span><span>{STATUS_LABEL[b.booking_status] ?? b.booking_status}</span></div>
            <p className="text-muted-foreground">{b.vehicles?.brand} {b.vehicles?.model} · {b.pickup_location}{b.drop_location ? ` → ${b.drop_location}` : ""} · {b.pickup_date} {b.pickup_time?.slice(0, 5)}</p>
            <p>Fare {inr(b.final_fare)} · You earn {inr(b.seller_amount)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function VehicleForm({ sellerId, city, vehicle, onDone, onCancel }: { sellerId: string; city: string; vehicle: any | null; onDone: () => void; onCancel: () => void }) {
  const [f, setF] = useState(() => ({
    vehicle_type: vehicle?.vehicle_type ?? "Sedan",
    brand: vehicle?.brand ?? "",
    model: vehicle?.model ?? "",
    registration_number: vehicle?.registration_number ?? "",
    year: vehicle?.year ?? new Date().getFullYear(),
    seats: vehicle?.seats ?? 4,
    fuel_type: vehicle?.fuel_type ?? "Petrol",
    transmission: vehicle?.transmission ?? "Manual",
    air_conditioned: vehicle?.air_conditioned ?? true,
    city: vehicle?.city ?? (city || "Indore"),
    description: vehicle?.description ?? "",
    local_price: vehicle?.local_price ?? 1800,
    outstation_price_per_km: vehicle?.outstation_price_per_km ?? 12,
    airport_price: vehicle?.airport_price ?? 900,
    rental_price_per_day: vehicle?.rental_price_per_day ?? 2500,
    status: vehicle?.status ?? "pending",
  }));
  const [images, setImages] = useState<string[]>(vehicle?.images ?? []);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (k: string, v: any) => setF((p) => ({ ...p, [k]: v }));

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) { toast.error(`${file.name} is not an image`); continue; }
        if (file.size > 5 * 1024 * 1024) { toast.error(`${file.name} is over 5 MB`); continue; }
        const path = `${sellerId}/${crypto.randomUUID()}.${file.name.split(".").pop() || "jpg"}`;
        const { error } = await supabase.storage.from("vehicle-images").upload(path, file, { contentType: file.type });
        if (error) throw error;
        const { data, error: e2 } = await supabase.storage.from("vehicle-images").createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
        if (e2) throw e2;
        urls.push(data.signedUrl);
      }
      setImages((p) => [...p, ...urls]);
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.brand.trim() || !f.model.trim()) return void toast.error("Brand and model are required");
    if (!/^[A-Za-z0-9 -]{4,15}$/.test(f.registration_number.trim())) return void toast.error("Enter a valid registration number");
    if (f.seats < 1 || f.seats > 30) return void toast.error("Seats must be between 1 and 30");
    setBusy(true);
    const payload: any = {
      ...f,
      brand: f.brand.trim(), model: f.model.trim(), registration_number: f.registration_number.trim().toUpperCase(),
      description: f.description.trim() || null, images,
    };
    if (!vehicle || vehicle.status === "pending") payload.status = vehicle ? vehicle.status : "pending";
    const { error } = vehicle
      ? await supabase.from("vehicles").update(payload).eq("id", vehicle.id)
      : await supabase.from("vehicles").insert({ ...payload, seller_id: sellerId });
    setBusy(false);
    if (error) return void toast.error(error.message);
    toast.success(vehicle ? "Vehicle updated" : "Vehicle submitted for admin approval");
    onDone();
  }

  const num = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => set(k, Number(e.target.value));
  return (
    <form onSubmit={submit} className="card-elevated space-y-4 p-4 text-sm sm:p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{vehicle ? `Edit ${vehicle.brand} ${vehicle.model}` : "Add a vehicle"}</h2>
        {vehicle && <Button type="button" variant="ghost" size="sm" onClick={onCancel}><X className="size-4" /> Cancel</Button>}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Vehicle type"><select className={sel} value={f.vehicle_type} onChange={(e) => set("vehicle_type", e.target.value)}>{VEHICLE_TYPES.map((t) => <option key={t}>{t}</option>)}</select></Field>
        <Field label="City"><select className={sel} value={f.city} onChange={(e) => set("city", e.target.value)}>{CITIES.map((c) => <option key={c}>{c}</option>)}</select></Field>
        <Field label="Brand"><Input value={f.brand} onChange={(e) => set("brand", e.target.value)} maxLength={40} required /></Field>
        <Field label="Model"><Input value={f.model} onChange={(e) => set("model", e.target.value)} maxLength={40} required /></Field>
        <Field label="Registration number"><Input value={f.registration_number} onChange={(e) => set("registration_number", e.target.value)} placeholder="MP09 AB 1234" maxLength={15} required /></Field>
        <Field label="Year"><Input type="number" value={f.year} onChange={num("year")} min={1990} max={2030} /></Field>
        <Field label="Seats"><Input type="number" value={f.seats} onChange={num("seats")} min={1} max={30} /></Field>
        <Field label="Fuel"><select className={sel} value={f.fuel_type} onChange={(e) => set("fuel_type", e.target.value)}>{FUEL_TYPES.map((t) => <option key={t}>{t}</option>)}</select></Field>
        <Field label="Transmission"><select className={sel} value={f.transmission} onChange={(e) => set("transmission", e.target.value)}>{TRANSMISSIONS.map((t) => <option key={t}>{t}</option>)}</select></Field>
        <Field label="Air conditioning"><select className={sel} value={f.air_conditioned ? "yes" : "no"} onChange={(e) => set("air_conditioned", e.target.value === "yes")}><option value="yes">AC</option><option value="no">Non-AC</option></select></Field>
        <Field label="Local package price (₹)"><Input type="number" value={f.local_price} onChange={num("local_price")} min={0} /></Field>
        <Field label="Outstation price per km (₹)"><Input type="number" value={f.outstation_price_per_km} onChange={num("outstation_price_per_km")} min={0} /></Field>
        <Field label="Airport price (₹)"><Input type="number" value={f.airport_price} onChange={num("airport_price")} min={0} /></Field>
        <Field label="Rental price per day (₹)"><Input type="number" value={f.rental_price_per_day} onChange={num("rental_price_per_day")} min={0} /></Field>
        <Field label="Status">
          {vehicle && vehicle.status !== "pending" ? (
            <select className={sel} value={f.status} onChange={(e) => set("status", e.target.value)}><option value="active">Active</option><option value="inactive">Inactive</option></select>
          ) : (
            <p className="py-2 text-muted-foreground">Pending admin approval</p>
          )}
        </Field>
      </div>
      <Field label="Description"><textarea className={sel + " h-20 py-2"} value={f.description} onChange={(e) => set("description", e.target.value)} maxLength={500} /></Field>
      <div>
        <Label>Photos</Label>
        <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5">
          {images.map((src, i) => (
            <div key={src} className="relative">
              <img src={src} alt={`Vehicle photo ${i + 1}`} className="aspect-[4/3] w-full rounded-md object-cover" />
              <button type="button" aria-label="Remove photo" onClick={() => setImages((p) => p.filter((x) => x !== src))} className="absolute right-1 top-1 rounded-full bg-background/90 p-1"><X className="size-3" /></button>
            </div>
          ))}
        </div>
        <Input className="mt-2" type="file" accept="image/*" multiple disabled={uploading} onChange={(e) => { upload(e.target.files); e.target.value = ""; }} />
        {uploading && <p className="mt-1 text-xs text-muted-foreground">Uploading…</p>}
      </div>
      <Button type="submit" variant="hero" size="lg" className="w-full" disabled={busy || uploading}>
        {busy ? "Saving…" : vehicle ? "Save changes" : "Add vehicle"}
      </Button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><Label className="mb-1 block">{label}</Label>{children}</div>;
}

function Drivers({ sellerId }: { sellerId: string }) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["seller-drivers", sellerId],
    queryFn: async () => {
      const { data, error } = await supabase.from("drivers").select("*").eq("seller_id", sellerId).order("created_at");
      if (error) throw error;
      return data ?? [];
    },
  });
  const [d, setD] = useState({ name: "", phone: "", license_number: "" });
  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (d.name.trim().length < 2) return void toast.error("Enter driver name");
    if (!/^[0-9+ ]{10,15}$/.test(d.phone.trim())) return void toast.error("Enter a valid mobile number");
    const { error } = await supabase.from("drivers").insert({ seller_id: sellerId, name: d.name.trim(), phone: d.phone.trim(), license_number: d.license_number.trim() || null });
    if (error) return void toast.error(error.message);
    setD({ name: "", phone: "", license_number: "" });
    toast.success("Driver added");
    qc.invalidateQueries({ queryKey: ["seller-drivers"] });
  }
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-2">
        {q.data?.length === 0 && <p className="text-sm text-muted-foreground">No drivers yet.</p>}
        {q.data?.map((x) => (
          <div key={x.id} className="card-elevated flex items-center justify-between gap-2 p-3 text-sm">
            <div>
              <p className="font-semibold">{x.name}</p>
              <p className="text-muted-foreground">{x.phone} · {x.license_number ?? "No licence"} · {x.status} · {x.verification_status}</p>
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant="outline" onClick={async () => {
                const { error } = await supabase.from("drivers").update({ status: x.status === "active" ? "inactive" : "active" }).eq("id", x.id);
                if (error) toast.error(error.message); else qc.invalidateQueries({ queryKey: ["seller-drivers"] });
              }}>{x.status === "active" ? "Deactivate" : "Activate"}</Button>
              <Button size="sm" variant="outline" aria-label="Delete driver" onClick={async () => {
                if (!confirm(`Remove ${x.name}?`)) return;
                const { error } = await supabase.from("drivers").delete().eq("id", x.id);
                if (error) toast.error("Driver is assigned to bookings — deactivate instead."); else qc.invalidateQueries({ queryKey: ["seller-drivers"] });
              }}><Trash2 className="size-4" /></Button>
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={add} className="card-elevated space-y-3 p-4 text-sm">
        <h3 className="font-semibold">Add driver</h3>
        <Field label="Name"><Input value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} maxLength={100} /></Field>
        <Field label="Mobile number"><Input type="tel" value={d.phone} onChange={(e) => setD({ ...d, phone: e.target.value })} maxLength={15} /></Field>
        <Field label="Licence number"><Input value={d.license_number} onChange={(e) => setD({ ...d, license_number: e.target.value })} maxLength={30} /></Field>
        <Button type="submit" className="w-full">Add driver</Button>
      </form>
    </div>
  );
}

function Availability({ vehicles }: { vehicles: any[] }) {
  const qc = useQueryClient();
  const [vid, setVid] = useState<string>(vehicles[0]?.id ?? "");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const q = useQuery({
    queryKey: ["availability", vid],
    enabled: !!vid,
    queryFn: async () => {
      const { data, error } = await supabase.from("vehicle_availability").select("*").eq("vehicle_id", vid).gte("date", new Date().toISOString().slice(0, 10)).order("date");
      if (error) throw error;
      return data ?? [];
    },
  });
  if (!vehicles.length) return <p className="text-sm text-muted-foreground">Add a vehicle first.</p>;
  async function block() {
    if ((q.data ?? []).some((r) => r.date === date)) return void toast.error("That date already has an entry");
    const { error } = await supabase.from("vehicle_availability").insert({ vehicle_id: vid, date, status: "blocked" });
    if (error) return void toast.error(error.message);
    toast.success("Date blocked");
    qc.invalidateQueries({ queryKey: ["availability", vid] });
  }
  return (
    <div className="card-elevated space-y-3 p-4 text-sm">
      <p className="text-muted-foreground">Vehicles are available every day unless you block a date. Booked dates appear here automatically.</p>
      <div className="grid gap-2 sm:grid-cols-3">
        <select className={sel} value={vid} onChange={(e) => setVid(e.target.value)}>
          {vehicles.map((v) => <option key={v.id} value={v.id}>{v.brand} {v.model} · {v.registration_number}</option>)}
        </select>
        <Input type="date" value={date} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setDate(e.target.value)} />
        <Button onClick={block}>Block this date</Button>
      </div>
      <div className="space-y-2">
        {q.data?.length === 0 && <p className="text-muted-foreground">No blocked or booked dates ahead.</p>}
        {q.data?.map((r) => (
          <div key={r.id} className="flex items-center justify-between rounded-md border p-2">
            <span>{r.date} · <b className="capitalize">{r.status}</b></span>
            {r.status === "blocked" && (
              <Button size="sm" variant="outline" onClick={async () => {
                const { error } = await supabase.from("vehicle_availability").delete().eq("id", r.id);
                if (error) toast.error(error.message); else qc.invalidateQueries({ queryKey: ["availability", vid] });
              }}>Unblock</Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function SellerProfile({ seller, onDone }: { seller: any; onDone: () => void }) {
  const [p, setP] = useState({
    business_name: seller.business_name ?? "", owner_name: seller.owner_name ?? "", phone: seller.phone ?? "",
    email: seller.email ?? "", city: seller.city ?? "Indore", address: seller.address ?? "",
  });
  const [busy, setBusy] = useState(false);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (p.business_name.trim().length < 2 || p.owner_name.trim().length < 2) return void toast.error("Business and owner name are required");
    if (p.phone && !/^[0-9+ ]{10,15}$/.test(p.phone.trim())) return void toast.error("Enter a valid mobile number");
    setBusy(true);
    const { error } = await supabase.from("seller_profiles").update({
      business_name: p.business_name.trim(), owner_name: p.owner_name.trim(), phone: p.phone.trim() || null,
      email: p.email.trim() || null, city: p.city, address: p.address.trim() || null,
    }).eq("id", seller.id);
    setBusy(false);
    if (error) return void toast.error(error.message);
    toast.success("Profile saved");
    onDone();
  }
  const set = (k: keyof typeof p) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setP({ ...p, [k]: e.target.value });
  return (
    <form onSubmit={save} className="card-elevated space-y-3 p-4 text-sm sm:max-w-xl">
      <Field label="Business name"><Input value={p.business_name} onChange={set("business_name")} maxLength={120} /></Field>
      <Field label="Owner name"><Input value={p.owner_name} onChange={set("owner_name")} maxLength={100} /></Field>
      <Field label="Mobile number"><Input type="tel" value={p.phone} onChange={set("phone")} maxLength={15} /></Field>
      <Field label="Email"><Input type="email" value={p.email} onChange={set("email")} maxLength={255} /></Field>
      <Field label="City"><select className={sel} value={p.city} onChange={set("city")}>{CITIES.map((c) => <option key={c}>{c}</option>)}</select></Field>
      <Field label="Address"><Input value={p.address} onChange={set("address")} maxLength={300} /></Field>
      <div className="grid grid-cols-2 gap-2 rounded-md bg-secondary p-3">
        <p>Verification: <b>{seller.verification_status}</b></p>
        <p>Commission: <b>{Number(seller.commission_rate)}%</b></p>
        <p className="col-span-2 text-xs text-muted-foreground">Commission and verification are managed by RideConnect.</p>
      </div>
      <Button type="submit" className="w-full" disabled={busy}>{busy ? "Saving…" : "Save profile"}</Button>
      <p className="text-center text-xs text-muted-foreground"><Link to="/become-a-seller" className="underline">Partner info</Link></p>
    </form>
  );
}
