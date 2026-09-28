import { Link } from "@tanstack/react-router";
import { CarFront } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-hero text-primary-foreground">
                <CarFront className="size-4" />
              </span>
              <span className="font-display text-base font-bold">RideConnect</span>
            </div>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              A marketplace connecting travellers with verified local taxi operators, travel agencies and car
              rental partners across Madhya Pradesh.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold">For travellers</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><Link to="/search" className="hover:text-foreground">Find a vehicle</Link></li>
              <li><Link to="/my-bookings" className="hover:text-foreground">My bookings</Link></li>
              <li><Link to="/auth" className="hover:text-foreground">Sign in</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold">For partners</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><Link to="/become-a-seller" className="hover:text-foreground">Become a partner</Link></li>
              <li><Link to="/seller" className="hover:text-foreground">Partner dashboard</Link></li>
            </ul>
          </div>
        </div>
        <p className="mt-10 text-xs text-muted-foreground">
          © {new Date().getFullYear()} RideConnect. Demo/test data is clearly marked inside the product.
        </p>
      </div>
    </footer>
  );
}
