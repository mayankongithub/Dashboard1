import { useEffect, useState, useMemo, lazy, Suspense } from 'react';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList } from 'recharts';
import Loading from './Loading';
import SkeletonLoader from './SkeletonLoader';
import { Link } from 'react-router-dom';

// Lazy load heavy components
const HomeBugStats = lazy(() => import('./HomeBugStats'));
const HomeBugAreas = lazy(() => import('./HomeBugAreas'));

// Colors matching the image - light pink for Manual, bright red for Automated
const COLORS = ['#E8B4B8', '#FF0000'];



const OptimizedManualAutomate = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [progressiveLoading, setProgressiveLoading] = useState({
    basic: false,
    charts: false,
    bugStats: false
  });

  // Additional data states for child components
  const [monthlyTriagingData, setMonthlyTriagingData] = useState(null);

  // Memoize expensive calculations - MUST be before any conditional returns
  const chartData = useMemo(() => {
    if (!dashboardData?.testCases) return [];
    return [
      { name: 'Manual TCs', value: dashboardData.testCases.manual || 0 },
      { name: 'Automated TCs', value: dashboardData.testCases.automated || 0 },
    ];
  }, [dashboardData]);

  const { total, manualPercentage, automatedPercentage } = useMemo(() => {
    if (!dashboardData?.testCases) return { total: 0, manualPercentage: 0, automatedPercentage: 0 };

    const allManual = dashboardData.testCases.manual || 0;
    const allAutomated = dashboardData.testCases.automated || 0;
    const allTotal = dashboardData.testCases.total || (allManual + allAutomated);

    return {
      total: allTotal,
      manualPercentage: Math.round((allManual / allTotal) * 100) || 0,
      automatedPercentage: Math.round((allAutomated / allTotal) * 100) || 0
    };
  }, [dashboardData]);

  const monthlyChartData = useMemo(() => {
    if (!dashboardData?.monthlyData) return [];

    try {
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth();

      const monthToIndex = {
        'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
        'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
      };

      const filteredMonthlyData = dashboardData.monthlyData.filter((item) => {
        const [month, yearStr] = item.month.split(' ');
        const year = parseInt(yearStr);
        return !(year === currentYear && monthToIndex[month] > currentMonth);
      });

      return filteredMonthlyData.map(item => ({
        name: item.month.split(' ')[0], // Just use the month name without newlines
        year: item.month.split(' ')[1], // Store year separately
        Manual: item.manual,
        Automated: item.automated,
        Total: item.total
      }));
    } catch (err) {
      console.error("Error formatting monthly chart data:", err);
      return [];
    }
  }, [dashboardData]);

  // Memoize Y-axis calculation with enhanced dynamic scaling
  const monthlyYAxisMax = useMemo(() => {
    if (!monthlyChartData || monthlyChartData.length === 0) return 10000;

    const maxManual = Math.max(...monthlyChartData.map(item => item.Manual || 0));
    const maxAutomated = Math.max(...monthlyChartData.map(item => item.Automated || 0));
    const maxValue = Math.max(maxManual, maxAutomated);

    // Enhanced dynamic scaling based on data range
    if (maxValue === 0) return 1000; // Minimum scale for empty data

    // Add 20% padding above the maximum value for better visualization
    const paddedMax = maxValue * 1.2;

    // Dynamic rounding based on the scale of the data
    if (paddedMax <= 1000) {
      // For small values, round to nearest 100
      return Math.ceil(paddedMax / 100) * 100;
    } else if (paddedMax <= 10000) {
      // For medium values, round to nearest 500
      return Math.ceil(paddedMax / 500) * 500;
    } else if (paddedMax <= 50000) {
      // For larger values, round to nearest 1000
      return Math.ceil(paddedMax / 1000) * 1000;
    } else {
      // For very large values, round to nearest 5000
      return Math.ceil(paddedMax / 5000) * 5000;
    }
  }, [monthlyChartData]);

  const fetchData = async (isRetry = false) => {
    setLoading(true);
    setError(null);
    setDashboardData(null); // Clear existing data to show single loader
    setMonthlyTriagingData(null); // Clear existing data to show single loader
    setProgressiveLoading({ basic: false, charts: false, bugStats: false });

    if (isRetry) {
      setRetryCount(prev => prev + 1);
    } else {
      setRetryCount(0);
    }

    // Set a timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      if (loading) {
        console.warn('Loading timeout reached, forcing completion');
        setLoading(false);
        setError('Loading timeout - please try refreshing the page');
      }
    }, 30000); // 30 second timeout

    try {
      // Use the new batch API endpoint for faster loading
      console.log('Fetching dashboard data using batch API...');

      // Add timeout to fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 second timeout

      const response = await fetch('/api/dashboard-batch', {
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) throw new Error(`HTTP error! ${response.status}`);
      const batchData = await response.json();

      if (batchData.error) throw new Error(batchData.error);

      console.log('Received batch dashboard data:', batchData);
      setDashboardData(batchData);
      setProgressiveLoading({ basic: true, charts: true, bugStats: false });

      // Fetch monthly triaging data sequentially
      console.log('Fetching monthly triaging data...');
      try {
        const triagingController = new AbortController();
        const triagingTimeoutId = setTimeout(() => triagingController.abort(), 15000); // 15 second timeout

        const response = await fetch(`/api/jira-monthly-triaging`, {
          signal: triagingController.signal
        });

        clearTimeout(triagingTimeoutId);

        if (!response.ok) throw new Error(`HTTP error! ${response.status}`);
        const monthlyTriagingResponse = await response.json();

        setMonthlyTriagingData(monthlyTriagingResponse);
        setProgressiveLoading(prev => ({ ...prev, bugStats: true }));
      } catch (err) {
        console.error('Error fetching monthly triaging data:', err.message);
        setProgressiveLoading(prev => ({ ...prev, bugStats: true }));
      }

      setLoading(false);
      clearTimeout(loadingTimeout);
    } catch (err) {
      clearTimeout(loadingTimeout);
      console.error(`Error fetching dashboard data: ${err.message}`);

      // Handle different types of errors
      if (err.name === 'AbortError') {
        setError('Request timeout - please check your connection and try again');
      } else {
        setError(`Error fetching data from Jira: ${err.message}`);
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Fallback mechanism to prevent infinite loading
    const fallbackTimeout = setTimeout(() => {
      if (loading && !error && !dashboardData) {
        console.warn('Fallback timeout triggered - forcing loading to complete');
        setLoading(false);
        setError('Loading took too long. Please refresh the page or try again.');
      }
    }, 45000); // 45 second fallback timeout

    return () => clearTimeout(fallbackTimeout);
  }, []);

  if (error) return (
    <div className="min-h-screen bg-white p-6 pt-4">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold mb-4 text-center">Test Case Dashboard</h2>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
          <p className="mt-2">Please try again later or contact the administrator.</p>
        </div>
        <div className="text-center mt-4">
          <button
            onClick={() => fetchData(true)}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-4"
          >
            Try Again {retryCount > 0 && `(${retryCount})`}
          </button>
          <button
            onClick={() => window.location.reload()}
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
          >
            Refresh Page
          </button>
        </div>
      </div>
    </div>
  );

  // Show single loader when initially loading, when no data is available, or when basic data isn't ready
  // Added additional checks to prevent infinite loading
  const shouldShowLoader = loading ||
    !dashboardData ||
    !progressiveLoading.basic ||
    !dashboardData.testCases ||
    !dashboardData.monthlyData;

  if (shouldShowLoader && !error) {
    return (
      <div className="min-h-screen relative bg-white">
        <Loading width="100%" height="100vh" color="#898A8A" speed={1.2} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="mt-96 text-center">
            <p className="text-gray-600 text-sm animate-pulse"></p>
            <p className="text-gray-500 text-xs mt-2"> </p>
            {retryCount > 0 && (
              <p className="text-orange-500 text-xs mt-1">Retry attempt: {retryCount}</p>
            )}

          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6 pt-4">
      {/* Current Test Cases Section */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex justify-between items-center mb-4">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-center">Current Test Case Status</h2>
          </div>
          
        </div>
        <p className="text-center mb-4 text-gray-600">
          This chart shows the current distribution of manual and automated test cases
        </p>

        <div className="flex flex-col md:flex-row justify-center gap-8 max-w-6xl mx-auto">
          {/* Summary Table */}
          <div className="w-full md:w-1/3">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="bg-red-600 text-white py-2 px-4 text-left"></th>
                  <th className="bg-red-600 text-white py-2 px-4 text-left">Count</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-gray-200">
                  <td className="py-2 px-4 border border-gray-300">Total TCs</td>
                  <td className="py-2 px-4 border border-gray-300">{total}</td>
                </tr>
                <tr className="bg-gray-100">
                  <td className="py-2 px-4 border border-gray-300">Manual TCs</td>
                  <td className="py-2 px-4 border border-gray-300">{dashboardData?.testCases?.manual || 0}</td>
                </tr>
                <tr className="bg-pink-100">
                  <td className="py-2 px-4 border border-gray-300">Automated TCs</td>
                  <td className="py-2 px-4 border border-gray-300">{dashboardData?.testCases?.automated || 0}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Pie Chart */}
          <div className="w-full md:w-2/3 bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-center mb-4">
              SFAP Test cases <span className="text-sm text-gray-700">(Source: Jira)</span>
            </h2>
            <div className="w-full h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={150}
                    dataKey="value"
                    labelLine={false}
                    label={({ cx, cy, midAngle, outerRadius, index }) => {
                      const RADIAN = Math.PI / 180;
                      const radius = outerRadius * 0.7;
                      const x = cx + radius * Math.cos(-midAngle * RADIAN);
                      const y = cy + radius * Math.sin(-midAngle * RADIAN);
                      return (
                        <text
                          x={x}
                          y={y}
                          fill="#fff"
                          textAnchor="middle"
                          dominantBaseline="central"
                          style={{ fontWeight: 'bold', fontSize: '18px' }}
                        >
                          {index === 0 ? `${manualPercentage}%` : `${automatedPercentage}%`}
                        </text>
                      );
                    }}
                  >
                    {chartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend layout="vertical" verticalAlign="middle" align="right" />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link to="/tickets" className="inline-block px-6 py-3 bg-red-600 text-white rounded hover:bg-red-700 transition-colors font-medium shadow-md">
            View Detailed Monthly Report
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto my-8">
        <hr className="border-gray-300" />
      </div>

      {/* Monthly Section with Table + Chart */}
      <div className="max-w-7xl mx-auto mt-16">
        <h2 className="text-2xl font-bold mb-4 text-center">Cumulative Monthly Manual and Automated Test Cases</h2>
        <p className="text-center mb-4 text-gray-600">
          This chart shows the current number of manual and automated test cases.
          Each bar represents the cumulative count as of that month.
        </p>

        <div className="bg-white p-4 rounded-lg shadow-md relative">
          {/* Monthly Bar Chart */}
          {progressiveLoading.charts ? (
            <div className="w-full h-[500px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyChartData}
                  margin={{ top: 30, right: 30, left: 20, bottom: 70 }}
                  barSize={20}
                  barGap={5}
                  animationDuration={1500}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fontWeight: 'bold' }}
                    angle={0}
                    interval={0}
                    height={50}
                    tickFormatter={(value) => value.split('\n')[0]} // Only show month name
                  />
                  <YAxis domain={[0, monthlyYAxisMax]} tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value, name) => [`${value}`, `${name} TCs`]}
                    labelFormatter={(label) => `Cumulative as of ${label}`}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      padding: '8px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Legend verticalAlign="top" height={36} />
                  <defs>
                    <linearGradient id="manualGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F8D0D4" stopOpacity={0.9} />
                      <stop offset="95%" stopColor="#E8B4B8" stopOpacity={0.9} />
                    </linearGradient>
                    <linearGradient id="automatedGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF5555" stopOpacity={0.9} />
                      <stop offset="95%" stopColor="#FF0000" stopOpacity={0.9} />
                    </linearGradient>
                  </defs>
                  <Bar dataKey="Manual" fill="url(#manualGradient)" name="Manual">
                    <LabelList dataKey="Manual" position="top" style={{ fill: '#E8B4B8', fontSize: '10px', fontWeight: 'bold', textShadow: '0px 0px 2px white' }} />
                  </Bar>
                  <Bar dataKey="Automated" fill="url(#automatedGradient)" name="Automated">
                    <LabelList dataKey="Automated" position="top" style={{ fill: '#FF0000', fontSize: '10px', fontWeight: 'bold', textShadow: '0px 0px 2px white' }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <SkeletonLoader type="barChart" />
          )}
        </div>

        <div className="mt-6 text-center">
          <Link to="/monthly" className="inline-block px-6 py-3 bg-red-600 text-white rounded hover:bg-red-700 transition-colors font-medium shadow-md">
            View Detailed Monthly Report
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto my-8">
        <hr className="border-gray-300" />
      </div>

      {/* Bug Stats Section */}
      <div className="max-w-7xl mx-auto mt-8 mb-16">
        {progressiveLoading.bugStats ? (
          <Suspense fallback={<SkeletonLoader type="chart" />}>
            <HomeBugStats
              preloadedBugStatsData={dashboardData?.bugStats}
              preloadedMonthlyTriagingData={monthlyTriagingData}
            />
          </Suspense>
        ) : (
          <SkeletonLoader type="chart" />
        )}
      </div>

      {/* Bug Areas Section */}
      <div className="max-w-7xl mx-auto mt-8 mb-16">
        {progressiveLoading.bugStats ? (
          <Suspense fallback={<SkeletonLoader type="chart" />}>
            <HomeBugAreas preloadedBugAreasData={dashboardData?.bugAreas} />
          </Suspense>
        ) : (
          <SkeletonLoader type="chart" />
        )}
      </div>
    </div>
  );
};

export default OptimizedManualAutomate;
