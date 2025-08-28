// Set up React Native globals
global.__DEV__ = true;

// Mock expo-linking
jest.mock('expo-linking', () => ({
  createURL: jest.fn(),
  parse: jest.fn(),
}));

// Mock expo-router
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  },
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
}));

// Global test utilities
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock fetch globally
global.fetch = jest.fn();

// Setup before each test
beforeEach(() => {
  jest.clearAllMocks();
});

// Cleanup after each test
afterEach(() => {
  jest.clearAllTimers();
});
