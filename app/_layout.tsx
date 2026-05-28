import { useEffect, Component } from 'react';
import { I18nManager, View, Text, ScrollView, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import { queryClient } from '../src/lib/query-client';
import { useAuthStore } from '../src/stores/authStore';
import { useDevSeed }   from '../src/dev/useDevSeed';
import i18n, { isCurrentRTL } from '../src/i18n';

// ── Error boundary — shows the crash message on screen instead of Expo's
// generic blue "Something went wrong" screen, so we can debug remotely ──
class ErrorBoundary extends Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <View style={eb.container}>
        <Text style={eb.title}>🚨 Crash — copy this error:</Text>
        <ScrollView style={eb.scroll}>
          <Text style={eb.msg} selectable>{String(error)}</Text>
          <Text style={eb.stack} selectable>{(error as any).stack ?? ''}</Text>
        </ScrollView>
      </View>
    );
  }
}
const eb = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 20, paddingTop: 60 },
  title:     { color: '#f87171', fontSize: 16, fontWeight: '700', marginBottom: 12 },
  scroll:    { flex: 1 },
  msg:       { color: '#fca5a5', fontSize: 14, fontWeight: '600', marginBottom: 12 },
  stack:     { color: '#94a3b8', fontSize: 11, lineHeight: 18 },
});

// Apply persisted RTL direction before first render
I18nManager.forceRTL(isCurrentRTL());

SplashScreen.preventAutoHideAsync();

function AppBootstrap() {
  const initialize = useAuthStore((s) => s.initialize);

  // Seed mock data in dev mode (no-op in production)
  useDevSeed();

  useEffect(() => {
    // In dev mode the seed already set isAuthenticated=true,
    // so initialize() will be a fast no-op (auth.getCurrentUser returns null
    // from Supabase which is caught and swallowed).
    initialize().finally(() => SplashScreen.hideAsync());
  }, [initialize]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  // Hide splash immediately if fonts can't load
  useEffect(() => {
    // SplashScreen is hidden inside AppBootstrap after initialize()
    // This is a safety-net in case fonts fail
  }, []);

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <I18nextProvider i18n={i18n}>
              <StatusBar style="light" />
              <AppBootstrap />
            </I18nextProvider>
          </QueryClientProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
