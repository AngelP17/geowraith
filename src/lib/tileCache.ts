/**
 * Tile Cache - IndexedDB-based map tile storage with LRU eviction
 * 
 * Provides offline map capability by caching tiles locally.
 * Zero external cost - uses browser APIs only.
 */

const DB_NAME = 'geowraith-tile-cache';
const DB_VERSION = 1;
const STORE_NAME = 'tiles';
const META_STORE = 'metadata';

// Mobile detection for quota adjustment
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
const DEFAULT_MAX_SIZE = isMobile ? 30 * 1024 * 1024 : 100 * 1024 * 1024; // 30MB mobile, 100MB desktop

export interface TileCacheStats {
  count: number;
  bytes: number;
  maxBytes: number;
}

interface TileEntry {
  z: number;
  x: number;
  y: number;
  blob: Blob;
  timestamp: number;
  size: number;
}

interface TileMetadata {
  key: 'stats';
  totalSize: number;
  tileCount: number;
  lastAccess: number;
}

export class TileCache {
  private db: IDBDatabase | null = null;
  private maxSize: number;
  private initPromise: Promise<void> | null = null;

  constructor(maxSize = DEFAULT_MAX_SIZE) {
    this.maxSize = maxSize;
  }

  async init(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this.doInit();
    return this.initPromise;
  }

  private async doInit(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(new Error('Failed to open tile cache database'));
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Tile store with compound key [z, x, y]
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const tileStore = db.createObjectStore(STORE_NAME, { keyPath: ['z', 'x', 'y'] });
          tileStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Metadata store
        if (!db.objectStoreNames.contains(META_STORE)) {
          db.createObjectStore(META_STORE, { keyPath: 'key' });
        }
      };
    });
  }

  async get(z: number, x: number, y: number): Promise<Blob | null> {
    await this.init();
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get([z, x, y]);

      request.onsuccess = () => {
        const entry: TileEntry | undefined = request.result;
        if (entry) {
          // Update last access time in background
          this.touchTile(z, x, y);
          resolve(entry.blob);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => reject(new Error(`Failed to get tile ${z}/${x}/${y}`));
    });
  }

  async set(z: number, x: number, y: number, blob: Blob): Promise<void> {
    await this.init();
    if (!this.db) return;

    const entry: TileEntry = {
      z,
      x,
      y,
      blob,
      timestamp: Date.now(),
      size: blob.size,
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME, META_STORE], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(entry);

      request.onsuccess = () => {
        // Check if we need to prune
        this.maybePrune();
        resolve();
      };

      request.onerror = () => reject(new Error(`Failed to store tile ${z}/${x}/${y}`));
    });
  }

  async has(z: number, x: number, y: number): Promise<boolean> {
    const tile = await this.get(z, x, y);
    return tile !== null;
  }

  async clear(): Promise<void> {
    await this.init();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME, META_STORE], 'readwrite');
      
      const tileStore = transaction.objectStore(STORE_NAME);
      const metaStore = transaction.objectStore(META_STORE);

      tileStore.clear();
      metaStore.clear();

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(new Error('Failed to clear cache'));
    });
  }

  async getStats(): Promise<TileCacheStats> {
    await this.init();
    if (!this.db) return { count: 0, bytes: 0, maxBytes: this.maxSize };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const entries: TileEntry[] = request.result;
        const bytes = entries.reduce((sum, e) => sum + (e.size || 0), 0);
        resolve({
          count: entries.length,
          bytes,
          maxBytes: this.maxSize,
        });
      };

      request.onerror = () => reject(new Error('Failed to get cache stats'));
    });
  }

  private async touchTile(z: number, x: number, y: number): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get([z, x, y]);

    request.onsuccess = () => {
      const entry: TileEntry | undefined = request.result;
      if (entry) {
        entry.timestamp = Date.now();
        store.put(entry);
      }
    };
  }

  private async maybePrune(): Promise<void> {
    const stats = await this.getStats();
    if (stats.bytes < this.maxSize * 0.9) return; // Only prune if >90% full

    // Prune to 70% of max size
    const targetSize = this.maxSize * 0.7;
    await this.pruneTo(targetSize);
  }

  private async pruneTo(targetBytes: number): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('timestamp');
      const request = index.openCursor();

      let currentBytes = 0;
      const toDelete: Array<[number, number, number]> = [];

      request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor) {
          // Delete oldest tiles
          toDelete.forEach(([z, x, y]) => store.delete([z, x, y]));
          resolve();
          return;
        }

        const entry: TileEntry = cursor.value;
        currentBytes += entry.size;

        if (currentBytes > targetBytes) {
          toDelete.push([entry.z, entry.x, entry.y]);
        }

        cursor.continue();
      };

      request.onerror = () => reject(new Error('Failed to prune cache'));
    });
  }
}

// Singleton instance
let globalCache: TileCache | null = null;

export function getTileCache(): TileCache {
  if (!globalCache) {
    globalCache = new TileCache();
  }
  return globalCache;
}

export async function isStoragePersistent(): Promise<boolean> {
  if ('storage' in navigator && 'persist' in navigator.storage) {
    return navigator.storage.persisted();
  }
  return false;
}

export async function requestPersistentStorage(): Promise<boolean> {
  if ('storage' in navigator && 'persist' in navigator.storage) {
    return navigator.storage.persist();
  }
  return false;
}
