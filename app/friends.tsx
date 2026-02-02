import { View, Text, TextInput, StyleSheet, TouchableOpacity, FlatList, Alert, ActivityIndicator } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { Theme } from '@/constants/Colors';
import { useAuthStore } from '@/stores/authStore';
import { useFriendStore } from '@/stores/friendStore';
import { ChevronLeft, UserPlus, Check, X, Search } from 'lucide-react-native';

export default function FriendsScreen() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { pendingRequests, fetchPendingRequests, sendFriendRequest, acceptFriendRequest, rejectFriendRequest, fetchFriends } = useFriendStore();

    const [username, setUsername] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState('');

    useEffect(() => {
        if (user) {
            fetchPendingRequests(user.id);
        }
    }, [user]);

    const handleSearch = async () => {
        if (!user || !username.trim()) return;

        setIsSearching(true);
        setSearchError('');

        const result = await sendFriendRequest(user.id, username.trim().toLowerCase());

        if (result.error) {
            setSearchError(result.error);
        } else {
            Alert.alert('Success!', `Friend request sent to @${username.trim()}`);
            setUsername('');
        }

        setIsSearching(false);
    };

    const handleAccept = async (requestId: string) => {
        const success = await acceptFriendRequest(requestId);
        if (success && user) {
            fetchPendingRequests(user.id);
            fetchFriends(user.id);
            Alert.alert('Friend Added! 🎉');
        }
    };

    const handleReject = async (requestId: string) => {
        const success = await rejectFriendRequest(requestId);
        if (success && user) {
            fetchPendingRequests(user.id);
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ChevronLeft color={Theme.colors.text} size={28} />
                </TouchableOpacity>
                <Text style={styles.title}>Friends</Text>
            </View>

            {/* Search/Add Friend */}
            <View style={styles.searchSection}>
                <Text style={styles.sectionTitle}>Add Friend</Text>
                <View style={styles.searchRow}>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter username"
                        placeholderTextColor="#666"
                        value={username}
                        onChangeText={setUsername}
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                    <TouchableOpacity
                        style={[styles.searchBtn, isSearching && styles.searchBtnDisabled]}
                        onPress={handleSearch}
                        disabled={isSearching || !username.trim()}
                    >
                        {isSearching ? (
                            <ActivityIndicator color={Theme.colors.background} size="small" />
                        ) : (
                            <UserPlus color={Theme.colors.background} size={20} />
                        )}
                    </TouchableOpacity>
                </View>
                {searchError ? (
                    <Text style={styles.error}>{searchError}</Text>
                ) : null}
            </View>

            {/* Pending Requests */}
            <View style={styles.requestsSection}>
                <Text style={styles.sectionTitle}>
                    Friend Requests {pendingRequests.length > 0 ? `(${pendingRequests.length})` : ''}
                </Text>

                {pendingRequests.length === 0 ? (
                    <Text style={styles.emptyText}>No pending requests</Text>
                ) : (
                    <FlatList
                        data={pendingRequests}
                        keyExtractor={item => item.id}
                        renderItem={({ item }) => (
                            <View style={styles.requestCard}>
                                <View style={styles.requestInfo}>
                                    <Text style={styles.requestName}>@{item.user.username}</Text>
                                    <Text style={styles.requestTime}>wants to be friends</Text>
                                </View>
                                <View style={styles.requestActions}>
                                    <TouchableOpacity
                                        style={[styles.actionBtn, styles.acceptBtn]}
                                        onPress={() => handleAccept(item.id)}
                                    >
                                        <Check color="#000" size={18} />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.actionBtn, styles.rejectBtn]}
                                        onPress={() => handleReject(item.id)}
                                    >
                                        <X color="#fff" size={18} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    />
                )}
            </View>
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
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 24,
    },
    backBtn: {
        padding: 8,
        marginRight: 8,
    },
    title: {
        color: Theme.colors.text,
        fontSize: 28,
        fontWeight: 'bold',
    },
    searchSection: {
        paddingHorizontal: 20,
        marginBottom: 32,
    },
    sectionTitle: {
        color: Theme.colors.text,
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
    },
    searchRow: {
        flexDirection: 'row',
        gap: 12,
    },
    input: {
        flex: 1,
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        padding: 14,
        fontSize: 16,
        color: Theme.colors.text,
        borderWidth: 1,
        borderColor: '#333',
    },
    searchBtn: {
        backgroundColor: Theme.colors.text,
        width: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchBtnDisabled: {
        opacity: 0.5,
    },
    error: {
        color: '#ff4444',
        fontSize: 14,
        marginTop: 8,
    },
    requestsSection: {
        flex: 1,
        paddingHorizontal: 20,
    },
    emptyText: {
        color: '#666',
        fontSize: 16,
        textAlign: 'center',
        marginTop: 20,
    },
    requestCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#1a1a1a',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#333',
    },
    requestInfo: {
        flex: 1,
    },
    requestName: {
        color: Theme.colors.text,
        fontSize: 16,
        fontWeight: '600',
    },
    requestTime: {
        color: '#888',
        fontSize: 14,
        marginTop: 2,
    },
    requestActions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    acceptBtn: {
        backgroundColor: '#4CAF50',
    },
    rejectBtn: {
        backgroundColor: '#333',
    },
});
