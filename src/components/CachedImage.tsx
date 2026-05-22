import React, { useState, useEffect, useRef } from 'react';

interface CachedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallback?: string;
  cacheTimeout?: number; // in milliseconds, default 24 hours
}

interface CacheEntry {
  url: string;
  timestamp: number;
  blob: Blob;
}

class ImageCache {
  private cache = new Map<string, CacheEntry>();
  private readonly DB_NAME = 'ImageCache';
  private readonly DB_VERSION = 1;
  private readonly STORE_NAME = 'images';
  private db: IDBDatabase | null = null;

  constructor() {
    this.initDB();
  }

  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          db.createObjectStore(this.STORE_NAME, { keyPath: 'url' });
        }
      };
    });
  }

  async get(url: string, cacheTimeout: number): Promise<string | null> {
    // Check memory cache first
    const memoryEntry = this.cache.get(url);
    if (memoryEntry && Date.now() - memoryEntry.timestamp < cacheTimeout) {
      return URL.createObjectURL(memoryEntry.blob);
    }

    // Check IndexedDB
    if (!this.db) await this.initDB();
    
    return new Promise((resolve) => {
      if (!this.db) {
        resolve(null);
        return;
      }

      const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.get(url);

      request.onsuccess = () => {
        const result = request.result;
        if (result && Date.now() - result.timestamp < cacheTimeout) {
          // Convert back to blob and create object URL
          const blob = new Blob([result.data], { type: result.type });
          this.cache.set(url, { url, timestamp: result.timestamp, blob });
          resolve(URL.createObjectURL(blob));
        } else {
          resolve(null);
        }
      };

      request.onerror = () => resolve(null);
    });
  }

  async set(url: string, blob: Blob): Promise<void> {
    const timestamp = Date.now();
    
    // Store in memory cache
    this.cache.set(url, { url, timestamp, blob });

    // Store in IndexedDB
    if (!this.db) await this.initDB();
    
    return new Promise((resolve) => {
      if (!this.db) {
        resolve();
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
        const store = transaction.objectStore(this.STORE_NAME);
        
        store.put({
          url,
          timestamp,
          data: reader.result,
          type: blob.type
        });
        
        resolve();
      };
      reader.readAsArrayBuffer(blob);
    });
  }

  async clear(): Promise<void> {
    this.cache.clear();
    
    if (!this.db) await this.initDB();
    
    return new Promise((resolve) => {
      if (!this.db) {
        resolve();
        return;
      }

      const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      store.clear();
      resolve();
    });
  }
}

const imageCache = new ImageCache();

export const CachedImage: React.FC<CachedImageProps> = ({
  src,
  alt,
  fallback = '/placeholder-image.svg',
  cacheTimeout = 24 * 60 * 60 * 1000, // 24 hours
  className,
  onLoad,
  onError,
  ...props
}) => {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!src) {
      setImageSrc(fallback);
      setIsLoading(false);
      return;
    }

    loadImage();

    return () => {
      // Cancel ongoing requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      // Clean up object URLs
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, [src, cacheTimeout, fallback]);

  const loadImage = async () => {
    setIsLoading(true);
    setHasError(false);

    if (!src || src.trim() === '') {
      console.warn('CachedImage: Empty or invalid src provided');
      setImageSrc(fallback);
      setIsLoading(false);
      return;
    }

    try {
      // Check cache first
      const cachedUrl = await imageCache.get(src, cacheTimeout);
      if (cachedUrl) {
        objectUrlRef.current = cachedUrl;
        setImageSrc(cachedUrl);
        setIsLoading(false);
        return;
      }

      // Cancel previous request if any
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Fetch image
      abortControllerRef.current = new AbortController();
      const response = await fetch(src, {
        signal: abortControllerRef.current.signal,
        cache: 'force-cache'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }

      const blob = await response.blob();
      
      // Cache the image
      await imageCache.set(src, blob);
      
      // Create object URL and set image
      const objectUrl = URL.createObjectURL(blob);
      objectUrlRef.current = objectUrl;
      setImageSrc(objectUrl);
      setIsLoading(false);

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return; // Request was cancelled, ignore
      }
      
      console.warn('Failed to load image:', src, error);
      setHasError(true);
      setImageSrc(fallback);
      setIsLoading(false);
    }
  };

  const handleLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    setIsLoading(false);
    if (onLoad) onLoad(event);
  };

  const handleError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    setHasError(true);
    setImageSrc(fallback);
    if (onError) onError(event);
  };

  return (
    <div className="relative">
      {isLoading && (
        <div className={`absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse ${className}`} />
      )}
      <img
        {...props}
        src={imageSrc}
        alt={alt}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
};

// Export cache management functions
export const clearImageCache = () => imageCache.clear();

export default CachedImage;