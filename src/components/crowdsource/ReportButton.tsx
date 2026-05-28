import { useRef } from 'react';
import {
  TouchableOpacity, Text, StyleSheet, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  onPress:    () => void;
  /** Optional label override */
  label?:     string;
  /** Position style override — defaults to bottom-right FAB */
  style?:     object;
}

/**
 * Floating Action Button that opens the crowd-report sheet.
 * Drop this anywhere on a screen and it springs in on mount.
 */
export function ReportButton({ onPress, label = 'Report', style }: Props) {
  const scaleAnim  = useRef(new Animated.Value(0)).current;
  const pressAnim  = useRef(new Animated.Value(1)).current;

  // Spring in on mount
  Animated.spring(scaleAnim, {
    toValue: 1,
    damping: 12,
    stiffness: 180,
    useNativeDriver: true,
  }).start();

  const handlePressIn = () =>
    Animated.timing(pressAnim, { toValue: 0.92, duration: 100, useNativeDriver: true }).start();

  const handlePressOut = () =>
    Animated.timing(pressAnim, { toValue: 1, duration: 150, useNativeDriver: true }).start();

  return (
    <Animated.View
      style={[
        styles.fab,
        style,
        { transform: [{ scale: scaleAnim }, { scale: pressAnim }] },
      ]}
    >
      <TouchableOpacity
        style={styles.inner}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <Ionicons name="megaphone-outline" size={18} color="#fff" />
        <Text style={styles.label}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 20,
    borderRadius: 28,
    backgroundColor: '#7c3aed',
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  label: { color: '#fff', fontWeight: '800', fontSize: 14 },
});
