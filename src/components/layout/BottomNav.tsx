import { Link } from "@tanstack/react-router";
import { Home, Search, CalendarCheck, User } from "lucide-react";
import { useProfile, homeForRole } from "@/lib/auth";

export function BottomNav() {
  const { data } = useProfile();
  const dash = homeForRole(data?.role ?? "customer");

  const items = [
    { to: "/", label: "Home", Icon: Home },
    { to: "/search", label: "Search", Icon: Search },
    { to: dash, label: "Bookings", Icon: CalendarCheck },
    { to: "/profile", label: "Profile", Icon: User },
  ];

  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 pt-1 backdrop-blur-lg md:hidden">
      <ul className="mx-auto grid max-w-md grid-cols-4">
        {items.map(({ to, label, Icon }) => (
          <li key={label}>
            <Link
              to={to}
              className="flex flex-col items-center gap-1 px-2 py-2 text-[11px] font-medium text-muted-foreground"
              activeProps={{ className: "text-accent-foreground" }}
            >
              <Icon className="size-5" />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
