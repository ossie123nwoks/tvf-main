import { useEffect, useRef, useState } from 'react';
import * as Linking from 'expo-linking';
import { AppState, AppStateStatus } from 'react-native';
import { 
  parseDeepLink, 
  handleIncomingDeepLink, 
  handleLaunchDeepLink,
  DeepLinkData 
} from '@/lib/utils/deepLinking';

export interface DeepLinkingState {
  isInitialized: boolean;
  lastDeepLink: DeepLinkData | null;
  isProcessing: boolean;
}

export function useDeepLinking() {
  const [state, setState] = useState<DeepLinkingState>({
    isInitialized: false,
    lastDeepLink: null,
    isProcessing: false
  });
  
  const appState = useRef(AppState.currentState);
  const initialUrlProcessed = useRef(false);

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground, check for pending deep links
        checkForPendingDeepLinks();
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);

  // Initialize deep linking
  useEffect(() => {
    initializeDeepLinking();
  }, []);

  const initializeDeepLinking = async () => {
    try {
      setState(prev => ({ ...prev, isProcessing: true }));

      // Get the initial URL that launched the app
      const initialUrl = await Linking.getInitialURL();
      
      if (initialUrl && !initialUrlProcessed.current) {
        initialUrlProcessed.current = true;
        const deepLinkData = parseDeepLink(initialUrl);
        
        if (deepLinkData) {
          setState(prev => ({ 
            ...prev, 
            lastDeepLink: deepLinkData,
            isInitialized: true 
          }));
          
          // Handle the initial deep link
          handleLaunchDeepLink(initialUrl);
        }
      }

      // Set up listener for incoming deep links when app is already running
      const subscription = Linking.addEventListener('url', handleUrlChange);
      
      setState(prev => ({ 
        ...prev, 
        isInitialized: true,
        isProcessing: false 
      }));

      return () => subscription?.remove();
    } catch (error) {
      console.error('Error initializing deep linking:', error);
      setState(prev => ({ 
        ...prev, 
        isInitialized: true,
        isProcessing: false 
      }));
    }
  };

  const handleUrlChange = (event: { url: string }) => {
    try {
      setState(prev => ({ ...prev, isProcessing: true }));
      
      const deepLinkData = parseDeepLink(event.url);
      
      if (deepLinkData) {
        setState(prev => ({ 
          ...prev, 
          lastDeepLink: deepLinkData,
          isProcessing: false 
        }));
        
        // Handle the incoming deep link
        handleIncomingDeepLink(event.url);
      } else {
        setState(prev => ({ ...prev, isProcessing: false }));
      }
    } catch (error) {
      console.error('Error handling URL change:', error);
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  const checkForPendingDeepLinks = async () => {
    try {
      const url = await Linking.getInitialURL();
      if (url && !initialUrlProcessed.current) {
        initialUrlProcessed.current = true;
        const deepLinkData = parseDeepLink(url);
        
        if (deepLinkData) {
          setState(prev => ({ 
            ...prev, 
            lastDeepLink: deepLinkData 
          }));
          
          handleLaunchDeepLink(url);
        }
      }
    } catch (error) {
      console.error('Error checking for pending deep links:', error);
    }
  };

  const clearLastDeepLink = () => {
    setState(prev => ({ ...prev, lastDeepLink: null }));
  };

  return {
    ...state,
    clearLastDeepLink
  };
}
