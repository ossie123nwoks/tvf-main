# iOS EAS Build Setup Guide

This guide will walk you through setting up cloud EAS builds for iOS now that you have your Apple Developer Program account.

## Prerequisites

✅ Apple Developer Program account (you have this!)
✅ Bundle Identifier configured: `com.tvffellowship.app` (already set in `app.config.ts`)
✅ EAS Project ID: `8bfd3384-3d72-45dd-bc91-757f4df9375f` (already configured)

## Step 1: Install EAS CLI (if not already installed)

```bash
npm install -g eas-cli
```

Or use npx (no installation needed):
```bash
npx eas-cli --version
```

## Step 2: Login to EAS

```bash
npx eas login
```

This will open a browser window for you to authenticate with your Expo account.

## Step 3: Configure iOS Credentials

EAS can automatically manage your iOS credentials (certificates, provisioning profiles, etc.) for you. This is the recommended approach.

### Option A: Automatic Credential Management (Recommended)

EAS will automatically generate and manage all necessary credentials:

```bash
npx eas build:configure
```

When prompted:
1. Select **iOS** platform
2. Choose **Automatic** credential management
3. Enter your **Apple Team ID** (10-character alphanumeric code from Apple Developer Portal)
   - Find it at: https://developer.apple.com/account → Membership
4. EAS will handle the rest automatically!

### Option B: Manual Credential Setup (Advanced)

If you prefer to manage credentials manually, you can:

1. Generate credentials manually in Apple Developer Portal
2. Upload them to EAS:
```bash
npx eas credentials
```

## Step 4: Verify Your Apple Developer Account

Before building, ensure your Apple Developer account is properly set up:

1. **Go to Apple Developer Portal**: https://developer.apple.com/account
2. **Verify your Team ID**: 
   - Navigate to Membership
   - Copy your Team ID (format: `ABC123DEFG`)
3. **Check App ID**:
   - Go to Certificates, Identifiers & Profiles
   - Click on Identifiers
   - Verify `com.tvffellowship.app` exists (or EAS will create it automatically)

## Step 5: Build Your iOS App

### Development Build (for testing)

```bash
npx eas build --platform ios --profile development
```

This will:
- Create a development build
- Install on your device via TestFlight (if configured) or direct download
- Include development tools and debugging capabilities

### Preview Build (for internal testing)

```bash
npx eas build --platform ios --profile preview
```

### Production Build (for App Store)

```bash
npx eas build --platform ios --profile production
```

## Step 6: First Build Process

On your **first iOS build**, EAS will:

1. **Ask for Apple Team ID** - Enter your 10-character Team ID
2. **Request App Store Connect API Key** (optional but recommended):
   - Go to: https://appstoreconnect.apple.com/access/api
   - Create a new key with "App Manager" role
   - Download the `.p8` key file
   - Note the Key ID
   - Note the Issuer ID
   - Run: `npx eas credentials` → iOS → App Store Connect API Key → Upload

3. **Generate Certificates** - EAS automatically creates:
   - Distribution Certificate
   - Provisioning Profiles
   - App Store Connect integration

4. **Build your app** - The build will run in the cloud

## Step 7: Monitor Your Build

After starting a build, you can:

1. **Watch the build progress**:
   ```bash
   npx eas build:list
   ```

2. **View build details**:
   - Visit: https://expo.dev/accounts/[your-account]/projects/tvf-app/builds
   - Click on your build to see logs and status

3. **Download the build**:
   - Once complete, download the `.ipa` file
   - Install via TestFlight or direct installation

## Step 8: Install on Device

### Option A: TestFlight (Recommended for Distribution)

1. **Submit to TestFlight**:
   ```bash
   npx eas submit --platform ios --profile production
   ```

2. **Add testers** in App Store Connect
3. **Install via TestFlight app** on your iOS device

### Option B: Direct Installation

1. **Download the `.ipa` file** from EAS build page
2. **Install via**:
   - Xcode (Window → Devices and Simulators)
   - Apple Configurator 2
   - Third-party tools like AltStore

## Troubleshooting

### Error: "No Apple Team ID found"

**Solution**: Run `npx eas credentials` and add your Apple Team ID manually.

### Error: "Bundle identifier already exists"

**Solution**: This means the App ID already exists in Apple Developer Portal. EAS will use the existing one - this is fine!

### Error: "Provisioning profile not found"

**Solution**: EAS should create this automatically. If not:
```bash
npx eas credentials
```
Select iOS → Provisioning Profile → Generate new

### Build Fails: "Code signing error"

**Solution**: 
1. Check your Apple Developer account is active
2. Verify Team ID is correct
3. Run `npx eas credentials` to regenerate certificates

### Build Takes Too Long

**First build** typically takes 15-30 minutes. Subsequent builds are usually faster (10-20 minutes).

## Next Steps

After your first successful build:

1. ✅ **Set up TestFlight** for easy distribution
2. ✅ **Configure App Store Connect** for App Store submission
3. ✅ **Set up automatic builds** with GitHub Actions (optional)
4. ✅ **Configure push notifications** (already set up in your app!)

## Useful Commands

```bash
# List all builds
npx eas build:list

# View build details
npx eas build:view [BUILD_ID]

# Cancel a running build
npx eas build:cancel [BUILD_ID]

# Manage credentials
npx eas credentials

# Submit to App Store
npx eas submit --platform ios

# Check build status
npx eas build:list --platform ios --status in-progress
```

## Configuration Files

Your iOS configuration is already set in:

- **Bundle ID**: `app.config.ts` line 19 → `com.tvffellowship.app`
- **Build Profiles**: `eas.json` → iOS configurations added
- **EAS Project**: `app.config.ts` line 101 → Project ID configured

## Additional Resources

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [iOS Build Configuration](https://docs.expo.dev/build-reference/ios-builds/)
- [Apple Developer Portal](https://developer.apple.com/account)
- [App Store Connect](https://appstoreconnect.apple.com)

---

**Ready to build?** Run:
```bash
npx eas build --platform ios --profile development
```

Good luck! 🚀

