/**
 * Client-safe image proxy URL generator
 */
export function getProxiedImageUrl(url?: string, referer?: string): string {
  if (!url) return '/icons/faviconlogo.png';
  if (url.startsWith('/api/v1/image-proxy') || url.startsWith('data:')) return url;
  if (!url.startsWith('http://') && !url.startsWith('https://')) return url;
  return `/api/v1/image-proxy?url=${encodeURIComponent(url)}${
    referer ? `&referer=${encodeURIComponent(referer)}` : ''
  }`;
}
