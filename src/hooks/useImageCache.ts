import { useState, useCallback } from 'react';
import { clearImageCache } from '@/components/CachedImage';
import { clearServiceWorkerCache } from '@/utils/serviceWorker';

export const useImageCache = () => {
  const [isClearing, setIsClearing] = useState(false);

  const clearAllImageCaches = useCallback(async () => {
    setIsClearing(true);
    try {
      // Clear IndexedDB cache
      await clearImageCache();
      
      // Clear Service Worker cache
      await clearServiceWorkerCache();
      
      // Clear browser cache (force refresh)
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }
      
      console.log('All image caches cleared successfully');
      return true;
    } catch (error) {
      console.error('Failed to clear image caches:', error);
      return false;
    } finally {
      setIsClearing(false);
    }
  }, []);

  const getCacheSize = useCallback(async () => {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        return {
          used: estimate.usage || 0,
          quota: estimate.quota || 0,
          usedMB: Math.round((estimate.usage || 0) / 1024 / 1024 * 100) / 100,
          quotaMB: Math.round((estimate.quota || 0) / 1024 / 1024 * 100) / 100
        };
      }
      return null;
    } catch (error) {
      console.error('Failed to get cache size:', error);
      return null;
    }
  }, []);

  const preloadImages = useCallback(async (urls: string[]) => {
    const promises = urls.map(async (url) => {
      try {
        // This will trigger our CachedImage caching mechanism
        const response = await fetch(url, { cache: 'force-cache' });
        if (!response.ok) throw new Error(`Failed to fetch ${url}`);
        return { url, success: true };
      } catch (error) {
        console.warn(`Failed to preload image: ${url}`, error);
        return { url, success: false, error };
      }
    });

    const results = await Promise.allSettled(promises);
    const successful = results.filter(result => 
      result.status === 'fulfilled' && result.value.success
    ).length;

    console.log(`Preloaded ${successful}/${urls.length} images`);
    return results;
  }, []);

  return {
    isClearing,
    clearAllImageCaches,
    getCacheSize,
    preloadImages
  };
};