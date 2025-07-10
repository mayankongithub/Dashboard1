// Cache Middleware
// Provides caching functionality for API endpoints to improve response times

const { cacheUtils, CACHE_TTL, CACHE_KEYS } = require('../config/redis');

/**
 * Cache middleware factory
 * Creates middleware that caches API responses based on configuration
 * @param {Object} options - Cache configuration options
 * @param {string} options.keyPrefix - Cache key prefix (from CACHE_KEYS)
 * @param {number} options.ttl - Time to live in milliseconds
 * @param {Function} options.keyGenerator - Function to generate cache key from request
 * @param {Function} options.shouldCache - Function to determine if response should be cached
 * @returns {Function} - Express middleware function
 */
const createCacheMiddleware = (options = {}) => {
  const {
    keyPrefix = 'api',
    ttl = CACHE_TTL.MEDIUM,
    keyGenerator = (req) => `${keyPrefix}:${req.originalUrl}`,
    shouldCache = (req, res, data) => res.statusCode === 200 && data
  } = options;

  return async (req, res, next) => {
    // Generate cache key
    const cacheKey = keyGenerator(req);
    
    try {
      // Try to get data from cache
      const cachedData = await cacheUtils.get(cacheKey);
      
      if (cachedData) {
        // Return cached data
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('X-Cache-Key', cacheKey);
        return res.json(cachedData);
      }
      
      // Cache miss - continue to actual handler
      res.setHeader('X-Cache', 'MISS');
      res.setHeader('X-Cache-Key', cacheKey);
      
      // Override res.json to cache the response
      const originalJson = res.json;
      res.json = function(data) {
        // Cache the response if conditions are met
        if (shouldCache(req, res, data)) {
          cacheUtils.set(cacheKey, data, ttl).catch(error => {
            console.error('Failed to cache response:', error.message);
          });
        }
        
        // Call original json method
        return originalJson.call(this, data);
      };
      
      next();
      
    } catch (error) {
      console.error('Cache middleware error:', error.message);
      // Continue without caching on error
      res.setHeader('X-Cache', 'ERROR');
      next();
    }
  };
};

/**
 * Predefined cache middleware for different data types
 */
const cacheMiddleware = {
  
  /**
   * Cache middleware for Jira test case data (medium TTL)
   */
  jiraTestCases: createCacheMiddleware({
    keyPrefix: CACHE_KEYS.JIRA_TEST_CASES,
    ttl: CACHE_TTL.MEDIUM,
    keyGenerator: (req) => `${CACHE_KEYS.JIRA_TEST_CASES}:${req.path}`
  }),
  
  /**
   * Cache middleware for Jira bug statistics (short TTL - frequently updated)
   */
  jiraBugStats: createCacheMiddleware({
    keyPrefix: CACHE_KEYS.JIRA_BUG_STATS,
    ttl: CACHE_TTL.SHORT,
    keyGenerator: (req) => `${CACHE_KEYS.JIRA_BUG_STATS}:${req.path}`
  }),
  
  /**
   * Cache middleware for Jira bug areas (long TTL - relatively stable)
   */
  jiraBugAreas: createCacheMiddleware({
    keyPrefix: CACHE_KEYS.JIRA_BUG_AREAS,
    ttl: CACHE_TTL.LONG,
    keyGenerator: (req) => `${CACHE_KEYS.JIRA_BUG_AREAS}:${req.path}`
  }),
  
  /**
   * Cache middleware for monthly data (extended TTL - historical data)
   */
  jiraMonthlyData: createCacheMiddleware({
    keyPrefix: CACHE_KEYS.JIRA_MONTHLY_DATA,
    ttl: CACHE_TTL.EXTENDED,
    keyGenerator: (req) => `${CACHE_KEYS.JIRA_MONTHLY_DATA}:${req.path}`
  }),
  
  /**
   * Cache middleware for cumulative data (extended TTL - historical data)
   */
  jiraCumulativeData: createCacheMiddleware({
    keyPrefix: CACHE_KEYS.JIRA_CUMULATIVE_DATA,
    ttl: CACHE_TTL.EXTENDED,
    keyGenerator: (req) => `${CACHE_KEYS.JIRA_CUMULATIVE_DATA}:${req.path}`
  }),
  
  /**
   * Cache middleware for triaging data (medium TTL)
   */
  jiraTriagingData: createCacheMiddleware({
    keyPrefix: CACHE_KEYS.JIRA_TRIAGING_DATA,
    ttl: CACHE_TTL.MEDIUM,
    keyGenerator: (req) => `${CACHE_KEYS.JIRA_TRIAGING_DATA}:${req.path}`
  }),
  
  /**
   * Cache middleware for dashboard batch data (short TTL - real-time dashboard)
   */
  dashboardBatch: createCacheMiddleware({
    keyPrefix: CACHE_KEYS.DASHBOARD_BATCH,
    ttl: CACHE_TTL.SHORT,
    keyGenerator: (req) => `${CACHE_KEYS.DASHBOARD_BATCH}:batch`
  })
};

/**
 * Cache invalidation utilities
 */
const cacheInvalidation = {
  
  /**
   * Invalidate all Jira-related cache
   */
  async invalidateJiraCache() {
    const patterns = [
      CACHE_KEYS.JIRA_TEST_CASES,
      CACHE_KEYS.JIRA_BUG_STATS,
      CACHE_KEYS.JIRA_BUG_AREAS,
      CACHE_KEYS.JIRA_MONTHLY_DATA,
      CACHE_KEYS.JIRA_CUMULATIVE_DATA,
      CACHE_KEYS.JIRA_TRIAGING_DATA
    ];
    
    for (const pattern of patterns) {
      try {
        await cacheUtils.delete(pattern);
        console.log(`🗑️  Invalidated cache pattern: ${pattern}`);
      } catch (error) {
        console.error(`Failed to invalidate cache pattern ${pattern}:`, error.message);
      }
    }
  },
  
  /**
   * Invalidate dashboard batch cache
   */
  async invalidateDashboardCache() {
    try {
      await cacheUtils.delete(CACHE_KEYS.DASHBOARD_BATCH);
      console.log('🗑️  Invalidated dashboard batch cache');
    } catch (error) {
      console.error('Failed to invalidate dashboard cache:', error.message);
    }
  },
  
  /**
   * Invalidate all cache
   */
  async invalidateAllCache() {
    try {
      await cacheUtils.clear();
      console.log('🧹 Invalidated all cache');
    } catch (error) {
      console.error('Failed to invalidate all cache:', error.message);
    }
  }
};

module.exports = {
  createCacheMiddleware,
  cacheMiddleware,
  cacheInvalidation
};
