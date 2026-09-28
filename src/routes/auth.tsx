import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { homeForRole, type Role } from "@/lib/auth";

type AuthSearch = { mode?: "login" | "register"; role?: "customer" | "seller" };

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): AuthSearch => ({
    mode: s["mode"] === "register" ? "register" : "login",
    role: s["role"] === "seller" ? "seller" : "customer",
  }),
  head: () => ({
    meta: [
      { title: "Sign in or register — RideConnect" },
      { name: "description", content: "Create a RideConnect account to book rides or list your vehicles." },
      { property: "og:title", content: "Sign in or register — RideConnect" },
      { property: "og:description", content: "Create a RideConnect account to book rides or list your vehicles." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const search = useSearch({ from: "/auth" });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<"login" | "register">(search.mode ?? "login");
  const [role, setRole] = useState<"customer" | "seller">(search.role ?? "customer");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [business, setBusiness] = useState("");
  const [city, setCity] = useState("Indore");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function afterAuth() {
    queryClient.clear();
    const { data: roles } = await supabase.from("user_roles").select("role");
    const list = (roles ?? []).map((r) => r.role as Role);
    const r: Role = list.includes("admin") ? "admin" : list.includes("seller") ? "seller" : "customer";
    navigate({ to: homeForRole(r) });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "register") {
        if (!name.trim()) throw new Error("Please enter your name.");
        const { error } = await supabase.auth.signUp({ email: email.trim(), password });
        if (error) throw error;
        const { error: rpcError } = await supabase.rpc("bootstrap_profile", {
          _name: name.trim(),
          _phone: phone.trim(),
          _role: role,
          _business_name: business.trim() || undefined,
          _city: city.trim() || undefined,
        });
        if (rpcError) throw rpcError;
        toast.success("Welcome to RideConnect!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        toast.success("Signed in");
      }
      await afterAuth();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <div className="card-elevated p-6">
        <h1 className="text-2xl font-bold">{mode === "login" ? "Welcome back" : "Create your account"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "login" ? "Sign in to manage your rides." : "Book rides, or list your vehicles as a partner."}
        </p>

        {mode === "register" && (
          <div className="mt-5 grid grid-cols-2 gap-2">
            {(["customer", "seller"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`rounded-xl border p-3 text-sm font-semibold ${
                  role === r ? "border-accent bg-secondary" : "border-border"
                }`}
              >
                {r === "customer" ? "I need a ride" : "I own vehicles"}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={submit} className="mt-5 space-y-4">
          {mode === "register" && (
            <>
              <div>
                <Label htmlFor="name">Full name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} />
              </div>
              {role === "seller" && (
                <>
                  <div>
                    <Label htmlFor="business">Business name</Label>
                    <Input id="business" value={business} onChange={(e) => setBusiness(e.target.value)} maxLength={120} />
                  </div>
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} maxLength={60} />
                  </div>
                </>
              )}
            </>
          )}
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
          <Button type="submit" variant="hero" size="lg" className="w-full" disabled={busy}>
            {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
          </Button>
        </form>

        <button
          type="button"
          className="mt-4 w-full text-sm text-muted-foreground underline-offset-4 hover:underline"
          onClick={() => setMode(mode === "login" ? "register" : "login")}
        >
          {mode === "login" ? "New here? Create an account" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
