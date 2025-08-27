import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'TRUEVINE FELLOWSHIP',
  slug: 'tvf-app',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff'
  },
  assetBundlePatterns: [
    '**/*'
  ],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.tvffellowship.app'
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#FFFFFF'
    },
    package: 'com.tvffellowship.app'
  },
  web: {
    favicon: './assets/favicon.png'
  },
  plugins: [
    'expo-router',
    'expo-av',
    'expo-notifications',
    'expo-file-system'
  ],
  scheme: 'tvf-app',
  // React 19 experimental configuration
  experiments: {
          // react19: true, // Commented out as it's not supported in current Expo version
      // useLegacyRenderer: true, // Commented out as it's not supported in current Expo version
      // useLegacyContext: true // Commented out as it's not supported in current Expo version
  }
});
