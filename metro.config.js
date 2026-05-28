// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Stub optional Supabase telemetry dep that isn't installed
config.resolver.extraNodeModules = {
  '@opentelemetry/api': path.resolve(__dirname, 'src/shims/empty.js'),
};

module.exports = config;
