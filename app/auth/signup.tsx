import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Theme } from '@/constants/Colors';
import { useAuthStore } from '@/stores/authStore';

export default function SignupScreen() {
    const router = useRouter();
    const { signUp, isLoading } = useAuthStore();

    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSignup = async () => {
        setError('');

        if (!username.trim()) {
            setError('Please enter a username');
            return;
        }

        if (!email.trim() || !email.includes('@')) {
            setError('Please enter a valid email');
            return;
        }

        if (!password.trim() || password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        console.log('Attempting signup:', email, username);
        const result = await signUp(email.trim(), password, username.trim().toLowerCase());

        if (result.error) {
            setError(result.error);
        } else {
            router.replace('/');
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.content}>
                    {/* Logo */}
                    <View style={styles.logoContainer}>
                        <Text style={styles.logo}>👁️</Text>
                        <Text style={styles.title}>Join Peep</Text>
                        <Text style={styles.subtitle}>Create your account</Text>
                    </View>

                    {/* Form */}
                    <View style={styles.form}>
                        <TextInput
                            style={styles.input}
                            placeholder="Username"
                            placeholderTextColor="#666"
                            value={username}
                            onChangeText={setUsername}
                            autoCapitalize="none"
                            autoCorrect={false}
                            editable={!isLoading}
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Email"
                            placeholderTextColor="#666"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            editable={!isLoading}
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Password (min 6 chars)"
                            placeholderTextColor="#666"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            editable={!isLoading}
                        />

                        {error ? (
                            <Text style={styles.error}>{error}</Text>
                        ) : null}

                        <TouchableOpacity
                            style={[styles.button, isLoading && styles.buttonDisabled]}
                            onPress={handleSignup}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#000" />
                            ) : (
                                <Text style={styles.buttonText}>Create Account</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Sign In Link */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Already have an account? </Text>
                        <TouchableOpacity onPress={() => router.back()}>
                            <Text style={styles.footerLink}>Sign In</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.colors.background,
    },
    scrollContent: {
        flexGrow: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: 32,
        justifyContent: 'center',
        paddingVertical: 48,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logo: {
        fontSize: 64,
        marginBottom: 8,
    },
    title: {
        fontSize: 36,
        fontWeight: 'bold',
        color: Theme.colors.text,
        letterSpacing: 1,
    },
    subtitle: {
        fontSize: 16,
        color: '#888',
        marginTop: 8,
    },
    form: {
        gap: 16,
    },
    input: {
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: Theme.colors.text,
        borderWidth: 1,
        borderColor: '#333',
    },
    error: {
        color: '#ff4444',
        fontSize: 14,
        textAlign: 'center',
    },
    button: {
        backgroundColor: Theme.colors.text,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: Theme.colors.background,
        fontSize: 18,
        fontWeight: 'bold',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 32,
    },
    footerText: {
        color: '#888',
        fontSize: 16,
    },
    footerLink: {
        color: Theme.colors.text,
        fontSize: 16,
        fontWeight: 'bold',
    },
});
