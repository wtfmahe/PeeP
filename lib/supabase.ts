import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = 'https://rnshjkbnqtpvetcktuye.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJuc2hqa2JucXRwdmV0Y2t0dXllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNDgyNDYsImV4cCI6MjA4NDYyNDI0Nn0.bN-Ywfd8AtRKriy8hy1M8Lu2NjM90_Dk6Uh2ZXavIoQ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});

// Types for our database
export interface Profile {
    id: string;
    username: string;
    avatar_url?: string;
    daily_peeps_remaining: number;
    last_peep_reset: string;
    created_at: string;
}

export interface Friend {
    id: string;
    user_id: string;
    friend_id: string;
    status: 'pending' | 'accepted';
    created_at: string;
}

export interface Peep {
    id: string;
    from_user_id: string;
    to_user_id: string;
    detected_app: string;
    friendly_name: string;
    created_at: string;
}

export interface UserStatus {
    user_id: string;
    current_app: string | null;
    friendly_name: string | null;
    updated_at: string;
}

// Legacy export for backwards compatibility
export type User = Profile;
