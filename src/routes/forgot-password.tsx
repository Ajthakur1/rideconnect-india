import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Forgot password — RideConnect" },
      { name: "description", content: "Reset your RideConnect account password." },
      { property: "og:title", content: "Forgot password — RideConnect" },
      { property: "og:description", content: "Reset your RideConnect account password." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Forgot,
});

function Forgot() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setSent(true);
  }
  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <div className="card-elevated p-6">
        <h1 className="text-2xl font-bold">Forgot password</h1>
        {sent ? (
          <p className="mt-3 text-sm">If an account exists for {email}, a reset link is on its way. Check your inbox.</p>
        ) : (
          <form onSubmit={submit} className="mt-4 space-y-4">
            <div><Label htmlFor="e">Email</Label><Input id="e" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <Button type="submit" variant="hero" className="w-full" disabled={busy}>{busy ? "Sending…" : "Send reset link"}</Button>
          </form>
        )}
        <Link to="/auth" className="mt-4 block text-center text-sm text-muted-foreground underline">Back to sign in</Link>
      </div>
    </div>
  );
}
