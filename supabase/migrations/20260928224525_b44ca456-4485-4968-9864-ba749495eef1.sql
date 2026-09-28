
CREATE TYPE public.app_role AS ENUM ('customer','seller','admin');

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$
LANGUAGE plpgsql SET search_path = public;

CREATE TABLE public.users (
  id uuid PRIMARY KEY,
  name text NOT NULL DEFAULT '',
  phone text,
  email text,
  role public.app_role NOT NULL DEFAULT 'customer',
  profile_image text,
  status text NOT NULL DEFAULT 'active',
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO authenticated;
GRANT SELECT ON public.users TO anon;
GRANT ALL ON public.users TO service_role;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(), 'admin')
$$;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own roles readable" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "admin manages roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users readable" ON public.users FOR SELECT USING (true);
CREATE POLICY "insert own user row" ON public.users FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "update own user row" ON public.users FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_admin()) WITH CHECK (id = auth.uid() OR public.is_admin());
CREATE POLICY "admin deletes users" ON public.users FOR DELETE TO authenticated USING (public.is_admin());
CREATE TRIGGER users_updated BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.seller_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  business_name text NOT NULL,
  owner_name text NOT NULL DEFAULT '',
  phone text,
  email text,
  city text NOT NULL DEFAULT '',
  address text,
  verification_status text NOT NULL DEFAULT 'pending',
  commission_rate numeric(5,2) NOT NULL DEFAULT 10.00,
  status text NOT NULL DEFAULT 'active',
  rating numeric(3,2) NOT NULL DEFAULT 4.5,
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.seller_profiles TO authenticated;
GRANT SELECT ON public.seller_profiles TO anon;
GRANT ALL ON public.seller_profiles TO service_role;
ALTER TABLE public.seller_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "seller profiles readable" ON public.seller_profiles FOR SELECT USING (true);
CREATE POLICY "seller inserts own profile" ON public.seller_profiles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "seller updates own profile" ON public.seller_profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin()) WITH CHECK (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "admin deletes seller profiles" ON public.seller_profiles FOR DELETE TO authenticated USING (public.is_admin());
CREATE TRIGGER sp_updated BEFORE UPDATE ON public.seller_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.protect_commission_rate()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.commission_rate IS DISTINCT FROM OLD.commission_rate AND NOT public.is_admin() THEN
    NEW.commission_rate := OLD.commission_rate;
  END IF;
  IF NEW.verification_status IS DISTINCT FROM OLD.verification_status AND NOT public.is_admin() THEN
    NEW.verification_status := OLD.verification_status;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER sp_protect BEFORE UPDATE ON public.seller_profiles FOR EACH ROW EXECUTE FUNCTION public.protect_commission_rate();

CREATE OR REPLACE FUNCTION public.my_seller_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.seller_profiles WHERE user_id = auth.uid() LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.bootstrap_profile(_name text, _phone text, _role text, _business_name text DEFAULT NULL, _city text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.app_role; uid uuid := auth.uid(); em text;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  r := COALESCE(NULLIF(_role,'')::public.app_role, 'customer');
  IF r = 'admin' THEN r := 'customer'; END IF;
  SELECT email INTO em FROM auth.users WHERE id = uid;
  INSERT INTO public.users (id, name, email, phone, role)
  VALUES (uid, COALESCE(_name,''), em, _phone, r)
  ON CONFLICT (id) DO UPDATE SET name = COALESCE(NULLIF(EXCLUDED.name,''), public.users.name), phone = COALESCE(EXCLUDED.phone, public.users.phone);
  INSERT INTO public.user_roles (user_id, role) VALUES (uid, r) ON CONFLICT DO NOTHING;
  IF r = 'seller' THEN
    INSERT INTO public.seller_profiles (user_id, business_name, owner_name, phone, email, city)
    VALUES (uid, COALESCE(NULLIF(_business_name,''),'My Travels'), COALESCE(_name,''), _phone, em, COALESCE(NULLIF(_city,''),'Indore'))
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
END; $$;
GRANT EXECUTE ON FUNCTION public.bootstrap_profile(text,text,text,text,text) TO authenticated;

CREATE TABLE public.vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.seller_profiles(id) ON DELETE CASCADE,
  vehicle_type text NOT NULL DEFAULT 'Sedan',
  brand text NOT NULL,
  model text NOT NULL,
  registration_number text NOT NULL,
  year int,
  seats int NOT NULL DEFAULT 4,
  fuel_type text NOT NULL DEFAULT 'Petrol',
  transmission text NOT NULL DEFAULT 'Manual',
  air_conditioned boolean NOT NULL DEFAULT true,
  images text[] NOT NULL DEFAULT '{}',
  description text,
  local_price numeric(10,2) NOT NULL DEFAULT 0,
  outstation_price_per_km numeric(10,2) NOT NULL DEFAULT 0,
  airport_price numeric(10,2) NOT NULL DEFAULT 0,
  rental_price_per_day numeric(10,2) NOT NULL DEFAULT 0,
  rating numeric(3,2) NOT NULL DEFAULT 4.5,
  city text NOT NULL DEFAULT 'Indore',
  status text NOT NULL DEFAULT 'pending',
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicles TO authenticated;
GRANT SELECT ON public.vehicles TO anon;
GRANT ALL ON public.vehicles TO service_role;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vehicles public read" ON public.vehicles FOR SELECT USING (status = 'active' OR public.is_admin() OR seller_id = public.my_seller_id());
CREATE POLICY "seller inserts vehicles" ON public.vehicles FOR INSERT TO authenticated WITH CHECK (seller_id = public.my_seller_id());
CREATE POLICY "seller updates vehicles" ON public.vehicles FOR UPDATE TO authenticated
  USING (seller_id = public.my_seller_id() OR public.is_admin()) WITH CHECK (seller_id = public.my_seller_id() OR public.is_admin());
CREATE POLICY "seller deletes vehicles" ON public.vehicles FOR DELETE TO authenticated
  USING (seller_id = public.my_seller_id() OR public.is_admin());
CREATE TRIGGER veh_updated BEFORE UPDATE ON public.vehicles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.seller_profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text NOT NULL,
  license_number text,
  status text NOT NULL DEFAULT 'active',
  verification_status text NOT NULL DEFAULT 'pending',
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.drivers TO authenticated;
GRANT ALL ON public.drivers TO service_role;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "seller manages drivers" ON public.drivers FOR ALL TO authenticated
  USING (seller_id = public.my_seller_id() OR public.is_admin())
  WITH CHECK (seller_id = public.my_seller_id() OR public.is_admin());
CREATE TRIGGER drv_updated BEFORE UPDATE ON public.drivers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE SEQUENCE public.booking_seq START 1;
CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_number text NOT NULL UNIQUE,
  customer_id uuid NOT NULL,
  seller_id uuid REFERENCES public.seller_profiles(id) ON DELETE SET NULL,
  vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE SET NULL,
  driver_id uuid REFERENCES public.drivers(id) ON DELETE SET NULL,
  booking_type text NOT NULL DEFAULT 'local',
  pickup_location text NOT NULL,
  drop_location text,
  pickup_date date NOT NULL,
  pickup_time time NOT NULL,
  passengers int NOT NULL DEFAULT 1,
  trip_distance numeric(10,2) NOT NULL DEFAULT 0,
  estimated_fare numeric(10,2) NOT NULL DEFAULT 0,
  final_fare numeric(10,2) NOT NULL DEFAULT 0,
  commission_rate numeric(5,2) NOT NULL DEFAULT 10,
  commission_amount numeric(10,2) NOT NULL DEFAULT 0,
  seller_amount numeric(10,2) NOT NULL DEFAULT 0,
  payment_status text NOT NULL DEFAULT 'pending',
  booking_status text NOT NULL DEFAULT 'pending',
  customer_notes text,
  seller_notes text,
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.bookings ALTER COLUMN booking_number DROP NOT NULL;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;

CREATE TABLE public.booking_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES public.seller_profiles(id) ON DELETE CASCADE,
  response_status text NOT NULL DEFAULT 'pending',
  responded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (booking_id, seller_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.booking_requests TO authenticated;
GRANT ALL ON public.booking_requests TO service_role;

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "booking read" ON public.bookings FOR SELECT TO authenticated
  USING (customer_id = auth.uid() OR seller_id = public.my_seller_id() OR public.is_admin()
    OR EXISTS (SELECT 1 FROM public.booking_requests br WHERE br.booking_id = bookings.id AND br.seller_id = public.my_seller_id()));
CREATE POLICY "customer creates booking" ON public.bookings FOR INSERT TO authenticated WITH CHECK (customer_id = auth.uid());
CREATE POLICY "booking update" ON public.bookings FOR UPDATE TO authenticated
  USING (customer_id = auth.uid() OR seller_id = public.my_seller_id() OR public.is_admin()
    OR EXISTS (SELECT 1 FROM public.booking_requests br WHERE br.booking_id = bookings.id AND br.seller_id = public.my_seller_id()))
  WITH CHECK (true);
CREATE POLICY "admin deletes bookings" ON public.bookings FOR DELETE TO authenticated USING (public.is_admin());
CREATE TRIGGER bk_updated BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.booking_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "requests read" ON public.booking_requests FOR SELECT TO authenticated
  USING (seller_id = public.my_seller_id() OR public.is_admin()
    OR EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = booking_id AND b.customer_id = auth.uid()));
CREATE POLICY "customer creates requests" ON public.booking_requests FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = booking_id AND b.customer_id = auth.uid()) OR public.is_admin());
CREATE POLICY "seller responds" ON public.booking_requests FOR UPDATE TO authenticated
  USING (seller_id = public.my_seller_id() OR public.is_admin()
    OR EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = booking_id AND b.customer_id = auth.uid()))
  WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.set_booking_number()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.booking_number IS NULL OR NEW.booking_number = '' THEN
    NEW.booking_number := 'RC-' || to_char(now(),'YYYY') || '-' || lpad(nextval('public.booking_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER bk_number BEFORE INSERT ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.set_booking_number();

CREATE OR REPLACE FUNCTION public.calc_commission()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE base numeric;
BEGIN
  base := COALESCE(NULLIF(NEW.final_fare,0), NEW.estimated_fare, 0);
  NEW.final_fare := base;
  NEW.commission_amount := round(base * NEW.commission_rate / 100.0, 2);
  NEW.seller_amount := base - NEW.commission_amount;
  RETURN NEW;
END; $$;
CREATE TRIGGER bk_commission BEFORE INSERT OR UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.calc_commission();

CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL,
  amount numeric(10,2) NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'cash',
  transaction_id text,
  payment_status text NOT NULL DEFAULT 'pending',
  paid_at timestamptz,
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payments read" ON public.payments FOR SELECT TO authenticated
  USING (customer_id = auth.uid() OR public.is_admin()
    OR EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = booking_id AND b.seller_id = public.my_seller_id()));
CREATE POLICY "payments write" ON public.payments FOR INSERT TO authenticated
  WITH CHECK (customer_id = auth.uid() OR public.is_admin());
CREATE POLICY "payments update" ON public.payments FOR UPDATE TO authenticated
  USING (public.is_admin() OR customer_id = auth.uid()) WITH CHECK (true);

CREATE TABLE public.commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL UNIQUE REFERENCES public.bookings(id) ON DELETE CASCADE,
  seller_id uuid REFERENCES public.seller_profiles(id) ON DELETE SET NULL,
  booking_amount numeric(10,2) NOT NULL DEFAULT 0,
  commission_rate numeric(5,2) NOT NULL DEFAULT 10,
  commission_amount numeric(10,2) NOT NULL DEFAULT 0,
  settlement_status text NOT NULL DEFAULT 'pending',
  settled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.commissions TO authenticated;
GRANT ALL ON public.commissions TO service_role;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "commissions read" ON public.commissions FOR SELECT TO authenticated
  USING (seller_id = public.my_seller_id() OR public.is_admin());
CREATE POLICY "admin updates commissions" ON public.commissions FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE OR REPLACE FUNCTION public.sync_commission()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.seller_id IS NOT NULL AND NEW.booking_status NOT IN ('pending','seller_notified','cancelled','seller_rejected') THEN
    INSERT INTO public.commissions (booking_id, seller_id, booking_amount, commission_rate, commission_amount)
    VALUES (NEW.id, NEW.seller_id, NEW.final_fare, NEW.commission_rate, NEW.commission_amount)
    ON CONFLICT (booking_id) DO UPDATE SET
      seller_id = EXCLUDED.seller_id,
      booking_amount = EXCLUDED.booking_amount,
      commission_rate = EXCLUDED.commission_rate,
      commission_amount = EXCLUDED.commission_amount;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER bk_sync_commission AFTER INSERT OR UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.sync_commission();

CREATE TABLE public.vehicle_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  date date NOT NULL,
  status text NOT NULL DEFAULT 'available',
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (vehicle_id, date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicle_availability TO authenticated;
GRANT SELECT ON public.vehicle_availability TO anon;
GRANT ALL ON public.vehicle_availability TO service_role;
ALTER TABLE public.vehicle_availability ENABLE ROW LEVEL SECURITY;
CREATE POLICY "availability read" ON public.vehicle_availability FOR SELECT USING (true);
CREATE POLICY "seller manages availability" ON public.vehicle_availability FOR ALL TO authenticated
  USING (public.is_admin() OR EXISTS (SELECT 1 FROM public.vehicles v WHERE v.id = vehicle_id AND v.seller_id = public.my_seller_id()))
  WITH CHECK (public.is_admin() OR EXISTS (SELECT 1 FROM public.vehicles v WHERE v.id = vehicle_id AND v.seller_id = public.my_seller_id()));

CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL,
  seller_id uuid REFERENCES public.seller_profiles(id) ON DELETE CASCADE,
  vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE SET NULL,
  rating int NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  review_text text,
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT SELECT ON public.reviews TO anon;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews public read" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "customer writes review" ON public.reviews FOR INSERT TO authenticated WITH CHECK (customer_id = auth.uid());
CREATE POLICY "customer edits own review" ON public.reviews FOR UPDATE TO authenticated
  USING (customer_id = auth.uid() OR public.is_admin()) WITH CHECK (customer_id = auth.uid() OR public.is_admin());
CREATE POLICY "delete own review" ON public.reviews FOR DELETE TO authenticated USING (customer_id = auth.uid() OR public.is_admin());

CREATE TABLE public.platform_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.platform_settings TO authenticated;
GRANT SELECT ON public.platform_settings TO anon;
GRANT ALL ON public.platform_settings TO service_role;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings read" ON public.platform_settings FOR SELECT USING (true);
CREATE POLICY "admin writes settings" ON public.platform_settings FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
INSERT INTO public.platform_settings (key, value) VALUES ('default_commission_rate','10'), ('service_fee_percent','2');
