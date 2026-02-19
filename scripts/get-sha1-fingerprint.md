# Getting SHA-1 Fingerprint for Google Authentication

## Option 1: Using EAS Build (Recommended for Expo projects)

This is the easiest way for Expo projects since you're using EAS Build.

### Steps:

1. **Build the app using EAS Build:**
   ```bash
   npx eas build --platform android --profile development
   ```

2. **After the build completes, EAS will provide you with:**
   - Download link for the APK
   - The SHA-1 fingerprint of the signing certificate

3. **Copy the SHA-1 fingerprint** and add it to your Google Cloud Console

## Option 2: Using Local Development Build

If you have Android Studio installed and have built the app locally:

### Steps:

1. **Open PowerShell or Command Prompt**
2. **Navigate to your project's android directory:**
   ```powershell
   cd android
   ```

3. **Run Gradle signing report:**
   ```powershell
   .\gradlew signingReport
   ```

4. **Look for output like this:**
   ```
   Variant: debug
   Config: debug
   Store: C:\Users\...\debug.keystore
   Alias: AndroidDebugKey
   SHA1: XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX
   ```

5. **Copy the SHA-1 value** (without colons or with colons both work in Google Console)

## Option 3: If You Have Java/OpenJDK Installed

### Steps:

1. **Open PowerShell or Command Prompt**

2. **Navigate to your project's android/app directory:**
   ```powershell
   cd android\app
   ```

3. **Run keytool command:**
   ```powershell
   keytool -list -v -keystore debug.keystore -alias androiddebugkey -storepass android -keypass android
   ```

4. **Look for this line in the output:**
   ```
   SHA1: XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX
   ```

5. **Copy the SHA-1 value**

## Option 4: Installing Java (If Needed)

If you don't have Java installed and want to use Option 3:

### Windows Installation:

1. **Download OpenJDK:**
   - Go to https://adoptium.net/
   - Download "OpenJDK 17" for Windows x64

2. **Install OpenJDK:**
   - Run the installer
   - Follow the installation wizard

3. **Add Java to PATH:**
   - Open System Properties → Environment Variables
   - Add `C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot\bin` to System PATH
   - Or set `JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot`

4. **Verify installation:**
   ```powershell
   java -version
   keytool
   ```

## Adding SHA-1 to Google Cloud Console

### Steps:

1. **Go to Google Cloud Console:**
   - https://console.cloud.google.com/

2. **Navigate to Credentials:**
   - APIs & Services → Credentials

3. **Create or Edit Android OAuth Client:**
   - Click "+ CREATE CREDENTIALS" → "OAuth client ID"
   - Application type: **Android**
   - Package name: `com.tvffellowship.app`
   - **SHA-1 certificate fingerprint**: Paste your SHA-1 here
   - Click "Create"

4. **Important Notes:**
   - You need **separate** OAuth clients for Web, Android, and iOS
   - Each client type has different requirements
   - Make sure to add SHA-1 for every build variant you use (debug, release)

## For Production Builds

When you build for production with EAS:

1. **Configure your production keystore in EAS:**
   ```bash
   npx eas credentials
   ```

2. **Generate a production build:**
   ```bash
   npx eas build --platform android --profile production
   ```

3. **Get the production SHA-1** from EAS Build output

4. **Add the production SHA-1** to your Android OAuth client in Google Cloud Console

## Summary

**For this project, the easiest approach is:**

1. Run: `npx eas build --platform android --profile development`
2. Copy the SHA-1 from the build output
3. Add it to Google Cloud Console → Android OAuth client
4. Make sure your package name is: `com.tvffellowship.app`

This will resolve your `DEVELOPER_ERROR` authentication issue.

