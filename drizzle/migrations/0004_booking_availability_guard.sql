CREATE OR REPLACE FUNCTION public.guard_booking_availability()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v record;
BEGIN
  IF public.is_admin() THEN RETURN NEW; END IF;
  SELECT ve.status, ve.seats, sp.verification_status, sp.status AS sstatus INTO v
    FROM public.vehicles ve JOIN public.seller_profiles sp ON sp.id = ve.seller_id WHERE ve.id = NEW.vehicle_id;
  IF v IS NULL OR v.status <> 'active' THEN RAISE EXCEPTION 'This vehicle is not available for booking'; END IF;
  IF v.verification_status <> 'verified' OR v.sstatus <> 'active' THEN RAISE EXCEPTION 'This operator is not accepting bookings'; END IF;
  IF NEW.passengers < 1 OR NEW.passengers > v.seats THEN RAISE EXCEPTION 'Too many passengers for this vehicle'; END IF;
  IF NEW.pickup_date < (now() AT TIME ZONE 'Asia/Kolkata')::date THEN RAISE EXCEPTION 'Pickup date is in the past'; END IF;
  IF EXISTS (SELECT 1 FROM public.vehicle_availability WHERE vehicle_id = NEW.vehicle_id AND date = NEW.pickup_date AND status IN ('blocked','booked')) THEN
    RAISE EXCEPTION 'This vehicle is unavailable on the selected date'; END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.guard_booking_availability() FROM PUBLIC, anon;
DROP TRIGGER IF EXISTS trg_guard_booking_availability ON public.bookings;
CREATE TRIGGER trg_guard_booking_availability BEFORE INSERT ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.guard_booking_availability();