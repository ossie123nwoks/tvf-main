# TRUEVINE FELLOWSHIP Church App

A React Native mobile application built with Expo for TRUEVINE FELLOWSHIP Church, featuring sermons, articles, offline functionality, and dark mode support.

## Features

- **Sermon Library**: Browse and search through church sermons with audio playback
- **Article Collection**: Read spiritual articles and devotionals
- **Offline Support**: Download content for offline listening and reading
- **Dark Mode**: Automatic and manual theme switching
- **Push Notifications**: Stay updated with new content and reminders
- **Cross-Platform**: Works on both iOS and Android

## Tech Stack

- **Framework**: React Native with Expo
- **Navigation**: Expo Router
- **UI Components**: React Native Paper (Material Design)
- **Backend**: Supabase
- **Audio**: Expo AV
- **State Management**: React Context + Hooks
- **Language**: TypeScript

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (for iOS development)
- Android Studio (for Android development)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd tvf_main
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   - Copy `env.example` to `.env`
   - Add your Supabase credentials:
     ```
     EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
     EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

4. **Start the development server**
   ```bash
   npm start
   ```

## Development

### Available Scripts

- `npm start` - Start the Expo development server
- `npm run android` - Run on Android device/emulator
- `npm run ios` - Run on iOS simulator
- `npm run web` - Run in web browser
- `npm test` - Run test suite
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

### Project Structure

```
tvf_main/
├── app/                    # Expo Router app directory
│   ├── (tabs)/           # Tab navigation screens
│   ├── _layout.tsx       # Root layout
│   └── index.tsx         # Entry point
├── components/            # Reusable UI components
├── lib/                   # Utility libraries and services
│   ├── supabase/         # Supabase client and services
│   └── theme/            # Theme configuration
├── types/                 # TypeScript type definitions
├── assets/                # Images, fonts, and other assets
└── tests/                 # Test files
```

### Key Components

- **ThemeProvider**: Manages light/dark theme switching
- **Dashboard**: Main screen with featured content and quick actions
- **Sermons**: Browse and search sermon library
- **Articles**: Read spiritual articles and devotionals
- **Profile**: User settings and preferences

## Configuration

### Supabase Setup

1. Create a new Supabase project
2. Set up authentication tables
3. Configure storage for audio files
4. Set up real-time subscriptions for notifications

### App Configuration

- Update `app.config.ts` with your app details
- Configure icons and splash screen in `assets/`
- Set up push notification certificates

## Testing

The app includes a comprehensive test suite:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- ComponentName.test.tsx
```

## Building for Production

### iOS
```bash
expo build:ios
```

### Android
```bash
expo build:android
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support and questions, please contact the development team or create an issue in the repository.

---

**TRUEVINE FELLOWSHIP Church App** - Bringing the Word to your mobile device.
