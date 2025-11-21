import { useEffect, useRef } from 'react';
import { Howl } from 'howler';
import { useStore } from '../store/useStore';

export const useAudioEngine = () => {
    const { tracks, scenes, activeSceneId, updateTrackPosition } = useStore();

    // RE-THINKING: To keep it simple and robust for this stage:
    // Let's create a new Howl instance for each SceneTrack.
    // It uses more memory but guarantees total isolation and is easier to reason about.
    // We can use the blob URL from the library track.

    const sceneHowlsRef = useRef<Record<string, Howl>>({}); // SceneTrackID -> Howl

    useEffect(() => {
        const activeScene = scenes.find((s) => s.id === activeSceneId);
        const newSceneHowls = { ...sceneHowlsRef.current };

        // Handle active scene playback
        if (activeScene) {
            activeScene.tracks.forEach(sceneTrack => {
                const libraryTrack = tracks.find(t => t.id === sceneTrack.sourceTrackId);
                if (!libraryTrack || !libraryTrack.file) return;

                let howl = newSceneHowls[sceneTrack.id];

                if (!howl) {
                    // Create new Howl for this scene track
                    const url = URL.createObjectURL(libraryTrack.file);
                    howl = new Howl({
                        src: [url],
                        html5: true,
                        loop: sceneTrack.loop,
                        volume: sceneTrack.volume,
                        format: ['mp3', 'wav', 'ogg', 'webm'],
                    });
                    newSceneHowls[sceneTrack.id] = howl;
                }

                // Update settings
                if (howl.volume() !== sceneTrack.volume) howl.volume(sceneTrack.volume);
                if (howl.loop() !== sceneTrack.loop) howl.loop(sceneTrack.loop);

                // Playback logic:
                // - If scene is playing AND track is enabled -> play
                // - Otherwise -> pause/stop
                const shouldPlay = activeScene.isPlaying && sceneTrack.isPlaying;

                if (shouldPlay && !howl.playing()) {
                    howl.play();
                } else if (!shouldPlay && howl.playing()) {
                    howl.pause();
                }
            });
        }

        // Cleanup / Stop logic
        // 1. Stop tracks if scene is not playing or changed
        // 2. Remove Howls for removed scene tracks

        Object.keys(newSceneHowls).forEach(sceneTrackId => {
            const howl = newSceneHowls[sceneTrackId];

            // Is this track still in the active scene?
            const isStillActive = activeScene?.tracks.find(t => t.id === sceneTrackId);

            if (!activeScene || !isStillActive) {
                if (howl.playing()) howl.stop();
                // Unload if it's no longer in the scene
                if (!isStillActive) {
                    howl.unload();
                    delete newSceneHowls[sceneTrackId];
                }
            }
        });

        sceneHowlsRef.current = newSceneHowls;

    }, [activeSceneId, scenes, tracks, updateTrackPosition]);

    // Track position updates
    useEffect(() => {
        const interval = setInterval(() => {
            Object.entries(sceneHowlsRef.current).forEach(([sceneTrackId, howl]) => {
                if (howl.playing()) {
                    const position = howl.seek() as number;
                    updateTrackPosition(sceneTrackId, position);
                }
            });
        }, 100); // Update every 100ms

        return () => clearInterval(interval);
    }, [updateTrackPosition]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            Object.values(sceneHowlsRef.current).forEach((howl) => howl.unload());
        };
    }, []);

    // Expose seek function
    return {
        seekTo: (sceneTrackId: string, position: number) => {
            const howl = sceneHowlsRef.current[sceneTrackId];
            if (howl) {
                const wasPlaying = howl.playing();
                howl.seek(position);
                updateTrackPosition(sceneTrackId, position);

                // Ensure playback continues if it was playing before seek
                if (wasPlaying && !howl.playing()) {
                    howl.play();
                }
            }
        },
    };
};
