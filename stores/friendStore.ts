import { create } from 'zustand';
import { supabase, Profile, UserStatus } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface FriendWithStatus extends Profile {
    status?: UserStatus;
}

interface FriendRequest {
    id: string;
    user: Profile;
    created_at: string;
}

interface FriendState {
    friends: FriendWithStatus[];
    pendingRequests: FriendRequest[];
    isLoading: boolean;
    statusChannel: RealtimeChannel | null;

    // Actions
    fetchFriends: (userId: string) => Promise<void>;
    fetchPendingRequests: (userId: string) => Promise<void>;
    subscribeToStatusUpdates: (userId: string) => void;
    unsubscribeFromStatusUpdates: () => void;
    sendFriendRequest: (userId: string, username: string) => Promise<{ error?: string }>;
    acceptFriendRequest: (requestId: string) => Promise<boolean>;
    rejectFriendRequest: (requestId: string) => Promise<boolean>;
    getFriendStatus: (friendId: string) => Promise<UserStatus | null>;
}

export const useFriendStore = create<FriendState>((set, get) => ({
    friends: [],
    pendingRequests: [],
    isLoading: false,
    statusChannel: null,

    fetchFriends: async (userId: string) => {
        set({ isLoading: true });
        try {
            // Get friends where I am user_id
            const { data: sentFriends, error: error1 } = await supabase
                .from('friends')
                .select(`
                    friend:profiles!friends_friend_id_fkey(*)
                `)
                .eq('user_id', userId)
                .eq('status', 'accepted');

            // Get friends where I am friend_id (they added me)
            const { data: receivedFriends, error: error2 } = await supabase
                .from('friends')
                .select(`
                    friend:profiles!friends_user_id_fkey(*)
                `)
                .eq('friend_id', userId)
                .eq('status', 'accepted');

            if (error1 || error2) {
                console.error('Error fetching friends:', error1 || error2);
                return;
            }

            const allFriends: FriendWithStatus[] = [
                ...(sentFriends?.map((f: any) => f.friend) || []),
                ...(receivedFriends?.map((f: any) => f.friend) || []),
            ];

            // Fetch current status for each friend
            const friendIds = allFriends.map(f => f.id);
            if (friendIds.length > 0) {
                const { data: statuses } = await supabase
                    .from('user_status')
                    .select('*')
                    .in('user_id', friendIds);

                if (statuses) {
                    allFriends.forEach(friend => {
                        friend.status = statuses.find(s => s.user_id === friend.id);
                    });
                }
            }

            set({ friends: allFriends });
        } catch (error) {
            console.error('Fetch friends error:', error);
        } finally {
            set({ isLoading: false });
        }
    },

    fetchPendingRequests: async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('friends')
                .select(`
                    id,
                    created_at,
                    user:profiles!friends_user_id_fkey(*)
                `)
                .eq('friend_id', userId)
                .eq('status', 'pending');

            if (error) {
                console.error('Error fetching requests:', error);
                return;
            }

            set({ pendingRequests: data?.map((r: any) => ({ ...r, user: r.user })) || [] });
        } catch (error) {
            console.error('Fetch requests error:', error);
        }
    },

    subscribeToStatusUpdates: (userId: string) => {
        const { friends, statusChannel: existingChannel } = get();

        // Clean up existing subscription
        if (existingChannel) {
            supabase.removeChannel(existingChannel);
        }

        const friendIds = friends.map(f => f.id);
        if (friendIds.length === 0) return;

        const channel = supabase
            .channel('friend-status-updates')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'user_status',
                },
                (payload) => {
                    const newStatus = payload.new as UserStatus;
                    if (friendIds.includes(newStatus.user_id)) {
                        set(state => ({
                            friends: state.friends.map(f =>
                                f.id === newStatus.user_id
                                    ? { ...f, status: newStatus }
                                    : f
                            ),
                        }));
                    }
                }
            )
            .subscribe();

        set({ statusChannel: channel });
    },

    unsubscribeFromStatusUpdates: () => {
        const { statusChannel } = get();
        if (statusChannel) {
            supabase.removeChannel(statusChannel);
            set({ statusChannel: null });
        }
    },

    sendFriendRequest: async (userId: string, username: string) => {
        try {
            // Find user by username
            const { data: friendData, error: findError } = await supabase
                .from('profiles')
                .select('id')
                .eq('username', username)
                .single();

            if (findError || !friendData) {
                return { error: 'User not found' };
            }

            if (friendData.id === userId) {
                return { error: "You can't add yourself as a friend" };
            }

            // Check if already friends or pending
            const { data: existing } = await supabase
                .from('friends')
                .select('id, status')
                .or(`and(user_id.eq.${userId},friend_id.eq.${friendData.id}),and(user_id.eq.${friendData.id},friend_id.eq.${userId})`)
                .single();

            if (existing) {
                if (existing.status === 'accepted') {
                    return { error: 'Already friends!' };
                }
                return { error: 'Friend request already pending' };
            }

            // Send request
            const { error } = await supabase
                .from('friends')
                .insert({
                    user_id: userId,
                    friend_id: friendData.id,
                    status: 'pending',
                });

            if (error) {
                return { error: error.message };
            }

            return {};
        } catch (error: any) {
            return { error: error.message || 'Failed to send request' };
        }
    },

    acceptFriendRequest: async (requestId: string) => {
        try {
            const { error } = await supabase
                .from('friends')
                .update({ status: 'accepted' })
                .eq('id', requestId);

            return !error;
        } catch (error) {
            console.error('Accept request error:', error);
            return false;
        }
    },

    rejectFriendRequest: async (requestId: string) => {
        try {
            const { error } = await supabase
                .from('friends')
                .delete()
                .eq('id', requestId);

            return !error;
        } catch (error) {
            console.error('Reject request error:', error);
            return false;
        }
    },

    getFriendStatus: async (friendId: string) => {
        try {
            const { data, error } = await supabase
                .from('user_status')
                .select('*')
                .eq('user_id', friendId)
                .single();

            if (error) {
                console.error('Get status error:', error);
                return null;
            }

            return data;
        } catch (error) {
            console.error('Get status error:', error);
            return null;
        }
    },
}));
