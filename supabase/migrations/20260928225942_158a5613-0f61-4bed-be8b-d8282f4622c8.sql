-- bookings
DROP POLICY IF EXISTS "booking update" ON public.bookings;
CREATE POLICY "booking update" ON public.bookings FOR UPDATE TO authenticated
USING ((customer_id = auth.uid()) OR (seller_id = public.my_seller_id()) OR public.is_admin() OR EXISTS (SELECT 1 FROM public.booking_requests br WHERE br.booking_id = bookings.id AND br.seller_id = public.my_seller_id()))
WITH CHECK ((customer_id = auth.uid()) OR (seller_id = public.my_seller_id()) OR public.is_admin() OR EXISTS (SELECT 1 FROM public.booking_requests br WHERE br.booking_id = bookings.id AND br.seller_id = public.my_seller_id()));

-- payments
DROP POLICY IF EXISTS "payments update" ON public.payments;
CREATE POLICY "payments update" ON public.payments FOR UPDATE TO authenticated
USING (public.is_admin() OR customer_id = auth.uid())
WITH CHECK (public.is_admin() OR customer_id = auth.uid());

-- booking_requests
DROP POLICY IF EXISTS "seller responds" ON public.booking_requests;
CREATE POLICY "seller responds" ON public.booking_requests FOR UPDATE TO authenticated
USING ((seller_id = public.my_seller_id()) OR public.is_admin() OR EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = booking_requests.booking_id AND b.customer_id = auth.uid()))
WITH CHECK ((seller_id = public.my_seller_id()) OR public.is_admin() OR EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = booking_requests.booking_id AND b.customer_id = auth.uid()));

-- users: own, admin, or sellers involved in the customer's bookings
DROP POLICY IF EXISTS "users readable" ON public.users;
CREATE POLICY "users readable" ON public.users FOR SELECT TO authenticated
USING (id = auth.uid() OR public.is_admin() OR EXISTS (
  SELECT 1 FROM public.bookings b WHERE b.customer_id = users.id AND (b.seller_id = public.my_seller_id()
   OR EXISTS (SELECT 1 FROM public.booking_requests br WHERE br.booking_id = b.id AND br.seller_id = public.my_seller_id()))));
REVOKE SELECT ON public.users FROM anon;

-- seller_profiles: public sees only verified/active listing; contact info only owner/admin
DROP POLICY IF EXISTS "seller profiles readable" ON public.seller_profiles;
CREATE POLICY "seller profiles public listing" ON public.seller_profiles FOR SELECT TO anon, authenticated
USING ((status = 'active' AND verification_status = 'verified') OR user_id = auth.uid() OR public.is_admin());
REVOKE SELECT ON public.seller_profiles FROM anon, authenticated;
GRANT SELECT (id, user_id, business_name, city, verification_status, commission_rate, status, rating, is_demo, created_at, updated_at) ON public.seller_profiles TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_seller_profile_private(_seller_id uuid)
RETURNS SETOF public.seller_profiles LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT * FROM public.seller_profiles
  WHERE id = _seller_id AND (user_id = auth.uid() OR public.is_admin());
$$;
REVOKE EXECUTE ON FUNCTION public.get_seller_profile_private(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_seller_profile_private(uuid) TO authenticated;

-- platform_settings: only public keys for everyone, admin sees all
DROP POLICY IF EXISTS "settings read" ON public.platform_settings;
CREATE POLICY "settings read" ON public.platform_settings FOR SELECT TO anon, authenticated
USING (key IN ('default_commission_rate','service_fee_percent') OR public.is_admin());

-- reviews: visible when tied to an active vehicle, or own/admin/seller
DROP POLICY IF EXISTS "reviews public read" ON public.reviews;
CREATE POLICY "reviews public read" ON public.reviews FOR SELECT TO anon, authenticated
USING (
  EXISTS (SELECT 1 FROM public.vehicles v WHERE v.id = reviews.vehicle_id AND v.status = 'active')
  OR EXISTS (SELECT 1 FROM public.seller_profiles s WHERE s.id = reviews.seller_id AND s.status = 'active' AND s.verification_status = 'verified')
  OR customer_id = auth.uid() OR public.is_admin() OR seller_id = public.my_seller_id());

-- vehicle_availability: only for active vehicles, or owner/admin
DROP POLICY IF EXISTS "availability read" ON public.vehicle_availability;
CREATE POLICY "availability read" ON public.vehicle_availability FOR SELECT TO anon, authenticated
USING (EXISTS (SELECT 1 FROM public.vehicles v WHERE v.id = vehicle_availability.vehicle_id AND v.status = 'active')
  OR public.is_admin());