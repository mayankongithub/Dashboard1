import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Link } from 'react-router-dom';
import Loading from './Loading';
import MonthlyTriagingCount from './MonthlyTriagingCount';

const HomeBugStats = ({ preloadedBugStatsData, preloadedMonthlyTriagingData }) => {
  const [data, setData] = useState(preloadedBugStatsData);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [monthlyTriagingError, setMonthlyTriagingError] = useState(null);

  // Use preloaded data if available
  useEffect(() => {
    if (preloadedBugStatsData) {
      setData(preloadedBugStatsData);
    } else {
      // Fallback to fetching data if not preloaded
      fetchData(null);
    }
  }, [preloadedBugStatsData]);

  const fetchData = (month) => {
    setLoading(true);
    setError(null);

    if (month) {
      console.log(`Fetching bug stats data for home page with month: ${month}`);
    } else {
      console.log(`Fetching bug stats data for home page (all months)`);
    }

    // If month is null, don't include any parameters
    const url = month ? `https://localhost:5000/api/jira-bug-stats?month=${month}` : `http://localhost:5000/api/jira-bug-stats`;
    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! ${res.status}`);
        return res.json();
      })
      .then(responseData => {
        console.log(`Received bug stats data:`, responseData);
        setData(responseData);
        setLoading(false);
      })
      .catch(err => {
        console.error(`Error fetching bug stats data: ${err.message}`);
        setError(`Error fetching data from Jira: ${err.message}`);
        setLoading(false);
      });
  };

  // Colors for the pie chart
  const COLORS = ['#B71C1C', '#E64A19', '#FFA000'];

  // Prepare data for pie chart
  const getPieChartData = () => {
    if (!data) return [];

    // Check if all values are zero
    const allZeros = data.firmwareBugs === 0 && data.ciBugs === 0 && data.scriptBugs === 0;

    // If all values are zero, return empty array to prevent rendering an empty pie chart
    if (allZeros) {
      return [];
    }

    return [
      { name: 'Firmware', value: data.firmwareBugs, count: data.firmwareBugs },
      { name: 'CI', value: data.ciBugs, count: data.ciBugs },
      { name: 'Script', value: data.scriptBugs, count: data.scriptBugs }
    ];
  };

  // Don't show individual loading state - let parent handle it
  // if (loading) {
  //   return (
  //     <div className="min-h-screen relative">
  //       <Loading
  //         width="100%"
  //         height="100vh"
  //         color="#898A8A"
  //         speed={1}
  //       />
  //       <div className="absolute inset-0 flex items-center justify-center">
  //       </div>
  //     </div>
  //   );
  // }

  // Show error state if either the main data or the MonthlyTriagingCount has an error
  if (error || monthlyTriagingError) {
    return (
      <div className="min-h-screen bg-white p-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-red-600 font-semibold text-center p-4">
            <h2 className="text-xl mb-2">Error loading data</h2>
            {error && <p className="mb-2">{error.toString()}</p>}
            {monthlyTriagingError && <p className="mb-2">{monthlyTriagingError.toString()}</p>}
            <button
              onClick={() => {
                fetchData(null);
                // Reset the MonthlyTriagingCount error state
                setMonthlyTriagingError(null);
              }}
              className="mt-4 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto mt-16">
      <div className="flex justify-center items-center mb-4">
        <h2 className="text-2xl font-bold text-center">Stats for Triaging done by SAT</h2>
      </div>

      {data && (
        <div className="flex flex-col md:flex-row gap-8">
          {/* Stats Table */}
          <div className="w-full md:w-1/2 bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">Bug Statistics</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr>
                    <th className="py-2 px-4 bg-red-500 text-white text-left">Category</th>
                    <th className="py-2 px-4 bg-red-500 text-white text-left">Count</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-gray-200">
                    <td className="py-2 px-4">Total bugs triaged</td>
                    <td className="py-2 px-4">{data.totalBugs}</td>
                  </tr>
                  <tr className="bg-gray-100">
                    <td className="py-2 px-4">Firmware bugs</td>
                    <td className="py-2 px-4">{data.firmwareBugs}</td>
                  </tr>
                  <tr className="bg-gray-200">
                    <td className="py-2 px-4">CI bugs</td>
                    <td className="py-2 px-4">{data.ciBugs}</td>
                  </tr>
                  <tr className="bg-gray-100">
                    <td className="py-2 px-4">Script bugs</td>
                    <td className="py-2 px-4">{data.scriptBugs}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Pie Chart */}
          <div className="w-full md:w-1/2 bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4 text-center">Bugs raised by Automation</h3>
            <div className="w-full h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={getPieChartData()}
                    cx="50%"
                    cy="50%"
                    outerRadius={140}
                    fill="#8884d8"
                    dataKey="value"
                    labelLine={true}
                    label={({ name, percent, cx, cy, midAngle, outerRadius, payload }) => {
                      const RADIAN = Math.PI / 180;
                      // Calculate position for the label
                      const radius = outerRadius * 1.1;
                      const x = cx + radius * Math.cos(-midAngle * RADIAN);
                      const y = cy + radius * Math.sin(-midAngle * RADIAN);

                      // Add vertical offset based on segment to create spacing
                      const yOffset = name === 'Script' ? 15 : (name === 'CI' ? 0 : -15);

                      return (
                        <text
                          x={x}
                          y={y + yOffset}
                          fill={name === 'Script' ? '#FFA000' : (name === 'CI' ? '#E64A19' : '#B71C1C')}
                          textAnchor={x > cx ? 'start' : 'end'}
                          dominantBaseline="central"
                          style={{ fontWeight: 'bold', fontSize: '14px' }}
                        >
                          {`${name}(${payload.count}) ${(percent * 100).toFixed(0)}%`}
                        </text>
                      );
                    }}
                  >
                    {getPieChartData().map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => {
                    const entry = getPieChartData().find(item => item.name === name);
                    return [`${entry ? entry.count : value}`, `${name} Bugs`];
                  }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto my-8">
        <hr className="border-gray-300" />
      </div>

      {/* Monthly Triaging Count Section */}
      <div className="max-w-7xl mx-auto mt-8">
        <MonthlyTriagingCount
          preloadedData={preloadedMonthlyTriagingData}
          onErrorChange={setMonthlyTriagingError}
        />
      </div>

      <div className="mt-6 text-center">
        <Link to="/bug-stats" className="inline-block px-6 py-3 bg-red-600 text-white rounded hover:bg-red-700 transition-colors font-medium shadow-md">
          View Detailed Bug Report
        </Link>
      </div>
    </div>
  );
};

export default HomeBugStats;
