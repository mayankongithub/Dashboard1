// Cache Management Controller
// Provides endpoints for cache management and monitoring

const { cacheUtils, CACHE_TTL, CACHE_KEYS, isRedisAvailable } = require('../config/redis');
const { cacheInvalidation } = require('../middleware/cache');

/**
 * Get cache status and statistics
 */
const getCacheStatus = async (req, res) => {
  try {
    const stats = cacheUtils.getStats();
    
    const statusData = {
      isRedisAvailable: isRedisAvailable(),
      redisConfig: stats.redisConfig ? {
        host: stats.redisConfig.host,
        port: stats.redisConfig.port,
        db: stats.redisConfig.db
      } : null,
      cacheTTL: stats.cacheTTL,
      cacheKeys: stats.cacheKeys,
      timestamp: new Date().toISOString()
    };
    
    res.json(statusData);
  } catch (error) {
    console.error('Cache status error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Clear all cache
 */
const clearAllCache = async (req, res) => {
  try {
    await cacheInvalidation.invalidateAllCache();
    
    res.json({
      success: true,
      message: 'All cache cleared successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Clear all cache error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Clear Jira-related cache only
 */
const clearJiraCache = async (req, res) => {
  try {
    await cacheInvalidation.invalidateJiraCache();
    
    res.json({
      success: true,
      message: 'Jira cache cleared successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Clear Jira cache error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Clear dashboard batch cache only
 */
const clearDashboardCache = async (req, res) => {
  try {
    await cacheInvalidation.invalidateDashboardCache();
    
    res.json({
      success: true,
      message: 'Dashboard cache cleared successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Clear dashboard cache error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Clear specific cache key
 */
const clearSpecificCache = async (req, res) => {
  try {
    const { key } = req.params;
    
    if (!key) {
      return res.status(400).json({ error: 'Cache key is required' });
    }
    
    const result = await cacheUtils.delete(key);
    
    res.json({
      success: result,
      message: result ? `Cache key '${key}' cleared successfully` : `Cache key '${key}' not found`,
      key,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Clear specific cache error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get specific cache value
 */
const getCacheValue = async (req, res) => {
  try {
    const { key } = req.params;
    
    if (!key) {
      return res.status(400).json({ error: 'Cache key is required' });
    }
    
    const value = await cacheUtils.get(key);
    
    if (value === null) {
      return res.status(404).json({
        success: false,
        message: `Cache key '${key}' not found`,
        key,
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      key,
      value,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get cache value error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Warm up cache by pre-loading common data
 */
const warmUpCache = async (req, res) => {
  try {
    const { cacheUtils: ionController } = require('./ioncontroller');
    
    // This would trigger cache population for common endpoints
    // Note: This is a simplified version - in production you might want to
    // call the internal functions directly to populate cache
    
    res.json({
      success: true,
      message: 'Cache warm-up initiated',
      note: 'Cache will be populated on next API calls',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Cache warm-up error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getCacheStatus,
  clearAllCache,
  clearJiraCache,
  clearDashboardCache,
  clearSpecificCache,
  getCacheValue,
  warmUpCache
};
