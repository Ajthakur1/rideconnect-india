import { useQuery } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Role = "customer" | "seller" | "admin";

export type AppProfile = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  role: Role;
  status: string;
  profile_image: string | null;
};

export function useSession() {
  return useQuery({
    queryKey: ["session"],
    queryFn: async (): Promise<Session | null> => {
      const { data } = await supabase.auth.getSession();
      return data.session ?? null;
    },
    staleTime: 30_000,
  });
}

export function useProfile() {
  const { data: session, isLoading: sessionLoading } = useSession();
  const userId = session?.user.id;

  const query = useQuery({
    queryKey: ["profile", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data: profile } = await supabase
        .from("users")
        .select("id,name,phone,email,role,status,profile_image")
        .eq("id", userId!)
        .maybeSingle();

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId!);

      const { data: seller } = await supabase
        .from("seller_profiles")
        .select("*")
        .eq("user_id", userId!)
        .maybeSingle();

      const roleList = (roles ?? []).map((r) => r.role as Role);
      const role: Role = roleList.includes("admin")
        ? "admin"
        : roleList.includes("seller")
          ? "seller"
          : ((profile?.role as Role) ?? "customer");

      return {
        profile: (profile as AppProfile | null) ?? null,
        roles: roleList,
        role,
        seller: seller ?? null,
      };
    },
  });

  return { ...query, session, isLoading: sessionLoading || query.isLoading };
}

export function homeForRole(role: Role) {
  if (role === "admin") return "/admin";
  if (role === "seller") return "/seller";
  return "/my-bookings";
}
