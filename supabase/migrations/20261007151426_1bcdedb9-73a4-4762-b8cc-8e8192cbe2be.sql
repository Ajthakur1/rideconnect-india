REVOKE EXECUTE ON FUNCTION public.is_admin(), public.my_seller_id() FROM anon;
DROP POLICY "availability read" ON public.vehicle_availability;
CREATE POLICY "availability public read" ON public.vehicle_availability FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM public.vehicles v WHERE v.id = vehicle_availability.vehicle_id AND v.status = 'active'));
CREATE POLICY "availability read" ON public.vehicle_availability FOR SELECT TO authenticated
  USING (public.is_admin() OR EXISTS (SELECT 1 FROM public.vehicles v WHERE v.id = vehicle_availability.vehicle_id AND v.status = 'active'));