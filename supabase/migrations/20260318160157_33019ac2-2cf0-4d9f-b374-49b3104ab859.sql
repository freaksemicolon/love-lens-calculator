
CREATE TABLE public.compatibility_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nickname_a text NOT NULL,
  nickname_b text NOT NULL,
  original_score integer NOT NULL,
  modified_score integer NOT NULL,
  modified_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.compatibility_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage overrides"
ON public.compatibility_overrides
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can read overrides"
ON public.compatibility_overrides
FOR SELECT
TO anon, authenticated
USING (true);

CREATE UNIQUE INDEX idx_compatibility_pair ON public.compatibility_overrides (
  LEAST(nickname_a, nickname_b),
  GREATEST(nickname_a, nickname_b)
);
