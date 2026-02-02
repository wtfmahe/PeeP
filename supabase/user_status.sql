-- Add this to your existing schema in Supabase SQL Editor
-- Run this AFTER running schema.sql

-- User status table for real-time app tracking
create table if not exists public.user_status (
  user_id uuid references public.profiles(id) on delete cascade primary key,
  current_app text,
  friendly_name text,
  updated_at timestamp with time zone default now()
);

alter table public.user_status enable row level security;

-- Users can view their own status
create policy "Users can view own status"
  on public.user_status for select
  using (auth.uid() = user_id);

-- Friends can view each other's status
create policy "Friends can view status"
  on public.user_status for select
  using (
    exists (
      select 1 from public.friends 
      where status = 'accepted' 
      and (
        (user_id = auth.uid() and friend_id = user_status.user_id)
        or (friend_id = auth.uid() and user_id = user_status.user_id)
      )
    )
  );

-- Users can update their own status
create policy "Users can insert own status"
  on public.user_status for insert
  with check (auth.uid() = user_id);

create policy "Users can update own status"
  on public.user_status for update
  using (auth.uid() = user_id);

-- Enable realtime for user_status
alter publication supabase_realtime add table public.user_status;
