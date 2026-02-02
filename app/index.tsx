import { View, Text, StyleSheet, FlatList, Alert, TouchableOpacity, RefreshControl, Vibration, AppState, AppStateStatus } from 'react-native';
import { Theme } from '@/constants/Colors';
import FriendCard from '@/components/feature/FriendCard';
import Toast from '@/components/ui/Toast';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'expo-router';
import * as UsageStats from '@/modules/usage-stats';
import { useAuthStore } from '@/stores/authStore';
import { useFriendStore, FriendWithStatus } from '@/stores/friendStore';
import { supabase, Peep } from '@/lib/supabase';

// Helper function to get friendly app names
function getFriendlyAppName(packageName: string): string {
    const appMap: Record<string, string> = {
        'com.google.android.youtube': 'Watching YouTube 📺',
        'com.instagram.android': 'On Instagram 📸',
        'com.whatsapp': 'Chatting on WhatsApp 💬',
        'com.twitter.android': 'On Twitter/X 🐦',
        'com.facebook.katana': 'On Facebook 📘',
        'com.spotify.music': 'Listening to Spotify 🎵',
        'com.netflix.mediaclient': 'Watching Netflix 🎬',
        'com.snapchat.android': 'On Snapchat 👻',
        'com.tiktok': 'Scrolling TikTok 🎵',
        'com.google.android.gm': 'Checking Email 📧',
        'com.google.android.apps.maps': 'Using Maps 🗺️',
        'com.android.chrome': 'Browsing Chrome 🌐',
        'com.zhiliaoapp.musically': 'Scrolling TikTok 🎵',
        'com.anonymous.peep': 'Using Peep 👁️',
        'com.google.android.dialer': 'On a Call 📞',
        'com.android.contacts': 'Looking at Contacts 📇',
    };

    return appMap[packageName] || `Using ${packageName.split('.').pop()} 📱`;
}

export default function HomeScreen() {
    const router = useRouter();
    const { user, profile, signOut } = useAuthStore();
    const { friends, isLoading, fetchFriends, subscribeToStatusUpdates, unsubscribeFromStatusUpdates, getFriendStatus } = useFriendStore();

    const [refreshing, setRefreshing] = useState(false);
    const [peepingId, setPeepingId] = useState<string | null>(null);

    // Toast state
    const [toastVisible, setToastVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    // Broadcasting state
    const broadcastInterval = useRef<NodeJS.Timeout | null>(null);
    const appState = useRef(AppState.currentState);

    const showToast = (message: string) => {
        setToastMessage(message);
        setToastVisible(true);
        Vibration.vibrate([0, 50, 30, 50]);
    };

    // Smart broadcast - only when app is active
    const broadcastMyStatus = async () => {
        if (!user) return;

        try {
            const currentApp = await UsageStats.getForegroundApp();
            if (currentApp) {
                const friendlyName = getFriendlyAppName(currentApp);
                await supabase.from('user_status').upsert({
                    user_id: user.id,
                    current_app: currentApp,
                    friendly_name: friendlyName,
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'user_id' });
                console.log('Broadcasted status:', friendlyName);
            }
        } catch (error) {
            console.error('Broadcast error:', error);
        }
    };

    const startBroadcasting = () => {
        // Broadcast immediately
        broadcastMyStatus();

        // Then broadcast every 30 seconds while app is active
        if (broadcastInterval.current) {
            clearInterval(broadcastInterval.current);
        }
        broadcastInterval.current = setInterval(broadcastMyStatus, 30000);
        console.log('Started broadcasting');
    };

    const stopBroadcasting = () => {
        if (broadcastInterval.current) {
            clearInterval(broadcastInterval.current);
            broadcastInterval.current = null;
            console.log('Stopped broadcasting');
        }
    };

    // Initialize on mount
    useEffect(() => {
        if (user) {
            // Fetch friends
            fetchFriends(user.id);

            // Start broadcasting (only while app is active)
            startBroadcasting();

            // Listen for app state changes (foreground/background)
            const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
                if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
                    // App came to foreground - start broadcasting
                    startBroadcasting();
                } else if (nextAppState.match(/inactive|background/)) {
                    // App went to background - stop broadcasting (battery saver!)
                    stopBroadcasting();
                }
                appState.current = nextAppState;
            });

            // Subscribe to real-time status updates from friends
            subscribeToStatusUpdates(user.id);

            // Subscribe to incoming peeps - show subtle toast notification
            const channel = supabase
                .channel('my-peeps')
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'peeps',
                        filter: `to_user_id=eq.${user.id}`,
                    },
                    async (payload) => {
                        const peep = payload.new as Peep;

                        // Get the peeper's profile
                        const { data: peeper } = await supabase
                            .from('profiles')
                            .select('username')
                            .eq('id', peep.from_user_id)
                            .single();

                        // Show subtle toast instead of alert
                        showToast(`👀 ${peeper?.username || 'Someone'} peeped you!`);
                    }
                )
                .subscribe();

            return () => {
                stopBroadcasting();
                subscription.remove();
                supabase.removeChannel(channel);
                unsubscribeFromStatusUpdates();
            };
        }
    }, [user]);

    const onRefresh = useCallback(async () => {
        if (!user) return;
        setRefreshing(true);
        await fetchFriends(user.id);
        setRefreshing(false);
    }, [user]);

    const handlePeep = async (friend: FriendWithStatus) => {
        if (!user) return;

        // Check permission first
        const hasPerm = await UsageStats.hasPermission();
        if (!hasPerm) {
            Alert.alert('Permission Needed', 'Allow usage access to peep friends.', [
                { text: 'Open Settings', onPress: UsageStats.requestPermission },
                { text: 'Cancel', style: 'cancel' },
            ]);
            return;
        }

        setPeepingId(friend.id);

        try {
            // Get friend's current status from Supabase
            const status = await getFriendStatus(friend.id);
            const friendlyName = status?.friendly_name || 'Offline 💤';

            // Record the peep in database (this triggers notification for friend)
            await supabase.from('peeps').insert({
                from_user_id: user.id,
                to_user_id: friend.id,
                detected_app: status?.current_app || null,
                friendly_name: friendlyName,
            });

            // Show what friend is doing
            showToast(`${friend.username}: ${friendlyName}`);
        } catch (error) {
            console.error('Peep error:', error);
            showToast('Could not peep friend');
        } finally {
            setPeepingId(null);
        }
    };

    const handleAddFriend = () => {
        router.push('/friends');
    };

    const handleSignOut = () => {
        Alert.alert('Sign Out', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign Out', style: 'destructive', onPress: signOut },
        ]);
    };

    return (
        <View style={styles.container}>
            {/* Toast Notification */}
            <Toast
                message={toastMessage}
                visible={toastVisible}
                onHide={() => setToastVisible(false)}
                duration={3000}
            />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleSignOut} style={styles.signOutBtn}>
                    <Text style={styles.signOutText}>👋</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Peep</Text>
                <Text style={styles.logo}>👁️</Text>
                <Text style={styles.welcome}>Hey, {profile?.username || 'friend'}!</Text>
            </View>

            {/* Friends List */}
            {friends.length === 0 && !isLoading ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyEmoji}>👀</Text>
                    <Text style={styles.emptyTitle}>No friends yet</Text>
                    <Text style={styles.emptySubtitle}>Add friends to start peeping!</Text>
                    <TouchableOpacity style={styles.addButton} onPress={handleAddFriend}>
                        <Text style={styles.addButtonText}>+ Add Friends</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={friends}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => (
                        <FriendCard
                            name={item.username}
                            status={item.status?.friendly_name || 'Tap to peep 👁️'}
                            peepsRemaining={99}
                            onPeep={() => handlePeep(item)}
                            isPeeping={peepingId === item.id}
                        />
                    )}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={Theme.colors.text}
                        />
                    }
                />
            )}

            {/* Add Friend FAB */}
            <TouchableOpacity style={styles.fab} onPress={handleAddFriend}>
                <Text style={styles.fabText}>+</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.colors.background,
        paddingTop: 60,
    },
    header: {
        alignItems: 'center',
        marginBottom: 20,
        paddingHorizontal: 20,
    },
    signOutBtn: {
        position: 'absolute',
        left: 20,
        top: 0,
        padding: 8,
    },
    signOutText: {
        fontSize: 24,
    },
    title: {
        color: Theme.colors.text,
        fontSize: 42,
        fontWeight: 'bold',
        letterSpacing: 2,
    },
    logo: {
        fontSize: 60,
        marginVertical: 8,
    },
    welcome: {
        color: '#888',
        fontSize: 16,
    },
    list: {
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyEmoji: {
        fontSize: 80,
        marginBottom: 16,
    },
    emptyTitle: {
        color: Theme.colors.text,
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    emptySubtitle: {
        color: '#888',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 24,
    },
    addButton: {
        backgroundColor: Theme.colors.text,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 24,
    },
    addButtonText: {
        color: Theme.colors.background,
        fontSize: 16,
        fontWeight: 'bold',
    },
    fab: {
        position: 'absolute',
        bottom: 32,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: Theme.colors.text,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    fabText: {
        color: Theme.colors.background,
        fontSize: 32,
        fontWeight: 'bold',
        marginTop: -2,
    },
});
