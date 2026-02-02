import { EventEmitter } from 'expo-modules-core';

// Event emitter to simulate push notifications
type MockEvents = {
    incoming_peep: (payload: { fromUser: string; id: string }) => void;
};
export const MockPushNotification = new EventEmitter<MockEvents>({} as any);

const ACTIVITIES = [
    'Watching Netflix 🎬',
    'Scrolling Instagram 📱',
    'Listening to Spotify 🎧',
    'Gaming 🎮',
    'Idle / Offline 😴',
    'Coding usually 👨‍💻',
];

export const MockPeepService = {
    // Scenario 1: You peep someone else
    peepFriend: async (friendId: string): Promise<string> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const randomActivity = ACTIVITIES[Math.floor(Math.random() * ACTIVITIES.length)];
                resolve(randomActivity);
            }, 2000); // 2 second delay to feel like a network request
        });
    },

    // Scenario 2: Someone peeps YOU (Simulated Trigger)
    // This would normally come from a Push Notification -> Background Task
    simulateIncomingPeep: () => {
        console.log('[Mock] Incoming peep request received...');
        MockPushNotification.emit('incoming_peep', {
            fromUser: 'Mahidhar',
            id: Math.random().toString(),
        });
    }
};
