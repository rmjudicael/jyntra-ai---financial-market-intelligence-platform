export const YOUTUBE_DEMO_URL: string = 'https://www.youtube.com/watch?v=GU5ax5bb0Y4&t=6s';

/** Libellé affiché sous le lecteur (chaîne vide = aucune mention tierce). */
export const YOUTUBE_DEMO_ATTRIBUTION: string = '';

export interface ParsedYouTubeVideo {
  videoId: string;
  embedUrl: string;
  watchUrl: string;
}

const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

export function parseYouTubeUrl(rawUrl: string): ParsedYouTubeVideo | null {
  const url = (rawUrl || '').trim();
  if (!url) return null;

  let videoId: string | null = null;

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '').toLowerCase();

    if (host === 'youtu.be') {
      videoId = parsed.pathname.split('/').filter(Boolean)[0] || null;
    } else if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
      if (parsed.pathname === '/watch') {
        videoId = parsed.searchParams.get('v');
      } else {
        const segments = parsed.pathname.split('/').filter(Boolean);
        if (['embed', 'shorts', 'v', 'live'].includes(segments[0])) {
          videoId = segments[1] || null;
        }
      }
    }
  } catch {
    return null;
  }

  if (!videoId || !VIDEO_ID_PATTERN.test(videoId)) return null;

  return {
    videoId,
    embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1`,
    watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
  };
}
