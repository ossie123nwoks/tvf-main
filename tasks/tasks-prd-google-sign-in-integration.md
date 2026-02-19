# Task List: Google Sign-In Integration

**Based on:** `prd-google-sign-in-integration.md`  
**Created:** December 2024  
**Status:** Planning Phase

---

## Relevant Files

*Files that will be created or modified for this feature:*

- `lib/supabase/auth.ts` - Extend AuthService class with Google Sign-In methods
- `lib/auth/AuthContext.tsx` - Update AuthContext to handle Google authentication state
- `components/auth/SignInScreen.tsx` - Add Google Sign-In button to existing sign-in screen
- `components/auth/SignUpScreen.tsx` - Add Google Sign-In button to existing sign-up screen
- `components/auth/GoogleSignInButton.tsx` - New component for Google Sign-In button with proper styling
- `app.config.ts` - Update deep linking configuration for OAuth redirects
- `package.json` - Add expo-auth-session dependency
- `.env` - Add Google OAuth credentials
- `env.example` - Document Google OAuth environment variables
- `types/user.ts` - Add types for Google authentication if needed
- `lib/utils/oAuthHelpers.ts` - Utility functions for OAuth flow handling

### Notes

- Integration with Supabase OAuth must use the built-in provider configuration
- Deep linking is already configured in app.config.ts with scheme 'tvf-app'
- The app uses expo-auth-session for OAuth flow handling in React Native
- All authentication flows must maintain the same session structure as email/password auth
- Theme support (light/dark mode) must work for all Google Sign-In UI components
- Unit tests should be placed alongside the code files they are testing
- Use `npm test` to run all tests or `npm test -- <test-file>` to run specific tests

---

## Tasks

- [ ] 1.0 Setup & Configuration
  - [x] 1.1 Install expo-auth-session dependency: `npm install expo-auth-session expo-crypto`
  - [x] 1.2 Configure Google OAuth in Google Cloud Console: Create OAuth 2.0 credentials, set authorized redirect URIs (e.g., tvf-app://auth/callback), and get client ID and client secret
  - [x] 1.3 Configure Google as OAuth provider in Supabase Dashboard: Add Google provider settings, enter client ID and secret, set redirect URL
  - [x] 1.4 Update app.config.ts: Add OAuth redirect URI configuration for both iOS and Android platforms
  - [x] 1.5 Add environment variables: Add EXPO_PUBLIC_GOOGLE_CLIENT_ID and EXPO_PUBLIC_GOOGLE_CLIENT_SECRET to .env file (Note: After getting credentials from Google Cloud Console and Supabase, add these to your local .env file)
  - [x] 1.6 Update env.example: Document the new Google OAuth environment variables for team reference
  - [x] 1.7 Verify deep linking configuration: Ensure tvf-app:// scheme is properly configured for OAuth callbacks

- [x] 2.0 Backend Service Implementation
  - [x] 2.1 Create lib/utils/oAuthHelpers.ts: Add utility functions for Google OAuth flow (getRedirectURL, initiateOAuthFlow, handleOAuthCallback)
  - [x] 2.2 Extend types/user.ts: Add GoogleSignInCredentials interface and related types for OAuth authentication
  - [x] 2.3 Extend lib/supabase/auth.ts: Add static method signInWithGoogle() that uses Supabase's signInWithOAuth() with Google provider
  - [x] 2.4 Update lib/supabase/auth.ts: Add handleGoogleProfileData() method to extract and map Google profile information (name, email, avatar)
  - [x] 2.5 Update lib/supabase/auth.ts: Modify signUp() flow to auto-populate profile fields when Google data is available
  - [x] 2.6 Add error handling in lib/supabase/auth.ts: Add Google-specific error codes and messages (network errors, cancelled flow, permission denied)
  - [x] 2.7 Update lib/auth/AuthContext.tsx: Add signInWithGoogle method to AuthContext interface
  - [x] 2.8 Update lib/auth/AuthContext.tsx: Implement signInWithGoogle callback that calls AuthService.signInWithGoogle()
  - [x] 2.9 Update lib/auth/AuthContext.tsx: Handle Google authentication state changes (success, failure, loading states)
  - [x] 2.10 Add Google session validation: Ensure Google sessions use the same structure and validation as email/password sessions

- [x] 3.0 UI Components & User Experience
  - [x] 3.1 Create components/auth/GoogleSignInButton.tsx: Build themed Google Sign-In button component following Google brand guidelines
  - [x] 3.2 Style GoogleSignInButton for theme support: Ensure proper styling for both light and dark modes
  - [x] 3.3 Add "Or continue with" divider component: Create visual separator between email/password and Google Sign-In options
  - [x] 3.4 Update components/auth/SignInScreen.tsx: Import and render GoogleSignInButton component below email/password form
  - [x] 3.5 Add divider between email/password and Google button in SignInScreen
  - [x] 3.6 Connect GoogleSignInButton to signInWithGoogle method from AuthContext in SignInScreen
  - [x] 3.7 Update components/auth/SignUpScreen.tsx: Import and render GoogleSignInButton component below email/password form
  - [x] 3.8 Add divider between email/password and Google button in SignUpScreen
  - [x] 3.9 Connect GoogleSignInButton to signInWithGoogle method from AuthContext in SignUpScreen
  - [x] 3.10 Add loading state handling: Show loading indicator on Google button during OAuth flow
  - [x] 3.11 Add visual feedback: Display success message or redirect after successful Google authentication
  - [x] 3.12 Ensure accessibility: Add proper labels and ARIA attributes for Google Sign-In button

- [ ] 4.0 Testing & Error Handling
  - [ ] 4.1 Test Google Sign-In flow on iOS: Verify OAuth redirect, callback handling, and session establishment
  - [ ] 4.2 Test Google Sign-In flow on Android: Verify OAuth redirect, callback handling, and session establishment
  - [ ] 4.3 Test network error handling: Simulate network failure during OAuth flow and verify user-friendly error message
  - [ ] 4.4 Test OAuth cancellation: Cancel Google Sign-In flow and verify graceful handling without crashes
  - [ ] 4.5 Test account conflict scenario: Attempt to sign in with Google using email that already exists as email/password account
  - [ ] 4.6 Test profile population: Verify that user profile is automatically populated from Google account data
  - [ ] 4.7 Test profile picture import: Verify Google profile picture is imported and stored correctly
  - [ ] 4.8 Test deep linking: Verify OAuth callbacks are properly handled through deep links
  - [ ] 4.9 Test session persistence: Verify Google sessions persist correctly after app restart
  - [ ] 4.10 Test sign-out with Google accounts: Verify sign-out properly clears both app and Google sessions
  - [ ] 4.11 Test theme switching with Google button: Verify button renders correctly in light and dark modes
  - [ ] 4.12 Add error boundary: Ensure errors during Google authentication don't crash the app
  - [ ] 4.13 Test edge cases: Empty profiles, missing data, API failures

- [ ] 5.0 Polish, Analytics & Documentation
  - [ ] 5.1 Add analytics tracking: Track Google Sign-In usage, success rates, and error frequencies
  - [ ] 5.2 Add user feedback: Implement success messages and error alerts for Google authentication
  - [ ] 5.3 Update README.md: Document Google Sign-In setup and configuration requirements
  - [ ] 5.4 Add inline code documentation: Add JSDoc comments to Google Sign-In methods and components
  - [ ] 5.5 Update SETUP.md: Add instructions for configuring Google OAuth for new developers
  - [ ] 5.6 Verify performance: Ensure Google Sign-In doesn't impact app load time or responsiveness
  - [ ] 5.7 Test cross-platform consistency: Ensure identical behavior on iOS and Android
  - [ ] 5.8 Add admin analytics: Track Google vs email/password authentication usage (if admin dashboard supports it)
  - [ ] 5.9 Create user guide documentation: Document how users can sign in with Google
  - [ ] 5.10 Final UI polish: Ensure spacing, animations, and transitions are smooth and consistent
  - [ ] 5.11 Code review and cleanup: Remove console.logs, optimize imports, and ensure code follows project conventions

