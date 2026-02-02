import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { Theme } from '@/constants/Colors';
import { useAuthStore } from '@/stores/authStore';
import { useEffect } from 'react';
import { NotificationService } from '@/services/NotificationService';

export default function RootLayout() {
    const { user, isLoading, isInitialized, initialize } = useAuthStore();
    const router = useRouter();
    const segments = useSegments();

    // Initialize auth on app start
    useEffect(() => {
        initialize();
    }, []);

    // Register for push notifications when user logs in
    useEffect(() => {
        if (user) {
            // Register for push notifications and save token to profile
            NotificationService.savePushTokenToProfile(user.id);

            // Set up notification listeners
            const receivedSubscription = NotificationService.addNotificationReceivedListener(
                (notification) => {
                    console.log('Notification received:', notification);
                }
            );

            const responseSubscription = NotificationService.addNotificationResponseListener(
                (response) => {
                    console.log('Notification tapped:', response);
                    // Navigate to home when notification is tapped
                    router.push('/');
                }
            );

            return () => {
                receivedSubscription.remove();
                responseSubscription.remove();
            };
        }
    }, [user]);

    // Handle auth-based navigation
    useEffect(() => {
        if (!isInitialized) return;

        const inAuthGroup = segments[0] === 'auth';

        if (!user && !inAuthGroup) {
            // Not logged in, redirect to login
            router.replace('/auth/login');
        } else if (user && inAuthGroup) {
            // Logged in but on auth screen, redirect to home
            router.replace('/');
        }
    }, [user, isInitialized, segments]);

    // Show loading screen while initializing
    if (!isInitialized || isLoading) {
        return (
            <View style={{ flex: 1, backgroundColor: Theme.colors.background, justifyContent: 'center', alignItems: 'center' }}>
                <StatusBar style="light" />
                <ActivityIndicator size="large" color={Theme.colors.text} />
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: Theme.colors.background }}>
            <StatusBar style="light" />
            <Stack
                screenOptions={{
                    headerStyle: {
                        backgroundColor: Theme.colors.background,
                    },
                    headerTintColor: Theme.colors.text,
                    headerTitleStyle: {
                        fontWeight: 'bold',
                    },
                    contentStyle: {
                        backgroundColor: Theme.colors.background,
                    },
                    headerShown: false,
                }}
            />
        </View>
    );
}
