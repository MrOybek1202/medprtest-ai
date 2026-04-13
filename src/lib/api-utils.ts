/**
 * Cleans the base API URL by removing trailing slashes and common accidental suffixes
 * like /api/health or /api.
 */
export function cleanApiUrl(url: string): string {
  if (!url) return '';
  
  return url
    .trim()
    .replace(/\/+$/, '') // Remove all trailing slashes
    .replace(/\/api\/health\/?$/, '') // Remove /api/health with optional trailing slash
    .replace(/\/api\/?$/, '') // Remove /api with optional trailing slash
    .replace(/\/+$/, ''); // Final cleanup of any slashes left after suffix removal
}
