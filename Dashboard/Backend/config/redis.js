// Redis Cache Configuration
// Provides caching functionality for Jira API responses to improve performance

// Use dynamic import for Keyv since it's an ES module
let Keyv;

// Redis configuration
const REDIS_CONFIG = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: process.env.REDIS_DB || 0,
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
  lazyConnect: true
};

// Cache TTL settings (in milliseconds) - All set to 2 minutes for faster refresh
const CACHE_TTL = {
  // Short-term cache for frequently changing data
  SHORT: 2 * 60 * 1000,        // 2 minutes

  // Medium-term cache for moderately changing data
  MEDIUM: 2 * 60 * 1000,       // 2 minutes

  // Long-term cache for relatively stable data
  LONG: 2 * 60 * 1000,         // 2 minutes

  // Extended cache for very stable data
  EXTENDED: 2 * 60 * 1000      // 2 minutes
};

// Cache key prefixes for different data types
const CACHE_KEYS = {
  JIRA_TEST_CASES: 'jira:test_cases',
  JIRA_BUG_STATS: 'jira:bug_stats',
  JIRA_BUG_AREAS: 'jira:bug_areas',
  JIRA_MONTHLY_DATA: 'jira:monthly_data',
  JIRA_CUMULATIVE_DATA: 'jira:cumulative_data',
  JIRA_TRIAGING_DATA: 'jira:triaging_data',
  DASHBOARD_BATCH: 'dashboard:batch'
};

// Initialize Redis cache instances with different TTL settings
let redisCache = null;
let isRedisAvailable = false;

// Initialize Redis connection
const initializeRedis = async () => {
  try {
    // Import Keyv dynamically since it's an ES module
    if (!Keyv) {
      const keyvModule = await import('keyv');
      Keyv = keyvModule.default;
    }

    // Try to connect to Redis using connection string
    const redisUrl = `redis://${REDIS_CONFIG.host}:${REDIS_CONFIG.port}/${REDIS_CONFIG.db}`;
    console.log('Attempting to connect to Redis at:', redisUrl);
    redisCache = new Keyv(redisUrl);
    
    // Test the connection
    await redisCache.set('test:connection', 'ok', 1000);
    const testValue = await redisCache.get('test:connection');
    
    if (testValue === 'ok') {
      isRedisAvailable = true;
      console.log('✅ Redis cache initialized successfully');
      
      // Clean up test key
      await redisCache.delete('test:connection');
    } else {
      throw new Error('Redis connection test failed');
    }
    
    // Handle Redis errors
    redisCache.on('error', (error) => {
      console.error('❌ Redis cache error:', error.message);
      isRedisAvailable = false;
    });
    
  } catch (error) {
    console.warn('⚠️  Redis not available, falling back to in-memory cache:', error.message);
    isRedisAvailable = false;
    
    // Fallback to in-memory cache
    if (!Keyv) {
      const keyvModule = await import('keyv');
      Keyv = keyvModule.default;
    }
    redisCache = new Keyv();
  }
};

// Cache utility functions
const cacheUtils = {
  /**
   * Get data from cache
   * @param {string} key - Cache key
   * @returns {Promise<any>} - Cached data or null
   */
  async get(key) {
    try {
      if (!redisCache) return null;
      const data = await redisCache.get(key);
      if (data) {
        console.log(`🎯 Cache HIT for key: ${key}`);
        return data;
      } else {
        console.log(`❌ Cache MISS for key: ${key}`);
        return null;
      }
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error.message);
      return null;
    }
  },

  /**
   * Set data in cache
   * @param {string} key - Cache key
   * @param {any} data - Data to cache
   * @param {number} ttl - Time to live in milliseconds
   * @returns {Promise<boolean>} - Success status
   */
  async set(key, data, ttl = CACHE_TTL.MEDIUM) {
    try {
      if (!redisCache) return false;
      await redisCache.set(key, data, ttl);
      console.log(`💾 Cache SET for key: ${key} (TTL: ${ttl/1000}s)`);
      return true;
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error.message);
      return false;
    }
  },

  /**
   * Delete data from cache
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} - Success status
   */
  async delete(key) {
    try {
      if (!redisCache) return false;
      const result = await redisCache.delete(key);
      console.log(`🗑️  Cache DELETE for key: ${key}`);
      return result;
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error.message);
      return false;
    }
  },

  /**
   * Clear all cache data
   * @returns {Promise<boolean>} - Success status
   */
  async clear() {
    try {
      if (!redisCache) return false;
      await redisCache.clear();
      console.log('🧹 Cache CLEARED all data');
      return true;
    } catch (error) {
      console.error('Cache clear error:', error.message);
      return false;
    }
  },

  /**
   * Get cache statistics
   * @returns {Object} - Cache statistics
   */
  getStats() {
    return {
      isRedisAvailable,
      redisConfig: isRedisAvailable ? REDIS_CONFIG : null,
      cacheTTL: CACHE_TTL,
      cacheKeys: CACHE_KEYS
    };
  },

  /**
   * Generate cache key for Jira data
   * @param {string} type - Data type (from CACHE_KEYS)
   * @param {string} identifier - Additional identifier
   * @returns {string} - Generated cache key
   */
  generateKey(type, identifier = '') {
    const baseKey = CACHE_KEYS[type] || type;
    return identifier ? `${baseKey}:${identifier}` : baseKey;
  },

  /**
   * Invalidate cache keys matching a pattern
   * @param {string} pattern - Pattern to match (supports wildcards)
   * @returns {Promise<number>} - Number of keys invalidated
   */
  async invalidatePattern(pattern) {
    try {
      if (!redisCache) return 0;

      // For Keyv, we need to manually track and match keys
      // This is a simplified implementation - in production you might want to use Redis SCAN
      const keysToDelete = [];

      // Get all cache keys from our analytics or maintain a key registry
      // For now, we'll use the known cache key patterns
      const allPatterns = Object.values(CACHE_KEYS);

      for (const keyPattern of allPatterns) {
        if (keyPattern.includes(pattern) || pattern.includes(keyPattern)) {
          // Try to delete variations of this key
          const variations = [
            keyPattern,
            `${keyPattern}:all`,
            `${keyPattern}:test_cases`,
            `${keyPattern}:2025_monthly`,
            `${keyPattern}:v12.8`,
            `${keyPattern}:batch`
          ];

          for (const variation of variations) {
            try {
              await redisCache.delete(variation);
              keysToDelete.push(variation);
            } catch (error) {
              // Key might not exist, continue
            }
          }
        }
      }

      console.log(`🗑️ Invalidated ${keysToDelete.length} cache keys matching pattern: ${pattern}`);
      return keysToDelete.length;

    } catch (error) {
      console.error(`Cache pattern invalidation error for ${pattern}:`, error.message);
      return 0;
    }
  },

  /**
   * Get all cache keys (for analytics and management)
   * @returns {Promise<Array>} - Array of cache keys
   */
  async getAllKeys() {
    try {
      if (!redisCache) return [];

      // This is a limitation of Keyv - it doesn't provide a way to list all keys
      // In a production environment, you'd want to use Redis directly for this
      // For now, return the known key patterns
      return Object.values(CACHE_KEYS);

    } catch (error) {
      console.error('Get all cache keys error:', error.message);
      return [];
    }
  },

  /**
   * Get cache size and memory usage
   * @returns {Promise<Object>} - Cache statistics
   */
  async getCacheSize() {
    try {
      if (!redisCache) return { size: 0, memory: 0 };

      // This would need Redis-specific implementation for accurate memory usage
      const keys = await this.getAllKeys();

      return {
        estimatedKeys: keys.length,
        isRedisAvailable,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Get cache size error:', error.message);
      return { size: 0, memory: 0, error: error.message };
    }
  }
};

module.exports = {
  initializeRedis,
  cacheUtils,
  CACHE_TTL,
  CACHE_KEYS,
  isRedisAvailable: () => isRedisAvailable
};
