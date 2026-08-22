/**
 * Simple in-memory TTL cache with support for pattern or tag based invalidation.
 */
export class Cache {
  /**
   * @param {number} [ttlMs=60000] Default TTL in milliseconds (60s)
   */
  constructor(ttlMs = 60000) {
    this.ttlMs = ttlMs;
    this.store = new Map();
  }

  /**
   * Sets a cache key with value and optional custom TTL.
   * @param {string} key
   * @param {any} value
   * @param {number} [customTtl]
   */
  set(key, value, customTtl) {
    const expiresAt = Date.now() + (customTtl ?? this.ttlMs);
    this.store.set(key, { value, expiresAt });
  }

  /**
   * Gets a cached value if present and not expired.
   * @param {string} key
   * @returns {any|null}
   */
  get(key) {
    const item = this.store.get(key);
    if (!item) {return null;}
    if (Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  /**
   * Invalidates a key or keys matching a prefix.
   * @param {string} [prefix]
   */
  invalidate(prefix) {
    if (!prefix) {
      this.store.clear();
      return;
    }
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }
}
