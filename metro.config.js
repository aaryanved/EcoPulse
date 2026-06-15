const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Supabase's realtime-js uses import.meta in its ESM build.
// Disabling package exports forces Metro to use the CJS build (main field) instead.
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
