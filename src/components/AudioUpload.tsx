import React, { useRef, useState } from 'react';
import { Upload, Youtube } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { Track } from '../types';
import { extractYouTubeId, fetchYouTubeMetadata, getYouTubeThumbnail } from '../utils/youtube';

export const AudioUpload: React.FC = () => {
    const addTrack = useStore((state) => state.addTrack);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [isLoadingYoutube, setIsLoadingYoutube] = useState(false);
    const [youtubeError, setYoutubeError] = useState<string | null>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            // Basic validation
            if (!file.type.startsWith('audio/')) continue;

            // Get actual duration from audio file
            const duration = await new Promise<number>((resolve) => {
                const audio = new Audio();
                audio.addEventListener('loadedmetadata', () => {
                    resolve(audio.duration);
                });
                audio.addEventListener('error', () => {
                    resolve(0); // Fallback if error
                });
                audio.src = URL.createObjectURL(file);
            });

            const newTrack: Track = {
                id: crypto.randomUUID(),
                name: file.name.replace(/\.[^/.]+$/, ""),
                file: file,
                duration: duration,
                type: 'local',
            };

            await addTrack(newTrack);
        }

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleYoutubeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setYoutubeError(null);

        if (!youtubeUrl.trim()) return;

        setIsLoadingYoutube(true);

        try {
            // Extract video ID
            const videoId = extractYouTubeId(youtubeUrl);
            if (!videoId) {
                throw new Error('Invalid YouTube URL');
            }

            // Fetch metadata
            const metadata = await fetchYouTubeMetadata(videoId);
            const thumbnail = getYouTubeThumbnail(videoId, 'hq');

            // Create YouTube track
            const newTrack: Track = {
                id: crypto.randomUUID(),
                name: metadata.title,
                youtubeId: videoId,
                duration: 0, // Will be set when player loads
                type: 'youtube',
                thumbnail: thumbnail,
            };

            await addTrack(newTrack);
            setYoutubeUrl(''); // Clear input
        } catch (error) {
            setYoutubeError(error instanceof Error ? error.message : 'Failed to add YouTube video');
        } finally {
            setIsLoadingYoutube(false);
        }
    };

    return (
        <>
            {/* Local Audio Upload */}
            <div className="p-4 border-2 border-dashed border-neutral-700 rounded-lg hover:border-indigo-500 transition-colors cursor-pointer text-center"
                onClick={() => fileInputRef.current?.click()}>
                <input
                    type="file"
                    multiple
                    accept="audio/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                />
                <div className="flex flex-col items-center gap-2 text-neutral-400">
                    <Upload className="w-8 h-8" />
                    <span className="text-sm font-medium">Click to upload audio files</span>
                </div>
            </div>

            {/* YouTube URL Input */}
            <div className="mt-4">
                <form onSubmit={handleYoutubeSubmit} className="flex flex-col gap-2">
                    <div className="flex gap-2">
                        <div className="flex-1 relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                <Youtube className="w-4 h-4 text-red-500" />
                            </div>
                            <input
                                type="text"
                                value={youtubeUrl}
                                onChange={(e) => setYoutubeUrl(e.target.value)}
                                placeholder="Paste YouTube URL..."
                                className="w-full pl-10 pr-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-indigo-500 transition-colors"
                                disabled={isLoadingYoutube}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isLoadingYoutube || !youtubeUrl.trim()}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-700 disabled:text-neutral-500 text-white rounded text-sm font-medium transition-colors"
                        >
                            {isLoadingYoutube ? 'Adding...' : 'Add YouTube'}
                        </button>
                    </div>
                    {youtubeError && (
                        <p className="text-xs text-red-400">{youtubeError}</p>
                    )}
                </form>
            </div>

            {/* Test Upload Button */}
            <button
                onClick={async (e) => {
                    e.stopPropagation();
                    const response = await fetch('/fly.mp3');
                    const blob = await response.blob();
                    const file = new File([blob], 'fly.mp3', { type: 'audio/mpeg' });

                    // Get actual duration
                    const duration = await new Promise<number>((resolve) => {
                        const audio = new Audio();
                        audio.addEventListener('loadedmetadata', () => {
                            resolve(audio.duration);
                        });
                        audio.addEventListener('error', () => {
                            resolve(0);
                        });
                        audio.src = URL.createObjectURL(file);
                    });

                    const newTrack: Track = {
                        id: crypto.randomUUID(),
                        name: 'fly',
                        file: file,
                        duration: duration,
                        type: 'local',
                    };
                    await addTrack(newTrack);
                }}
                className="mt-2 text-xs text-neutral-500 hover:text-white underline"
            >
                Test Upload (fly.mp3)
            </button>
        </>
    );
};
