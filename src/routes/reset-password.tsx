import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pw !== pw2) { toast.error("Passwords don't match"); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Password updated");
    navigate({ to: "/my-bookings" });
  }
  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <div className="card-elevated p-6">
        <h1 className="text-2xl font-bold">Set a new password</h1>
        <form onSubmit={submit} className="mt-4 space-y-4">
          <div><Label htmlFor="a">New password</Label><Input id="a" type="password" minLength={8} required value={pw} onChange={(e) => setPw(e.target.value)} /></div>
          <div><Label htmlFor="b">Confirm password</Label><Input id="b" type="password" minLength={8} required value={pw2} onChange={(e) => setPw2(e.target.value)} /></div>
          <Button type="submit" variant="hero" className="w-full" disabled={busy}>{busy ? "Saving…" : "Update password"}</Button>
        </form>
      </div>
    </div>
  );
}
