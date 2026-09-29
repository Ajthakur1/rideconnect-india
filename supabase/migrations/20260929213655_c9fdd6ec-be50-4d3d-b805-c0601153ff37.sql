CREATE POLICY "sellers upload own vehicle images" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'vehicle-images' AND (storage.foldername(name))[1] = public.my_seller_id()::text);
CREATE POLICY "sellers read own vehicle images" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'vehicle-images' AND ((storage.foldername(name))[1] = public.my_seller_id()::text OR public.is_admin()));
CREATE POLICY "sellers delete own vehicle images" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'vehicle-images' AND (storage.foldername(name))[1] = public.my_seller_id()::text);