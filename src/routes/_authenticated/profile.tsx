import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProfile } from "@/lib/auth";
import { CustomerNav } from "@/components/CustomerNav";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "My profile — RideConnect" },
      { name: "description", content: "Manage your RideConnect name and mobile number." },
      { property: "og:title", content: "My profile — RideConnect" },
      { property: "og:description", content: "Manage your RideConnect name and mobile number." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { session, data, isLoading, refetch } = useProfile() as any;
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  useEffect(() => {
    setName(data?.profile?.name ?? "");
    setPhone(data?.profile?.phone ?? "");
  }, [data]);

  async function save() {
    if (!name.trim()) { toast.error("Name is required"); return; }
    const { error } = await supabase.from("users").update({ name: name.trim(), phone: phone.trim() }).eq("id", session.user.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Profile saved");
    refetch();
  }

  return (
    <div className="mx-auto max-w-md px-4 py-6 pb-24">
      <h1 className="text-2xl font-bold">My profile</h1>
      <div className="mt-3"><CustomerNav /></div>
      {isLoading ? <p className="mt-4 text-muted-foreground">Loading…</p> : (
        <div className="card-elevated mt-5 space-y-3 p-4">
          <div><Label>Email</Label><Input value={session?.user.email ?? ""} disabled /></div>
          <div><Label htmlFor="n">Full name</Label><Input id="n" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} /></div>
          <div><Label htmlFor="p">Mobile number</Label><Input id="p" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={15} /></div>
          <p className="text-xs text-muted-foreground">Account type: {data?.role}</p>
          <Button className="w-full" onClick={save}>Save changes</Button>
        </div>
      )}
    </div>
  );
}
