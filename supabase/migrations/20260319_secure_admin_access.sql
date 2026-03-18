-- quiz_results 공개 읽기 제거
drop policy if exists "Public can read quiz results" on public.quiz_results;
drop policy if exists "Anyone can read quiz results" on public.quiz_results;

-- quiz_results는 관리자만 읽기 가능
create policy "Admins can read quiz results"
on public.quiz_results
for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- compatibility_overrides 공개 읽기 제거
drop policy if exists "Public can read overrides" on public.compatibility_overrides;
drop policy if exists "Anyone can read overrides" on public.compatibility_overrides;

-- compatibility_overrides는 관리자만 읽기 가능
create policy "Admins can read overrides"
on public.compatibility_overrides
for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- 혹시 RLS가 꺼져 있으면 다시 확실히 켜기
alter table public.quiz_results enable row level security;
alter table public.compatibility_overrides enable row level security;
alter table public.user_roles enable row level security;
