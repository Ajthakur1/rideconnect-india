
DROP POLICY "vehicles public read" ON public.vehicles;
CREATE POLICY "vehicles anon read active" ON public.vehicles FOR SELECT TO anon USING (status = 'active');
CREATE POLICY "vehicles auth read" ON public.vehicles FOR SELECT TO authenticated
  USING (status = 'active' OR public.is_admin() OR seller_id = public.my_seller_id());

REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.protect_commission_rate() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_booking_number() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.calc_commission() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_commission() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.my_seller_id() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.bootstrap_profile(text,text,text,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.my_seller_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.bootstrap_profile(text,text,text,text,text) TO authenticated;
