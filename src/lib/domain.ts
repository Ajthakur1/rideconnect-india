export const CITIES = ["Indore", "Ujjain", "Dewas", "Bhopal", "Sehore"] as const;

export const VEHICLE_TYPES = [
  "Sedan",
  "SUV",
  "Hatchback",
  "Luxury",
  "Tempo Traveller",
  "Other",
] as const;

export const BOOKING_TYPES = ["local", "outstation", "airport", "rental"] as const;
export type BookingType = (typeof BOOKING_TYPES)[number];

export const BOOKING_TYPE_LABEL: Record<string, string> = {
  local: "Local",
  outstation: "Outstation",
  airport: "Airport",
  rental: "Rental",
};

export const BOOKING_STATUSES = [
  "pending",
  "seller_notified",
  "seller_accepted",
  "seller_rejected",
  "confirmed",
  "driver_assigned",
  "trip_started",
  "trip_completed",
  "cancelled",
  "payment_completed",
] as const;

export const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  seller_notified: "Sent to operators",
  seller_accepted: "Accepted",
  seller_rejected: "Rejected",
  confirmed: "Confirmed",
  driver_assigned: "Driver assigned",
  trip_started: "Trip started",
  trip_completed: "Trip completed",
  cancelled: "Cancelled",
  payment_completed: "Paid",
};

export const FUEL_TYPES = ["Petrol", "Diesel", "CNG", "Electric", "Hybrid"] as const;
export const TRANSMISSIONS = ["Manual", "Automatic"] as const;

/** Rough road distances (km) between supported cities — used for fare estimates. */
const DISTANCES: Record<string, number> = {
  "indore|ujjain": 55,
  "indore|dewas": 35,
  "indore|bhopal": 195,
  "indore|sehore": 110,
  "ujjain|dewas": 40,
  "ujjain|bhopal": 190,
  "ujjain|sehore": 150,
  "dewas|bhopal": 160,
  "dewas|sehore": 120,
  "bhopal|sehore": 37,
};

function norm(v: string) {
  return v.trim().toLowerCase().replace(/\s*airport\s*/g, "").trim();
}

export function estimateDistanceKm(pickup: string, drop: string): number {
  const a = norm(pickup);
  const b = norm(drop);
  if (!a || !b) return 0;
  if (a === b) return 20;
  const key = [a, b].sort().join("|");
  return DISTANCES[key] ?? 120;
}

export type FareVehicle = {
  local_price: number;
  outstation_price_per_km: number;
  airport_price: number;
  rental_price_per_day: number;
};

export type FareBreakdown = {
  distanceKm: number;
  baseFare: number;
  serviceFee: number;
  total: number;
  basis: string;
};

export const SERVICE_FEE_PERCENT = 2;

export function calculateFare(
  vehicle: FareVehicle,
  bookingType: BookingType,
  pickup: string,
  drop: string,
  days = 1,
): FareBreakdown {
  const distanceKm =
    bookingType === "outstation" ? estimateDistanceKm(pickup, drop) : bookingType === "rental" ? 0 : 20;
  let baseFare = 0;
  let basis = "";

  switch (bookingType) {
    case "local":
      baseFare = Number(vehicle.local_price);
      basis = "Local package (up to 8 hrs / 80 km)";
      break;
    case "outstation":
      baseFare = Number(vehicle.outstation_price_per_km) * distanceKm;
      basis = `${distanceKm} km × ₹${Number(vehicle.outstation_price_per_km)}/km`;
      break;
    case "airport":
      baseFare = Number(vehicle.airport_price);
      basis = "Fixed airport transfer";
      break;
    case "rental":
      baseFare = Number(vehicle.rental_price_per_day) * Math.max(1, days);
      basis = `${Math.max(1, days)} day(s) × ₹${Number(vehicle.rental_price_per_day)}/day`;
      break;
  }

  baseFare = Math.round(baseFare);
  const serviceFee = Math.round((baseFare * SERVICE_FEE_PERCENT) / 100);
  return { distanceKm, baseFare, serviceFee, total: baseFare + serviceFee, basis };
}

export function priceForType(v: FareVehicle, t: BookingType): { amount: number; unit: string } {
  switch (t) {
    case "outstation":
      return { amount: Number(v.outstation_price_per_km), unit: "/km" };
    case "airport":
      return { amount: Number(v.airport_price), unit: "/transfer" };
    case "rental":
      return { amount: Number(v.rental_price_per_day), unit: "/day" };
    default:
      return { amount: Number(v.local_price), unit: "/8hr pkg" };
  }
}

export function inr(n: number | string | null | undefined): string {
  const v = Number(n ?? 0);
  return "₹" + v.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

export const CANCELLATION_POLICY = [
  "Free cancellation up to 6 hours before pickup.",
  "25% of the fare is charged for cancellations within 6 hours.",
  "No refund once the driver has started the trip.",
];
