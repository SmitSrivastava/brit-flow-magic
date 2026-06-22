
CREATE TABLE public.flavours_india (
  id BIGSERIAL PRIMARY KEY,
  flavor TEXT NOT NULL,
  conv_volume TEXT,
  eng_volume TEXT,
  conv_growth NUMERIC,
  eng_growth NUMERIC,
  diy NUMERIC,
  shareability NUMERIC,
  consumption_intent NUMERIC,
  advocacy NUMERIC,
  health_indulgence NUMERIC,
  gifting NUMERIC,
  trend TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.flavours_india TO anon, authenticated;
GRANT ALL ON public.flavours_india TO service_role;
ALTER TABLE public.flavours_india ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read flavours_india" ON public.flavours_india FOR SELECT USING (true);

CREATE TABLE public.flavours_global (
  id BIGSERIAL PRIMARY KEY,
  flavor TEXT NOT NULL,
  conv_volume TEXT,
  eng_volume TEXT,
  conv_growth NUMERIC,
  eng_growth NUMERIC,
  consumption_intent NUMERIC,
  diy NUMERIC,
  social_shareability NUMERIC,
  advocacy NUMERIC,
  trend TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.flavours_global TO anon, authenticated;
GRANT ALL ON public.flavours_global TO service_role;
ALTER TABLE public.flavours_global ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read flavours_global" ON public.flavours_global FOR SELECT USING (true);

CREATE TABLE public.britannia_portfolio (
  id BIGSERIAL PRIMARY KEY,
  category TEXT NOT NULL,
  brand TEXT NOT NULL,
  flavours TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.britannia_portfolio TO anon, authenticated;
GRANT ALL ON public.britannia_portfolio TO service_role;
ALTER TABLE public.britannia_portfolio ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read britannia_portfolio" ON public.britannia_portfolio FOR SELECT USING (true);
