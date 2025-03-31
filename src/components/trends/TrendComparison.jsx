"use client"

import { useState } from "react"
import TrendChart from "./TrendChart"

function TrendComparison({ trends, userPreferences }) {
  // Instead of storing IDs, store the entire trend objects
  const [selectedKeywords, setSelectedKeywords] = useState([])
  const [error, setError] = useState(null)

  // Toggle a trend selection by its keyword
  const handleTrendToggle = (keyword) => {
    // Check if this keyword is already selected
    const isSelected = selectedKeywords.includes(keyword)

    if (isSelected) {
      // Remove this keyword from selection
      setSelectedKeywords(selectedKeywords.filter((k) => k !== keyword))
    } else {
      // Add this keyword to selection if under limit
      if (selectedKeywords.length < 5) {
        setSelectedKeywords([...selectedKeywords, keyword])
      } else {
        setError("Maximum of 5 trends can be selected for comparison")
        setTimeout(() => setError(null), 3000)
      }
    }
  }

  // Clear all selections
  const clearSelections = () => {
    setSelectedKeywords([])
  }

  const selectedTrends = Array.isArray(trends) ? trends.filter((trend) => selectedKeywords.includes(trend.keyword)) : []

  // Prepare data for the chart
  const prepareComparisonData = () => {
    if (!selectedTrends.length) return null

    try {
      // Get dates from the first trend
      const firstTrend = selectedTrends[0]
      if (!firstTrend.data || !firstTrend.data.length) return null

      const labels = firstTrend.data.map((point) => point.date)

      // Create datasets for each selected trend
      const datasets = selectedTrends.map((trend, index) => ({
        label: trend.keyword,
        data: trend.data.map((point) => point.value),
        borderColor: getColorByIndex(index),
        backgroundColor: getColorByIndex(index, 0.1),
        fill: false,
      }))

      return { labels, datasets }
    } catch (err) {
      console.error("Error preparing chart data:", err)
      return null
    }
  }

  // Helper function to get colors
  function getColorByIndex(index, alpha = 1) {
    const colors = [
      `rgba(79, 70, 229, ${alpha})`, // Indigo
      `rgba(220, 38, 38, ${alpha})`, // Red
      `rgba(16, 185, 129, ${alpha})`, // Green
      `rgba(245, 158, 11, ${alpha})`, // Amber
      `rgba(59, 130, 246, ${alpha})`, // Blue
    ]
    return colors[index % colors.length]
  }

  // Get chart data
  const chartData = prepareComparisonData()

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md transition-colors duration-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Compare Trends</h2>
        {selectedTrends.length > 0 && (
          <button
            onClick={clearSelections}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            Clear all
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded">
          {error}
          <button className="ml-2 text-red-700 dark:text-red-200 font-bold" onClick={() => setError(null)}>
            ×
          </button>
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-md font-medium mb-2 text-gray-900 dark:text-gray-100">
          Select trends to compare ({selectedKeywords.length}/5):
        </h3>
        <div className="flex flex-wrap gap-2">
          {Array.isArray(trends) && trends.length > 0 ? (
            trends.map((trend, index) => (
              <button
                key={index}
                onClick={() => handleTrendToggle(trend.keyword)}
                className={`px-3 py-1 rounded-full text-sm ${
                  selectedKeywords.includes(trend.keyword)
                    ? "bg-indigo-600 dark:bg-indigo-700 text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                }`}
              >
                {trend.keyword || "Unnamed Trend"}
              </button>
            ))
          ) : (
            <p className="text-gray-500 dark:text-gray-400">No trends available for comparison</p>
          )}
        </div>
      </div>

      <div className="mt-4">
        <h3 className="text-md font-medium mb-2 text-gray-900 dark:text-gray-100">Selected Trends:</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {selectedTrends.length > 0 ? (
            selectedTrends.map((trend, index) => (
              <div
                key={index}
                className="px-3 py-1 rounded-full text-sm bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 flex items-center"
              >
                <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: getColorByIndex(index) }}></span>
                {trend.keyword}
                <button
                  onClick={() => handleTrendToggle(trend.keyword)}
                  className="ml-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                >
                  ×
                </button>
              </div>
            ))
          ) : (
            <p className="text-gray-500 dark:text-gray-400">No trends selected</p>
          )}
        </div>
      </div>

      {selectedTrends.length > 0 ? (
        chartData ? (
          <div className="aspect-w-16 aspect-h-9">
            <TrendChart
              data={chartData}
              title={`Comparing ${selectedTrends.length} Trend${selectedTrends.length !== 1 ? "s" : ""}`}
              timeRange={userPreferences?.defaultTimeRange || "1m"}
              isComparison={true}
            />
          </div>
        ) : (
          <div className="text-center py-10 text-gray-500 dark:text-gray-400">
            Unable to generate comparison chart. The selected trends may not have compatible data.
          </div>
        )
      ) : (
        <div className="text-center py-10 text-gray-500 dark:text-gray-400">
          Select at least one trend to see comparison chart
        </div>
      )}
    </div>
  )
}

export default TrendComparison

