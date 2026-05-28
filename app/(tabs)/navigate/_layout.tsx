import { Stack } from 'expo-router';

export default function NavigateLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown:      false,
        contentStyle:     { backgroundColor: '#0f172a' },
        animation:        'slide_from_right',
        gestureEnabled:   true,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="dashboard" options={{ gestureEnabled: false }} />
      <Stack.Screen name="route" />
    </Stack>
  );
}
