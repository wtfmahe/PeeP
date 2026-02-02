import { supabase } from '../lib/supabase';
import * as UsageStats from '../modules/usage-stats';

// Map package names to friendly display names
const APP_NAME_MAP: Record<string, string> = {
    'com.android.chrome': 'Browsing Chrome 🌐',
    'com.google.android.youtube': 'Watching YouTube 📺',
    'com.spotify.music': 'Listening to Spotify 🎵',
    'com.instagram.android': 'Scrolling Instagram 📸',
    'com.whatsapp': 'Chatting on WhatsApp 💬',
    'com.netflix.mediaclient': 'Watching Netflix 🎬',
    'com.anonymous.peep': 'Using Peep 👁️',
    'com.twitter.android': 'Scrolling X 𝕏',
    'com.google.android.apps.maps': 'Navigating Maps 🗺️',
    'com.google.android.gm': 'Checking Gmail 📧',
    'com.facebook.katana': 'On Facebook 👥',
    'com.zhiliaoapp.musically': 'Watching TikTok 🎵',
    'com.snapchat.android': 'Using Snapchat 👻',
    'com.discord': 'Chatting on Discord 💬',
    'com.linkedin.android': 'Networking on LinkedIn 💼',
    'com.reddit.frontpage': 'Browsing Reddit 🔥',
    'com.amazon.mShop.android.shopping': 'Shopping on Amazon 🛒',
};

function getFriendlyAppName(packageName: string): string {
    if (!packageName) return 'Idle 😴';
    return APP_NAME_MAP[packageName] || `Using ${packageName.split('.').pop()} 📱`;
}

let broadcastInterval: NodeJS.Timeout | null = null;

export const StatusBroadcaster = {
    /**
     * Start broadcasting current app status to Supabase
     * @param userId - The current user's ID
     * @param intervalMs - How often to broadcast (default 30 seconds)
     */
    start: (userId: string, intervalMs: number = 30000) => {
        // Clean up any existing interval
        StatusBroadcaster.stop();

        const broadcast = async () => {
            try {
                // Check permission first
                const hasPermission = await UsageStats.hasPermission();
                if (!hasPermission) {
                    console.log('StatusBroadcaster: No usage stats permission');
                    return;
                }

                // Get current foreground app
                const currentApp = await UsageStats.getForegroundApp();
                const friendlyName = getFriendlyAppName(currentApp || '');

                // Upsert to user_status table
                const { error } = await supabase
                    .from('user_status')
                    .upsert({
                        user_id: userId,
                        current_app: currentApp,
                        friendly_name: friendlyName,
                        updated_at: new Date().toISOString(),
                    }, {
                        onConflict: 'user_id',
                    });

                if (error) {
                    console.error('StatusBroadcaster error:', error);
                } else {
                    console.log('StatusBroadcaster: Updated status to', friendlyName);
                }
            } catch (error) {
                console.error('StatusBroadcaster broadcast error:', error);
            }
        };

        // Broadcast immediately, then on interval
        broadcast();
        broadcastInterval = setInterval(broadcast, intervalMs);

        console.log(`StatusBroadcaster: Started (every ${intervalMs / 1000}s)`);
    },

    /**
     * Stop broadcasting status
     */
    stop: () => {
        if (broadcastInterval) {
            clearInterval(broadcastInterval);
            broadcastInterval = null;
            console.log('StatusBroadcaster: Stopped');
        }
    },

    /**
     * Manually trigger a broadcast (useful after peeping someone)
     */
    broadcastNow: async (userId: string) => {
        try {
            const currentApp = await UsageStats.getForegroundApp();
            const friendlyName = getFriendlyAppName(currentApp || '');

            await supabase
                .from('user_status')
                .upsert({
                    user_id: userId,
                    current_app: currentApp,
                    friendly_name: friendlyName,
                    updated_at: new Date().toISOString(),
                }, {
                    onConflict: 'user_id',
                });

            return friendlyName;
        } catch (error) {
            console.error('StatusBroadcaster manual broadcast error:', error);
            return null;
        }
    },

    /**
     * Get friendly app name from package name
     */
    getFriendlyAppName,
};
