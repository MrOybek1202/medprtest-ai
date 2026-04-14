/**
 * Cleans the base API URL by removing trailing slashes and common accidental suffixes
 * like /api/health or /api.
 */
export function cleanApiUrl(url: string): string {
  if (!url) return '';

  return url
    .trim()
    .replace(/\/+$/, '')
    .replace(/\/api\/health\/?$/, '')
    .replace(/\/api\/?$/, '')
    .replace(/\/+$/, '');
}
