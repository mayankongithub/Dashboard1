import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import Loading from './Loading';
import MonthlyTriagingCount from './MonthlyTriagingCount';

const BugStats = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [monthlyTriagingError, setMonthlyTriagingError] = useState(null);

  // Get the current month (1-12)
  const currentMonth = new Date().getMonth() + 1;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    console.log(`Starting to fetch bug stats data for current month (${currentMonth})`);
    const startTime = Date.now();

    setLoading(true);
    setData(null); // Clear existing data to show loader
    setError(null);

    // No need to pass month parameter, the backend will use the current month by default
    fetch(`/api/jira-bug-stats`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! ${res.status}`);
        return res.json();
      })
      .then(responseData => {
        const loadTime = Date.now() - startTime;
        console.log(`Bug stats data loaded successfully in ${loadTime}ms:`, responseData);
        setData(responseData);
        setLoading(false);
      })
      .catch(err => {
        const loadTime = Date.now() - startTime;
        console.error(`Bug stats data failed to load after ${loadTime}ms: ${err.message}`);

        // Check if the error is due to server issues
        if (err.message.includes('500')) {
          setError(`Server error. Please try again later.`);
        } else {
          setError(`Error fetching data from Jira: ${err.message}`);
        }

        setLoading(false);
      });
  };

  // Helper function to get month name
  const getMonthName = (monthNumber) => {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return monthNames[monthNumber - 1] || '';
  };

  // Colors for the pie chart
  const COLORS = ['#B71C1C', '#E64A19', '#FFA000'];

  // Prepare data for pie chart
  const getPieChartData = () => {
    if (!data) return [];

    return [
      { name: 'Firmware', value: data.firmwareBugs, count: data.firmwareBugs },
      { name: 'CI', value: data.ciBugs, count: data.ciBugs },
      { name: 'Script', value: data.scriptBugs, count: data.scriptBugs }
    ];
  };

  // Show loading state when data is being fetched or when there's no data
  if (loading || !data) {
    return (
      <div className="min-h-screen relative">
        <Loading
          width="100%"
          height="100vh"
          color="#898A8A"
          speed={1}
        />
        <div className="absolute inset-0 flex items-center justify-center">
        </div>
      </div>
    );
  }

  // Show error state if either the main data or the MonthlyTriagingCount has an error
  if (error || monthlyTriagingError) return (
    <div className="min-h-screen bg-white p-6 pt-4">
      <div className="max-w-7xl mx-auto bg-white p-6 rounded shadow-sm">
        <div className="text-red-600 font-semibold text-center p-4">
          <h2 className="text-xl mb-2">Error loading data from Jira</h2>
          {error && <p>{error.toString()}</p>}
          {monthlyTriagingError && <p>{monthlyTriagingError.toString()}</p>}
          <p className="mt-4 text-gray-700">Please try again later or contact the administrator.</p>
          <button
            onClick={() => {
              fetchData();
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

  return (
    <div className="min-h-screen bg-white p-6 pt-4">
      <div className="max-w-7xl mx-auto mb-8">
        {/* Header Spacing */}
        <div className="mb-6"></div>

        <h2 className="text-2xl font-bold mb-4 text-center">Stats for Triaging done by SAT</h2>
        <p className="text-center mb-4 text-gray-600">
          This report shows bugs triaged by the SAT team for {data?.monthName || getMonthName(currentMonth)} {data?.year || new Date().getFullYear()}
        </p>

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
              <div className="w-full h-[500px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={getPieChartData()}
                      cx="50%"
                      cy="50%"
                      outerRadius={170}
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
            onLoadingChange={() => {
              // We're not using separate loading states anymore
            }}
            onErrorChange={setMonthlyTriagingError}
          />
        </div>
      </div>
    </div>
  );
};

export default BugStats;
