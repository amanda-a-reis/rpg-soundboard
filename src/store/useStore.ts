import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Track, Scene, SceneTrack } from '../types';
import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval';

interface AppState {
  tracks: Track[];
  scenes: Scene[];
  activeSceneId: string | null;
  trackPositions: Record<string, number>; // sceneTrackId -> current position in seconds

  // Actions
  addTrack: (track: Track) => Promise<void>;
  removeTrack: (trackId: string) => Promise<void>;
  updateTrack: (trackId: string, updates: Partial<Track>) => void;

  createScene: (name: string) => void;
  deleteScene: (sceneId: string) => void;
  updateScene: (sceneId: string, updates: Partial<Scene>) => void;

  addTrackToScene: (sceneId: string, trackId: string) => void;
  removeTrackFromScene: (sceneId: string, sceneTrackId: string) => void;
  updateSceneTrack: (sceneId: string, sceneTrackId: string, updates: Partial<SceneTrack>) => void;

  setActiveScene: (sceneId: string | null) => void;

  // Track position management
  updateTrackPosition: (sceneTrackId: string, position: number) => void;
  getTrackPosition: (sceneTrackId: string) => number;

  // Helper to load blobs on init
  loadAudioFiles: () => Promise<void>;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      tracks: [],
      scenes: [],
      activeSceneId: null,
      trackPositions: {},

      addTrack: async (track) => {
        // Save blob to IndexedDB
        await idbSet(track.id, track.file);

        set((state) => ({
          tracks: [...state.tracks, track],
        }));
      },

      removeTrack: async (trackId) => {
        // Remove blob from IndexedDB
        await idbDel(trackId);

        set((state) => ({
          tracks: state.tracks.filter((t) => t.id !== trackId),
          // Remove from all scenes where it might be referenced
          scenes: state.scenes.map(s => ({
            ...s,
            tracks: s.tracks.filter(st => st.sourceTrackId !== trackId)
          }))
        }));
      },

      updateTrack: (trackId, updates) => {
        set((state) => ({
          tracks: state.tracks.map((t) =>
            t.id === trackId ? { ...t, ...updates } : t
          ),
        }));
      },

      createScene: (name) => {
        const newScene: Scene = {
          id: crypto.randomUUID(),
          name,
          tracks: [],
          isPlaying: false,
        };
        set((state) => ({
          scenes: [...state.scenes, newScene],
        }));
      },

      deleteScene: (sceneId) => {
        set((state) => ({
          scenes: state.scenes.filter((s) => s.id !== sceneId),
          activeSceneId: state.activeSceneId === sceneId ? null : state.activeSceneId,
        }));
      },

      updateScene: (sceneId, updates) => {
        set((state) => ({
          scenes: state.scenes.map((s) =>
            s.id === sceneId ? { ...s, ...updates } : s
          ),
        }));
      },

      addTrackToScene: (sceneId, trackId) => {
        set((state) => {
          const scene = state.scenes.find(s => s.id === sceneId);
          if (!scene) return state;

          // Create a new SceneTrack instance
          const newSceneTrack: SceneTrack = {
            id: crypto.randomUUID(),
            sourceTrackId: trackId,
            volume: 1.0,
            loop: false,
            isPlaying: true, // Default to playing when scene plays
          };

          return {
            scenes: state.scenes.map(s =>
              s.id === sceneId
                ? { ...s, tracks: [...s.tracks, newSceneTrack] }
                : s
            )
          };
        });
      },

      removeTrackFromScene: (sceneId, sceneTrackId) => {
        set((state) => ({
          scenes: state.scenes.map(s =>
            s.id === sceneId
              ? { ...s, tracks: s.tracks.filter(st => st.id !== sceneTrackId) }
              : s
          )
        }));
      },

      updateSceneTrack: (sceneId, sceneTrackId, updates) => {
        set((state) => ({
          scenes: state.scenes.map(s =>
            s.id === sceneId
              ? {
                ...s,
                tracks: s.tracks.map(st =>
                  st.id === sceneTrackId ? { ...st, ...updates } : st
                )
              }
              : s
          )
        }));
      },

      setActiveScene: (sceneId) => {
        set({ activeSceneId: sceneId });
      },

      updateTrackPosition: (sceneTrackId, position) => {
        set((state) => ({
          trackPositions: {
            ...state.trackPositions,
            [sceneTrackId]: position,
          },
        }));
      },

      getTrackPosition: (sceneTrackId) => {
        return get().trackPositions[sceneTrackId] || 0;
      },

      loadAudioFiles: async () => {
        const { tracks } = get();
        const loadedTracks = await Promise.all(
          tracks.map(async (track) => {
            const file = await idbGet(track.id);
            if (file && file instanceof Blob) {
              return { ...track, file };
            }
            return track;
          })
        );
        set({ tracks: loadedTracks });
      },
    }),
    {
      name: 'rpg-soundboard-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        tracks: state.tracks.map(t => ({ ...t, file: undefined as any })), // Don't persist blobs to localStorage
        scenes: state.scenes,
        activeSceneId: state.activeSceneId,
      }),
    }
  )
);
