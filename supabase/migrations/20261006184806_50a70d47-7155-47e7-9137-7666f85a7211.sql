CREATE OR REPLACE FUNCTION public.enforce_booking_rates()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE vs uuid; rate numeric;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NOT public.is_admin() THEN
      SELECT seller_id INTO vs FROM public.vehicles WHERE id = NEW.vehicle_id;
      IF vs IS NULL THEN RAISE EXCEPTION 'Vehicle not found'; END IF;
      NEW.seller_id := vs;
      NEW.booking_status := 'pending';
      NEW.payment_status := 'pending';
      NEW.final_fare := NEW.estimated_fare;
    END IF;
  ELSIF NOT public.is_admin() THEN
    NEW.estimated_fare := OLD.estimated_fare;
    NEW.final_fare := OLD.final_fare;
  END IF;
  IF TG_OP = 'INSERT' OR NEW.seller_id IS DISTINCT FROM OLD.seller_id OR (NEW.commission_rate IS DISTINCT FROM OLD.commission_rate AND NOT public.is_admin()) THEN
    SELECT commission_rate INTO rate FROM public.seller_profiles WHERE id = NEW.seller_id;
    NEW.commission_rate := COALESCE(rate, 10);
  END IF;
  RETURN NEW;
END; $$;
REVOKE EXECUTE ON FUNCTION public.enforce_booking_rates() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER bk_a_rates BEFORE INSERT OR UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.enforce_booking_rates();

CREATE OR REPLACE FUNCTION public.sync_commission()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
BEGIN
  IF NEW.seller_id IS NOT NULL AND NEW.booking_status NOT IN ('cancelled','seller_rejected') THEN
    INSERT INTO public.commissions (booking_id, seller_id, booking_amount, commission_rate, commission_amount)
    VALUES (NEW.id, NEW.seller_id, NEW.final_fare, NEW.commission_rate, NEW.commission_amount)
    ON CONFLICT (booking_id) DO UPDATE SET
      seller_id = EXCLUDED.seller_id, booking_amount = EXCLUDED.booking_amount,
      commission_rate = EXCLUDED.commission_rate, commission_amount = EXCLUDED.commission_amount;
  END IF;
  RETURN NEW;
END; $function$;