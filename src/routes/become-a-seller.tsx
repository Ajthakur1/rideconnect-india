import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { BadgeCheck, IndianRupee, Bell, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { CITIES } from "@/lib/domain";

export const Route = createFileRoute("/become-a-seller")({
  head: () => ({
    meta: [
      { title: "Become a partner — RideConnect" },
      { name: "description", content: "Register your taxi or rental business on RideConnect and keep 90% of every fare." },
      { property: "og:title", content: "Become a RideConnect partner" },
      { property: "og:description", content: "Receive booking requests from travellers in your city. 10% platform commission." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BecomeSeller,
});

const schema = z.object({
  owner: z.string().trim().min(2, "Enter the owner name").max(100),
  business: z.string().trim().min(2, "Enter your business name").max(120),
  phone: z.string().trim().regex(/^[0-9+ ]{10,15}$/, "Enter a valid mobile number"),
  email: z.string().trim().email("Enter a valid email").max(255),
  city: z.string().trim().min(2).max(60),
  address: z.string().trim().min(5, "Enter your address").max(300),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
});

function BecomeSeller() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [f, setF] = useState({ owner: "", business: "", phone: "", email: "", city: "Indore", address: "", password: "" });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF((p) => ({ ...p, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(f);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    const v = parsed.data;
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: v.email,
        password: v.password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) throw error;
      if (!data.session) {
        toast.success("Check your email to confirm your account, then sign in.");
        return;
      }
      const { error: rpcError } = await supabase.rpc("bootstrap_profile", {
        _name: v.owner, _phone: v.phone, _role: "seller", _business_name: v.business, _city: v.city,
      });
      if (rpcError) throw rpcError;
      const { error: upErr } = await supabase
        .from("seller_profiles")
        .update({ address: v.address, owner_name: v.owner, phone: v.phone })
        .eq("user_id", data.session.user.id);
      if (upErr) throw upErr;
      qc.clear();
      toast.success("Your seller account has been created and is awaiting verification.");
      navigate({ to: "/seller" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  const sel = "flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm";

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <h1 className="text-3xl font-bold">Grow your travel business with RideConnect</h1>
          <p className="mt-3 text-muted-foreground">
            Vehicle owners, taxi operators, travel agencies and drivers use RideConnect to receive booking requests from
            travellers across Madhya Pradesh. You keep 90% of the fare — the platform commission is a flat 10%.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {[
              [Car, "List your fleet", "Add vehicles with photos, seats, fuel and your own pricing."],
              [Bell, "Get booking requests", "First operator to accept wins the trip."],
              [IndianRupee, "Clear earnings", "Every booking shows fare, commission and your payout."],
              [BadgeCheck, "Verified badge", "Once verified, travellers see a badge on your listings."],
            ].map(([Icon, title, body]) => {
              const I = Icon as typeof Car;
              return (
                <div key={title as string} className="card-elevated p-4">
                  <I className="size-5 text-accent-foreground" />
                  <h2 className="mt-2 text-sm font-semibold">{title as string}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">{body as string}</p>
                </div>
              );
            })}
          </div>
        </div>

        <form onSubmit={submit} className="card-elevated space-y-4 p-6">
          <h2 className="text-xl font-bold">Register as a partner</h2>
          <div><Label htmlFor="owner">Owner name</Label><Input id="owner" value={f.owner} onChange={set("owner")} required maxLength={100} /></div>
          <div><Label htmlFor="business">Business / company name</Label><Input id="business" value={f.business} onChange={set("business")} required maxLength={120} /></div>
          <div><Label htmlFor="phone">Mobile number</Label><Input id="phone" type="tel" inputMode="tel" value={f.phone} onChange={set("phone")} required maxLength={15} /></div>
          <div><Label htmlFor="email">Email</Label><Input id="email" type="email" value={f.email} onChange={set("email")} required maxLength={255} /></div>
          <div>
            <Label htmlFor="city">City</Label>
            <select id="city" className={sel} value={f.city} onChange={set("city")}>
              {CITIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div><Label htmlFor="address">Address</Label><Input id="address" value={f.address} onChange={set("address")} required maxLength={300} /></div>
          <div><Label htmlFor="password">Password</Label><Input id="password" type="password" value={f.password} onChange={set("password")} required minLength={8} /></div>
          <Button type="submit" variant="hero" size="lg" className="w-full" disabled={busy}>
            {busy ? "Creating account…" : "Create seller account"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Already a partner? <Link to="/auth" className="underline">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
