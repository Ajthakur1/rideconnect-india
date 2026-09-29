GRANT SELECT ON public.vehicles TO anon;
GRANT SELECT (id, business_name, city, verification_status, status, rating, is_demo, created_at) ON public.seller_profiles TO anon;
GRANT SELECT ON public.reviews TO anon;

ALTER POLICY "seller profiles public listing" ON public.seller_profiles TO authenticated;
CREATE POLICY "anon reads verified sellers" ON public.seller_profiles FOR SELECT TO anon
  USING (status = 'active' AND verification_status = 'verified');

ALTER POLICY "reviews public read" ON public.reviews TO authenticated;
CREATE POLICY "anon reads public reviews" ON public.reviews FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM public.vehicles v WHERE v.id = reviews.vehicle_id AND v.status = 'active'));