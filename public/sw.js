const CACHE_NAME = 'image-cache-v1';
const IMAGE_CACHE_NAME = 'images-v1';

// Image file extensions to cache
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.ico'];

// Cache duration in milliseconds (24 hours)
const CACHE_DURATION = 24 * 60 * 60 * 1000;

self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete old caches
          if (cacheName !== CACHE_NAME && cacheName !== IMAGE_CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Activated');
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Only handle image requests
  if (isImageRequest(event.request)) {
    event.respondWith(handleImageRequest(event.request));
  }
});

function isImageRequest(request) {
  const url = new URL(request.url);
  const pathname = url.pathname.toLowerCase();
  
  // Check if it's an image by extension
  const isImageExtension = IMAGE_EXTENSIONS.some(ext => pathname.endsWith(ext));
  
  // Check if it's an image by content-type (for dynamic URLs)
  const acceptHeader = request.headers.get('accept') || '';
  const isImageAccept = acceptHeader.includes('image/');
  
  // Check for common CDN patterns
  const isImageCDN = url.hostname.includes('cdn.') || 
                     url.hostname.includes('images.') ||
                     pathname.includes('/image/') ||
                     pathname.includes('/assets/');
  
  return isImageExtension || (isImageAccept && isImageCDN);
}

async function handleImageRequest(request) {
  const cache = await caches.open(IMAGE_CACHE_NAME);
  const cacheKey = request.url;
  
  try {
    // Check if we have a cached version
    const cachedResponse = await cache.match(cacheKey);
    
    if (cachedResponse) {
      // Check if cache is still valid
      const cachedTime = cachedResponse.headers.get('sw-cached-time');
      if (cachedTime) {
        const cacheAge = Date.now() - parseInt(cachedTime);
        if (cacheAge < CACHE_DURATION) {
          console.log('Service Worker: Serving from cache:', request.url);
          return cachedResponse;
        }
      }
    }
    
    // Fetch from network
    console.log('Service Worker: Fetching from network:', request.url);
    const networkResponse = await fetch(request, {
      cache: 'force-cache'
    });
    
    // Only cache successful image responses
    if (networkResponse.ok && networkResponse.headers.get('content-type')?.startsWith('image/')) {
      // Clone the response since it can only be consumed once
      const responseClone = networkResponse.clone();
      
      // Add timestamp header for cache validation
      const responseWithTimestamp = new Response(responseClone.body, {
        status: responseClone.status,
        statusText: responseClone.statusText,
        headers: {
          ...Object.fromEntries(responseClone.headers.entries()),
          'sw-cached-time': Date.now().toString()
        }
      });
      
      // Cache the response
      await cache.put(cacheKey, responseWithTimestamp);
      console.log('Service Worker: Cached image:', request.url);
    }
    
    return networkResponse;
    
  } catch (error) {
    console.error('Service Worker: Error handling image request:', error);
    
    // Try to serve from cache as fallback
    const cachedResponse = await cache.match(cacheKey);
    if (cachedResponse) {
      console.log('Service Worker: Serving stale cache as fallback:', request.url);
      return cachedResponse;
    }
    
    // Return a placeholder or throw the error
    throw error;
  }
}

// Listen for messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_IMAGE_CACHE') {
    clearImageCache().then(() => {
      event.ports[0].postMessage({ success: true });
    }).catch((error) => {
      event.ports[0].postMessage({ success: false, error: error.message });
    });
  }
});

async function clearImageCache() {
  const cache = await caches.open(IMAGE_CACHE_NAME);
  const keys = await cache.keys();
  await Promise.all(keys.map(key => cache.delete(key)));
  console.log('Service Worker: Image cache cleared');
}