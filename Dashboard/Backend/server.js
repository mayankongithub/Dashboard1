// Simple Dashboard Backend Server
// Now using ioncontroller for all API functions

const express = require('express');
const cors = require('cors');
const compression = require('compression');
const ionController = require('./controllers/ioncontroller');

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

// No caching - removed for better real-time data

// ===== API ENDPOINTS =====

// Batch endpoint for all dashboard data
app.get('/api/dashboard-batch', ionController.getDashboardData);

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

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
