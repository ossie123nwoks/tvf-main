# Google Sign-In Implementation - Step by Step Guide

## ✅ What's Already Done

Your implementation is **already configured**! Here's what's working:

### Code Configuration ✅
- ✅ Google Sign-In code implemented in `lib/supabase/auth.ts`
- ✅ Auth context configured in `lib/auth/AuthContext.tsx`
- ✅ Environment variables set in `.env`
- ✅ App config updated in `app.config.ts`
- ✅ iOS URL scheme configured

### OAuth Clients ✅ (You confirmed you created these)
- ✅ Web OAuth Client
- ✅ Android OAuth Client  
- ✅ iOS OAuth Client

## 🚀 Final Implementation Steps

### Step 1: Verify Supabase Configuration

**Go to Supabase Dashboard:**
1. Visit: https://supabase.com/dashboard
2. Select your project
3. Navigate to: **Authentication** → **Providers**
4. Find **Google** provider
5. **Ensure these settings:**

```
✅ Enabled: Yes (toggle ON)

Client ID: YOUR_GOOGLE_WEB_CLIENT_ID_HERE

Client Secret: YOUR_GOOGLE_WEB_CLIENT_SECRET_HERE

Redirect URLs:
- tvf-app://auth-callback
- https://YOUR_SUPABASE_PROJECT_ID.supabase.co/auth/v1/callback
```

6. **Click Save** if you made any changes

### Step 2: Verify iOS Configuration (Critical!)

**This is the most common error. Let's verify:**

1. **Go to Google Cloud Console:**
   - https://console.cloud.google.com/apis/credentials

2. **Click on your iOS OAuth Client**

3. **Look for "iOS URL scheme" or "Reversed client ID"**

4. **Compare with your app.config.ts:**
   ```typescript
   iosUrlScheme: ''
   ```

5. **If they DON'T match:**
   - Copy the actual value from Google Cloud Console
   - Update `app.config.ts` line 92 with the correct value
   - Save the file

### Step 3: Verify Android SHA-1 (Critical for Android!)

**Without this, Android will show DEVELOPER_ERROR:**

1. **Go to Google Cloud Console:**
   - https://console.cloud.google.com/apis/credentials

2. **Click on your Android OAuth Client**

3. **Verify SHA-1 certificate fingerprint is added**

4. **If SHA-1 is missing, get it:**
   
   **Option A: Using EAS Build (Easiest)**
   ```bash
   npx eas build --platform android --profile development
   ```
   - Wait for build to complete
   - Copy SHA-1 from build output
   - Add it to your Android OAuth client in Google Cloud Console

   **Option B: Using PowerShell Script**
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\scripts\get-sha1.ps1
   ```
   - Copy the SHA-1 from output
   - Add it to your Android OAuth client in Google Cloud Console

   **Option C: If you have Java installed**
   ```powershell
   cd android\app
   keytool -list -v -keystore debug.keystore -alias androiddebugkey -storepass android -keypass android
   ```
   - Find SHA1: line
   - Copy the value
   - Add it to your Android OAuth client in Google Cloud Console

5. **After adding SHA-1, save the Android OAuth client**

### Step 4: Rebuild Your Apps

**After any configuration changes, you MUST rebuild:**

#### For Android:
```bash
# Option 1: Using Expo
npx expo run:android

# Option 2: Using EAS Build (if you want cloud build)
npx eas build --platform android --profile development
```

#### For iOS:
```bash
# Option 1: Using Expo
npx expo run:ios

# Option 2: Using EAS Build (if you want cloud build)
npx eas build --platform ios --profile development
```

### Step 5: Test Google Sign-In

#### Test on Android:

1. **Open your app**
2. **Navigate to Sign In screen**
3. **Tap "Sign in with Google" button**
4. **Expected behavior:**
   - ✅ No DEVELOPER_ERROR
   - ✅ Google Sign-In dialog appears
   - ✅ You can select a Google account
   - ✅ After selection, you're signed in
   - ✅ User appears in Supabase auth.users table

5. **If you get DEVELOPER_ERROR:**
   - Go back to Step 3 and ensure SHA-1 is added

#### Test on iOS:

1. **Open your app**
2. **Navigate to Sign In screen**
3. **Tap "Sign in with Google" button**
4. **Expected behavior:**
   - ✅ App doesn't crash
   - ✅ Google Sign-In dialog appears
   - ✅ You can select a Google account
   - ✅ After selection, you're signed in
   - ✅ User appears in Supabase auth.users table

5. **If app crashes:**
   - Go back to Step 2 and ensure iosUrlScheme is correct

## 📋 Configuration Checklist

Before testing, verify each item:

### Google Cloud Console
- [ ] Web OAuth Client created
- [ ] Android OAuth Client created with SHA-1 added
- [ ] iOS OAuth Client created
- [ ] All clients use the same Google Cloud project

### Supabase
- [ ] Google provider is enabled
- [ ] Web Client ID and Secret are configured
- [ ] Redirect URLs are configured

### Local Configuration
- [ ] `.env` file has correct values
- [ ] `app.config.ts` has correct `iosUrlScheme`
- [ ] `app.config.ts` has correct `webClientId`
- [ ] iOS Bundle ID: `com.tvffellowship.app`
- [ ] Android Package: `com.tvffellowship.app`

### Code
- [ ] `lib/supabase/auth.ts` has signInWithGoogle method
- [ ] `lib/auth/AuthContext.tsx` has signInWithGoogle method
- [ ] Google Sign-In button exists in UI

## 🔧 Common Issues & Solutions

### Issue 1: "Missing iosUrlScheme" Error
**Solution:** Already fixed in app.config.ts!
- If you still see this error, rebuild the app

### Issue 2: DEVELOPER_ERROR on Android
**Solution:**
- Add SHA-1 fingerprint to Android OAuth client
- Rebuild the app
- Verify package name is exactly: `com.tvffellowship.app`

### Issue 3: DEVELOPER_ERROR on iOS
**Solution:**
- Verify iosUrlScheme in app.config.ts matches iOS OAuth client
- Verify bundle ID is exactly: `com.tvffellowship.app`
- Rebuild the app

### Issue 4: App Crashes on iOS Sign In
**Solution:**
- Check iosUrlScheme configuration in app.config.ts
- Verify it matches the iOS OAuth client's reversed client ID
- Rebuild the app

### Issue 5: "Invalid client" Error
**Solution:**
- Verify you're using the **Web OAuth Client ID** in code
- Check Supabase has the same Web Client ID configured
- Verify redirect URLs are correct

### Issue 6: Sign In Opens Browser Instead of Native Dialog
**Solution:**
- This is expected if Google Play Services aren't available
- On iOS, it should always use native dialog
- Check `@react-native-google-signin/google-signin` is properly installed

## 🎉 Success Indicators

You'll know Google Sign-In is working when:

✅ **Build succeeds** without errors
✅ **No DEVELOPER_ERROR** messages
✅ **Google Sign-In button** opens native dialog
✅ **Account selection** works smoothly
✅ **User is authenticated** after selecting account
✅ **User appears** in Supabase auth.users table
✅ **Sign out** works correctly
✅ **Re-sign in** works with cached credentials

## 📱 Testing Checklist

After implementation:
- [ ] Build for Android succeeds
- [ ] Build for iOS succeeds
- [ ] Google Sign In works on Android
- [ ] Google Sign In works on iOS
- [ ] User data appears in Supabase
- [ ] Sign out works
- [ ] Re-sign in works
- [ ] Error handling works (cancel sign in)

## 🆘 Need Help?

If you encounter issues:

1. **Check console logs** for detailed error messages
2. **Verify all three OAuth clients** in Google Cloud Console
3. **Check Supabase** Google provider is enabled
4. **Review** GOOGLE_SIGNIN_IMPLEMENTATION.md
5. **Read** troubleshooting section in SETUP.md
6. **Run** `npx eas diagnostics` to check your setup

## Next Steps After Success

Once Google Sign-In works:

1. ✅ Test all authentication flows
2. ✅ Verify user data storage
3. ✅ Test on real devices (not just emulators)
4. ✅ Test error scenarios (network issues, cancelled sign-in)
5. ✅ Consider adding analytics to track sign-in success rates
6. ✅ Update your app's privacy policy if needed
7. ✅ Test user profile sync with Google data

---

**You're almost there!** Follow the steps above to complete your Google Sign-In implementation.

