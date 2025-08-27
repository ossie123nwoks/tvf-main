export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  preferences: UserPreferences;
  role: UserRole;
  isEmailVerified: boolean;
  lastSignInAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'member' | 'admin' | 'moderator';

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  notifications: NotificationSettings;
  audioQuality: 'low' | 'medium' | 'high';
  autoDownload: boolean;
  language: string;
}

export interface NotificationSettings {
  newContent: boolean;
  reminders: boolean;
  updates: boolean;
  marketing: boolean;
}

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
}

export interface Session {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: User;
}

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface SignUpCredentials {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  acceptTerms: boolean;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
}

export interface EmailVerificationRequest {
  email: string;
}

export interface EmailVerificationConfirm {
  token: string;
}

export interface UserProfileUpdate {
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  preferences?: Partial<UserPreferences>;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface DeleteAccountRequest {
  password: string;
  reason?: string;
}

export interface OnboardingData {
  hasCompletedOnboarding: boolean;
  onboardingStep: number;
  preferences: Partial<UserPreferences>;
}

export interface AuthError {
  code: string;
  message: string;
  field?: string;
}

export interface AuthSuccess {
  message: string;
  user: User;
  session?: Session;
}
