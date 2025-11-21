import React from 'react';
import { Music, ListMusic, Settings } from 'lucide-react';

interface LayoutProps {
    children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
    return (
        <div className="min-h-screen bg-neutral-900 text-white flex flex-col">
            <header className="bg-neutral-800 border-b border-neutral-700 p-4 flex items-center justify-between shadow-md">
                <div className="flex items-center gap-2">
                    <Music className="w-6 h-6 text-indigo-500" />
                    <h1 className="text-xl font-bold tracking-tight">RPG Soundboard</h1>
                </div>
                <nav className="flex gap-4 text-sm text-neutral-400">
                    {/* Placeholder for future nav items */}
                    <span className="hover:text-white cursor-pointer flex items-center gap-1">
                        <ListMusic className="w-4 h-4" /> Library
                    </span>
                    <span className="hover:text-white cursor-pointer flex items-center gap-1">
                        <Settings className="w-4 h-4" /> Settings
                    </span>
                </nav>
            </header>
            <main className="flex-1 p-4 overflow-hidden flex flex-col max-w-full">
                {children}
            </main>
        </div>
    );
};
