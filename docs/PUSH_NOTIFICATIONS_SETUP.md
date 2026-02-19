# Push Notifications Setup Guide

This guide will help you set up push notifications for both iOS and Android platforms using Expo and Supabase.

## Overview

- **iOS**: Uses Apple Push Notification Service (APNs) via Expo's managed workflow
- **Android**: Uses Firebase Cloud Messaging (FCM) - requires Firebase project setup
- **Backend**: Supabase stores push tokens and sends notifications via Expo Push Notification API

## Prerequisites

- Expo account with EAS (Expo Application Services) configured
- Firebase account (for Android)
- Apple Developer account (for iOS production)
- Supabase project with `push_tokens` table already created

## Android Setup (Firebase Cloud Messaging)

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select an existing project
3. Follow the setup wizard to create your project

### Step 2: Add Android App to Firebase

1. In Firebase Console, click "Add app" → Select Android icon
2. Enter your Android package name: `com.tvffellowship.app`
3. Enter app nickname (optional): "TRUEVINE FELLOWSHIP Android"
4. Click "Register app"

### Step 3: Download google-services.json

1. After registering, download the `google-services.json` file
2. Place it in your project root directory (same level as `app.config.ts`)
3. **Security Note**: 
   - If your repo is **private**: You can commit this file (remove it from `.gitignore`)
   - If your repo is **public**: Keep it in `.gitignore` and use EAS Secrets (see Step 5, Option B)
   
   The file is already in `.gitignore` by default, so it won't be committed unless you explicitly remove it.

### Step 4: Update app.config.ts

Uncomment the `googleServicesFile` line in `app.config.ts`:

```typescript
android: {
  // ... other config
  googleServicesFile: './google-services.json',
  // ... rest of config
}
```

### Step 5: Build with EAS

**Recommended Approach: Use EAS Build** (no prebuild needed!)

EAS Build automatically picks up `google-services.json` from your project root. You have two options:

**Option A: Include google-services.json in your repo** (Simplest)

1. Remove `google-services.json` from `.gitignore` temporarily
2. Commit the file (it's safe if your repo is private)
3. Uncomment `googleServicesFile` in `app.config.ts`
4. Build with EAS:

```bash
eas build --platform android --profile development
```

**Option B: Use EAS Secrets** (More secure for public repos)

1. Keep `google-services.json` in `.gitignore`
2. Upload to EAS Secrets:
```bash
eas secret:create --scope project --name GOOGLE_SERVICES_JSON --type file --value ./google-services.json
```
3. EAS Build will automatically inject it during build
4. Uncomment `googleServicesFile` in `app.config.ts`
5. Build with EAS:

```bash
eas build --platform android --profile development
```

**Why EAS Build instead of Prebuild?**

✅ **Simpler**: No need to manage native Android/iOS folders  
✅ **Automatic**: EAS handles Firebase integration  
✅ **APNs**: Expo automatically configures iOS push notifications  
✅ **Consistent**: Same workflow for development and production  
✅ **Less maintenance**: No native code conflicts or merge issues

**Alternative: Local Development Build** (if you want to test locally)

If you need to test locally during development, you can use prebuild:

```bash
# Generate native folders (one-time setup)
npx expo prebuild --clean

# Build and run locally
npx expo run:android
```

**Note**: After running `prebuild`, you'll have `android/` and `ios/` folders. Make sure to add them to `.gitignore` (already done) and don't commit them. EAS Build works better without these folders in the managed workflow.

## iOS Setup (Apple Push Notifications)

### Step 1: Configure APNs via EAS

Expo manages APNs credentials automatically through EAS. No manual setup needed!

### Step 2: Build with EAS

When you build your iOS app with EAS, Expo will automatically:
- Generate APNs certificates
- Configure push notification capabilities
- Set up the necessary entitlements

```bash
# Build for iOS
eas build --platform ios --profile development
```

### Step 3: Verify Setup

After building, push notifications should work automatically on iOS devices.

## Testing Push Notifications

### Development Testing

1. **Build and install** your app on a physical device (push notifications don't work on simulators)
2. **Sign in** to your app
3. **Check logs** - you should see:
   - `Expo push token: ExponentPushToken[...]` (success)
   - Or a warning about Firebase if Android isn't configured yet

### Sending Test Notifications

You can test push notifications using:

1. **Expo Push Notification Tool**: https://expo.dev/notifications
2. **Your Supabase backend**: Use the `sendNotificationToUser` function in `lib/notifications/push.ts`

### Test via Expo CLI

```bash
# Send a test notification
npx expo send-notification \
  --to ExpoPushToken[YOUR_TOKEN_HERE] \
  --title "Test Notification" \
  --body "This is a test message"
```

## Troubleshooting

### Android: "FirebaseApp is not initialized"

**Symptom**: Error message about Firebase not being initialized

**Solution**:
1. Ensure `google-services.json` is in project root
2. Uncomment `googleServicesFile` in `app.config.ts`
3. Rebuild the app (not just restart Metro bundler)
4. Check that package name matches: `com.tvffellowship.app`

### iOS: Notifications Not Received

**Possible causes**:
1. **Not a physical device**: Push notifications don't work on iOS Simulator
2. **Permissions not granted**: Check device Settings → Notifications → Your App
3. **Development build**: Ensure you're using a development or production build, not Expo Go
4. **APNs not configured**: Build with EAS to auto-configure APNs

### Token Not Generated

**Check**:
- Physical device (not simulator/emulator)
- Permissions granted
- User is authenticated (tokens are user-specific)
- EAS project ID is configured in `app.config.ts`

### Notifications Not Stored in Supabase

**Check**:
- User is authenticated
- `push_tokens` table exists in Supabase
- RLS policies allow INSERT/UPDATE for authenticated users
- Network connection is active

## Production Checklist

Before deploying to production:

### Android
- [ ] Firebase project created
- [ ] `google-services.json` downloaded and placed in project root
- [ ] `googleServicesFile` uncommented in `app.config.ts`
- [ ] App rebuilt with Firebase configuration
- [ ] Test notifications sent and received

### iOS
- [ ] Apple Developer account active
- [ ] App built with EAS (auto-configures APNs)
- [ ] Push notification capability enabled in Xcode (if custom native code)
- [ ] Test notifications sent and received

### General
- [ ] Push tokens stored in Supabase `push_tokens` table
- [ ] Notification sending logic tested
- [ ] Error handling implemented (already done in code)
- [ ] User notification preferences working

## Architecture

```
┌─────────────┐
│   User App  │
│  (iOS/Android)│
└──────┬──────┘
       │
       │ 1. Request Push Token
       │
┌──────▼──────────┐
│ Expo Push       │
│ Notification    │
│ Service         │
└──────┬──────────┘
       │
       │ 2. Generate Token
       │
┌──────▼──────────┐     ┌──────────────┐
│  Your App       │────▶│  Supabase    │
│  (Store Token)  │     │  (Database)  │
└─────────────────┘     └──────────────┘
                                │
                                │ 3. Send Notification
                                │
                        ┌───────▼──────────┐
                        │ Expo Push API    │
                        │ (Backend)        │
                        └───────┬──────────┘
                                │
                                │ 4. Deliver to Device
                                │
                        ┌───────▼──────────┐
                        │   User Device    │
                        │  (iOS/Android)   │
                        └──────────────────┘
```

## Additional Resources

- [Expo Push Notifications Documentation](https://docs.expo.dev/push-notifications/push-notifications-setup/)
- [Firebase Cloud Messaging Setup](https://docs.expo.dev/push-notifications/fcm-credentials/)
- [Apple Push Notification Service](https://developer.apple.com/documentation/usernotifications)
- [Supabase Push Notifications Guide](https://supabase.com/docs/guides/functions/examples/push-notifications)

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review Expo documentation links
3. Check Supabase logs for database errors
4. Verify all configuration steps were completed

---

**Note**: During development, push notifications may show warnings about Firebase not being configured. This is expected and won't break your app. Follow the setup steps above when you're ready to enable push notifications.

