/**
 * Proactive Cache Warming Service
 * Runs continuously on the deployed server to pre-fetch and cache all dashboard data
 * Users get instant responses from cached data
 */

const cron = require('node-cron');
const { cacheUtils, CACHE_TTL } = require('../config/redis');
const ionController = require('../controllers/ioncontroller');

// Cache warming configuration
const WARMING_CONFIG = {
  // How often to warm the cache (every minute)
  schedule: '*/1 * * * *', // Cron format: every 1 minute
  
  // Endpoints to warm with their priorities and cache times
  endpoints: [
    {
      name: 'dashboard-batch',
      url: '/api/dashboard-batch',
      priority: 'critical',
      cacheKey: 'dashboard_batch_warmed',
      cacheTTL: 2 * 60 * 1000, // 2 minutes
      fetcher: 'getDashboardData'
    },
    {
      name: 'test-cases',
      url: '/api/jira-data',
      priority: 'critical',
      cacheKey: 'jira_test_cases_warmed',
      cacheTTL: 2 * 60 * 1000,
      fetcher: 'getTestCaseData'
    },
    {
      name: 'monthly-cumulative-data',
      url: '/api/jira-cumulative-monthly-data',
      priority: 'high',
      cacheKey: 'jira_monthly_cumulative_warmed',
      cacheTTL: 2 * 60 * 1000, // 2 minutes
      fetcher: 'getCumulativeMonthlyTestCaseData'
    },
    {
      name: 'monthly-test-cases',
      url: '/api/jira-monthly-test-cases',
      priority: 'high',
      cacheKey: 'jira_monthly_test_cases_warmed',
      cacheTTL: 2 * 60 * 1000, // 2 minutes
      fetcher: 'getMonthlyTestCaseData'
    },
    {
      name: 'bug-stats',
      url: '/api/jira-bug-stats',
      priority: 'critical',
      cacheKey: 'jira_bug_stats_warmed',
      cacheTTL: 2 * 60 * 1000, // 2 minutes
      fetcher: 'getBugStats'
    },
    {
      name: 'bug-areas',
      url: '/api/jira-bug-areas',
      priority: 'high',
      cacheKey: 'jira_bug_areas_warmed',
      cacheTTL: 2 * 60 * 1000, // 2 minutes
      fetcher: 'getBugAreasData'
    },
    {
      name: 'triaging-data',
      url: '/api/jira-monthly-triaging',
      priority: 'high',
      cacheKey: 'jira_triaging_warmed',
      cacheTTL: 2 * 60 * 1000, // 2 minutes
      fetcher: 'getMonthlyTriagingData'
    },
    {
      name: 'all-test-case-data',
      url: '/api/jira-all-test-cases',
      priority: 'medium',
      cacheKey: 'jira_all_test_cases_warmed',
      cacheTTL: 2 * 60 * 1000, // 2 minutes
      fetcher: 'getAllTestCaseData'
    },
    {
      name: 'cumulative-test-case-data',
      url: '/api/jira-cumulative-test-cases',
      priority: 'medium',
      cacheKey: 'jira_cumulative_test_cases_warmed',
      cacheTTL: 2 * 60 * 1000, // 2 minutes
      fetcher: 'getCumulativeTestCaseData'
    }
  ]
};

// Warming statistics
const warmingStats = {
  totalRuns: 0,
  successfulWarms: 0,
  failedWarms: 0,
  lastRun: null,
  lastSuccess: null,
  lastError: null,
  endpointStats: new Map(),
  averageWarmTime: 0,
  isRunning: false
};

/**
 * Mock request and response objects for internal API calls
 */
const createMockReqRes = () => {
  const mockReq = {
    query: {},
    params: {},
    headers: {},
    get: () => null
  };

  let responseData = null;
  let statusCode = 200;
  let headers = {};

  const mockRes = {
    json: (data) => {
      responseData = data;
      return mockRes;
    },
    status: (code) => {
      statusCode = code;
      return mockRes;
    },
    setHeader: (key, value) => {
      headers[key] = value;
      return mockRes;
    },
    get: (key) => headers[key],
    // Getters for accessing the response data
    getData: () => responseData,
    getStatus: () => statusCode,
    getHeaders: () => headers
  };

  return { mockReq, mockRes };
};

/**
 * Warm a single endpoint
 */
const warmEndpoint = async (endpoint) => {
  const startTime = Date.now();
  
  try {
    console.log(`🔥 Warming cache for ${endpoint.name}...`);
    
    // Check if data is already cached and fresh
    const existingData = await cacheUtils.get(endpoint.cacheKey);
    if (existingData) {
      console.log(`⚡ ${endpoint.name} already cached, skipping...`);
      return { success: true, cached: true, time: Date.now() - startTime };
    }

    // Create mock request/response objects
    const { mockReq, mockRes } = createMockReqRes();

    // Call the appropriate controller function
    if (ionController[endpoint.fetcher]) {
      await ionController[endpoint.fetcher](mockReq, mockRes);
      
      const responseData = mockRes.getData();
      const responseStatus = mockRes.getStatus();
      
      if (responseStatus === 200 && responseData) {
        // Store in our warming cache with extended TTL
        await cacheUtils.set(endpoint.cacheKey, responseData, endpoint.cacheTTL);
        
        const warmTime = Date.now() - startTime;
        console.log(`✅ ${endpoint.name} warmed successfully in ${warmTime}ms`);
        
        // Update endpoint stats
        const stats = warmingStats.endpointStats.get(endpoint.name) || {
          successes: 0,
          failures: 0,
          totalTime: 0,
          lastSuccess: null,
          lastError: null
        };
        
        stats.successes++;
        stats.totalTime += warmTime;
        stats.lastSuccess = new Date().toISOString();
        warmingStats.endpointStats.set(endpoint.name, stats);
        
        return { success: true, cached: false, time: warmTime, dataSize: JSON.stringify(responseData).length };
      } else {
        throw new Error(`Invalid response: status ${responseStatus}`);
      }
    } else {
      throw new Error(`Controller function ${endpoint.fetcher} not found`);
    }
    
  } catch (error) {
    const warmTime = Date.now() - startTime;
    console.error(`❌ Failed to warm ${endpoint.name}: ${error.message}`);
    
    // Update endpoint stats
    const stats = warmingStats.endpointStats.get(endpoint.name) || {
      successes: 0,
      failures: 0,
      totalTime: 0,
      lastSuccess: null,
      lastError: null
    };
    
    stats.failures++;
    stats.lastError = error.message;
    warmingStats.endpointStats.set(endpoint.name, stats);
    
    return { success: false, error: error.message, time: warmTime };
  }
};

/**
 * Warm all endpoints based on priority
 */
const warmAllEndpoints = async () => {
  if (warmingStats.isRunning) {
    console.log('⏳ Cache warming already in progress, skipping...');
    return;
  }

  warmingStats.isRunning = true;
  warmingStats.totalRuns++;
  warmingStats.lastRun = new Date().toISOString();
  
  const overallStartTime = Date.now();
  
  try {
    console.log('🚀 Starting proactive cache warming cycle...');
    
    // Group endpoints by priority
    const criticalEndpoints = WARMING_CONFIG.endpoints.filter(ep => ep.priority === 'critical');
    const highEndpoints = WARMING_CONFIG.endpoints.filter(ep => ep.priority === 'high');
    const mediumEndpoints = WARMING_CONFIG.endpoints.filter(ep => ep.priority === 'medium');
    
    let successCount = 0;
    let failureCount = 0;
    const results = [];
    
    // Warm critical endpoints first (parallel)
    console.log('🔥 Warming critical endpoints...');
    const criticalResults = await Promise.allSettled(
      criticalEndpoints.map(endpoint => warmEndpoint(endpoint))
    );
    
    criticalResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.push({ endpoint: criticalEndpoints[index].name, ...result.value });
        if (result.value.success) successCount++;
        else failureCount++;
      } else {
        results.push({ endpoint: criticalEndpoints[index].name, success: false, error: result.reason });
        failureCount++;
      }
    });
    
    // Small delay before high priority
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Warm high priority endpoints (parallel)
    console.log('🔥 Warming high priority endpoints...');
    const highResults = await Promise.allSettled(
      highEndpoints.map(endpoint => warmEndpoint(endpoint))
    );
    
    highResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.push({ endpoint: highEndpoints[index].name, ...result.value });
        if (result.value.success) successCount++;
        else failureCount++;
      } else {
        results.push({ endpoint: highEndpoints[index].name, success: false, error: result.reason });
        failureCount++;
      }
    });
    
    // Small delay before medium priority
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Warm medium priority endpoints (sequential to avoid overload)
    console.log('🔥 Warming medium priority endpoints...');
    for (const endpoint of mediumEndpoints) {
      try {
        const result = await warmEndpoint(endpoint);
        results.push({ endpoint: endpoint.name, ...result });
        if (result.success) successCount++;
        else failureCount++;
      } catch (error) {
        results.push({ endpoint: endpoint.name, success: false, error: error.message });
        failureCount++;
      }
      
      // Small delay between medium priority endpoints
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    const totalTime = Date.now() - overallStartTime;
    
    // Update overall stats
    warmingStats.successfulWarms += successCount;
    warmingStats.failedWarms += failureCount;
    warmingStats.lastSuccess = new Date().toISOString();
    warmingStats.averageWarmTime = (warmingStats.averageWarmTime + totalTime) / 2;
    
    console.log(`✅ Cache warming completed: ${successCount} success, ${failureCount} failed in ${totalTime}ms`);
    
    // Store warming results in cache for monitoring
    await cacheUtils.set('cache_warming_results', {
      timestamp: new Date().toISOString(),
      totalTime,
      successCount,
      failureCount,
      results,
      stats: warmingStats
    }, 5 * 60 * 1000); // Keep results for 5 minutes
    
  } catch (error) {
    console.error('❌ Cache warming cycle failed:', error.message);
    warmingStats.lastError = error.message;
  } finally {
    warmingStats.isRunning = false;
  }
};

/**
 * Start the cache warming service
 */
const startCacheWarmingService = () => {
  console.log('🚀 Starting proactive cache warming service...');
  console.log(`📅 Schedule: ${WARMING_CONFIG.schedule} (every minute)`);
  console.log(`🎯 Endpoints to warm: ${WARMING_CONFIG.endpoints.length}`);

  // Run IMMEDIATELY on startup (no delay)
  console.log('🔥 Running initial cache warming on server startup...');
  warmAllEndpoints().then(() => {
    console.log('✅ Initial cache warming completed - cache is ready!');
  }).catch(error => {
    console.error('❌ Initial cache warming failed:', error.message);
  });

  // Schedule regular warming every minute
  const task = cron.schedule(WARMING_CONFIG.schedule, () => {
    console.log('🔄 Running scheduled cache warming...');
    warmAllEndpoints();
  }, {
    scheduled: true,
    timezone: "UTC"
  });

  console.log('✅ Cache warming service started successfully');
  console.log('📊 Cache will be refreshed every minute automatically');

  return task;
};

/**
 * Stop the cache warming service
 */
const stopCacheWarmingService = (task) => {
  if (task) {
    task.stop();
    console.log('🛑 Cache warming service stopped');
  }
};

/**
 * Get warming statistics
 */
const getWarmingStats = () => {
  return {
    ...warmingStats,
    endpointStats: Object.fromEntries(warmingStats.endpointStats),
    config: WARMING_CONFIG,
    uptime: process.uptime()
  };
};

/**
 * Get warmed data for an endpoint
 */
const getWarmedData = async (endpointName) => {
  const endpoint = WARMING_CONFIG.endpoints.find(ep => ep.name === endpointName);
  if (!endpoint) {
    throw new Error(`Endpoint ${endpointName} not found in warming config`);
  }
  
  const data = await cacheUtils.get(endpoint.cacheKey);
  return {
    data,
    cached: !!data,
    endpoint: endpoint.name,
    cacheKey: endpoint.cacheKey,
    timestamp: new Date().toISOString()
  };
};

module.exports = {
  startCacheWarmingService,
  stopCacheWarmingService,
  warmAllEndpoints,
  getWarmingStats,
  getWarmedData,
  WARMING_CONFIG
};
