/**
 * Normalizes a URL by ensuring it has a proper protocol prefix
 * This prevents relative URL issues where URLs without protocols
 * get prefixed with the current domain
 */
export function normalizeUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return null;
  }

  const trimmedUrl = url.trim();
  
  // If URL already has a protocol, return as-is
  if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
    return trimmedUrl;
  }
  
  // If URL starts with '//' (protocol-relative), add https:
  if (trimmedUrl.startsWith('//')) {
    return `https:${trimmedUrl}`;
  }
  
  // Otherwise, add https:// prefix to make it a proper external URL
  return `https://${trimmedUrl}`;
}
