CREATE OR REPLACE FUNCTION public.respond_booking_request(_request_id uuid, _accept boolean)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.booking_requests; b public.bookings; v public.vehicles; next_seller uuid; rate numeric;
BEGIN
  SELECT * INTO r FROM public.booking_requests WHERE id = _request_id FOR UPDATE;
  IF r.id IS NULL THEN RAISE EXCEPTION 'Request not found'; END IF;
  IF r.seller_id IS DISTINCT FROM public.my_seller_id() THEN RAISE EXCEPTION 'Only the assigned seller can respond to this request'; END IF;
  IF r.response_status <> 'pending' THEN RAISE EXCEPTION 'This request is no longer pending'; END IF;
  SELECT * INTO b FROM public.bookings WHERE id = r.booking_id FOR UPDATE;
  IF b.booking_status NOT IN ('pending','seller_notified','seller_rejected') THEN
    UPDATE public.booking_requests SET response_status='expired', responded_at=now() WHERE id=r.id;
    RAISE EXCEPTION 'This booking has already been taken or closed';
  END IF;

  IF _accept THEN
    SELECT commission_rate INTO rate FROM public.seller_profiles WHERE id = r.seller_id;
    UPDATE public.booking_requests SET response_status='accepted', responded_at=now() WHERE id=r.id;
    UPDATE public.booking_requests SET response_status='expired', responded_at=now()
      WHERE booking_id=r.booking_id AND id<>r.id AND response_status='pending';
    UPDATE public.bookings SET seller_id=r.seller_id, commission_rate=COALESCE(rate,10), booking_status='confirmed' WHERE id=b.id;
    RETURN 'confirmed';
  END IF;

  UPDATE public.booking_requests SET response_status='rejected', responded_at=now() WHERE id=r.id;
  IF EXISTS (SELECT 1 FROM public.booking_requests WHERE booking_id=b.id AND response_status='pending') THEN
    RETURN 'rejected';
  END IF;
  -- offer to another eligible seller not yet asked
  SELECT * INTO v FROM public.vehicles WHERE id=b.vehicle_id;
  SELECT sp.id INTO next_seller FROM public.vehicles ve JOIN public.seller_profiles sp ON sp.id=ve.seller_id
   WHERE ve.vehicle_type=v.vehicle_type AND ve.city=v.city AND ve.status='active' AND ve.seats>=b.passengers
     AND sp.verification_status='verified' AND sp.status='active'
     AND NOT EXISTS (SELECT 1 FROM public.booking_requests x WHERE x.booking_id=b.id AND x.seller_id=sp.id)
   ORDER BY sp.rating DESC LIMIT 1;
  IF next_seller IS NOT NULL THEN
    INSERT INTO public.booking_requests(booking_id, seller_id) VALUES (b.id, next_seller);
    UPDATE public.bookings SET booking_status='pending' WHERE id=b.id;
    RETURN 'reassigned';
  END IF;
  UPDATE public.bookings SET booking_status='seller_rejected' WHERE id=b.id;
  RETURN 'rejected';
END $$;
REVOKE ALL ON FUNCTION public.respond_booking_request(uuid, boolean) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.respond_booking_request(uuid, boolean) TO authenticated;

DROP POLICY IF EXISTS "seller responds" ON public.booking_requests;
CREATE POLICY "admin updates requests" ON public.booking_requests FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "customer creates requests" ON public.booking_requests;
CREATE POLICY "customer creates request for booked seller" ON public.booking_requests FOR INSERT TO authenticated
WITH CHECK (public.is_admin() OR (public.is_booking_customer(booking_id)
  AND seller_id = (SELECT bk.seller_id FROM public.bookings bk WHERE bk.id = booking_id)));