export interface Track {
    id: string;
    name: string;
    file?: Blob;            // For local audio files
    youtubeId?: string;      // For YouTube videos
    duration: number;
    type: 'local' | 'youtube';
    thumbnail?: string;      // YouTube thumbnail URL (optional)
}

export interface SceneTrack {
    id: string; // Unique ID for this instance in the scene
    sourceTrackId: string; // Reference to the library track
    volume: number;
    loop: boolean;
    isPlaying: boolean;
}

export interface Scene {
    id: string;
    name: string;
    tracks: SceneTrack[]; // Changed from trackIds: string[]
    isPlaying: boolean;
}

export interface AudioState {
    masterVolume: number;
}
