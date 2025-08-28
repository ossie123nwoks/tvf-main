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
    backgroundColor: '#ffffff',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.tvffellowship.app',
    buildNumber: '1',
    infoPlist: {
      NSCameraUsageDescription: 'This app uses the camera to allow you to upload profile pictures.',
      NSPhotoLibraryUsageDescription: 'This app uses the photo library to allow you to select profile pictures and share content.',
      NSMicrophoneUsageDescription: 'This app uses the microphone to allow you to record audio notes.',
      UIBackgroundModes: ['audio'],
      LSApplicationQueriesSchemes: ['mailto', 'message', 'whatsapp', 'twitter', 'facebook', 'instagram'],
    },
    associatedDomains: ['applinks:tvffellowship.org'],
    config: {
      usesNonExemptEncryption: false,
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#FFFFFF',
    },
    package: 'com.tvffellowship.app',
    versionCode: 1,
    permissions: [
      'INTERNET',
      'ACCESS_NETWORK_STATE',
      'READ_EXTERNAL_STORAGE',
      'WRITE_EXTERNAL_STORAGE',
      'VIBRATE',
      'RECEIVE_BOOT_COMPLETED',
      'SCHEDULE_EXACT_ALARM',
    ],
    intentFilters: [
      {
        action: 'VIEW',
        autoVerify: true,
        data: [
          {
            scheme: 'https',
            host: 'tvffellowship.org',
            pathPrefix: '/sermon',
          },
          {
            scheme: 'https',
            host: 'tvffellowship.org',
            pathPrefix: '/article',
          },
        ],
        category: ['BROWSABLE', 'DEFAULT'],
      },
    ],
  },
  web: {
    favicon: './assets/favicon.png',
    bundler: 'metro',
    output: 'static',
  },
  plugins: [
    'expo-router',
    'expo-av',
    'expo-notifications',
    'expo-file-system',
    [
      'expo-media-library',
      {
        photosPermission: 'Allow TRUEVINE FELLOWSHIP to access your photos for profile pictures and sharing content.',
        savePhotosPermission: 'Allow TRUEVINE FELLOWSHIP to save photos to your device for offline access.',
        isAccessMediaLocationEnabled: true,
      },
    ],
  ],
  scheme: 'tvf-app',
  extra: {
    eas: {
      projectId: 'tvf-fellowship-app',
    },
    appName: 'TRUEVINE FELLOWSHIP',
    appVersion: '1.0.0',
    appDescription: 'Mobile app for TRUEVINE FELLOWSHIP Church with sermons, articles, and offline functionality',
    appWebsite: 'https://tvffellowship.org',
    appEmail: 'support@tvffellowship.org',
    appPrivacyPolicy: 'https://tvffellowship.org/privacy',
    appTermsOfService: 'https://tvffellowship.org/terms',
  },
  updates: {
    fallbackToCacheTimeout: 0,
    url: 'https://u.expo.dev/tvf-fellowship-app',
  },
  runtimeVersion: {
    policy: 'sdkVersion',
  },
});
