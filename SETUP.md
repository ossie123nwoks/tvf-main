# 🚀 TRUEVINE FELLOWSHIP App Setup Guide

## Quick Start

### 1. **Environment Variables Setup**

Create a `.env` file in your project root:

```bash
# In your project root directory
touch .env
```

Add your Supabase credentials to `.env`:

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# App Configuration
EXPO_PUBLIC_APP_NAME=TRUEVINE FELLOWSHIP
EXPO_PUBLIC_APP_VERSION=1.0.0
```

### 2. **Get Supabase Credentials**

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `EXPO_PUBLIC_SUPABASE_URL`
   - **anon public** key → `EXPO_PUBLIC_SUPABASE_ANON_KEY`

### 3. **Database Setup**

Run the database schema in your Supabase SQL Editor:

```sql
-- Copy and paste the contents of database/schema.sql
-- This will create all necessary tables and indexes
```

### 4. **Install Dependencies**

```bash
npm install
```

### 5. **Configure Google Sign-In (Required for Authentication)**

To enable Google Sign-In, you need to set up OAuth credentials in Google Cloud Console:

#### Step 1: Get Your SHA-1 Fingerprint

**Option A: Using EAS Build (Recommended - No Java Installation Needed)**

```bash
npx eas build --platform android --profile development
```

After the build completes, EAS will show you the SHA-1 fingerprint in the build output. Copy this value.

**Option B: Using PowerShell Script (If You Have Java Installed)**

Run the provided script:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\get-sha1.ps1
```

This will automatically find your SHA-1 and copy it to your clipboard.

**Option C: Manual Method (If You Have Java Installed)**

```powershell
cd android\app
keytool -list -v -keystore debug.keystore -alias androiddebugkey -storepass android -keypass android
```

Look for the SHA-1 line in the output.

#### Step 2: Configure Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create one)
3. Go to **APIs & Services** → **Credentials**
4. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
5. Create **THREE separate OAuth clients**:

   **Web Application (for your app code):**
   - Application type: **Web application**
   - Name: TVF App - Web
   - Authorized redirect URIs: 
     - `tvf-app://auth-callback`
     - `https://YOUR_SUPABASE_PROJECT.supabase.co/auth/v1/callback`
   - Save and copy the **Client ID**

   **Android Application (for Android builds):**
   - Application type: **Android**
   - Name: TVF App - Android
   - Package name: `com.tvffellowship.app`
   - SHA-1 certificate fingerprint: [Paste your SHA-1 from Step 1]
   - Save and copy the **Client ID**

   **iOS Application (for iOS builds):**
   - Application type: **iOS**
   - Name: TVF App - iOS
   - Bundle ID: `com.tvffellowship.app`
   - Save and copy the **REVERSED_CLIENT_ID**

6. Add credentials to your `.env` file:

```env
# Google OAuth Configuration
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_CLIENT_SECRET=your-google-client-secret
```

7. Update `app.config.ts` with iOS REVERSED_CLIENT_ID:

```typescript
[
  '@react-native-google-signin/google-signin',
  {
    iosUrlScheme: 'com.googleusercontent.apps.YOUR_IOS_REVERSED_CLIENT_ID',
    webClientId: 'your-web-client-id.apps.googleusercontent.com',
  },
]
```

#### Step 3: Configure Supabase

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Authentication** → **Providers** → **Google**
4. Enable Google provider
5. Enter:
   - **Client ID**: Your Web OAuth Client ID
   - **Client Secret**: Your Web OAuth Client Secret
6. Save

### 6. **Start Development Server**

```bash
npm start
```

## 🔧 Troubleshooting

### Missing Environment Variables Error

If you see "Missing Supabase environment variables":

1. ✅ Check that `.env` file exists in project root
2. ✅ Verify environment variable names are correct
3. ✅ Make sure there are no spaces around the `=` sign
4. ✅ Restart your development server after creating `.env`

### Route Export Warnings

The "missing default export" warnings are caused by the Supabase error. Once you fix the environment variables, these warnings will disappear.

### Google Sign-In Errors

**"Missing iosUrlScheme" Error:**
- This has been fixed in `app.config.ts`
- Make sure your iOS OAuth client's reversed client ID is correctly configured

**"DEVELOPER_ERROR" on Android:**
- Verify your SHA-1 fingerprint is added to your Android OAuth client in Google Cloud Console
- Make sure your package name is exactly `com.tvffellowship.app`
- Ensure you're using the **Web OAuth Client ID** in your code, not the Android one
- Common fix: Re-add the SHA-1 fingerprint to Google Cloud Console

**"DEVELOPER_ERROR" on iOS:**
- Verify your iOS bundle ID matches exactly: `com.tvffellowship.app`
- Check that your `iosUrlScheme` in `app.config.ts` matches your iOS OAuth client's reversed client ID
- Rebuild the iOS app after making changes: `npx expo run:ios`

## 📱 Testing

After setup:

1. **Open app** in Expo Go or simulator
2. **Check console** for any remaining errors
3. **Test authentication** by signing up/in
4. **Test content** by browsing sermons and articles

## 🆘 Need Help?

- Check the console for detailed error messages
- Verify your Supabase project is active
- Ensure all environment variables are set correctly
- Restart the development server after changes

---

**TRUEVINE FELLOWSHIP Church App** - Bringing the Word to your mobile device.






