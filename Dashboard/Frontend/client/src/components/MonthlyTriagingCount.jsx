import { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';

// No caching - removed for better real-time data

const MonthlyTriagingCount = ({ onErrorChange, preloadedData }) => {
  const [data, setData] = useState(preloadedData);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dataReady, setDataReady] = useState(!!preloadedData);
  // Always show all months since we removed the toggle button
  const showAllMonths = true;

  useEffect(() => {
    if (preloadedData) {
      console.log('Using preloaded monthly triaging data');
      setData(preloadedData);
      setDataReady(true);
      setLoading(false);
    } else {
      fetchData();
    }

    // Set a timeout to force loading to complete after 3 seconds
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.log('Monthly triaging data loading timeout reached');
        setLoading(false);
        setDataReady(true);
      }
    }, 3000);

    // Cleanup function
    return () => {
      clearTimeout(timeoutId);
      if (onErrorChange) onErrorChange(null);
    };
  }, [preloadedData]);

  const fetchData = () => {
    setLoading(true);
    setDataReady(false);

    setError(null);
    if (onErrorChange) onErrorChange(null);

    setData(null);

    console.log('Fetching monthly triaging count data');

    const url = `/api/jira-monthly-triaging`;

    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! ${res.status}`);
        return res.json();
      })
      .then(responseData => {
        console.log('Received monthly triaging count data:', responseData);
        if (responseData && Array.isArray(responseData) && responseData.length > 0) {
          setData(responseData);
          setDataReady(true);
          setLoading(false);
        } else {
          // Handle empty data case
          const errorMsg = 'No monthly triaging data available';
          setError(errorMsg);
          if (onErrorChange) onErrorChange(errorMsg);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error(`Error fetching monthly triaging count data: ${err.message}`);
        const errorMsg = `Error fetching data from Jira: ${err.message}`;
        setError(errorMsg);
        if (onErrorChange) onErrorChange(errorMsg);
        setLoading(false);
      });
  };

  // Don't show individual loading state - let parent handle it
  // if (loading) {
  //   return (
  //     <div className="w-full">
  //       <div className="flex flex-col items-center mb-4">
  //         <h2 className="text-2xl font-bold mb-2 text-center">Monthly Triaging Count</h2>
  //       </div>
  //       <p className="text-center mb-4 text-gray-600">
  //         This chart shows the number of bugs triaged each month.
  //         Each bar represents the count for that month.
  //       </p>
  //       <div className="bg-white p-4 rounded-lg shadow-md">
  //         <div className="w-full h-[500px] flex justify-center items-center">
  //           <div className="text-center">
  //             <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600 mb-4"></div>
  //             <p className="text-gray-600 text-lg">Loading monthly triaging data...</p>
  //           </div>
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }

  // Show error state
  if (error) {
    return (
      <div className="w-full">
        <div className="flex flex-col items-center mb-4">
          <h2 className="text-2xl font-bold mb-2 text-center">Monthly Triaging Count</h2>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-red-600 font-semibold text-center p-4">
            <h2 className="text-xl mb-2">Error loading data from Jira</h2>
            <p>{error.toString()}</p>
            <button
              onClick={() => fetchData()}
              className="mt-4 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Format data for the chart - use memoization to avoid recalculating on every render
  // Always call useMemo regardless of loading/error state to maintain hook order
  const { chartData, yAxisMax } = useMemo(() => {
    // Default empty values
    if (!dataReady || !data || data.length === 0) {
      return { chartData: [], yAxisMax: 0 };
    }

    // Format data for the chart
    const formattedData = data.map(item => {
      const year = item.year;
      const monthName = item.monthShort;
      return {
        name: `${monthName} ${year}`,
        month: item.month,
        'FW': item.firmwareBugs,
        'CI': item.ciBugs,
        'Scripts': item.scriptBugs,
        totalBugs: item.totalBugs,
        fwLabel: `FW(${item.firmwareBugs})`,
        ciLabel: `CI(${item.ciBugs})`,
        scriptsLabel: `Scripts(${item.scriptBugs})`
      };
    });

    // Calculate max value for Y axis with some padding
    const maxFW = Math.max(...formattedData.map(item => item.FW || 0));
    const maxCI = Math.max(...formattedData.map(item => item.CI || 0));
    const maxScripts = Math.max(...formattedData.map(item => item.Scripts || 0));
    const maxValue = Math.max(maxFW, maxCI, maxScripts);

    // Round up to the nearest 10
    const axisMax = Math.ceil(maxValue / 10) * 10;

    return { chartData: formattedData, yAxisMax: axisMax };
  }, [data, dataReady]);

  // Show loading state when data is not ready
  if (!dataReady || !data || data.length === 0 || loading) {
    return (
      <div className="w-full">
        <div className="flex flex-col items-center mb-4">
          <h2 className="text-2xl font-bold mb-2 text-center">Monthly Triaging Count</h2>
          <p className="text-center mb-4 text-gray-600">
            This chart shows the number of bugs triaged each month.
            Each bar represents the count for that month.
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="w-full h-[500px] flex items-center justify-center bg-gray-50 rounded">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading triaging statistics...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render a single bar chart like the Cumulative Monthly chart
  const renderMonthlyCharts = () => {
    // Safety check - if chartData is empty, return empty div
    if (!chartData || chartData.length === 0) {
      return <div className="text-center py-8">No chart data available</div>;
    }

    // Only show the last 7 months for better performance, unless showAllMonths is true
    const displayData = showAllMonths ? chartData : chartData.slice(-7);

    return (
      <div className="w-full h-[500px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={displayData}
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
              tickFormatter={(value) => value.split(' ')[0]} // Only show month name
            />
            <YAxis domain={[0, yAxisMax]} tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(value, name) => [`${value}`, `${name} Bugs`]}
              labelFormatter={(label) => `Bugs as of ${label}`}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #ccc',
                borderRadius: '4px',
                padding: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            />
            <Legend verticalAlign="top" height={36} />
            <Bar dataKey="FW" name="Firmware" fill="#F8CECC">
              <LabelList
                dataKey="FW"
                position="top"
                style={{
                  fill: '#F8CECC',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  textShadow: '0px 0px 2px white'
                }}
              />
            </Bar>
            <Bar dataKey="CI" name="CI" fill="#D85450">
              <LabelList
                dataKey="CI"
                position="top"
                style={{
                  fill: '#D85450',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  textShadow: '0px 0px 2px white'
                }}
              />
            </Bar>
            <Bar dataKey="Scripts" name="Scripts" fill="#FFB570">
              <LabelList
                dataKey="Scripts"
                position="top"
                style={{
                  fill: '#FFB570',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  textShadow: '0px 0px 2px white'
                }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div className="w-full">
      <div className="flex flex-col items-center mb-4">
        <h2 className="text-2xl font-bold mb-2 text-center">Monthly Triaging Count</h2>
        <p className="text-center mb-4 text-gray-600">
          This chart shows the number of bugs triaged each month.
          Each bar represents the count for that month.
        </p>

      </div>
      <div className="bg-white p-4 rounded-lg shadow-md">
        {renderMonthlyCharts()}
      </div>
    </div>
  );
};

export default MonthlyTriagingCount;
