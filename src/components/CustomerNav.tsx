import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export function CustomerNav() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  async function logout() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }
  const cls = "rounded-full border px-4 py-2 text-sm font-medium";
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link to="/my-bookings" className={cls} activeProps={{ className: "bg-primary text-primary-foreground" }}>My Bookings</Link>
      <Link to="/profile" className={cls} activeProps={{ className: "bg-primary text-primary-foreground" }}>Profile</Link>
      <Button variant="outline" size="sm" className="ml-auto gap-1 rounded-full" onClick={logout}>
        <LogOut className="size-4" /> Logout
      </Button>
    </div>
  );
}

export function useCustomerGuard(role: string | undefined, loading: boolean) {
  const navigate = useNavigate();
  if (!loading && role && role !== "customer") {
    queueMicrotask(() => navigate({ to: role === "admin" ? "/admin" : "/seller", replace: true }));
    return false;
  }
  return true;
}
