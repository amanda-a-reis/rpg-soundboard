import React, { useState } from 'react';
import { Trash2, GripVertical } from 'lucide-react';
import { useStore } from '../store/useStore';

export const Library: React.FC = () => {
    const { tracks, removeTrack } = useStore();
    const [draggedTrackId, setDraggedTrackId] = useState<string | null>(null);

    const handleDragStart = (e: React.DragEvent, trackId: string) => {
        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('trackId', trackId);
        setDraggedTrackId(trackId);
    };

    const handleDragEnd = () => {
        setDraggedTrackId(null);
    };

    return (
        <div className="bg-neutral-800 rounded-lg p-4 flex flex-col gap-4 h-full overflow-hidden">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-neutral-200">Audio Library</h2>
                <p className="text-xs text-neutral-500">Drag tracks to scenes</p>
            </div>
            <div className="flex-1 overflow-y-auto flex flex-col gap-2">
                {tracks.length === 0 && (
                    <p className="text-neutral-500 text-sm text-center py-4">No tracks uploaded.</p>
                )}
                {tracks.map((track) => (
                    <div
                        key={track.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, track.id)}
                        onDragEnd={handleDragEnd}
                        className={`
                            bg-neutral-700/50 p-3 rounded flex items-center justify-between gap-3
                            group hover:bg-neutral-700 transition-all duration-200
                            cursor-grab active:cursor-grabbing
                            ${draggedTrackId === track.id ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}
                            hover:shadow-lg hover:shadow-indigo-500/10
                            border-2 border-transparent hover:border-indigo-500/30
                        `}
                    >
                        {/* Drag Handle */}
                        <GripVertical className="w-4 h-4 text-neutral-500 group-hover:text-indigo-400 flex-shrink-0 transition-colors" />

                        {/* Track Name */}
                        <div className="truncate flex-1 min-w-0">
                            <p className="font-medium text-sm text-neutral-200 truncate" title={track.name}>
                                {track.name}
                            </p>
                            <p className="text-xs text-neutral-500 mt-0.5">
                                {Math.floor(track.duration / 60)}:{String(Math.floor(track.duration % 60)).padStart(2, '0')}
                            </p>
                        </div>

                        {/* Delete Button */}
                        <button
                            onClick={() => removeTrack(track.id)}
                            className="p-1.5 hover:bg-red-500/20 text-neutral-400 hover:text-red-400 rounded flex-shrink-0 transition-colors"
                            title="Delete track"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};
