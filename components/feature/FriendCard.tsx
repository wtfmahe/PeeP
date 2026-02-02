import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Theme } from '@/constants/Colors';
import { Eye } from 'lucide-react-native';

interface FriendCardProps {
    name: string;
    status?: string;
    onPeep: () => void;
    peepsRemaining: number;
    isPeeping?: boolean;
}

export default function FriendCard({ name, status, onPeep, peepsRemaining, isPeeping }: FriendCardProps) {
    return (
        <View style={styles.card}>
            <View style={styles.info}>
                <Text style={styles.name}>{name}</Text>
                <Text style={styles.status}>{status || 'Offline'}</Text>
            </View>
            <TouchableOpacity onPress={onPeep} style={styles.peepButton} disabled={peepsRemaining <= 0}>
                <Eye color={peepsRemaining > 0 ? Theme.colors.background : Theme.colors.secondary} size={20} />
                <Text style={[styles.peepText, peepsRemaining <= 0 && styles.disabledText]}>
                    {peepsRemaining > 0 ? 'Peep' : 'Limit'}
                </Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Theme.colors.card,
        padding: 16,
        borderRadius: 12,
        marginVertical: 8,
        borderWidth: 1,
        borderColor: Theme.colors.border,
    },
    info: {
        flex: 1,
    },
    name: {
        color: Theme.colors.text,
        fontSize: 18,
        fontWeight: '600',
    },
    status: {
        color: Theme.colors.secondary,
        fontSize: 14,
        marginTop: 4,
    },
    peepButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Theme.colors.primary,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        gap: 8,
    },
    peepText: {
        color: Theme.colors.background,
        fontWeight: 'bold',
        fontSize: 14,
    },
    disabledText: {
        color: Theme.colors.secondary,
    },
});
