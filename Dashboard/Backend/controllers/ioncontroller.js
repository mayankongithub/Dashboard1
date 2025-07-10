// ioncontroller.js
// Controller containing all API functions for the Dashboard Backend

const JiraClient = require('jira-client');
const moment = require('moment');
const { cacheUtils, CACHE_TTL, CACHE_KEYS } = require('../config/redis');

// Jira configuration
const JIRA_CONFIG = {
  protocol: 'https',
  host: 'jira.tegile.com',
  username: 'bugs-bunny',
  password: 'hsv4h5s65a6h56j5ch5',
  apiVersion: '2',
  strictSSL: true
};

const JIRA_PROJECT = 'SFAP';
const USERS = ['adukane', 'vborikar', 'hsuthar', 'kmuthukumar', 'skhade', 'sjinde', 'tmujawar', 'vdharpale', 'sadak', 'rsrivastava', 'maysharma'];

// Initialize Jira client
const jira = new JiraClient(JIRA_CONFIG);

// ===== API CONTROLLER FUNCTIONS =====



/**
 * Get current test case data (manual vs automated)
 */
const getTestCaseData = async (req, res) => {
  const startTime = Date.now();
  const cacheKey = cacheUtils.generateKey('JIRA_TEST_CASES', 'current');

  try {
    // Try to get from cache first
    const cachedData = await cacheUtils.get(cacheKey);
    if (cachedData) {
      const responseTime = Date.now() - startTime;
      console.log(`🚀 CACHE HIT - Test case data served in ${responseTime}ms`);
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('X-Response-Time', `${responseTime}ms`);
      return res.json(cachedData);
    }

    // Direct JQL queries for manual and automated test cases using user-specified patterns
    const manualJQL = `project = SFAP AND issuetype = Test AND Method IN (Manual,EMPTY)`;
    const automatedJQL = `project = SFAP AND issuetype IS NOT EMPTY AND Method = Automated`;

    console.log(`Executing Manual JQL: ${manualJQL}`);
    console.log(`Executing Automated JQL: ${automatedJQL}`);

    const [manualResult, automatedResult] = await Promise.all([
      jira.searchJira(manualJQL),
      jira.searchJira(automatedJQL)
    ]);

    const responseData = {
      manual: manualResult.total,
      automated: automatedResult.total
    };

    // Cache the result
    await cacheUtils.set(cacheKey, responseData, CACHE_TTL.MEDIUM);

    const responseTime = Date.now() - startTime;
    console.log(`⏱️  CACHE MISS - Test case data fetched and cached in ${responseTime}ms`);
    console.log(`Test case data: ${JSON.stringify(responseData)}`);
    res.setHeader('X-Cache', 'MISS');
    res.setHeader('X-Response-Time', `${responseTime}ms`);
    res.json(responseData);
  } catch (error) {
    console.error("Test case data error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get monthly test case data (same as above for compatibility)
 */
const getMonthlyTestCaseData = async (req, res) => {
  const startTime = Date.now();
  const cacheKey = cacheUtils.generateKey('JIRA_MONTHLY_DATA', 'test_cases');

  try {
    // Try to get from cache first
    const cachedData = await cacheUtils.get(cacheKey);
    if (cachedData) {
      const responseTime = Date.now() - startTime;
      console.log(`🚀 CACHE HIT - Monthly test case data served in ${responseTime}ms`);
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('X-Response-Time', `${responseTime}ms`);
      return res.json(cachedData);
    }

    // Direct JQL queries for manual and automated test cases using user-specified patterns
    const manualJQL = `project = SFAP AND issuetype = Test AND Method IN (Manual,EMPTY)`;
    const automatedJQL = `project = SFAP AND issuetype IS NOT EMPTY AND Method = Automated`;

    const [manualResult, automatedResult] = await Promise.all([
      jira.searchJira(manualJQL),
      jira.searchJira(automatedJQL)
    ]);

    const manualCount = manualResult.total;
    const automatedCount = automatedResult.total;

    const responseData = {
      manual: manualCount,
      automated: automatedCount,
      total: manualCount + automatedCount,
      manualLabel: `Manual(${manualCount})`,
      automatedLabel: `Automated(${automatedCount})`
    };

    // Cache the result
    await cacheUtils.set(cacheKey, responseData, CACHE_TTL.MEDIUM);

    const responseTime = Date.now() - startTime;
    console.log(`⏱️  CACHE MISS - Monthly test case data fetched and cached in ${responseTime}ms`);
    res.setHeader('X-Cache', 'MISS');
    res.setHeader('X-Response-Time', `${responseTime}ms`);
    res.json(responseData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get all test cases
 */
const getAllTestCaseData = async (req, res) => {
  try {
    // Direct JQL queries for all, manual and automated test cases using user-specified patterns
    const allJQL = `project = SFAP AND issuetype = Test`;
    const manualJQL = `project = SFAP AND issuetype = Test AND Method IN (Manual,EMPTY)`;
    const automatedJQL = `project = SFAP AND issuetype IS NOT EMPTY AND Method = Automated`;

    const [allResult, manualResult, automatedResult] = await Promise.all([
      jira.searchJira(allJQL),
      jira.searchJira(manualJQL),
      jira.searchJira(automatedJQL)
    ]);

    const responseData = {
      all: allResult.total,
      manual: manualResult.total,
      automated: automatedResult.total
    };
    res.json(responseData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get cumulative test case data (same as all data for compatibility)
 */
const getCumulativeTestCaseData = async (req, res) => {
  try {
    // Direct JQL queries for all, manual and automated test cases using user-specified patterns
    const allJQL = `project = SFAP AND issuetype = Test`;
    const manualJQL = `project = SFAP AND issuetype = Test AND Method IN (Manual,EMPTY)`;
    const automatedJQL = `project = SFAP AND issuetype IS NOT EMPTY AND Method = Automated`;

    const [allResult, manualResult, automatedResult] = await Promise.all([
      jira.searchJira(allJQL),
      jira.searchJira(manualJQL),
      jira.searchJira(automatedJQL)
    ]);

    const responseData = {
      all: allResult.total,
      manual: manualResult.total,
      automated: automatedResult.total
    };
    res.json(responseData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get cumulative monthly test case data for 2025 - Ultra-optimized with minimal API calls
 */
const getCumulativeMonthlyTestCaseData = async (req, res) => {
  const startTime = Date.now();
  const cacheKey = cacheUtils.generateKey('JIRA_CUMULATIVE_DATA', '2025_monthly');

  try {
    // Try to get from cache first
    const cachedData = await cacheUtils.get(cacheKey);
    if (cachedData) {
      const responseTime = Date.now() - startTime;
      console.log(`🚀 CACHE HIT - Cumulative monthly data served in ${responseTime}ms`);
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('X-Response-Time', `${responseTime}ms`);
      return res.json(cachedData);
    }

    console.log('Fetching cumulative monthly test case data with ultra-optimization...');
    const currentDate = new Date();
    const currentYear = 2025;
    const currentMonth = currentDate.getMonth();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Get the end date for the current month
    const lastDayOfCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const currentMonthEndDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(lastDayOfCurrentMonth).padStart(2, '0')}`;

    // Make only 2 API calls total instead of 2 * number_of_months
    console.log('Making only 2 optimized API calls...');

    // Use the user-specified JQL patterns
    const manualJQL = `project = SFAP AND issuetype = Test AND Method IN (Manual,EMPTY) AND created <= "${currentMonthEndDate}" ORDER BY created ASC`;
    const automatedJQL = `project = SFAP AND issuetype IS NOT EMPTY AND Method = Automated AND created <= "${currentMonthEndDate}" ORDER BY created ASC`;

    console.log(`Manual JQL: ${manualJQL}`);
    console.log(`Automated JQL: ${automatedJQL}`);

    // Function to get all results with pagination if needed
    const getAllResults = async (jql, description) => {
      let allIssues = [];
      let startAt = 0;
      const maxResults = 1000; // Use smaller chunks for pagination
      let total = 0;

      do {
        console.log(`Fetching ${description} - batch starting at ${startAt}`);
        const result = await jira.searchJira(jql, {
          fields: ['created'],
          maxResults: maxResults,
          startAt: startAt
        });

        if (result.issues) {
          allIssues = allIssues.concat(result.issues);
        }
        total = result.total;
        startAt += maxResults;

        console.log(`${description}: Got ${result.issues ? result.issues.length : 0} issues, total so far: ${allIssues.length}/${total}`);
      } while (startAt < total && allIssues.length < total);

      return { issues: allIssues, total: total };
    };

    const [manualResults, automatedResults] = await Promise.all([
      getAllResults(manualJQL, 'Manual test cases'),
      getAllResults(automatedJQL, 'Automated test cases')
    ]);

    console.log(`Retrieved ${manualResults.total} manual and ${automatedResults.total} automated test cases`);
    console.log(`Manual results returned: ${manualResults.issues ? manualResults.issues.length : 0} issues`);
    console.log(`Automated results returned: ${automatedResults.issues ? automatedResults.issues.length : 0} issues`);

    // OPTIMIZED: Process all months in parallel for faster cumulative calculation
    const monthsToProcess = Array.from({ length: Math.min(currentMonth, 11) + 1 }, (_, i) => i);
    console.log(`Processing ${monthsToProcess.length} months of cumulative data in parallel...`);

    const monthPromises = monthsToProcess.map(async (month) => {
      const lastDayOfMonth = new Date(currentYear, month + 1, 0).getDate();
      const monthEndDate = new Date(currentYear, month, lastDayOfMonth, 23, 59, 59);

      // Parallel counting for manual and automated test cases
      const [manualCount, automatedCount] = await Promise.all([
        Promise.resolve(manualResults.issues ? manualResults.issues.filter(issue => {
          const createdDate = new Date(issue.fields.created);
          return createdDate <= monthEndDate;
        }).length : 0),
        Promise.resolve(automatedResults.issues ? automatedResults.issues.filter(issue => {
          const createdDate = new Date(issue.fields.created);
          return createdDate <= monthEndDate;
        }).length : 0)
      ]);

      return {
        month: `${monthNames[month]} ${currentYear}`,
        manual: manualCount,
        automated: automatedCount,
        total: manualCount + automatedCount,
        manualLabel: `Manual(${manualCount})`,
        automatedLabel: `Automated(${automatedCount})`,
        monthIndex: month // For sorting
      };
    });

    // Execute all month processing in parallel
    const monthResults = await Promise.all(monthPromises);

    // Sort by month index and remove the index
    const cumulativeMonthlyData = monthResults
      .sort((a, b) => a.monthIndex - b.monthIndex)
      .map(result => {
        const { monthIndex, ...finalResult } = result;
        return finalResult;
      });

    // Cache the result with extended TTL since this is historical data
    await cacheUtils.set(cacheKey, cumulativeMonthlyData, CACHE_TTL.EXTENDED);

    const responseTime = Date.now() - startTime;
    console.log(`⏱️  CACHE MISS - Cumulative monthly data fetched and cached in ${responseTime}ms`);
    console.log(`Successfully processed cumulative monthly data for ${cumulativeMonthlyData.length} months`);
    res.setHeader('X-Cache', 'MISS');
    res.setHeader('X-Response-Time', `${responseTime}ms`);
    res.json(cumulativeMonthlyData);
  } catch (error) {
    console.error("Cumulative monthly data error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get bug statistics for current month - Optimized for performance
 */
const getBugStats = async (req, res) => {
  try {
    const startTime = Date.now();
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    const month = req.query.month ? parseInt(req.query.month) : currentMonth;

    if (month < 1 || month > 12) {
      return res.status(400).json({ error: "Month must be between 1 and 12" });
    }

    // Check cache first
    const cacheKey = cacheUtils.generateKey('JIRA_BUG_STATS', `${currentYear}-${month}`);
    const cachedData = await cacheUtils.get(cacheKey);
    if (cachedData) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cachedData);
    }

    console.log(`Fetching bug statistics using new JQL patterns for Stats for Triaging done by SAT - month: ${month}, year: ${currentYear}`);

    // Use proper date ranges for the specified month
    const startDate = moment({ year: currentYear, month: month - 1 }).startOf('month').format('YYYY-MM-DD');
    const endDate = moment({ year: currentYear, month: month - 1 }).endOf('month').format('YYYY-MM-DD');

    // Use the new JQL patterns with specific date ranges - Stats for Triaging done by SAT
    const firmwareJQL = `project = SFAP AND issuetype = Bug AND status is not EMPTY AND created >= "${startDate}" AND created <= "${endDate}" AND reporter = bugs-bunny AND component = "Automated Test" AND labels = CI:Stage4 AND text ~ Firmware order by status ASC`;

    const scriptJQL = `project = SFAP AND issuetype = Bug AND status is not EMPTY AND created >= "${startDate}" AND created <= "${endDate}" AND reporter = bugs-bunny AND component = "Automated Test" AND labels = CI:Stage4 AND text ~ Firmware order by status ASC`;

    const ciJQL = `project = SFAP AND issuetype = Bug AND status is not EMPTY AND created >= "${startDate}" AND created <= "${endDate}" AND reporter = bugs-bunny AND component = "Automated Test" AND labels = CI:Stage4 AND text ~ CI order by status ASC`;

    console.log(`Executing new JQL queries for SAT triaging stats...`);
    const queryStart = Date.now();

    // Execute all three queries in parallel
    const [firmwareBugsResult, scriptBugsResult, ciBugsResult] = await Promise.all([
      jira.searchJira(firmwareJQL, { maxResults: 1000 }),
      jira.searchJira(scriptJQL, { maxResults: 1000 }),
      jira.searchJira(ciJQL, { maxResults: 1000 })
    ]);

    const queryTime = Date.now() - queryStart;

    const firmwareBugs = firmwareBugsResult.total;
    const scriptBugs = scriptBugsResult.total;
    const ciBugs = ciBugsResult.total;
    const totalBugs = firmwareBugs + scriptBugs + ciBugs;

    console.log(`SAT triaging stats queries completed in ${queryTime}ms - Firmware: ${firmwareBugs}, Script: ${scriptBugs}, CI: ${ciBugs}, Total: ${totalBugs}`);

    const monthName = moment().month(month - 1).format('MMMM');

    const responseData = {
      totalBugs,
      firmwareBugs,
      ciBugs,
      scriptBugs,
      month,
      year: currentYear,
      monthName,
      dateRange: { start: startDate, end: endDate }
    };

    // Cache the result
    await cacheUtils.set(cacheKey, responseData, CACHE_TTL.SHORT);

    const totalTime = Date.now() - startTime;
    console.log(`Bug stats completed in ${totalTime}ms: ${JSON.stringify(responseData)}`);
    res.setHeader('X-Cache', 'MISS');
    res.json(responseData);
  } catch (error) {
    console.error("Bug stats error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get monthly triaging count data - Highly optimized for performance
 */
const getMonthlyTriagingData = async (req, res) => {
  const startTime = Date.now();
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  const cacheKey = cacheUtils.generateKey('JIRA_TRIAGING_DATA', `${currentYear}_monthly`);

  try {
    // Try to get from cache first
    const cachedData = await cacheUtils.get(cacheKey);
    if (cachedData) {
      const responseTime = Date.now() - startTime;
      console.log(`🚀 CACHE HIT - Monthly triaging data served in ${responseTime}ms`);
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('X-Response-Time', `${responseTime}ms`);
      return res.json(cachedData);
    }

    console.log(`Fetching highly optimized monthly triaging data for year: ${currentYear}, current month: ${currentMonth}`);

    // Optimize: Create user query once
    const userQuery = USERS.map(user => `description ~ "Triaged by: ${user}"`).join(' OR ');

    // Optimize: Fetch all data for the year in one query, then process by month
    const yearStartDate = `${currentYear}-01-01`;
    // Fix: Use currentMonth - 1 for moment.js (0-based) to include the current month data
    const yearEndDate = moment({ year: currentYear, month: currentMonth - 1 }).endOf('month').format('YYYY-MM-DD');

    console.log(`Fetching all triaging data from ${yearStartDate} to ${yearEndDate}`);

    // Single query to get all bugs for the year
    const baseJQL = `project=${JIRA_PROJECT} AND issuetype=Bug AND reporter=bugs-bunny AND createdDate >= "${yearStartDate}" AND createdDate <= "${yearEndDate}" AND (${userQuery})`;

    // Execute all three queries in parallel for the entire year
    const [allBugsResult, allCiBugsResult, allScriptBugsResult] = await Promise.all([
      jira.searchJira(baseJQL, { maxResults: 1000, fields: ['created', 'components'] }),
      jira.searchJira(`${baseJQL} AND component = "Continuous Integration"`, { maxResults: 1000, fields: ['created'] }),
      jira.searchJira(`${baseJQL} AND component = "Automated Test"`, { maxResults: 1000, fields: ['created'] })
    ]);

    console.log(`Retrieved ${allBugsResult.total} total bugs, ${allCiBugsResult.total} CI bugs, ${allScriptBugsResult.total} script bugs`);

    // OPTIMIZED: Process all months in parallel instead of sequential loop
    console.log(`Processing ${currentMonth} months of triaging data in parallel...`);

    const monthPromises = Array.from({ length: currentMonth }, (_, i) => i + 1).map(async (month) => {
      const monthStart = moment({ year: currentYear, month: month - 1 }).startOf('month');
      const monthEnd = moment({ year: currentYear, month: month - 1 }).endOf('month');

      // Parallel filtering for each month's data
      const [monthBugs, monthCiBugs, monthScriptBugs] = await Promise.all([
        // Use Promise.resolve to make filtering async and allow parallel processing
        Promise.resolve(allBugsResult.issues.filter(bug => {
          const createdDate = moment(bug.fields.created);
          return createdDate.isBetween(monthStart, monthEnd, null, '[]');
        })),
        Promise.resolve(allCiBugsResult.issues.filter(bug => {
          const createdDate = moment(bug.fields.created);
          return createdDate.isBetween(monthStart, monthEnd, null, '[]');
        })),
        Promise.resolve(allScriptBugsResult.issues.filter(bug => {
          const createdDate = moment(bug.fields.created);
          return createdDate.isBetween(monthStart, monthEnd, null, '[]');
        }))
      ]);

      const totalBugs = monthBugs.length;
      const ciBugs = monthCiBugs.length;
      const scriptBugs = monthScriptBugs.length;

      const monthName = moment().month(month - 1).format('MMMM');
      const monthShort = moment().month(month - 1).format('MMM');

      // Debug logging for current month
      if (month === currentMonth) {
        console.log(`DEBUG: Current month (${monthName}) data - Total: ${totalBugs}, CI: ${ciBugs}, Scripts: ${scriptBugs}, FW: ${totalBugs - ciBugs - scriptBugs}`);
      }

      return {
        month,
        monthName,
        monthShort,
        year: currentYear,
        totalBugs,
        firmwareBugs: totalBugs - ciBugs - scriptBugs,
        ciBugs,
        scriptBugs
      };
    });

    // Execute all month processing in parallel
    const monthlyResults = await Promise.all(monthPromises);

    // Cache the result
    await cacheUtils.set(cacheKey, monthlyResults, CACHE_TTL.MEDIUM);

    const responseTime = Date.now() - startTime;
    console.log(`⏱️  CACHE MISS - Monthly triaging data fetched and cached in ${responseTime}ms`);
    console.log(`Successfully processed triaging data for ${monthlyResults.length} months`);
    console.log(`Final results:`, monthlyResults.map(r => `${r.monthShort}: ${r.totalBugs} total`).join(', '));
    res.setHeader('X-Cache', 'MISS');
    res.setHeader('X-Response-Time', `${responseTime}ms`);
    res.json(monthlyResults);
  } catch (error) {
    console.error("Monthly triaging error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

// Internal helper function for bug areas data
const getBugAreasDataInternal = async () => {
  console.log('Fetching bug areas data for batch request...');

  // Try different variations of the JQL query to find one that works
  const jqlVariations = [
    // Original user query
    `project = "SFA Platform" AND issuetype = Bug AND labels in (SFA:TAG:AWL, SFA:TAG:BadBlocks, SFA:TAG:EBOF:Fabrio:Reset, SFA:TAG:DriveMissing, SFA:TAG:Downgrade, SFA:TAG:DI, SFA:TAG:ControllerBootStuck, SFA:TAG:DualControllerCrash, SFA:TAG:SingleControllerCrash, SFA:TAG:Upgrade, SFA:TAG:DrivePartiaReady) AND cf[10502] = 12.8`,
    // Try with quoted version
    `project = "SFA Platform" AND issuetype = Bug AND labels in (SFA:TAG:AWL, SFA:TAG:BadBlocks, SFA:TAG:EBOF:Fabrio:Reset, SFA:TAG:DriveMissing, SFA:TAG:Downgrade, SFA:TAG:DI, SFA:TAG:ControllerBootStuck, SFA:TAG:DualControllerCrash, SFA:TAG:SingleControllerCrash, SFA:TAG:Upgrade, SFA:TAG:DrivePartiaReady) AND cf[10502] = "12.8"`,
    // Try with fixVersion
    `project = "SFA Platform" AND issuetype = Bug AND labels in (SFA:TAG:AWL, SFA:TAG:BadBlocks, SFA:TAG:EBOF:Fabrio:Reset, SFA:TAG:DriveMissing, SFA:TAG:Downgrade, SFA:TAG:DI, SFA:TAG:ControllerBootStuck, SFA:TAG:DualControllerCrash, SFA:TAG:SingleControllerCrash, SFA:TAG:Upgrade, SFA:TAG:DrivePartiaReady) AND fixVersion = "12.8"`,
    // Without version filter (fallback)
    `project = "SFA Platform" AND issuetype = Bug AND labels in (SFA:TAG:AWL, SFA:TAG:BadBlocks, SFA:TAG:EBOF:Fabrio:Reset, SFA:TAG:DriveMissing, SFA:TAG:Downgrade, SFA:TAG:DI, SFA:TAG:ControllerBootStuck, SFA:TAG:DualControllerCrash, SFA:TAG:SingleControllerCrash, SFA:TAG:Upgrade, SFA:TAG:DrivePartiaReady)`
  ];

  let allBugsResult = null;
  let successfulJQL = null;

  // Try each JQL variation until one works
  for (const jql of jqlVariations) {
    try {
      console.log(`Trying JQL: ${jql}`);
      allBugsResult = await jira.searchJira(jql, { maxResults: 1000 });
      successfulJQL = jql;
      console.log(`Success! Found ${allBugsResult.total} bugs with JQL: ${jql}`);
      break;
    } catch (error) {
      console.log(`JQL failed: ${jql}, Error: ${error.message}`);
      continue;
    }
  }

  if (!allBugsResult) {
    throw new Error('All JQL variations failed. Unable to fetch bug areas data.');
  }

  // Define the labels we're interested in
  const targetLabels = [
    'SFA:TAG:AWL',
    'SFA:TAG:BadBlocks',
    'SFA:TAG:EBOF:Fabrio:Reset',
    'SFA:TAG:DriveMissing',
    'SFA:TAG:Downgrade',
    'SFA:TAG:DI',
    'SFA:TAG:ControllerBootStuck',
    'SFA:TAG:DualControllerCrash',
    'SFA:TAG:SingleControllerCrash',
    'SFA:TAG:Upgrade',
    'SFA:TAG:DrivePartiaReady'
  ];

  // Initialize label counts
  const labelCounts = {};
  targetLabels.forEach(label => {
    labelCounts[label] = 0;
  });

  // OPTIMIZED: Get all bugs with parallel pagination for faster processing
  const allBugs = [];
  const maxResults = 100;
  const totalPages = Math.ceil(allBugsResult.total / maxResults);

  if (totalPages <= 1) {
    // Single page, no need for parallel processing
    const batchResult = await jira.searchJira(successfulJQL, {
      startAt: 0,
      maxResults: maxResults,
      fields: ['labels']
    });
    allBugs.push(...batchResult.issues);
  } else {
    // PARALLEL PAGINATION: Process multiple pages simultaneously
    const pagePromises = [];
    for (let page = 0; page < totalPages; page++) {
      const startAt = page * maxResults;
      pagePromises.push(
        jira.searchJira(successfulJQL, {
          startAt: startAt,
          maxResults: maxResults,
          fields: ['labels']
        })
      );
    }

    // Execute all page requests in parallel
    const pageResults = await Promise.all(pagePromises);
    pageResults.forEach(result => {
      if (result.issues) {
        allBugs.push(...result.issues);
      }
    });
  }

  // Count bugs for each label
  allBugs.forEach(bug => {
    const issueLabels = bug.fields.labels || [];
    issueLabels.forEach(label => {
      if (labelCounts.hasOwnProperty(label)) {
        labelCounts[label]++;
      }
    });
  });

  // Format data for frontend consumption
  const formattedData = Object.entries(labelCounts).map(([label, count]) => ({
    label: label.replace('SFA:TAG:', ''), // Remove prefix for cleaner display
    fullLabel: label,
    count: count
  }));

  // Sort by count descending
  formattedData.sort((a, b) => b.count - a.count);

  return {
    totalBugs: allBugsResult.total,
    labelCounts: formattedData,
    version: '12.8',
    lastUpdated: new Date().toISOString()
  };
};

/**
 * Batch API endpoint to get all dashboard data in one request
 */
const getDashboardData = async (_req, res) => {
  try {
    // Check cache first
    const cacheKey = cacheUtils.generateKey('DASHBOARD_BATCH', 'all');
    const cachedData = await cacheUtils.get(cacheKey);
    if (cachedData) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cachedData);
    }

    console.log('Fetching all dashboard data in batch...');

    // Execute all queries in parallel for maximum performance
    const [
      manualResult,
      automatedResult,
      allResult,
      monthlyDataResult,
      bugStatsResult,
      bugAreasResult
    ] = await Promise.all([
      // Basic test case queries using user-specified patterns
      jira.searchJira(`project = ${JIRA_PROJECT} AND issuetype = Test AND Method IN (Manual,EMPTY)`),
      jira.searchJira(`project = ${JIRA_PROJECT} AND issuetype IS NOT EMPTY AND Method = Automated`),
      jira.searchJira(`project = '${JIRA_PROJECT}' AND issuetype = Test`),

      // Monthly data - get cumulative monthly data
      getCumulativeMonthlyDataInternal(),

      // Bug stats for current month
      getBugStatsInternal(),

      // Bug areas data
      getBugAreasDataInternal().catch(error => {
        console.error('Bug areas data failed in batch:', error.message);
        return { totalBugs: 0, labelCounts: [], version: '12.8', lastUpdated: new Date().toISOString() };
      })
    ]);

    const responseData = {
      testCaseData: {
        manual: manualResult.total,
        automated: automatedResult.total
      },
      allTestCaseData: {
        all: allResult.total,
        manual: manualResult.total,
        automated: automatedResult.total
      },
      monthlyData: monthlyDataResult,
      bugStats: bugStatsResult,
      bugAreas: bugAreasResult,
      timestamp: new Date().toISOString()
    };

    // Cache the result
    await cacheUtils.set(cacheKey, responseData, CACHE_TTL.SHORT);

    console.log('Batch dashboard data fetched successfully');
    res.setHeader('X-Cache', 'MISS');
    res.json(responseData);
  } catch (error) {
    console.error("Batch dashboard data error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

// Internal helper functions for batch processing
const getCumulativeMonthlyDataInternal = async () => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  const monthsToFetch = Array.from({ length: currentMonth }, (_, i) => i + 1);

  // SUPER OPTIMIZED: Process ALL months in parallel instead of batches
  console.log(`Processing ${monthsToFetch.length} months in parallel for maximum speed...`);

  const monthPromises = monthsToFetch.map(async (month) => {
    try {
      const endDate = moment({ year: currentYear, month: month - 1 }).endOf('month').format('YYYY-MM-DD');

      // Parallel execution for each month's manual and automated queries
      const [manualResult, automatedResult] = await Promise.all([
        jira.searchJira(`project = ${JIRA_PROJECT} AND issuetype = Test AND Method IN (Manual,EMPTY) AND createdDate <= "${endDate}"`),
        jira.searchJira(`project = ${JIRA_PROJECT} AND issuetype IS NOT EMPTY AND Method = Automated AND createdDate <= "${endDate}"`)
      ]);

      const manualCount = manualResult.total;
      const automatedCount = automatedResult.total;
      const monthName = moment().month(month - 1).format('MMM');

      return {
        month: `${monthName} ${currentYear}`,
        manual: manualCount,
        automated: automatedCount,
        total: manualCount + automatedCount,
        monthIndex: month // Add for sorting
      };
    } catch (error) {
      console.error(`Error fetching data for month ${month}:`, error.message);
      return null;
    }
  });

  // Execute ALL month queries in parallel
  const monthlyDataResults = await Promise.all(monthPromises);

  // Filter out null results and sort by month index
  const validResults = monthlyDataResults
    .filter(result => result !== null)
    .sort((a, b) => a.monthIndex - b.monthIndex)
    .map(result => {
      // Remove monthIndex from final result
      const { monthIndex, ...finalResult } = result;
      return finalResult;
    });

  console.log(`Successfully processed ${validResults.length} months in parallel`);
  return validResults;
};

const getBugStatsInternal = async () => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  // Use proper JQL queries for firmware, script, and CI bugs - Stats for Triaging done by SAT
  const firmwareJQL = `project = SFAP AND issuetype = Bug AND status is not EMPTY AND created >= startOfMonth() AND created <= endOfMonth() AND reporter = bugs-bunny AND component = "Automated Test" AND labels = CI:Stage4 AND text ~ Firmware order by status ASC`;

  const scriptJQL = `project = SFAP AND issuetype = Bug AND status is not EMPTY AND created >= startOfMonth() AND created <= endOfMonth() AND reporter = bugs-bunny AND component = "Automated Test" AND labels = CI:Stage4 AND text ~ Firmware order by status ASC`;

  const ciJQL = `project = SFAP AND issuetype = Bug AND status is not EMPTY AND created >= startOfMonth() AND created <= endOfMonth() AND reporter = bugs-bunny AND component = "Automated Test" AND labels = CI:Stage4 AND text ~ CI order by status ASC`;

  const [firmwareBugsResult, scriptBugsResult, ciBugsResult] = await Promise.all([
    jira.searchJira(firmwareJQL),
    jira.searchJira(scriptJQL),
    jira.searchJira(ciJQL)
  ]);

  const firmwareBugs = firmwareBugsResult.total;
  const scriptBugs = scriptBugsResult.total;
  const ciBugs = ciBugsResult.total;
  const totalBugs = firmwareBugs + scriptBugs + ciBugs;

  const monthName = moment().month(currentMonth - 1).format('MMMM');

  return {
    totalBugs,
    firmwareBugs,
    ciBugs,
    scriptBugs,
    month: currentMonth,
    year: currentYear,
    monthName,
    dateRange: { start: moment().startOf('month').format('YYYY-MM-DD'), end: moment().endOf('month').format('YYYY-MM-DD') }
  };
};



/**
 * Get bug areas data using DDNJira patterns for CI, Firmware, and Script bugs
 */
const getBugAreasData = async (req, res) => {
  const startTime = Date.now();
  const cacheKey = cacheUtils.generateKey('JIRA_BUG_AREAS', 'v12.8');

  try {
    // Try to get from cache first
    const cachedData = await cacheUtils.get(cacheKey);
    if (cachedData) {
      const responseTime = Date.now() - startTime;
      console.log(`🚀 CACHE HIT - Bug areas data served in ${responseTime}ms`);
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('X-Response-Time', `${responseTime}ms`);
      return res.json(cachedData);
    }

    const responseData = await getBugAreasDataInternal();

    // Cache the result with long TTL since bug areas data is relatively stable
    await cacheUtils.set(cacheKey, responseData, CACHE_TTL.LONG);

    const responseTime = Date.now() - startTime;
    console.log(`⏱️  CACHE MISS - Bug areas data fetched and cached in ${responseTime}ms`);
    console.log(`Bug areas data processed: ${JSON.stringify(responseData, null, 2)}`);
    res.setHeader('X-Cache', 'MISS');
    res.setHeader('X-Response-Time', `${responseTime}ms`);
    res.json(responseData);
  } catch (error) {
    console.error("Bug areas data error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

// ===== EXPORTS =====

module.exports = {
  // API Controller functions
  getTestCaseData,
  getMonthlyTestCaseData,
  getAllTestCaseData,
  getCumulativeTestCaseData,
  getCumulativeMonthlyTestCaseData,
  getBugStats,
  getMonthlyTriagingData,
  getDashboardData,
  getBugAreasData
};
