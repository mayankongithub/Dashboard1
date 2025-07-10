import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import Loading from './Loading';

const BugAreas = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchData = () => {
    console.log('Starting to fetch bug areas data...');
    setLoading(true);
    setData(null); // Clear existing data to show loader
    setError(null); // Clear any previous errors

    const startTime = Date.now();
    fetch(`/api/jira-bug-areas`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        const loadTime = Date.now() - startTime;
        console.log(`Bug areas data loaded successfully in ${loadTime}ms`);
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        const loadTime = Date.now() - startTime;
        console.error(`Bug areas data failed to load after ${loadTime}ms:`, err.message);
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    console.log('BugAreas component mounted, fetching data...');
    fetchData();

    return () => {
      console.log('BugAreas component unmounting...');
    };
  }, []);

  if (error) return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6"></div>
        <div className="text-red-600 font-semibold text-center p-4">
          <h2 className="text-xl mb-2">Error loading bug areas data</h2>
          <p>{error.toString()}</p>
          <button
            onClick={fetchData}
            className="mt-4 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );

  // Show loader when loading or when data is null/undefined
  if (loading || !data) return (
    <div className="min-h-screen relative">
      <Loading width="100%" height="100vh" color="#898A8A" speed={1} />
      <div className="absolute inset-0 flex items-center justify-center">
        </div>
    </div>
  );

  // Prepare data for bar chart with enhanced formatting
  const chartData = data?.labelCounts || [];

  // Calculate total for percentage calculations
  const totalBugCount = chartData.reduce((sum, item) => sum + item.count, 0);

  // Enhanced data with percentages and colors
  const enhancedChartData = chartData.map((item, index) => ({
    ...item,
    percentage: totalBugCount > 0 ? ((item.count / totalBugCount) * 100).toFixed(1) : 0,
    color: getBarColor(index, chartData.length)
  }));

  // Calculate the maximum value for the Y-axis based on the data with enhanced dynamic scaling
  const calculateYAxisMax = () => {
    if (!chartData || chartData.length === 0) return 100; // Default max value for empty data

    // Find the maximum value in the data
    const maxValue = Math.max(...chartData.map(item => item.count || 0));

    // Enhanced dynamic scaling based on data range
    if (maxValue === 0) return 100; // Minimum scale for empty data

    // Add 20% padding above the maximum value for better visualization
    const paddedMax = maxValue * 1.2;

    // Dynamic rounding based on the scale of the data
    if (paddedMax <= 100) {
      // For small values, round to nearest 10
      return Math.ceil(paddedMax / 10) * 10;
    } else if (paddedMax <= 500) {
      // For medium values, round to nearest 50
      return Math.ceil(paddedMax / 50) * 50;
    } else if (paddedMax <= 1000) {
      // For larger values, round to nearest 100
      return Math.ceil(paddedMax / 100) * 100;
    } else if (paddedMax <= 5000) {
      // For very large values, round to nearest 250
      return Math.ceil(paddedMax / 250) * 250;
    } else {
      // For extremely large values, round to nearest 500
      return Math.ceil(paddedMax / 500) * 500;
    }
  };

  // Calculate the Y-axis maximum value
  const yAxisMax = calculateYAxisMax();

  // Color generation function for better visual appeal
  function getBarColor(index, total) {
    const colors = [
      '#DC2626', // Red-600
      '#EA580C', // Orange-600
      '#D97706', // Amber-600
      '#CA8A04', // Yellow-600
      '#65A30D', // Lime-600
      '#16A34A', // Green-600
      '#059669', // Emerald-600
      '#0D9488', // Teal-600
      '#0891B2', // Cyan-600
      '#0284C7', // Sky-600
      '#2563EB', // Blue-600
      '#7C3AED', // Violet-600
      '#9333EA', // Purple-600
      '#C026D3', // Fuchsia-600
      '#DB2777'  // Pink-600
    ];
    return colors[index % colors.length];
  }

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800 mb-2">{`Area: ${label}`}</p>
          <p className="text-blue-600 font-medium">{`Bug Count: ${data.count}`}</p>
          <p className="text-green-600 font-medium">{`Percentage: ${data.percentage}%`}</p>
          <p className="text-xs text-gray-500 mt-1">{`Full Label: ${data.fullLabel}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white-50 to-gray-100 p-6 pt-4">
      <div className="max-w-7xl mx-auto mb-8">
        {/* Header Spacing */}
        <div className="mb-6"></div>

        <div className="flex justify-end items-center mb-0">
            <svg
              className={`w-5 h-5 mr-2 ${loading ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
            </svg>
        </div>

        {/* done */}

        {/* Enhanced Bar Chart Section */}
        {chartData.length > 0 ? (
          <div className="bg-white p-8 rounded-2xl shadow-xl mb-4 border border-gray-100">
            <div className="text-center mb-4">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Bug Count by Area</h3>
              <p className="text-gray-600">Interactive visualization of bug distribution across different areas</p>
            </div>

            {/* Chart Container */}
            <div className="w-full h-[700px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={enhancedChartData}
                  margin={{ top: 30, right: 40, left: 40, bottom: 140 }}
                  barSize={50}
                >
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#DC2626" stopOpacity={0.9}/>
                      <stop offset="100%" stopColor="#EF4444" stopOpacity={0.6}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#E5E7EB"
                    strokeOpacity={0.6}
                  />
                  <XAxis
                    dataKey="label"
                    angle={-45}
                    textAnchor="end"
                    height={140}
                    tick={{
                      fontSize: 13,
                      fill: '#374151',
                      fontWeight: 500
                    }}
                    interval={0}
                    axisLine={{ stroke: '#9CA3AF', strokeWidth: 1 }}
                    tickLine={{ stroke: '#9CA3AF', strokeWidth: 1 }}
                  />
                  <YAxis
                    domain={[0, yAxisMax]}
                    tick={{
                      fontSize: 13,
                      fill: '#374151',
                      fontWeight: 500
                    }}
                    axisLine={{ stroke: '#9CA3AF', strokeWidth: 1 }}
                    tickLine={{ stroke: '#9CA3AF', strokeWidth: 1 }}
                    label={{
                      value: 'Number of Bugs',
                      angle: -90,
                      position: 'insideLeft',
                      style: { textAnchor: 'middle', fill: '#6B7280', fontSize: '14px', fontWeight: 500 }
                    }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="count"
                    radius={[4, 4, 0, 0]}
                    stroke="#DC2626"
                    strokeWidth={1}
                  >
                    {enhancedChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Summary Statistics */}
            
          </div>
        ) : (
          <div className="bg-white p-8 rounded-2xl shadow-xl mb-8 text-center border border-gray-100">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">No Bug Data Available</h3>
              <p className="text-gray-500 mb-4">No bugs found matching the specified criteria for version 12.8</p>
              <button
                onClick={fetchData}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Retry Loading
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default BugAreas;
