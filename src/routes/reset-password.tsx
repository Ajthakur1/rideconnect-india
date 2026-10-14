import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { homeForRole, type Role } from "@/lib/auth";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new password — RideConnect" },
      { name: "description", content: "Choose a new password for your RideConnect account." },
      { property: "og:title", content: "Set a new password — RideConnect" },
      { property: "og:description", content: "Choose a new password for your RideConnect account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Reset,
});

function Reset() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState<"checking" | "ready" | "invalid">("checking");

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const query = new URLSearchParams(window.location.search);
    const linkError = hash.get("error_description") || query.get("error_description");
    if (linkError) { setState("invalid"); return; }
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") && session) setState("ready");
    });
    const t = setTimeout(async () => {
      const { data } = await supabase.auth.getSession();
      setState((s) => (s === "ready" ? s : data.session ? "ready" : "invalid"));
    }, 1500);
    return () => { sub.subscription.unsubscribe(); clearTimeout(t); };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    if (pw !== pw2) { toast.error("Passwords don't match"); return; }
    setBusy(true);
    const { data, error } = await supabase.auth.updateUser({ password: pw });
    if (error) { setBusy(false); toast.error(error.message); return; }
    const uid = data.user?.id;
    let role: Role = "customer";
    if (uid) {
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", uid);
      const list = (roles ?? []).map((r) => r.role as Role);
      role = list.includes("admin") ? "admin" : list.includes("seller") ? "seller" : "customer";
    }
    setBusy(false);
    qc.invalidateQueries();
    toast.success("Password updated");
    navigate({ to: homeForRole(role), replace: true });
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <div className="card-elevated p-6">
        <h1 className="text-2xl font-bold">Set a new password</h1>
        {state === "checking" && <p className="mt-3 text-sm text-muted-foreground">Checking your reset link…</p>}
        {state === "invalid" && (
          <div className="mt-3 space-y-3 text-sm">
            <p>This reset link is invalid or has expired. Please request a new one.</p>
            <Button asChild variant="hero" className="w-full"><Link to="/forgot-password">Request a new link</Link></Button>
          </div>
        )}
        {state === "ready" && (
          <form onSubmit={submit} className="mt-4 space-y-4">
            <div><Label htmlFor="a">New password</Label><Input id="a" type="password" minLength={8} maxLength={72} required value={pw} onChange={(e) => setPw(e.target.value)} /></div>
            <div><Label htmlFor="b">Confirm password</Label><Input id="b" type="password" minLength={8} maxLength={72} required value={pw2} onChange={(e) => setPw2(e.target.value)} /></div>
            <Button type="submit" variant="hero" className="w-full" disabled={busy}>{busy ? "Saving…" : "Update password"}</Button>
          </form>
        )}
      </div>
    </div>
  );
}
