
-- Add original_answers column to preserve real answers when manipulated
ALTER TABLE public.quiz_results ADD COLUMN original_answers JSONB;

-- Allow updates and deletes for admin functionality
CREATE POLICY "Anyone can update quiz results" ON public.quiz_results FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete quiz results" ON public.quiz_results FOR DELETE USING (true);
