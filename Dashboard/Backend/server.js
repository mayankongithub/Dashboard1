// Simple Dashboard Backend Server
// Now using ioncontroller for all API functions with Redis caching

const express = require('express');
const cors = require('cors');
const compression = require('compression');
const ionController = require('./controllers/ioncontroller');
const cacheController = require('./controllers/cacheController');
const { initializeRedis } = require('./config/redis');
const {
  startCacheWarmingService,
  getWarmingStats,
  getWarmedData
} = require('./services/cacheWarmingService');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable compression for all responses
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// Simple CORS setup
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', '*'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Performance monitoring removed - keeping only cache warming optimization

// ===== REDIS CACHE INITIALIZATION =====
// Initialize Redis cache on server startup
initializeRedis().then(() => {
  console.log('✅ Redis initialized successfully');
  console.log('🚀 Starting immediate cache warming...');

  // Start proactive cache warming service (runs immediately + every minute)
  startCacheWarmingService();

  console.log('🎯 Cache warming is now active - data will be pre-loaded for instant responses');
}).catch(error => {
  console.error('❌ Failed to initialize Redis:', error.message);
  console.log('⚠️  Server will continue without cache warming');
});

// ===== API ENDPOINTS =====

// Batch endpoint for all dashboard data
app.get('/api/dashboard-batch', ionController.getDashboardData);

// Quick summary endpoint for instant loading
app.get('/api/dashboard-summary', async (req, res) => {
  try {
    const cacheKey = 'dashboard_summary_quick';
    const cached = await require('./config/redis').cacheUtils.get(cacheKey);

    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cached);
    }

    // Get only essential data for immediate display
    const [testCasesResponse, bugStatsResponse] = await Promise.all([
      fetch('http://localhost:5000/api/jira-data').then(r => r.json()).catch(() => ({ manual: 0, automated: 0 })),
      fetch('http://localhost:5000/api/jira-bug-stats').then(r => r.json()).catch(() => ({ totalBugs: 0 }))
    ]);

    const summary = {
      testCases: {
        manual: testCasesResponse.manual || 0,
        automated: testCasesResponse.automated || 0,
        total: (testCasesResponse.manual || 0) + (testCasesResponse.automated || 0)
      },
      bugStats: {
        totalBugs: bugStatsResponse.totalBugs || 0
      },
      timestamp: new Date().toISOString(),
      loadTime: 'instant'
    };

    // Cache for 30 seconds (very short for real-time feel)
    await require('./config/redis').cacheUtils.set(cacheKey, summary, 30000);

    res.setHeader('X-Cache', 'MISS');
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current test case data (manual vs automated)
app.get('/api/jira-data', ionController.getTestCaseData);

// Get monthly test case data (same as above for compatibility)
app.get('/api/jira-monthly-data', ionController.getMonthlyTestCaseData);

// Get all test cases
app.get('/api/jira-all-data', ionController.getAllTestCaseData);

// Get cumulative test case data (same as all data for compatibility)
app.get('/api/jira-cumulative-data', ionController.getCumulativeTestCaseData);

// Get cumulative monthly test case data for 2025
app.get('/api/jira-cumulative-monthly-data', ionController.getCumulativeMonthlyTestCaseData);

// Get bug statistics for current month
app.get('/api/jira-bug-stats', ionController.getBugStats);

// Get monthly triaging count data
app.get('/api/jira-monthly-triaging', ionController.getMonthlyTriagingData);

// Get bug areas data for version 12.8
app.get('/api/jira-bug-areas', ionController.getBugAreasData);

// ===== CACHE MANAGEMENT ENDPOINTS =====

// Get cache status and statistics
app.get('/api/cache/status', cacheController.getCacheStatus);

// Clear all cache
app.delete('/api/cache/clear', cacheController.clearAllCache);

// Clear Jira cache only
app.delete('/api/cache/clear/jira', cacheController.clearJiraCache);

// Clear dashboard cache only
app.delete('/api/cache/clear/dashboard', cacheController.clearDashboardCache);

// Clear specific cache key
app.delete('/api/cache/clear/:key', cacheController.clearSpecificCache);

// Get specific cache value
app.get('/api/cache/get/:key', cacheController.getCacheValue);

// Warm up cache
app.post('/api/cache/warmup', cacheController.warmUpCache);

// Smart cache endpoints removed - using cache warming service instead

// ===== PROACTIVE CACHE WARMING ENDPOINTS =====

// Get cache warming statistics
app.get('/api/cache/warming/stats', (req, res) => {
  try {
    const stats = getWarmingStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get warmed data for a specific endpoint
app.get('/api/cache/warming/data/:endpoint', async (req, res) => {
  try {
    const { endpoint } = req.params;
    const result = await getWarmedData(endpoint);

    if (result.data) {
      res.setHeader('X-Cache', 'WARMED');
      res.setHeader('X-Warmed-Endpoint', endpoint);
      res.json(result.data);
    } else {
      res.status(404).json({
        error: 'No warmed data available for this endpoint',
        endpoint,
        suggestion: 'Try the regular API endpoint or wait for next warming cycle'
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Instant dashboard data from warmed cache
app.get('/api/dashboard-instant', async (req, res) => {
  try {
    // Try to get warmed dashboard data first
    const warmedDashboard = await getWarmedData('dashboard-batch');

    if (warmedDashboard.data) {
      res.setHeader('X-Cache', 'WARMED');
      res.setHeader('X-Response-Time', '0ms');
      return res.json(warmedDashboard.data);
    }

    // Fallback to regular cache
    const cacheKey = require('./config/redis').cacheUtils.generateKey('DASHBOARD_BATCH', 'all');
    const cachedData = await require('./config/redis').cacheUtils.get(cacheKey);

    if (cachedData) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cachedData);
    }

    // If no cached data available, return minimal response
    res.status(202).json({
      message: 'Data is being prepared, please try again in a moment',
      status: 'warming',
      retryAfter: 30
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Request deduplication endpoints removed - using cache warming instead

// Performance monitoring endpoints removed - keeping only cache warming

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📊 Dashboard available at: http://localhost:${PORT}`);
  console.log(`🔥 Cache warming: ACTIVE - Data pre-loaded every minute`);
  console.log(`⚡ Users will get instant responses from cached data`);
  console.log(`📈 Monitor cache warming at: http://localhost:${PORT}/api/cache/warming/stats`);
});
