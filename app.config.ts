import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: process.env.EXPO_PUBLIC_APP_NAME || 'TRUEVINE FELLOWSHIP',
  slug: 'tvf-app',
  version: process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/splash-image.png',
    resizeMode: 'contain',
    backgroundColor: '#1d3557',
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
     googleServicesFile: './google-services.json',
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
    'expo-dev-client',
    'expo-secure-store',
    [
      'expo-media-library',
      {
        photosPermission: 'Allow TRUEVINE FELLOWSHIP to access your photos for profile pictures and sharing content.',
        savePhotosPermission: 'Allow TRUEVINE FELLOWSHIP to save photos to your device for offline access.',
        isAccessMediaLocationEnabled: true,
      },
    ],
    [
      '@react-native-google-signin/google-signin',
      {
        iosUrlScheme: 'com.googleusercontent.apps.611655344607-brc26j79oqujh50g9q1fejeomu9uurf1',
        webClientId: '611655344607-oa8gqe3edlev9023hssd2t64nd97gme6.apps.googleusercontent.com',
      },
    ],
  ],
  scheme: 'tvf-app',
  extra: {
    eas: {
      projectId: '8bfd3384-3d72-45dd-bc91-757f4df9375f',
    },
    appName: process.env.EXPO_PUBLIC_APP_NAME || 'TRUEVINE FELLOWSHIP',
    appVersion: process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
    appDescription: 'Mobile app for TRUEVINE FELLOWSHIP Church with sermons, articles, and offline functionality',
    appWebsite: 'https://tvffellowship.org',
    appEmail: 'support@tvffellowship.org',
    appPrivacyPolicy: 'https://tvffellowship.org/privacy',
    appTermsOfService: 'https://tvffellowship.org/terms',
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  },
  runtimeVersion: {
    policy: 'sdkVersion',
  },
});
