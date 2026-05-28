// Web shim for @rnmapbox/maps
// Mapbox native SDK is not available in browsers.
// Returns empty placeholder components so screens don't crash on web.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const Placeholder = () => (
  <View style={styles.box}>
    <Text style={styles.text}>🗺️ Map (mobile only)</Text>
  </View>
);

const styles = StyleSheet.create({
  box:  { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1e293b' },
  text: { color: '#64748b', fontSize: 14 },
});

export default { MapView: Placeholder, Camera: () => null, UserLocation: () => null };
export const MapView       = Placeholder;
export const Camera        = () => null;
export const UserLocation  = () => null;
export const setAccessToken = () => {};
