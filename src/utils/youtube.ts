/**
 * YouTube utility functions for parsing URLs and fetching metadata
 */

/**
 * Extract YouTube video ID from various URL formats
 */
export function extractYouTubeId(url: string): string | null {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
        /youtube\.com\/embed\/([^&\n?#]+)/,
        /youtube\.com\/v\/([^&\n?#]+)/,
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }
    return null;
}

/**
 * Fetch YouTube video metadata using oEmbed API (no API key required)
 */
export async function fetchYouTubeMetadata(videoId: string): Promise<{
    title: string;
    thumbnail: string;
    duration?: number; // oEmbed doesn't provide duration
}> {
    try {
        const response = await fetch(
            `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
        );

        if (!response.ok) {
            throw new Error('Failed to fetch video metadata');
        }

        const data = await response.json();

        return {
            title: data.title,
            thumbnail: data.thumbnail_url,
        };
    } catch (error) {
        console.error('Error fetching YouTube metadata:', error);
        throw error;
    }
}

/**
 * Get YouTube thumbnail URL directly
 */
export function getYouTubeThumbnail(videoId: string, quality: 'default' | 'hq' | 'maxres' = 'hq'): string {
    const qualityMap = {
        'default': 'default',
        'hq': 'hqdefault',
        'maxres': 'maxresdefault',
    };

    return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`;
}

/**
 * Validate if a YouTube video ID is valid format
 */
export function isValidYouTubeId(videoId: string): boolean {
    return /^[a-zA-Z0-9_-]{11}$/.test(videoId);
}
