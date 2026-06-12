-- Supabase SQL Editor에서 실행하세요

-- 1. profiles 테이블
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  plan text not null default 'free' check (plan in ('free', 'starter', 'pro')),
  monthly_usage int not null default 0,
  usage_reset_date date not null default current_date,
  tool_usage jsonb not null default '{}',   -- { "mockup": 3, "upscaler": 1, ... }
  created_at timestamptz not null default now()
);

-- 기존 테이블에 tool_usage 컬럼 추가 (이미 테이블이 있는 경우)
alter table profiles add column if not exists tool_usage jsonb not null default '{}';

-- 2. usage_logs 테이블
create table if not exists usage_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles on delete cascade,
  action text not null,
  engine text not null,
  created_at timestamptz not null default now()
);

-- 3. RLS 활성화
alter table profiles enable row level security;
alter table usage_logs enable row level security;

-- 4. RLS 정책 (본인 데이터만)
create policy "본인만 읽기" on profiles for select using (auth.uid() = id);
create policy "본인만 수정" on profiles for update using (auth.uid() = id);
create policy "본인만 로그 조회" on usage_logs for select using (auth.uid() = user_id);
create policy "본인만 로그 생성" on usage_logs for insert with check (auth.uid() = user_id);

-- service role이 profiles 수정 가능하도록 (웹훅/서버 처리용)
create policy "서비스 롤 수정" on profiles for update using (true);

-- 5. 회원가입 시 profiles 자동 생성 트리거
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- 6. (선택) images 스토리지 버킷 생성 - Storage 탭에서 수동으로 만들어도 됩니다
-- insert into storage.buckets (id, name, public) values ('images', 'images', true);
-- create policy "인증된 사용자 업로드" on storage.objects for insert to authenticated with check (bucket_id = 'images');
-- create policy "공개 읽기" on storage.objects for select using (bucket_id = 'images');
