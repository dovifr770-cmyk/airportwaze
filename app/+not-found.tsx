import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

export default function NotFoundScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>✈</Text>
      <Text style={styles.title}>Lost in transit</Text>
      <Text style={styles.subtitle}>This page doesn't exist.</Text>
      <TouchableOpacity style={styles.button} onPress={() => router.replace('/(tabs)')}>
        <Text style={styles.buttonText}>Back to Dashboard</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center', padding: 24 },
  icon:       { fontSize: 64, marginBottom: 16 },
  title:      { fontSize: 24, fontWeight: '800', color: '#f8fafc', marginBottom: 8 },
  subtitle:   { fontSize: 15, color: '#64748b', marginBottom: 32 },
  button:     { backgroundColor: '#3b82f6', borderRadius: 14, paddingHorizontal: 32, paddingVertical: 14 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
