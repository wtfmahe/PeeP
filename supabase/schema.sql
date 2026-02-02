-- Peep App Database Schema
-- Run this in Supabase SQL Editor (Database > SQL Editor > New Query)

-- Enable Row Level Security
alter default privileges in schema public grant all on tables to postgres, anon, authenticated, service_role;

-- Users table (extends Supabase auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  avatar_url text,
  daily_peeps_remaining int default 5,
  last_peep_reset timestamp with time zone default now(),
  created_at timestamp with time zone default now()
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Profiles policies
create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Friends table
create table if not exists public.friends (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  friend_id uuid references public.profiles(id) on delete cascade not null,
  status text check (status in ('pending', 'accepted')) default 'pending',
  created_at timestamp with time zone default now(),
  unique(user_id, friend_id)
);

-- Enable RLS on friends
alter table public.friends enable row level security;

-- Friends policies
create policy "Users can view their own friendships"
  on public.friends for select
  using (auth.uid() = user_id or auth.uid() = friend_id);

create policy "Users can send friend requests"
  on public.friends for insert
  with check (auth.uid() = user_id);

create policy "Users can accept/reject friend requests"
  on public.friends for update
  using (auth.uid() = friend_id);

create policy "Users can remove friendships"
  on public.friends for delete
  using (auth.uid() = user_id or auth.uid() = friend_id);

-- Peeps table (logs of who peeped whom)
create table if not exists public.peeps (
  id uuid default gen_random_uuid() primary key,
  from_user_id uuid references public.profiles(id) on delete cascade not null,
  to_user_id uuid references public.profiles(id) on delete cascade not null,
  detected_app text,
  friendly_name text,
  created_at timestamp with time zone default now()
);

-- Enable RLS on peeps
alter table public.peeps enable row level security;

-- Peeps policies
create policy "Users can view peeps they sent or received"
  on public.peeps for select
  using (auth.uid() = from_user_id or auth.uid() = to_user_id);

create policy "Users can create peeps"
  on public.peeps for insert
  with check (auth.uid() = from_user_id);

-- Function to automatically create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, new.raw_user_meta_data->>'username');
  return new;
end;
$$;

-- Trigger for new user signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Enable realtime for peeps (so users get notified when peeped)
alter publication supabase_realtime add table public.peeps;
