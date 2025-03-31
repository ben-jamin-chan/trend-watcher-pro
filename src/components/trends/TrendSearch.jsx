"use client"

import { useState } from "react"

function TrendSearch({ onSearch }) {
  const [keyword, setKeyword] = useState("")
  const [timeRange, setTimeRange] = useState("1m") // Default to 1 month
  const [category, setCategory] = useState("all")
  const [region, setRegion] = useState("US")

  const handleSubmit = (e) => {
    e.preventDefault()
    onSearch({
      keyword,
      timeRange,
      category,
      region,
    })
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md transition-colors duration-200">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Search Trends</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="keyword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Keyword or Topic
          </label>
          <input
            type="text"
            id="keyword"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            placeholder="Enter keyword or topic"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label htmlFor="timeRange" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Time Range
            </label>
            <select
              id="timeRange"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="1h">Past hour</option>
              <option value="4h">Past 4 hours</option>
              <option value="1d">Past day</option>
              <option value="7d">Past 7 days</option>
              <option value="30d">Past 30 days</option>
              <option value="90d">Past 90 days</option>
              <option value="12m">Past 12 months</option>
              <option value="5y">Past 5 years</option>
              <option value="all">2004 - present</option>
              <option value="custom">Custom time range</option>
            </select>
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Category
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="all">All Categories</option>
              <option value="b">Business</option>
              <option value="e">Entertainment</option>
              <option value="m">Health</option>
              <option value="t">Sci/Tech</option>
              <option value="s">Sports</option>
            </select>
          </div>

          <div>
            <label htmlFor="region" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Region
            </label>
            <select
              id="region"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="US">United States</option>
              <option value="GB">United Kingdom</option>
              <option value="CA">Canada</option>
              <option value="AU">Australia</option>
              <option value="IN">India</option>
              <option value="DE">Germany</option>
              <option value="FR">France</option>
              <option value="JP">Japan</option>
              <option value="BR">Brazil</option>
              <option value="WW">Worldwide</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-indigo-600 dark:bg-indigo-700 text-white py-2 px-4 rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-900"
        >
          Search Trends
        </button>
      </form>
    </div>
  )
}

export default TrendSearch

