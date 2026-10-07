CREATE OR REPLACE FUNCTION public.is_booking_customer(_booking_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (SELECT 1 FROM public.bookings WHERE id = _booking_id AND customer_id = auth.uid())
$$;
CREATE OR REPLACE FUNCTION public.is_requested_seller(_booking_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (SELECT 1 FROM public.booking_requests WHERE booking_id = _booking_id AND seller_id = public.my_seller_id())
$$;
REVOKE EXECUTE ON FUNCTION public.is_booking_customer(uuid), public.is_requested_seller(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_booking_customer(uuid), public.is_requested_seller(uuid) TO authenticated;

DROP POLICY "booking read" ON public.bookings;
CREATE POLICY "booking read" ON public.bookings FOR SELECT TO authenticated
  USING (customer_id = auth.uid() OR seller_id = public.my_seller_id() OR public.is_admin() OR public.is_requested_seller(id));
DROP POLICY "booking update" ON public.bookings;
CREATE POLICY "booking update" ON public.bookings FOR UPDATE TO authenticated
  USING (customer_id = auth.uid() OR seller_id = public.my_seller_id() OR public.is_admin() OR public.is_requested_seller(id))
  WITH CHECK (customer_id = auth.uid() OR seller_id = public.my_seller_id() OR public.is_admin() OR public.is_requested_seller(id));

DROP POLICY "requests read" ON public.booking_requests;
CREATE POLICY "requests read" ON public.booking_requests FOR SELECT TO authenticated
  USING (seller_id = public.my_seller_id() OR public.is_admin() OR public.is_booking_customer(booking_id));
DROP POLICY "seller responds" ON public.booking_requests;
CREATE POLICY "seller responds" ON public.booking_requests FOR UPDATE TO authenticated
  USING (seller_id = public.my_seller_id() OR public.is_admin() OR public.is_booking_customer(booking_id))
  WITH CHECK (seller_id = public.my_seller_id() OR public.is_admin() OR public.is_booking_customer(booking_id));
DROP POLICY "customer creates requests" ON public.booking_requests;
CREATE POLICY "customer creates requests" ON public.booking_requests FOR INSERT TO authenticated
  WITH CHECK (public.is_booking_customer(booking_id) OR public.is_admin());

DROP POLICY "users readable" ON public.users;
CREATE POLICY "users readable" ON public.users FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_admin() OR EXISTS (
    SELECT 1 FROM public.bookings b WHERE b.customer_id = users.id
      AND (b.seller_id = public.my_seller_id() OR public.is_requested_seller(b.id))));