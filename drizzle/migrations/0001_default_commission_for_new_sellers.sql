CREATE OR REPLACE FUNCTION public.apply_default_commission()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE d numeric;
BEGIN
  IF NOT public.is_admin() THEN
    SELECT value::numeric INTO d FROM public.platform_settings WHERE key = 'default_commission_rate';
    NEW.commission_rate := COALESCE(d, 10);
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.apply_default_commission() FROM public, anon, authenticated;
DROP TRIGGER IF EXISTS trg_apply_default_commission ON public.seller_profiles;
CREATE TRIGGER trg_apply_default_commission BEFORE INSERT ON public.seller_profiles
FOR EACH ROW EXECUTE FUNCTION public.apply_default_commission();