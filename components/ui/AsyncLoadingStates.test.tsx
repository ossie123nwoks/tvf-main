import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import {
  AsyncLoadingWrapper,
  InlineLoadingSpinner,
  ButtonLoadingState,
  FormLoadingState,
} from './AsyncLoadingStates';

// Mock the theme hook
jest.mock('@/lib/theme/ThemeProvider', () => ({
  useTheme: () => ({
    colors: {
      primary: '#007AFF',
      textSecondary: '#8E8E93',
      surface: '#FFFFFF',
      error: '#FF3B30',
      onPrimary: '#FFFFFF',
      background: '#F2F2F7',
    },
    spacing: {
      lg: 16,
      md: 12,
      sm: 8,
    },
  }),
}));

describe('AsyncLoadingStates Components', () => {
  describe('AsyncLoadingWrapper', () => {
    it('should show loading state when isLoading is true', () => {
      const state = { isLoading: true, error: null };

      render(
        <AsyncLoadingWrapper state={state}>
          <div>Content</div>
        </AsyncLoadingWrapper>
      );

      expect(screen.getByText('Loading...')).toBeTruthy();
      expect(screen.queryByText('Content')).toBeFalsy();
    });

    it('should show error state when error exists', () => {
      const state = { isLoading: false, error: 'Test error' };

      render(
        <AsyncLoadingWrapper state={state}>
          <div>Content</div>
        </AsyncLoadingWrapper>
      );

      expect(screen.getByText('Something went wrong')).toBeTruthy();
      expect(screen.getByText('We encountered an error. Please try again.')).toBeTruthy();
      expect(screen.queryByText('Content')).toBeFalsy();
    });

    it('should show children when no loading or error', () => {
      const state = { isLoading: false, error: null };

      render(
        <AsyncLoadingWrapper state={state}>
          <div>Content</div>
        </AsyncLoadingWrapper>
      );

      expect(screen.getByText('Content')).toBeTruthy();
      expect(screen.queryByText('Loading...')).toBeFalsy();
      expect(screen.queryByText('Something went wrong')).toBeFalsy();
    });

    it('should show retry button when retry function is provided', () => {
      const retryMock = jest.fn();
      const state = { isLoading: false, error: 'Test error', retry: retryMock };

      render(
        <AsyncLoadingWrapper state={state}>
          <div>Content</div>
        </AsyncLoadingWrapper>
      );

      const retryButton = screen.getByText('Try Again');
      expect(retryButton).toBeTruthy();

      fireEvent.press(retryButton);
      expect(retryMock).toHaveBeenCalled();
    });
  });

  describe('InlineLoadingSpinner', () => {
    it('should not render when isLoading is false', () => {
      render(<InlineLoadingSpinner isLoading={false} />);

      expect(screen.queryByText('Loading...')).toBeFalsy();
    });

    it('should render when isLoading is true', () => {
      render(<InlineLoadingSpinner isLoading={true} />);

      // The icon should be present (though we can't easily test the icon name)
      expect(screen.getByTestId('inline-loading')).toBeTruthy();
    });

    it('should show message when provided', () => {
      render(<InlineLoadingSpinner isLoading={true} message="Processing..." />);

      expect(screen.getByText('Processing...')).toBeTruthy();
    });
  });

  describe('ButtonLoadingState', () => {
    it('should show loading state when isLoading is true', () => {
      render(
        <ButtonLoadingState isLoading={true}>
          <button>Click me</button>
        </ButtonLoadingState>
      );

      expect(screen.getByText('Loading...')).toBeTruthy();
      expect(screen.queryByText('Click me')).toBeFalsy();
    });

    it('should show children when isLoading is false', () => {
      render(
        <ButtonLoadingState isLoading={false}>
          <button>Click me</button>
        </ButtonLoadingState>
      );

      expect(screen.getByText('Click me')).toBeTruthy();
      expect(screen.queryByText('Loading...')).toBeFalsy();
    });
  });

  describe('FormLoadingState', () => {
    it('should show loading overlay when isLoading is true', () => {
      render(
        <FormLoadingState isLoading={true}>
          <form>Form content</form>
        </FormLoadingState>
      );

      expect(screen.getByText('Saving...')).toBeTruthy();
      expect(screen.getByText('Form content')).toBeTruthy();
    });

    it('should not show loading overlay when isLoading is false', () => {
      render(
        <FormLoadingState isLoading={false}>
          <form>Form content</form>
        </FormLoadingState>
      );

      expect(screen.queryByText('Saving...')).toBeFalsy();
      expect(screen.getByText('Form content')).toBeTruthy();
    });
  });
});
