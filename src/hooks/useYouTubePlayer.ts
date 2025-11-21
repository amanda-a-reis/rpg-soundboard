import { useRef, useCallback, useEffect } from 'react';

declare global {
    interface Window {
        YT: YTNamespace;
        onYouTubeIframeAPIReady: () => void;
    }
}

interface YTPlayer {
    playVideo: () => void;
    pauseVideo: () => void;
    stopVideo: () => void;
    seekTo: (seconds: number, allowSeekAhead: boolean) => void;
    setVolume: (volume: number) => void;
    getVolume: () => number;
    getCurrentTime: () => number;
    getDuration: () => number;
    getPlayerState: () => number;
    setLoop: (loop: boolean) => void;
    destroy: () => void;
}

interface YTPlayerConstructor {
    new (elementId: string, config: {
        videoId: string;
        playerVars?: {
            autoplay?: 0 | 1;
            controls?: 0 | 1;
            disablekb?: 0 | 1;
            fs?: 0 | 1;
            modestbranding?: 0 | 1;
            playsinline?: 0 | 1;
            rel?: 0 | 1;
            showinfo?: 0 | 1;
        };
        events?: {
            onReady?: (event: { target: YTPlayer }) => void;
            onStateChange?: (event: { target: YTPlayer; data: number }) => void;
            onError?: (event: { target: YTPlayer; data: number }) => void;
        };
    }): YTPlayer;
}

interface YTNamespace {
    Player: YTPlayerConstructor;
    PlayerState: {
        UNSTARTED: -1;
        ENDED: 0;
        PLAYING: 1;
        PAUSED: 2;
        BUFFERING: 3;
        CUED: 5;
    };
    loaded: number;
}

declare const YT: YTNamespace;

export interface YouTubePlayerManager {
    createPlayer: (sceneTrackId: string, youtubeId: string, onReady?: (duration: number) => void) => void;
    play: (sceneTrackId: string) => void;
    pause: (sceneTrackId: string) => void;
    stop: (sceneTrackId: string) => void;
    seek: (sceneTrackId: string, position: number) => void;
    setVolume: (sceneTrackId: string, volume: number) => void;
    getCurrentTime: (sceneTrackId: string) => number;
    getDuration: (sceneTrackId: string) => number;
    isPlaying: (sceneTrackId: string) => boolean;
    destroyPlayer: (sceneTrackId: string) => void;
    destroyAll: () => void;
}

export const useYouTubePlayer = (): YouTubePlayerManager => {
    const playersRef = useRef<Record<string, YTPlayer>>({});
    const apiReadyRef = useRef<boolean>(false);
    const pendingPlayersRef = useRef<Array<{
        sceneTrackId: string;
        youtubeId: string;
        onReady?: (duration: number) => void;
    }>>([]);

    const createPlayerInternal = useCallback((sceneTrackId: string, youtubeId: string, onReady?: (duration: number) => void) => {
        if (playersRef.current[sceneTrackId]) {
            return;
        }

        const containerId = `youtube-player-${sceneTrackId}`;
        let container = document.getElementById(containerId);

        if (!container) {
            container = document.createElement('div');
            container.id = containerId;
            container.style.position = 'absolute';
            container.style.width = '0';
            container.style.height = '0';
            container.style.overflow = 'hidden';
            container.style.pointerEvents = 'none';
            document.body.appendChild(container);
        }

        try {
            const player = new window.YT.Player(containerId, {
                videoId: youtubeId,
                playerVars: {
                    autoplay: 0,
                    controls: 0,
                    disablekb: 1,
                    fs: 0,
                    modestbranding: 1,
                    playsinline: 1,
                    rel: 0,
                    showinfo: 0,
                },
                events: {
                    onReady: (event) => {
                        const duration = event.target.getDuration();
                        if (onReady) {
                            onReady(duration);
                        }
                    },
                    onStateChange: (event) => {
                        if (event.data === window.YT.PlayerState.ENDED) {
                            const player = playersRef.current[sceneTrackId];
                            if (player) {
                                player.seekTo(0, true);
                            }
                        }
                    },
                    onError: (event) => {
                        console.error('YouTube player error:', event.data);
                    },
                },
            });

            playersRef.current[sceneTrackId] = player;
        } catch (error) {
            console.error('Error creating YouTube player:', error);
        }
    }, []);

    useEffect(() => {
        const checkAPIReady = () => {
            if (typeof window.YT !== 'undefined' && window.YT.Player) {
                apiReadyRef.current = true;
                pendingPlayersRef.current.forEach(({ sceneTrackId, youtubeId, onReady }) => {
                    createPlayerInternal(sceneTrackId, youtubeId, onReady);
                });
                pendingPlayersRef.current = [];
            } else {
                setTimeout(checkAPIReady, 100);
            }
        };

        if (!apiReadyRef.current) {
            checkAPIReady();
        }

        return () => {
            Object.values(playersRef.current).forEach(player => {
                try {
                    player.destroy();
                } catch (e) {
                    console.error('Error destroying YouTube player:', e);
                }
            });
            playersRef.current = {};
        };
    }, []);

    const createPlayer = useCallback((sceneTrackId: string, youtubeId: string, onReady?: (duration: number) => void) => {
        if (!apiReadyRef.current) {
            pendingPlayersRef.current.push({ sceneTrackId, youtubeId, onReady });
            return;
        }
        createPlayerInternal(sceneTrackId, youtubeId, onReady);
    }, [createPlayerInternal]);

    const play = useCallback((sceneTrackId: string) => {
        const player = playersRef.current[sceneTrackId];
        if (player) {
            try {
                player.playVideo();
            } catch (e) {
                console.error('Error playing YouTube video:', e);
            }
        }
    }, []);

    const pause = useCallback((sceneTrackId: string) => {
        const player = playersRef.current[sceneTrackId];
        if (player) {
            try {
                player.pauseVideo();
            } catch (e) {
                console.error('Error pausing YouTube video:', e);
            }
        }
    }, []);

    const stop = useCallback((sceneTrackId: string) => {
        const player = playersRef.current[sceneTrackId];
        if (player) {
            try {
                player.stopVideo();
            } catch (e) {
                console.error('Error stopping YouTube video:', e);
            }
        }
    }, []);

    const seek = useCallback((sceneTrackId: string, position: number) => {
        const player = playersRef.current[sceneTrackId];
        if (player) {
            try {
                player.seekTo(position, true);
            } catch (e) {
                console.error('Error seeking YouTube video:', e);
            }
        }
    }, []);

    const setVolume = useCallback((sceneTrackId: string, volume: number) => {
        const player = playersRef.current[sceneTrackId];
        if (player && typeof player.setVolume === 'function') {
            try {
                player.setVolume(volume * 100);
            } catch (e) {
                console.error('Error setting YouTube volume:', e);
            }
        }
    }, []);

    const getCurrentTime = useCallback((sceneTrackId: string): number => {
        const player = playersRef.current[sceneTrackId];
        if (player) {
            try {
                return player.getCurrentTime();
            } catch (e) {
                console.error('Error getting YouTube current time:', e);
            }
        }
        return 0;
    }, []);

    const getDuration = useCallback((sceneTrackId: string): number => {
        const player = playersRef.current[sceneTrackId];
        if (player) {
            try {
                return player.getDuration();
            } catch (e) {
                console.error('Error getting YouTube duration:', e);
            }
        }
        return 0;
    }, []);

    const isPlaying = useCallback((sceneTrackId: string): boolean => {
        const player = playersRef.current[sceneTrackId];
        if (player && typeof player.getPlayerState === 'function') {
            try {
                return player.getPlayerState() === window.YT.PlayerState.PLAYING;
            } catch (e) {
                console.error('Error checking YouTube playing state:', e);
            }
        }
        return false;
    }, []);

    const destroyPlayer = useCallback((sceneTrackId: string) => {
        const player = playersRef.current[sceneTrackId];
        if (player) {
            try {
                player.destroy();
                const container = document.getElementById(`youtube-player-${sceneTrackId}`);
                if (container) {
                    container.remove();
                }
            } catch (e) {
                console.error('Error destroying YouTube player:', e);
            }
            delete playersRef.current[sceneTrackId];
        }
    }, []);

    const destroyAll = useCallback(() => {
        Object.keys(playersRef.current).forEach(sceneTrackId => {
            destroyPlayer(sceneTrackId);
        });
    }, [destroyPlayer]);

    return {
        createPlayer,
        play,
        pause,
        stop,
        seek,
        setVolume,
        getCurrentTime,
        getDuration,
        isPlaying,
        destroyPlayer,
        destroyAll,
    };
};
