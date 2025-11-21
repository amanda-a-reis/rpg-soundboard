import React, { useState } from 'react';
import { Play, Square, Trash2, Volume2, Repeat, X, Plus } from 'lucide-react';
import { useStore } from '../store/useStore';
import clsx from 'clsx';

interface SceneManagerProps {
    seekTo: (sceneTrackId: string, position: number) => void;
}

export const SceneManager: React.FC<SceneManagerProps> = ({ seekTo }) => {
    const {
        scenes,
        tracks,
        createScene,
        deleteScene,
        updateScene,
        activeSceneId,
        setActiveScene,
        updateSceneTrack,
        removeTrackFromScene,
        addTrackToScene
    } = useStore();

    // Separate selector for trackPositions to ensure re-renders
    const trackPositions = useStore((state) => state.trackPositions);

    const [newSceneName, setNewSceneName] = useState('');
    const [dragOverSceneId, setDragOverSceneId] = useState<string | null>(null);

    const handleCreateScene = (e: React.FormEvent) => {
        e.preventDefault();
        if (newSceneName.trim()) {
            createScene(newSceneName.trim());
            setNewSceneName('');
        }
    };

    const toggleScenePlayback = (sceneId: string) => {
        const scene = scenes.find(s => s.id === sceneId);
        if (!scene) return;

        if (activeSceneId === sceneId && scene.isPlaying) {
            // Stop
            updateScene(sceneId, { isPlaying: false });
        } else {
            // Play (and switch if needed)
            if (activeSceneId !== sceneId) {
                // Stop old scene
                if (activeSceneId) {
                    updateScene(activeSceneId, { isPlaying: false });
                }
                setActiveScene(sceneId);
            }
            updateScene(sceneId, { isPlaying: true });
        }
    };

    const handleDragOver = (e: React.DragEvent, sceneId: string) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        setDragOverSceneId(sceneId);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOverSceneId(null);
    };

    const handleDrop = (e: React.DragEvent, sceneId: string) => {
        e.preventDefault();
        const trackId = e.dataTransfer.getData('trackId');
        if (trackId) {
            addTrackToScene(sceneId, trackId);
        }
        setDragOverSceneId(null);
    };

    return (
        <div className="flex flex-col gap-6 h-full overflow-hidden">
            {/* Create Scene */}
            <form onSubmit={handleCreateScene} className="flex gap-2">
                <input
                    type="text"
                    value={newSceneName}
                    onChange={(e) => setNewSceneName(e.target.value)}
                    placeholder="New Scene Name"
                    className="bg-neutral-800 border border-neutral-700 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500 flex-1"
                />
                <button
                    type="submit"
                    disabled={!newSceneName.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" /> Create
                </button>
            </form>

            {/* Scenes List */}
            <div className="flex-1 overflow-y-auto flex flex-col gap-4">
                {scenes.length === 0 && (
                    <p className="text-neutral-500 text-center py-8">No scenes created.</p>
                )}
                {scenes.map((scene) => {
                    const isActive = activeSceneId === scene.id;
                    const isPlaying = isActive && scene.isPlaying;
                    const isDragOver = dragOverSceneId === scene.id;

                    return (
                        <div
                            key={scene.id}
                            onDragOver={(e) => handleDragOver(e, scene.id)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, scene.id)}
                            className={clsx(
                                "bg-neutral-800 rounded-lg border transition-all duration-200",
                                isActive ? "border-indigo-500/50" : "border-neutral-700",
                                isDragOver && "border-indigo-500 border-2 bg-indigo-500/5 shadow-lg shadow-indigo-500/20 scale-[1.02]"
                            )}
                        >
                            {/* Scene Header */}
                            <div className="p-4 flex items-center justify-between bg-neutral-750 border-b border-neutral-700/50">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => toggleScenePlayback(scene.id)}
                                        className={clsx(
                                            "p-2 rounded-full transition-colors",
                                            isPlaying
                                                ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                                                : "bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30"
                                        )}
                                    >
                                        {isPlaying ? <Square className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                                    </button>
                                    <h3 className="font-semibold text-lg">{scene.name}</h3>
                                    <span className="text-xs text-neutral-500 font-mono bg-neutral-900 px-2 py-0.5 rounded">
                                        {scene.tracks.length} tracks
                                    </span>
                                </div>
                                <button
                                    onClick={() => deleteScene(scene.id)}
                                    className="text-neutral-500 hover:text-red-400 p-2"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Scene Tracks */}
                            <div className="p-4 flex flex-col gap-3">
                                {scene.tracks.length === 0 && (
                                    <p className={clsx(
                                        "text-sm italic text-center py-8 rounded-lg border-2 border-dashed transition-all",
                                        isDragOver
                                            ? "text-indigo-400 border-indigo-500 bg-indigo-500/10"
                                            : "text-neutral-500 border-neutral-700"
                                    )}>
                                        {isDragOver ? "Drop track here! 🎵" : "Drag tracks here from the library"}
                                    </p>
                                )}
                                {scene.tracks.map((sceneTrack) => {
                                    const track = tracks.find(t => t.id === sceneTrack.sourceTrackId);
                                    if (!track) return null;

                                    const currentPosition = trackPositions[sceneTrack.id] || 0;
                                    const duration = track.duration;
                                    const progress = duration > 0 ? (currentPosition / duration) * 100 : 0;

                                    const formatTime = (seconds: number) => {
                                        const mins = Math.floor(seconds / 60);
                                        const secs = Math.floor(seconds % 60);
                                        return `${mins}:${String(secs).padStart(2, '0')}`;
                                    };

                                    const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        const clickX = e.clientX - rect.left;
                                        const percentage = clickX / rect.width;
                                        const newPosition = percentage * duration;
                                        seekTo(sceneTrack.id, newPosition);
                                    };

                                    return (
                                        <div key={sceneTrack.id} className="flex flex-col gap-2 bg-neutral-900/50 p-3 rounded border border-neutral-800">
                                            {/* Top Row: Track Name & Controls */}
                                            <div className="flex items-center gap-3">
                                                {/* Play/Pause */}
                                                <button
                                                    onClick={() => updateSceneTrack(scene.id, sceneTrack.id, { isPlaying: !sceneTrack.isPlaying })}
                                                    className={clsx(
                                                        "p-1.5 rounded transition-colors flex-shrink-0",
                                                        sceneTrack.isPlaying ? "text-green-400 bg-green-500/10" : "text-neutral-600 hover:text-neutral-400"
                                                    )}
                                                    title={sceneTrack.isPlaying ? "Pause Track" : "Play Track"}
                                                >
                                                    {sceneTrack.isPlaying ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                                </button>

                                                {/* Track Name */}
                                                <div className="flex-1 truncate min-w-0">
                                                    <span className="text-sm font-medium text-neutral-300 truncate" title={track.name}>{track.name}</span>
                                                </div>

                                                {/* Volume */}
                                                <div className="flex items-center gap-2 w-24 flex-shrink-0">
                                                    <Volume2 className="w-4 h-4 text-neutral-500 flex-shrink-0" />
                                                    <input
                                                        type="range"
                                                        min="0"
                                                        max="1"
                                                        step="0.01"
                                                        value={sceneTrack.volume}
                                                        onChange={(e) => updateSceneTrack(scene.id, sceneTrack.id, { volume: parseFloat(e.target.value) })}
                                                        className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                                    />
                                                </div>

                                                {/* Loop */}
                                                <button
                                                    onClick={() => updateSceneTrack(scene.id, sceneTrack.id, { loop: !sceneTrack.loop })}
                                                    className={clsx(
                                                        "p-1.5 rounded transition-colors flex-shrink-0",
                                                        sceneTrack.loop ? "text-indigo-400 bg-indigo-500/10" : "text-neutral-600 hover:text-neutral-400"
                                                    )}
                                                    title="Toggle Loop"
                                                >
                                                    <Repeat className="w-4 h-4" />
                                                </button>

                                                {/* Remove */}
                                                <button
                                                    onClick={() => removeTrackFromScene(scene.id, sceneTrack.id)}
                                                    className="text-neutral-600 hover:text-red-400 p-1 flex-shrink-0"
                                                    title="Remove from Scene"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>

                                            {/* Bottom Row: Progress Bar */}
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-neutral-500 font-mono w-10 text-right flex-shrink-0">
                                                    {formatTime(currentPosition)}
                                                </span>
                                                <div
                                                    className="flex-1 h-2 bg-neutral-800 rounded-full cursor-pointer relative group overflow-hidden"
                                                    onClick={handleProgressClick}
                                                >
                                                    {/* Progress Fill */}
                                                    <div
                                                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-100"
                                                        style={{ width: `${progress}%` }}
                                                    />
                                                    {/* Hover Effect */}
                                                    <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors rounded-full" />
                                                </div>
                                                <span className="text-xs text-neutral-500 font-mono w-10 flex-shrink-0">
                                                    {formatTime(duration)}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
