import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import { Link } from 'react-router-dom';
import Loading from './Loading';

// Colors matching the image - light pink for Manual, bright red for Automated
const COLORS = ['#E8B4B8', '#FF0000'];

const Tickets = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchData = () => {
    setLoading(true);
    setData(null); // Clear existing data to show loader
    setError(null); // Clear any previous errors
    // Use the cumulative data endpoint to get all test cases
    fetch(`/api/jira-cumulative-data`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! ${res.status}`);
        return res.json();
      })
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (error) return (
    <div className="min-h-screen bg-white p-6 pt-4">
      <div className="max-w-7xl mx-auto bg-white p-6 rounded shadow-sm">
        <div className="text-red-600 font-semibold text-center p-4">
          <h2 className="text-xl mb-2">Error loading data from Jira</h2>
          <p>{error.toString()}</p>
          <p className="mt-4 text-gray-700">Please try again later or contact the administrator.</p>
        </div>
      </div>
    </div>
  );
  // Show loader when loading or when data is null/undefined
  if (loading || !data) return (
    <div className="min-h-screen relative">
      <Loading
        width="100%"
        height="100vh"
        color="#898A8A"
        speed={1}
      />
    </div>
  );

  // Extract data from Jira API
  const manual = data.manual || 0;
  const automated = data.automated || 0;
  const total = data.all || 0; // Use the total from the API

  const chartData = [
    { name: 'Manual TCs', value: manual },
    { name: 'Automated TCs', value: automated },
  ];

  // Calculate percentages for the pie chart labels
  const manualPercentage = Math.round((manual / total) * 100);
  const automatedPercentage = Math.round((automated / total) * 100);

  return (
    <div className="min-h-screen bg-white p-6 pt-4">
      {/* Header Spacing */}
      <div className="mb-6 max-w-7xl mx-auto"></div>

      {/* Current Test Cases Section */}
      <div className="max-w-7xl mx-auto mb-8">
        <h2 className="text-2xl font-bold mb-4 text-center">Current Test Case Status</h2>
        <p className="text-center mb-4 text-gray-600">
          This chart shows the current distribution of manual and automated test cases
        </p>

        <div className="flex flex-col md:flex-row justify-center gap-8 max-w-6xl mx-auto">
          {/* Table */}
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
                  <td className="py-2 px-4 border border-gray-300">{manual}</td>
                </tr>
                <tr className="bg-pink-100">
                  <td className="py-2 px-4 border border-gray-300">Automated TCs</td>
                  <td className="py-2 px-4 border border-gray-300">{automated}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Pie Chart */}
          <div className="w-full md:w-2/3 bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-center mb-4">
              Current Test Cases <span className="text-sm text-gray-700">(Source: Jira)</span>
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
                  <Legend
                    layout="vertical"
                    verticalAlign="middle"
                    align="right"
                    formatter={(value) => {
                      return <span style={{ color: '#000', fontSize: '14px' }}>{value}</span>;
                    }}
                  />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="text-center text-gray-500 text-sm mt-8">
        © {new Date().getFullYear()} DDN Confidential
      </div>
    </div>
  );
};

export default Tickets;
