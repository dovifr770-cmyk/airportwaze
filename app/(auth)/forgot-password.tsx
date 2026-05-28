import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../src/stores/authStore';

export default function ForgotPasswordScreen() {
  const [email, setEmail]     = useState('');
  const [sent, setSent]       = useState(false);
  const [loading, setLoading] = useState(false);
  const resetPassword         = useAuthStore((s) => s.resetPassword);

  const handleReset = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email.trim().toLowerCase());
      setSent(true);
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Could not send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <View style={styles.card}>
        {sent ? (
          <>
            <Text style={styles.icon}>📬</Text>
            <Text style={styles.title}>Check your inbox</Text>
            <Text style={styles.body}>
              We sent a password reset link to {email}. It expires in 1 hour.
            </Text>
            <TouchableOpacity style={styles.button} onPress={() => router.replace('/(auth)/login')}>
              <Text style={styles.buttonText}>Back to Sign In</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.title}>Reset password</Text>
            <Text style={styles.body}>Enter your email and we'll send a reset link.</Text>
            <TextInput
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor="#475569"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleReset}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.buttonText}>Send Reset Link</Text>
              }
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#0f172a', padding: 24, justifyContent: 'center' },
  back:           { position: 'absolute', top: 60, left: 24 },
  backText:       { color: '#60a5fa', fontSize: 16 },
  card:           { backgroundColor: '#1e293b', borderRadius: 24, padding: 28, alignItems: 'center' },
  icon:           { fontSize: 48, marginBottom: 16 },
  title:          { fontSize: 22, fontWeight: '700', color: '#f8fafc', marginBottom: 8, textAlign: 'center' },
  body:           { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 28, lineHeight: 20 },
  input: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#f8fafc',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
    width: '100%',
  },
  button:         { backgroundColor: '#3b82f6', borderRadius: 12, padding: 16, alignItems: 'center', width: '100%' },
  buttonDisabled: { opacity: 0.6 },
  buttonText:     { color: '#fff', fontSize: 16, fontWeight: '700' },
});
