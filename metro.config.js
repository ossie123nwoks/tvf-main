const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure environment variables are loaded
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = config;
