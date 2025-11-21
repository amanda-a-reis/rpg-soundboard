import React, { useRef } from 'react';
import { Upload } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { Track } from '../types';

export const AudioUpload: React.FC = () => {
    const addTrack = useStore((state) => state.addTrack);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
            };

            await addTrack(newTrack);
        }

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <>
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
