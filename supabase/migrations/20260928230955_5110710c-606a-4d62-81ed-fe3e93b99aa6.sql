ALTER TABLE public.bookings ADD CONSTRAINT bookings_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE public.payments ADD CONSTRAINT payments_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE public.reviews ADD CONSTRAINT reviews_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE public.seller_profiles ADD CONSTRAINT seller_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

CREATE VIEW public.profiles WITH (security_invoker = true) AS
  SELECT id, id AS user_id, name AS full_name, phone, role, status, created_at, updated_at
  FROM public.users;
GRANT SELECT ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;