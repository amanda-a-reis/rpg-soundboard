export interface Track {
    id: string;
    name: string;
    file: Blob; // We store the file blob for playback
    duration: number;
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
