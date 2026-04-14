ALTER TABLE public.agents
ADD COLUMN IF NOT EXISTS interview_guide text;
