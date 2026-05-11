import { ExpoConfig, ConfigContext } from 'expo/config';

/**
 * ============================================================
 * VERSIONING — UPDATE THESE BEFORE EVERY PLAY STORE RELEASE
 * ============================================================
 *
 * APP_VERSION  → Semantic version shown to users (e.g. "1.1.0")
 *                Increment MAJOR for breaking changes,
 *                MINOR for new features, PATCH for bug fixes.
 *
 * ANDROID_VERSION_CODE → Integer that MUST increase with every
 *                        AAB uploaded to Google Play Console.
 *                        Google rejects uploads where this value
 *                        is ≤ the previously uploaded code.
 *                        Tip: Use a date-based scheme like
 *                        YYYYMMDDNN for long-term scalability.
 *
 * IOS_BUILD_NUMBER → String that must increase for each
 *                    TestFlight / App Store upload.
 * ============================================================
 */
const APP_VERSION = '1.1.0';
const ANDROID_VERSION_CODE = 2;
const IOS_BUILD_NUMBER = '2';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: process.env.EXPO_PUBLIC_APP_NAME || 'TRUEVINE FELLOWSHIP',
  slug: 'tvf-app',
  version: APP_VERSION,
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
    buildNumber: IOS_BUILD_NUMBER,
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
    versionCode: ANDROID_VERSION_CODE,
    permissions: [
      'INTERNET',
      'ACCESS_NETWORK_STATE',
      'VIBRATE',
      'RECEIVE_BOOT_COMPLETED',
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
    appVersion: APP_VERSION,
    googleClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
    testOtpEnabled: process.env.EXPO_PUBLIC_TEST_OTP_ENABLED,
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
