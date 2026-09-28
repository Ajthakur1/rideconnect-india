import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/lib/auth";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — RideConnect" },
      { name: "description", content: "Manage your RideConnect account details." },
      { property: "og:title", content: "Profile — RideConnect" },
      { property: "og:description", content: "Manage your RideConnect account details." },
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

  if (isLoading) return <p className="p-6 text-muted-foreground">Loading…</p>;
  if (!session) return <div className="p-6"><Link to="/auth" className="underline">Sign in</Link> to view your profile.</div>;

  async function save() {
    const { error } = await supabase.from("users").update({ name, phone }).eq("id", session.user.id);
    if (error) return toast.error(error.message);
    toast.success("Profile saved");
    refetch();
  }

  return (
    <div className="mx-auto max-w-md px-4 py-6 pb-24">
      <h1 className="text-2xl font-bold">Profile</h1>
      <p className="text-sm text-muted-foreground">{session.user.email} · {data?.role}</p>
      <div className="mt-4 grid gap-2">
        <input className="rounded-md border bg-background px-3 py-2" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="rounded-md border bg-background px-3 py-2" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <Button onClick={save}>Save</Button>
      </div>
    </div>
  );
}
