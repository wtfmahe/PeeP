import { supabase, User, Friend, Peep } from '../lib/supabase';

export class PeepService {
    // Get current user's profile
    static async getProfile(userId: string): Promise<User | null> {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('Error fetching profile:', error);
            return null;
        }
        return data;
    }

    // Get friends list (accepted only)
    static async getFriends(userId: string): Promise<User[]> {
        const { data, error } = await supabase
            .from('friends')
            .select(`
        friend:profiles!friends_friend_id_fkey(id, username, avatar_url)
      `)
            .eq('user_id', userId)
            .eq('status', 'accepted');

        if (error) {
            console.error('Error fetching friends:', error);
            return [];
        }

        return data?.map((f: any) => f.friend) || [];
    }

    // Send a peep to a friend
    static async sendPeep(
        fromUserId: string,
        toUserId: string,
        detectedApp: string,
        friendlyName: string
    ): Promise<boolean> {
        const { error } = await supabase
            .from('peeps')
            .insert({
                from_user_id: fromUserId,
                to_user_id: toUserId,
                detected_app: detectedApp,
                friendly_name: friendlyName
            });

        if (error) {
            console.error('Error sending peep:', error);
            return false;
        }
        return true;
    }

    // Get latest peep for a friend (what are they doing?)
    static async getLatestPeep(friendId: string): Promise<Peep | null> {
        const { data, error } = await supabase
            .from('peeps')
            .select('*')
            .eq('to_user_id', friendId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error) {
            console.error('Error fetching peep:', error);
            return null;
        }
        return data;
    }

    // Subscribe to incoming peeps (real-time)
    static subscribeToIncomingPeeps(
        userId: string,
        callback: (peep: Peep) => void
    ) {
        return supabase
            .channel('incoming-peeps')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'peeps',
                    filter: `to_user_id=eq.${userId}`
                },
                (payload) => {
                    callback(payload.new as Peep);
                }
            )
            .subscribe();
    }

    // Send friend request
    static async sendFriendRequest(userId: string, friendUsername: string): Promise<{ success: boolean; error?: string }> {
        // First find the user by username
        const { data: friendData, error: findError } = await supabase
            .from('profiles')
            .select('id')
            .eq('username', friendUsername)
            .single();

        if (findError || !friendData) {
            return { success: false, error: 'User not found' };
        }

        // Send friend request
        const { error } = await supabase
            .from('friends')
            .insert({
                user_id: userId,
                friend_id: friendData.id,
                status: 'pending'
            });

        if (error) {
            if (error.code === '23505') {
                return { success: false, error: 'Friend request already sent' };
            }
            return { success: false, error: error.message };
        }

        return { success: true };
    }

    // Accept friend request
    static async acceptFriendRequest(requestId: string): Promise<boolean> {
        const { error } = await supabase
            .from('friends')
            .update({ status: 'accepted' })
            .eq('id', requestId);

        return !error;
    }

    // Get pending friend requests
    static async getPendingRequests(userId: string): Promise<any[]> {
        const { data, error } = await supabase
            .from('friends')
            .select(`
        id,
        user:profiles!friends_user_id_fkey(id, username, avatar_url),
        created_at
      `)
            .eq('friend_id', userId)
            .eq('status', 'pending');

        if (error) {
            console.error('Error fetching requests:', error);
            return [];
        }
        return data || [];
    }
}
