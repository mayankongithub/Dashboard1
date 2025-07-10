import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { Link } from 'react-router-dom';
import Loading from './Loading';

const HomeBugAreas = ({ preloadedBugAreasData }) => {
  const [data, setData] = useState(preloadedBugAreasData);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Use preloaded data if available
  useEffect(() => {
    if (preloadedBugAreasData) {
      setData(preloadedBugAreasData);
    } else {
      // Fallback to fetching data if not preloaded
      fetchData();
    }
  }, [preloadedBugAreasData]);

  const fetchData = () => {
    setLoading(true);
    setError(null);

    console.log('Fetching bug areas data for home page...');

    fetch('/api/jira-bug-areas')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! ${res.status}`);
        return res.json();
      })
      .then(responseData => {
        console.log('Received bug areas data:', responseData);
        setData(responseData);
        setLoading(false);
      })
      .catch(err => {
        console.error(`Error fetching bug areas data: ${err.message}`);
        setError(`Error fetching data from Jira: ${err.message}`);
        setLoading(false);
      });
  };

  // Show error state
  if (error) {
    return (
      <div className="max-w-7xl mx-auto mt-16">
        <div className="text-red-600 font-semibold text-center p-4">
          <h2 className="text-xl mb-2">Error loading bug areas data</h2>
          <p className="mb-2">{error.toString()}</p>
          <button
            onClick={fetchData}
            className="mt-4 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Prepare data for bar chart with enhanced formatting
  const chartData = data?.labelCounts || [];

  // Calculate total for percentage calculations
  const totalBugCount = chartData.reduce((sum, item) => sum + item.count, 0);

  // Enhanced data with percentages and colors - limit to top 10 for home page
  const topChartData = chartData
    .slice(0, 10)
    .map((item, index) => ({
      ...item,
      percentage: totalBugCount > 0 ? ((item.count / totalBugCount) * 100).toFixed(1) : 0,
      color: getBarColor(index, 10)
    }));

  // Calculate the maximum value for the Y-axis based on the data with enhanced dynamic scaling
  const calculateYAxisMax = () => {
    if (!topChartData || topChartData.length === 0) return 100; // Default max value for empty data

    // Find the maximum value in the data
    const maxValue = Math.max(...topChartData.map(item => item.count || 0));

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
    <div className="max-w-7xl mx-auto mt-16">
      <div className="flex justify-center items-center mb-4">
        <h2 className="text-2xl font-bold text-center">Bug Areas Distribution</h2>
      </div>

      {topChartData.length > 0 ? (
        <div className="bg-white p-6 rounded-lg shadow-md">
          
          {/* Chart Container */}
          <div className="w-full h-[400px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topChartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                barSize={40}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#E5E7EB"
                  strokeOpacity={0.6}
                />
                <XAxis
                  dataKey="label"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{
                    fontSize: 11,
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
                    fontSize: 12,
                    fill: '#374151',
                    fontWeight: 500
                  }}
                  axisLine={{ stroke: '#9CA3AF', strokeWidth: 1 }}
                  tickLine={{ stroke: '#9CA3AF', strokeWidth: 1 }}
                  label={{
                    value: 'Bug Count',
                    angle: -90,
                    position: 'insideLeft',
                    style: { textAnchor: 'middle', fill: '#6B7280', fontSize: '12px', fontWeight: 500 }
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="count"
                  radius={[4, 4, 0, 0]}
                  stroke="#DC2626"
                  strokeWidth={1}
                >
                  {topChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Summary Statistics */}
          
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-800">No Bug Areas Data Available</h3>
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

      <div className="mt-6 text-center">
        <Link to="/bug-areas" className="inline-block px-6 py-3 bg-red-600 text-white rounded hover:bg-red-700 transition-colors font-medium shadow-md">
          View Detailed Bug Areas Report
        </Link>
      </div>
    </div>
  );
};

export default HomeBugAreas;
