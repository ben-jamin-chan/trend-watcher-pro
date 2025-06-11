import { useState, useEffect } from "react";
import { getRealTimeTrends } from "../../services/api";
import TrendChart from "./TrendChart";

function RealTimeTrendChart({ geo = "US", category = "all", refreshInterval = 300000 }) {
  const [trendData, setTrendData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await getRealTimeTrends({ geo, category });
      setTrendData(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching real-time trends:", err);
      setError("Failed to load real-time trend data");
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on mount and set up refresh interval
  useEffect(() => {
    fetchData();

    // Set up interval for real-time updates
    const intervalId = setInterval(() => {
      fetchData();
    }, refreshInterval);

    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [geo, category, refreshInterval]);

  if (loading && !trendData) {
    return <div className="p-4 text-center">Loading real-time trend data...</div>;
  }

  if (error && !trendData) {
    return (
      <div className="p-4 text-center text-red-600">
        {error}
        <button 
          onClick={fetchData} 
          className="ml-3 underline text-blue-500 hover:text-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <TrendChart 
        data={trendData?.default?.timelineData || []} 
        title={`Real-Time Trends - ${geo}`} 
        timeRange="1h" 
        keyword={`Real-Time Trends ${geo}`}
      />
      <div className="mt-2 text-xs text-gray-500 text-right">
        Last updated: {new Date().toLocaleString()}
      </div>
    </div>
  );
}

export default RealTimeTrendChart; 