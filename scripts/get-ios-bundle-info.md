# How to Get iOS Bundle Identifier and Configuration

## Quick Answer

Your iOS Bundle ID is already configured in your app:

```
com.tvffellowship.app
```

## Where It's Defined

### In `app.config.ts` (Line 19):

```typescript
ios: {
  supportsTablet: true,
  bundleIdentifier: 'com.tvffellowship.app',
  buildNumber: '1',
  // ...
}
```

## How to Verify iOS Configuration

### Option 1: Check app.config.ts

Your bundle ID is: `com.tvffellowship.app`

You can verify this by running:

```bash
grep -i "bundleIdentifier" app.config.ts
```

Or just look at line 19 in `app.config.ts`.

### Option 2: After Building with EAS

When you build your iOS app with EAS:

```bash
npx eas build --platform ios --profile development
```

EAS will show you all your app's configuration including:
- Bundle ID
- App version
- Build number

### Option 3: Check EAS Build Output

If you've already built the app, check your EAS build history:

```bash
npx eas build:list
```

Click on any iOS build to see the bundle identifier.

## iOS Bundle Identifier vs Other IDs

### Bundle Identifier
- **What**: Unique identifier for your iOS app
- **Format**: Reverse domain format (com.yourcompany.appname)
- **Your Value**: `com.tvffellowship.app`
- **Used For**: App Store, device installation, provisioning profiles

### App ID (in Apple Developer Portal)
- **What**: Identifier used in Apple Developer Portal
- **Can Include**: App groups, push notifications, etc.
- **Format**: Usually same as bundle identifier
- **Your Value**: `com.tvffellowship.app`

### Team ID
- **What**: Your Apple Developer Team identifier
- **Format**: 10 alphanumeric characters (e.g., ABC123DEFG)
- **Where to Find**: Apple Developer Portal → Membership

## How to Get Your iOS Team ID

### Method 1: EAS Build

```bash
npx eas build:configure
```

EAS will ask for your Apple Team ID and help you configure it.

### Method 2: Apple Developer Portal

1. Go to https://developer.apple.com/account
2. Click on **Membership** in the left sidebar
3. Your Team ID is displayed under "Team Information"

## iOS Configuration Checklist for Google Sign-In

To set up Google Sign-In for iOS, you need:

✅ **Bundle ID**: `com.tvffellowship.app` (Already configured)
✅ **iOS OAuth Client**: Create one in Google Cloud Console
✅ **iOS URL Scheme**: Already set in app.config.ts

Let's verify your iOS URL Scheme is correct:

### Check app.config.ts (Lines 89-95):

```typescript
[
  '@react-native-google-signin/google-signin',
  {
    iosUrlScheme: 'com.googleusercontent.apps.611655344607-oa8gqe3edlev9023hssd2t64nd97gme6',
    webClientId: '611655344607-oa8gqe3edlev9023hssd2t64nd97gme6.apps.googleusercontent.com',
  },
]
```

⚠️ **IMPORTANT**: Make sure this `iosUrlScheme` matches your iOS OAuth client's reversed client ID in Google Cloud Console.

## Getting iOS Reversed Client ID from Google Cloud Console

### Steps:

1. **Go to Google Cloud Console**
   - https://console.cloud.google.com/

2. **Navigate to Credentials**
   - APIs & Services → Credentials

3. **Create iOS OAuth Client**
   - Click "+ CREATE CREDENTIALS" → "OAuth client ID"
   - Application type: **iOS**
   - Bundle ID: `com.tvffellowship.app`
   - Click "Create"

4. **Copy the Reversed Client ID**
   - After creation, you'll see the client details
   - Look for "iOS URL scheme" or "Reversed client ID"
   - Format: `com.googleusercontent.apps.XXXXX-XXXXX`
   - Copy this value

5. **Update app.config.ts**
   - Replace the `iosUrlScheme` value in app.config.ts with your actual reversed client ID
   - Save the file
   - Rebuild your iOS app

## Quick iOS Setup Verification

Run this to check all iOS-related configurations:

```bash
# Check bundle identifier
cat app.config.ts | grep -A 2 "bundleIdentifier"

# Check iOS URL scheme
cat app.config.ts | grep -A 5 "iosUrlScheme"

# Check package configuration
cat app.config.ts | grep -A 2 "package"
```

## Next Steps After Getting Bundle Info

1. ✅ Bundle ID: `com.tvffellowship.app` - Already configured
2. ⏳ Get iOS OAuth client reversed ID from Google Cloud Console
3. ⏳ Update `iosUrlScheme` in app.config.ts if different
4. ⏳ Rebuild iOS app: `npx expo run:ios` or `npx eas build --platform ios`

## Summary

**Your iOS Bundle ID**: `com.tvffellowship.app`

This is used for:
- App Store submission
- Apple Developer Portal setup
- Google Cloud Console iOS OAuth client
- Device installation
- Push notifications (if configured)

**Current Status**: ✅ Configured in app.config.ts

You're ready to create the iOS OAuth client in Google Cloud Console with this bundle ID!

