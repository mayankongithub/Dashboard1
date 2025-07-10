import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
  LabelList,
} from 'recharts';
import Loading from './Loading';

const MonthlyTestCases = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchData = () => {
    console.log('Starting to fetch monthly test case data...');
    setLoading(true);
    setData(null); // Clear existing data to show loader
    setError(null); // Clear any previous errors

    const startTime = Date.now();
    // Use the new cumulative monthly data endpoint without year parameter
    fetch(`/api/jira-cumulative-monthly-data`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        const loadTime = Date.now() - startTime;
        console.log(`Monthly test case data loaded successfully in ${loadTime}ms`);
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        const loadTime = Date.now() - startTime;
        console.error(`Monthly test case data failed to load after ${loadTime}ms:`, err.message);
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    console.log('MonthlyTestCases component mounted, fetching data...');
    fetchData();

    return () => {
      console.log('MonthlyTestCases component unmounting...');
    };
  }, []);

  if (error) return (
    <div className="min-h-screen bg-[#f0f0f0] p-4">
      <div className="max-w-7xl mx-auto bg-white p-6 rounded shadow-sm">
        <div className="text-red-600 font-semibold text-center p-4">
          <h2 className="text-xl mb-2">Error loading data from Jira</h2>
          <p>{error.toString()}</p>
        </div>
      </div>
    </div>
  );

  // Show loader when loading or when data is null/undefined
  if (loading || !data) return (
    <div className="min-h-screen relative">
      <Loading width="100%" height="100vh" color="#898A8A" speed={1} />
    </div>
  );

  // No need to filter data as the backend already handles this
  const filteredData = data;

  // Calculate the maximum value for the Y-axis based on the data with enhanced dynamic scaling
  const calculateYAxisMax = () => {
    if (!filteredData || filteredData.length === 0) return 10000; // Default max value

    // Find the maximum value in the data
    const maxManual = Math.max(...filteredData.map(item => item.manual || 0));
    const maxAutomated = Math.max(...filteredData.map(item => item.automated || 0));
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
  };

  // Calculate the Y-axis maximum value
  const yAxisMax = calculateYAxisMax();

  return (
    <div className="min-h-screen bg-white px-4 py-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex justify-center w-full">
            <h1 className="text-3xl font-bold" style={{ padding: '10px' }}>
              Cumulative Monthly Manual and Automated Test Cases
            </h1>
          </div>
        </div>

        {/* Combined Bar Chart */}
        <div className="w-full h-[500px] bg-white rounded shadow border p-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={filteredData}
              margin={{ top: 30, right: 30, left: 20, bottom: 70 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                angle={0}
                textAnchor="middle"
                interval={0}
                tickFormatter={(value) => value.split(' ')[0]}
                height={50}
              />
              <YAxis domain={[0, yAxisMax]} tick={{ fontSize: 12 }} />
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
              <Bar dataKey="manual" fill="#E8B4B8" name="Manual">
                <LabelList
                  dataKey="manual"
                  position="top"
                  style={{
                    fill: '#E8B4B8',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    textShadow: '0px 0px 2px white'
                  }}
                />
              </Bar>
              <Bar dataKey="automated" fill="#FF0000" name="Automated">
                <LabelList
                  dataKey="automated"
                  position="top"
                  style={{
                    fill: '#FF0000',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    textShadow: '0px 0px 2px white'
                  }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default MonthlyTestCases;

