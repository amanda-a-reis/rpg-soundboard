import { useEffect, useRef } from 'react';
import { Howl } from 'howler';
import { useStore } from '../store/useStore';
import { useYouTubePlayer } from './useYouTubePlayer';

export const useAudioEngine = () => {
    const { tracks, scenes, activeSceneId, updateTrackPosition, updateTrack } = useStore();
    const sceneHowlsRef = useRef<Record<string, Howl>>({});
    const youtubePlayer = useYouTubePlayer();
    const youtubePlayerRef = useRef(youtubePlayer);

    useEffect(() => {
        youtubePlayerRef.current = youtubePlayer;
    }, [youtubePlayer]);

    useEffect(() => {
        const activeScene = scenes.find((s) => s.id === activeSceneId);
        const newSceneHowls = { ...sceneHowlsRef.current };

        if (activeScene) {
            activeScene.tracks.forEach(sceneTrack => {
                const libraryTrack = tracks.find(t => t.id === sceneTrack.sourceTrackId);
                if (!libraryTrack) return;

                if (libraryTrack.type === 'youtube' && libraryTrack.youtubeId) {
                    youtubePlayerRef.current.createPlayer(sceneTrack.id, libraryTrack.youtubeId, (duration) => {
                        if (libraryTrack.duration === 0) {
                            updateTrack(libraryTrack.id, { duration });
                        }
                    });

                    youtubePlayerRef.current.setVolume(sceneTrack.id, sceneTrack.volume);

                    const shouldPlay = activeScene.isPlaying && sceneTrack.isPlaying;
                    if (shouldPlay && !youtubePlayerRef.current.isPlaying(sceneTrack.id)) {
                        youtubePlayerRef.current.play(sceneTrack.id);
                    } else if (!shouldPlay && youtubePlayerRef.current.isPlaying(sceneTrack.id)) {
                        youtubePlayerRef.current.pause(sceneTrack.id);
                    }
                } else if (libraryTrack.type === 'local' && libraryTrack.file) {
                    let howl = newSceneHowls[sceneTrack.id];

                    if (!howl) {
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

                    if (howl.volume() !== sceneTrack.volume) howl.volume(sceneTrack.volume);
                    if (howl.loop() !== sceneTrack.loop) howl.loop(sceneTrack.loop);

                    const shouldPlay = activeScene.isPlaying && sceneTrack.isPlaying;

                    if (shouldPlay && !howl.playing()) {
                        howl.play();
                    } else if (!shouldPlay && howl.playing()) {
                        howl.pause();
                    }
                }
            });
        }

        Object.keys(newSceneHowls).forEach(sceneTrackId => {
            const howl = newSceneHowls[sceneTrackId];
            const isStillActive = activeScene?.tracks.find(t => t.id === sceneTrackId);

            if (!activeScene || !isStillActive) {
                if (howl.playing()) howl.stop();
                if (!isStillActive) {
                    howl.unload();
                    delete newSceneHowls[sceneTrackId];
                }
            }
        });

        if (activeScene) {
            activeScene.tracks.forEach(sceneTrack => {
                const libraryTrack = tracks.find(t => t.id === sceneTrack.sourceTrackId);
                if (libraryTrack?.type === 'youtube') {
                    const isStillActive = activeScene.tracks.find(t => t.id === sceneTrack.id);
                    if (!isStillActive) {
                        youtubePlayerRef.current.destroyPlayer(sceneTrack.id);
                    }
                }
            });
        }

        sceneHowlsRef.current = newSceneHowls;

    }, [activeSceneId, scenes, tracks, updateTrack]);

    useEffect(() => {
        const interval = setInterval(() => {
            Object.entries(sceneHowlsRef.current).forEach(([sceneTrackId, howl]) => {
                if (howl.playing()) {
                    const position = howl.seek() as number;
                    updateTrackPosition(sceneTrackId, position);
                }
            });

            const activeScene = scenes.find((s) => s.id === activeSceneId);
            if (activeScene) {
                activeScene.tracks.forEach(sceneTrack => {
                    const libraryTrack = tracks.find(t => t.id === sceneTrack.sourceTrackId);
                    if (libraryTrack?.type === 'youtube' && youtubePlayerRef.current.isPlaying(sceneTrack.id)) {
                        const position = youtubePlayerRef.current.getCurrentTime(sceneTrack.id);
                        updateTrackPosition(sceneTrack.id, position);
                    }
                });
            }
        }, 100);

        return () => clearInterval(interval);
    }, [updateTrackPosition, activeSceneId, scenes, tracks]);

    useEffect(() => {
        return () => {
            Object.values(sceneHowlsRef.current).forEach((howl) => howl.unload());
            youtubePlayerRef.current.destroyAll();
        };
    }, []);

    return {
        seekTo: (sceneTrackId: string, position: number) => {
            const howl = sceneHowlsRef.current[sceneTrackId];
            if (howl) {
                const wasPlaying = howl.playing();
                howl.seek(position);
                updateTrackPosition(sceneTrackId, position);

                if (wasPlaying && !howl.playing()) {
                    howl.play();
                }
            } else {
                youtubePlayerRef.current.seek(sceneTrackId, position);
                updateTrackPosition(sceneTrackId, position);
            }
        },
    };
};
