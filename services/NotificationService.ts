import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';

// Configure how notifications are displayed when app is in foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export class NotificationService {
    private static expoPushToken: string | null = null;

    /**
     * Register for push notifications and get the FCM token
     */
    static async registerForPushNotifications(): Promise<string | null> {
        if (!Device.isDevice) {
            console.log('Push notifications only work on physical devices');
            // For emulators, we still try to get a token for testing
        }

        // Check and request permissions
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('Push notification permission denied');
            return null;
        }

        try {
            // Get the Expo push token (works with FCM on Android)
            const tokenData = await Notifications.getExpoPushTokenAsync({
                projectId: 'peep-78d1f', // Your Firebase project ID
            });

            this.expoPushToken = tokenData.data;
            console.log('Push token:', this.expoPushToken);
            return this.expoPushToken;
        } catch (error) {
            console.error('Error getting push token:', error);

            // Fallback: try getting device push token directly
            try {
                const deviceToken = await Notifications.getDevicePushTokenAsync();
                console.log('Device push token:', deviceToken.data);
                return deviceToken.data;
            } catch (e) {
                console.error('Error getting device token:', e);
                return null;
            }
        }
    }

    /**
     * Save the FCM token to the user's profile in Supabase
     */
    static async savePushTokenToProfile(userId: string): Promise<void> {
        const token = await this.registerForPushNotifications();

        if (token) {
            const { error } = await supabase
                .from('profiles')
                .update({ fcm_token: token })
                .eq('id', userId);

            if (error) {
                console.error('Error saving FCM token:', error);
            } else {
                console.log('FCM token saved to profile');
            }
        }
    }

    /**
     * Clear the FCM token from profile (on logout)
     */
    static async clearPushToken(userId: string): Promise<void> {
        const { error } = await supabase
            .from('profiles')
            .update({ fcm_token: null })
            .eq('id', userId);

        if (error) {
            console.error('Error clearing FCM token:', error);
        }
    }

    /**
     * Add a listener for received notifications
     */
    static addNotificationReceivedListener(
        callback: (notification: Notifications.Notification) => void
    ) {
        return Notifications.addNotificationReceivedListener(callback);
    }

    /**
     * Add a listener for when user taps on a notification
     */
    static addNotificationResponseListener(
        callback: (response: Notifications.NotificationResponse) => void
    ) {
        return Notifications.addNotificationResponseReceivedListener(callback);
    }

    /**
     * Send a local notification (for testing)
     */
    static async sendLocalNotification(title: string, body: string): Promise<void> {
        await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                sound: true,
            },
            trigger: null, // Immediate
        });
    }
}

export default NotificationService;
