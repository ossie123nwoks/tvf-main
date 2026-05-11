import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { Sermon } from '@/types/content';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type MediaType = 'audio' | 'video';

interface MiniPlayerContextValue {
  // ── Playback state (driven by context, read everywhere) ──
  activeSermonId: string | null;
  sermon: Sermon | null;
  mediaType: MediaType;
  isPlaying: boolean;
  isLoading: boolean;
  isBuffering: boolean;
  positionMillis: number;
  durationMillis: number;
  /** True when the full-screen player is mounted */
  isFullScreen: boolean;
  audioError: string | null;

  // ── Actions ──
  /** Load (or resume) audio for a sermon. Returns existing sound if already loaded. */
  loadAudio: (sermon: Sermon, resolvedUri: string) => Promise<Audio.Sound | null>;
  togglePlayPause: () => Promise<void>;
  /** Seek to an absolute position in milliseconds */
  seekTo: (millis: number) => Promise<void>;
  /** Dismiss mini player and stop audio */
  dismiss: () => Promise<void>;
  /** Call when full-screen player mounts */
  attachFullScreen: () => void;
  /** Call when full-screen player unmounts */
  detachFullScreen: () => void;
  /** Register a video sermon (no sound object; just metadata) */
  registerVideo: (sermon: Sermon) => void;
}

// ─────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────

const MiniPlayerContext = createContext<MiniPlayerContextValue | undefined>(undefined);

export const useMiniPlayer = (): MiniPlayerContextValue => {
  const ctx = useContext(MiniPlayerContext);
  if (!ctx) throw new Error('useMiniPlayer must be used inside MiniPlayerProvider');
  return ctx;
};

// ─────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────

export const MiniPlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // The actual Sound object lives here — never in SermonMediaPlayer
  const soundRef = useRef<Audio.Sound | null>(null);
  // Ref mirror of activeSermonId to avoid stale closures in loadAudio
  const activeSermonIdRef = useRef<string | null>(null);

  const [activeSermonId, setActiveSermonId] = useState<string | null>(null);
  const [sermon, setSermon] = useState<Sermon | null>(null);
  const [mediaType, setMediaType] = useState<MediaType>('audio');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [positionMillis, setPositionMillis] = useState(0);
  const [durationMillis, setDurationMillis] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);

  // ── Status handler (called by the Sound object's internal callback) ──
  const handleStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setIsPlaying(status.isPlaying);
      setIsBuffering(status.isBuffering);
      setPositionMillis(status.positionMillis ?? 0);
      setDurationMillis(status.durationMillis ?? 0);
      setIsLoading(false);
    }
  }, []);

  // ── Set background audio mode once at provider mount ──
  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    }).catch(e => console.warn('[MiniPlayerContext] setAudioMode error:', e));
  }, []);

  // ── AppState listener: resume audio if OS interrupted it on background ──
  useEffect(() => {
    // Track whether audio was playing before the app went to background
    const wasPlayingRef = { current: false };

    const handleAppStateChange = async (nextState: AppStateStatus) => {
      if (nextState === 'background' || nextState === 'inactive') {
        // Snapshot playing state before backgrounding
        if (soundRef.current) {
          try {
            const status = await soundRef.current.getStatusAsync();
            wasPlayingRef.current = status.isLoaded && (status as any).isPlaying;
          } catch (_) {
            wasPlayingRef.current = false;
          }
        }
      } else if (nextState === 'active') {
        // App came to foreground—re-assert audio session and resume if interrupted
        try {
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            staysActiveInBackground: true,
            playsInSilentModeIOS: true,
            shouldDuckAndroid: true,
            playThroughEarpieceAndroid: false,
          });
          if (wasPlayingRef.current && soundRef.current) {
            const status = await soundRef.current.getStatusAsync();
            if (status.isLoaded && !(status as any).isPlaying) {
              await soundRef.current.playAsync();
            }
            wasPlayingRef.current = false;
          }
        } catch (e) {
          console.warn('[MiniPlayerContext] foreground resume error:', e);
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  // ── Load audio (creates sound only if not already loaded for this sermon) ──
  // Uses activeSermonIdRef (not state) to avoid stale closures.
  const loadAudio = useCallback(
    async (targetSermon: Sermon, resolvedUri: string): Promise<Audio.Sound | null> => {
      // ── Already loaded for THIS sermon → reuse ──
      if (soundRef.current && activeSermonIdRef.current === targetSermon.id) {
        // Re-subscribe status callback (in case component re-mounted)
        soundRef.current.setOnPlaybackStatusUpdate(handleStatusUpdate);
        // Sync state from current playback status
        const status = await soundRef.current.getStatusAsync();
        handleStatusUpdate(status);
        return soundRef.current;
      }

      // ── Different sermon → unload previous ──
      if (soundRef.current) {
        try {
          await soundRef.current.stopAsync();
          await soundRef.current.unloadAsync();
        } catch (_) {}
        soundRef.current = null;
      }

      // ── Create new sound ──
      try {
        setIsLoading(true);
        setAudioError(null);
        setPositionMillis(0);
        setDurationMillis(0);
        setIsPlaying(false);
        setSermon(targetSermon);
        setActiveSermonId(targetSermon.id);
        activeSermonIdRef.current = targetSermon.id; // keep ref in sync
        setMediaType('audio');

        const { sound } = await Audio.Sound.createAsync(
          { uri: resolvedUri },
          { shouldPlay: false, isLooping: false, isMuted: false },
          handleStatusUpdate,
        );

        soundRef.current = sound;
        setIsLoading(false);
        return sound;
      } catch (err) {
        setIsLoading(false);
        setAudioError('Failed to load audio.');
        console.error('[MiniPlayerContext] loadAudio error:', err);
        return null;
      }
    },
    [handleStatusUpdate], // no longer needs [activeSermonId] — uses ref instead
  );

  // ── Register a video sermon (YouTube/native — no Sound object) ──
  const registerVideo = useCallback((targetSermon: Sermon) => {
    setSermon(targetSermon);
    setActiveSermonId(targetSermon.id);
    setMediaType('video');
  }, []);

  // ── Toggle play/pause ──
  const togglePlayPause = useCallback(async () => {
    if (!soundRef.current) return;
    try {
      const status = await soundRef.current.getStatusAsync();
      if (!status.isLoaded) return;
      if (status.isPlaying) {
        await soundRef.current.pauseAsync();
      } else {
        await soundRef.current.playAsync();
      }
    } catch (e) {
      console.warn('[MiniPlayerContext] togglePlayPause:', e);
    }
  }, []);

  // ── Seek to absolute position in ms ──
  const seekTo = useCallback(async (millis: number) => {
    if (!soundRef.current) return;
    try {
      await soundRef.current.setPositionAsync(millis);
    } catch (e) {
      console.warn('[MiniPlayerContext] seekTo:', e);
    }
  }, []);

  // ── Dismiss — stops and unloads everything ──
  const dismiss = useCallback(async () => {
    try {
      await soundRef.current?.pauseAsync();
      await soundRef.current?.unloadAsync();
    } catch (_) {}
    soundRef.current = null;
    setActiveSermonId(null);
    setSermon(null);
    setIsPlaying(false);
    setIsLoading(false);
    setIsBuffering(false);
    setPositionMillis(0);
    setDurationMillis(0);
    setIsFullScreen(false);
    setAudioError(null);
  }, []);

  // ── Full-screen lifecycle ──
  const attachFullScreen = useCallback(() => setIsFullScreen(true), []);
  const detachFullScreen = useCallback(() => setIsFullScreen(false), []);

  return (
    <MiniPlayerContext.Provider
      value={{
        activeSermonId,
        sermon,
        mediaType,
        isPlaying,
        isLoading,
        isBuffering,
        positionMillis,
        durationMillis,
        isFullScreen,
        audioError,
        loadAudio,
        togglePlayPause,
        seekTo,
        dismiss,
        attachFullScreen,
        detachFullScreen,
        registerVideo,
      }}
    >
      {children}
    </MiniPlayerContext.Provider>
  );
};
