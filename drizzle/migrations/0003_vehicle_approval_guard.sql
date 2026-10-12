CREATE OR REPLACE FUNCTION public.guard_vehicle_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.is_admin() THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN NEW.status := 'pending'; RETURN NEW; END IF;
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF OLD.status IN ('pending','rejected') OR NEW.status NOT IN ('active','inactive') THEN
      RAISE EXCEPTION 'Only an admin can approve or reject vehicles';
    END IF;
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.guard_vehicle_status() FROM public, anon, authenticated;
DROP TRIGGER IF EXISTS trg_guard_vehicle_status ON public.vehicles;
CREATE TRIGGER trg_guard_vehicle_status BEFORE INSERT OR UPDATE ON public.vehicles
FOR EACH ROW EXECUTE FUNCTION public.guard_vehicle_status();