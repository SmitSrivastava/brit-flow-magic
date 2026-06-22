CREATE TABLE public.fpd_volumes (
  id BIGSERIAL PRIMARY KEY,
  base_brand TEXT NOT NULL,
  volume BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.fpd_volumes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fpd_volumes TO authenticated;
GRANT ALL ON public.fpd_volumes TO service_role;
ALTER TABLE public.fpd_volumes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read fpd_volumes" ON public.fpd_volumes FOR SELECT USING (true);

INSERT INTO public.fpd_volumes (base_brand, volume) VALUES
('Bourbon', 2553015),
('Marie', 2404010),
('GoodDay', 3520869),
('50-50', 2913008),
('MilkBikis', 1555121),
('NutriChoice', 875039),
('Winkin_Cow', 119835),
('Croissant', 69448),
('Jim-Jam', 725446);