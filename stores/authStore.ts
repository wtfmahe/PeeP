import { create } from 'zustand';
import { supabase, Profile } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';

interface AuthState {
    user: User | null;
    profile: Profile | null;
    session: Session | null;
    isLoading: boolean;
    isInitialized: boolean;

    // Actions
    initialize: () => Promise<void>;
    signUp: (email: string, password: string, username: string) => Promise<{ error?: string }>;
    signIn: (email: string, password: string) => Promise<{ error?: string }>;
    signOut: () => Promise<void>;
    fetchProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    profile: null,
    session: null,
    isLoading: false,
    isInitialized: false,

    initialize: async () => {
        try {
            set({ isLoading: true });

            // Get current session
            const { data: { session } } = await supabase.auth.getSession();

            if (session?.user) {
                set({ user: session.user, session });
                await get().fetchProfile();
            }

            // Listen for auth changes
            supabase.auth.onAuthStateChange(async (event, session) => {
                console.log('Auth state changed:', event);
                set({ user: session?.user ?? null, session });

                if (session?.user) {
                    await get().fetchProfile();
                } else {
                    set({ profile: null });
                }
            });
        } catch (error) {
            console.error('Auth initialization error:', error);
        } finally {
            set({ isLoading: false, isInitialized: true });
        }
    },

    signUp: async (email: string, password: string, username: string) => {
        set({ isLoading: true });
        try {
            console.log('SignUp: Starting for', email, username);

            // Check if username is taken (don't use .single() - it errors if no match)
            const { data: existing, error: checkError } = await supabase
                .from('profiles')
                .select('username')
                .eq('username', username);

            console.log('SignUp: Username check result:', existing, checkError);

            if (existing && existing.length > 0) {
                set({ isLoading: false });
                return { error: 'Username already taken' };
            }

            console.log('SignUp: Calling supabase.auth.signUp...');
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { username },
                },
            });

            console.log('SignUp: Result:', data?.user?.id, error?.message);

            if (error) {
                set({ isLoading: false });
                return { error: error.message };
            }

            if (data.user) {
                set({ user: data.user, session: data.session });
                // Wait a moment for trigger to create profile
                await new Promise(resolve => setTimeout(resolve, 500));
                await get().fetchProfile();
            }

            return {};
        } catch (error: any) {
            console.error('SignUp error:', error);
            return { error: error.message || 'Sign up failed' };
        } finally {
            set({ isLoading: false });
        }
    },

    signIn: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                return { error: error.message };
            }

            if (data.user) {
                set({ user: data.user, session: data.session });
                await get().fetchProfile();
            }

            return {};
        } catch (error: any) {
            return { error: error.message || 'Sign in failed' };
        } finally {
            set({ isLoading: false });
        }
    },

    signOut: async () => {
        set({ isLoading: true });
        try {
            await supabase.auth.signOut();
            set({ user: null, profile: null, session: null });
        } catch (error) {
            console.error('Sign out error:', error);
        } finally {
            set({ isLoading: false });
        }
    },

    fetchProfile: async () => {
        const { user } = get();
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error) {
                console.error('Fetch profile error:', error);
                return;
            }

            set({ profile: data });
        } catch (error) {
            console.error('Fetch profile error:', error);
        }
    },
}));
