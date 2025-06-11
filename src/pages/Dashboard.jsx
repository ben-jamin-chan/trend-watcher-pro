"use client"

import { useState, useContext, useEffect } from "react"
import TrendSearch from "../components/trends/TrendSearch"
import TrendChart from "../components/trends/TrendChart"
import SavedTrendsList from "../components/trends/SavedTrendsList"
import TrendComparison from "../components/trends/TrendComparison"
import GeographicMap from "../components/trends/GeographicMap"
import { AuthContext } from "../context/AuthContext"
import {
  getSavedTrends,
  saveTrend,
  deleteSavedTrend,
  searchTrends,
  getGeoData,
  toggleTrendNotification as apiToggleTrendNotification,
  getUserPreferences,
} from "../services/api"

// Add this near the top of the file, after the imports
const API_URL = "http://localhost:5001/api"

function Dashboard() {
  const { currentUser } = useContext(AuthContext)
  const [activeTab, setActiveTab] = useState("overview")
  const [currentTrend, setCurrentTrend] = useState(null)
  const [savedTrends, setSavedTrends] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedTrend, setSelectedTrend] = useState(null)
  const [userPreferences, setUserPreferences] = useState({
    defaultTimeRange: "1m",
    defaultRegion: "US",
  })

  // Load user preferences when component mounts
  useEffect(() => {
    async function loadUserPreferences() {
      if (!currentUser) return

      try {
        const prefs = await getUserPreferences(currentUser.uid)
        setUserPreferences(prefs)
      } catch (error) {
        console.error("Error loading user preferences:", error)
      }
    }

    loadUserPreferences()
  }, [currentUser])

  // Add this function to help debug the saved trends
  const debugSavedTrends = () => {
    console.log("Current saved trends:", savedTrends)

    // Check for any trends with notifications enabled
    const trendsWithNotifications = savedTrends.filter((t) => t.notificationsEnabled)
    console.log("Trends with notifications enabled:", trendsWithNotifications)

    // Check notification frequencies
    trendsWithNotifications.forEach((trend) => {
      console.log(`${trend.keyword}: frequency = ${trend.notificationFrequency || "24h (default)"}`)
    })
  }

  // Fetch saved trends when component mounts or when user preferences change
  useEffect(() => {
    if (currentUser) {
      fetchSavedTrends().then(() => {
        debugSavedTrends()
      })
    }
  }, [currentUser, userPreferences.defaultTimeRange]) // Add defaultTimeRange as dependency

  const fetchSavedTrends = async () => {
    try {
      setLoading(true)
      const trends = await getSavedTrends(currentUser.uid)
      
      // Update each trend's data with the user's preferred time range
      const updatedTrends = await Promise.all(trends.map(async (trend) => {
        try {
          // Get fresh data with user's preferred time range
          const trendData = await searchTrends({
            keyword: trend.keyword,
            timeRange: userPreferences.defaultTimeRange,
          })

          return {
            ...trend,
            timeRange: userPreferences.defaultTimeRange,
            data: formatTrendData(trendData),
          }
        } catch (error) {
          console.error(`Error updating trend data for ${trend.keyword}:`, error)
          return trend // Keep original data if update fails
        }
      }))

      setSavedTrends(updatedTrends)

      // Set the first trend as selected by default if we have trends and no selection
      if (updatedTrends.length > 0 && !selectedTrend) {
        setSelectedTrend(updatedTrends[0].keyword)
        setCurrentTrend({
          keyword: updatedTrends[0].keyword,
          timeRange: userPreferences.defaultTimeRange,
          data: updatedTrends[0].data,
          geoData: updatedTrends[0].geoData,
        })
      }

      return updatedTrends
    } catch (err) {
      setError("Failed to fetch saved trends")
      console.error(err)
      return []
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (searchParams) => {
    try {
      setLoading(true)
      setError(null)

      // Use user's preferred time range if not specified in search params
      const effectiveTimeRange = searchParams.timeRange || userPreferences.defaultTimeRange

      // Get trend data with user's preferred time range
      const trendData = await searchTrends({
        ...searchParams,
        timeRange: effectiveTimeRange,
      })

      // Get geographic data
      const geoData = await getGeoData(searchParams.keyword)

      setCurrentTrend({
        keyword: searchParams.keyword,
        timeRange: effectiveTimeRange,
        category: searchParams.category,
        region: searchParams.region,
        data: formatTrendData(trendData),
        geoData: formatGeoData(geoData),
      })
    } catch (err) {
      setError("Failed to fetch trend data")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Update the formatTrendData function to handle timestamps properly
  const formatTrendData = (apiData) => {
    if (!apiData || !apiData.default || !apiData.default.timelineData) {
      return []
    }

    return apiData.default.timelineData.map((point) => {
      // Parse the timestamp if it's a 24-hour view
      let formattedTime = point.formattedTime
      if (userPreferences.defaultTimeRange === "1d") {
        // Ensure we have the full timestamp for 24-hour view
        const timestamp = point.time || point.timestamp
        if (timestamp) {
          // Convert timestamp to Date object and format it
          const date = new Date(timestamp * 1000) // Convert UNIX timestamp to milliseconds
          formattedTime = date.toISOString() // Use ISO string for consistent formatting
        }
      }

      return {
        date: formattedTime,
        value: point.value[0]
      }
    })
  }

  // Helper function to format geographic data from API
  const formatGeoData = (apiData) => {
    // This will depend on the exact format returned by your API
    // Here's a simplified example
    if (!apiData || !apiData.default || !apiData.default.geoMapData) {
      return { regions: [] }
    }

    return {
      regions: apiData.default.geoMapData.map((region) => ({
        code: region.geoCode,
        value: region.value[0],
      })),
    }
  }

  const handleSaveTrend = async () => {
    if (!currentTrend || !currentUser) return

    try {
      setLoading(true)

      // Get fresh data with user's preferred time range
      const trendData = await searchTrends({
        keyword: currentTrend.keyword,
        timeRange: userPreferences.defaultTimeRange,
      })

      const formattedData = formatTrendData(trendData)

      const trendToSave = {
        userId: currentUser.uid,
        keyword: currentTrend.keyword,
        timeRange: userPreferences.defaultTimeRange,
        currentValue: formattedData[formattedData.length - 1]?.value || 0,
        data: formattedData,
      }

      await saveTrend(trendToSave)

      // Refresh the saved trends list
      await fetchSavedTrends()
    } catch (err) {
      setError("Failed to save trend")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Update these handler functions to work with keywords instead of IDs
  const handleRemoveTrend = async (keyword) => {
    try {
      setLoading(true)
      setError(null)

      console.log(`Attempting to delete trend with keyword: ${keyword}`)

      // Call the API to delete from MongoDB Atlas
      await deleteSavedTrend(keyword, currentUser.uid)

      // Update local state after successful API call
      setSavedTrends(savedTrends.filter((trend) => trend.keyword !== keyword))

      // If we're removing the currently selected trend, reset selection
      if (selectedTrend === keyword) {
        const remainingTrends = savedTrends.filter((trend) => trend.keyword !== keyword)
        if (remainingTrends.length > 0) {
          setSelectedTrend(remainingTrends[0].keyword)
          setCurrentTrend({
            keyword: remainingTrends[0].keyword,
            timeRange: remainingTrends[0].timeRange,
            data: remainingTrends[0].data,
            geoData: remainingTrends[0].geoData,
          })
        } else {
          setSelectedTrend(null)
          setCurrentTrend(null)
        }
      }

      console.log(`Trend "${keyword}" removed successfully`)
    } catch (err) {
      setError("Failed to remove trend: " + err.message)
      console.error("Error removing trend:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleViewTrend = async (keyword) => {
    console.log(`Viewing trend: ${keyword}`)

    try {
      setLoading(true)
      // Find the trend by keyword
      const trend = savedTrends.find((trend) => trend.keyword === keyword)
      if (trend) {
        // Get fresh data with user's preferred time range
        const trendData = await searchTrends({
          keyword: trend.keyword,
          timeRange: userPreferences.defaultTimeRange,
        })

        // Update the selected trend
        setSelectedTrend(keyword)

        // Update the current trend data for the chart
        setCurrentTrend({
          keyword: trend.keyword,
          timeRange: userPreferences.defaultTimeRange,
          data: formatTrendData(trendData),
          geoData: trend.geoData,
        })

        console.log(`Set current trend to: ${trend.keyword} with time range: ${userPreferences.defaultTimeRange}`)
      }
    } catch (error) {
      console.error("Error updating trend data:", error)
      setError("Failed to update trend data")
    } finally {
      setLoading(false)
    }
  }

  // Replace the placeholder updateNotificationFrequency function with the actual API call
  const updateNotificationFrequency = async (keyword, frequency) => {
    try {
      console.log(`Dashboard: Calling API to update frequency for ${keyword} to ${frequency}`)

      const response = await fetch(
        `${API_URL}/saved-trends/keyword/${encodeURIComponent(keyword)}/notification-frequency`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ frequency, userId: currentUser.uid }),
        },
      )

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`API error (${response.status}):`, errorText)
        throw new Error(`API error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log("API response:", data)
      return data
    } catch (error) {
      console.error("Error updating notification frequency:", error)
      throw error
    }
  }

  // Update the handleToggleNotification function
  const handleToggleNotification = async (keyword) => {
    try {
      setLoading(true)
      setError(null)

      // Find the trend
      const trend = savedTrends.find((t) => t.keyword === keyword)

      if (!trend) {
        throw new Error("Trend not found")
      }

      // Call the API to toggle notification
      const response = await apiToggleTrendNotification(keyword, currentUser.uid)

      if (response) {
        // Update local state
        setSavedTrends(
          savedTrends.map((t) => (t.keyword === keyword ? { ...t, notificationsEnabled: !t.notificationsEnabled } : t)),
        )

        console.log(`Notification ${!trend.notificationsEnabled ? "enabled" : "disabled"} for "${keyword}"`)
      }
    } catch (err) {
      setError("Failed to toggle notification: " + err.message)
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Update the handleUpdateNotificationFrequency function
  const handleUpdateNotificationFrequency = async (keyword, frequency) => {
    try {
      setLoading(true)
      setError(null)

      console.log(`Updating notification frequency for ${keyword} to ${frequency}`)

      // Call the API to update frequency
      const response = await updateNotificationFrequency(keyword, frequency)

      if (response) {
        // Update local state
        setSavedTrends(
          savedTrends.map((t) =>
            t.keyword === keyword
              ? {
                  ...t,
                  notificationFrequency: frequency,
                  notificationsEnabled: true,
                }
              : t,
          ),
        )

        console.log(`Updated notification frequency for "${keyword}" to ${frequency}`)

        // Refresh the saved trends to ensure we have the latest data
        await fetchSavedTrends()
      }
    } catch (err) {
      setError("Failed to update notification frequency: " + err.message)
      console.error("Error updating notification frequency:", err)
    } finally {
      setLoading(false)
    }
  }

  // Add this function to your Dashboard.jsx file
  const handleCreateTestNotification = async () => {
    if (!currentUser) return

    try {
      setLoading(true)
      setError(null)

      // Call the API to create a test notification
      const response = await fetch(`${API_URL}/notifications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: currentUser.uid,
          title: "Test Notification",
          message: `This is a test notification created at ${new Date().toLocaleTimeString()}`,
          keyword: "Test",
          percentChange: Math.random() > 0.5 ? 5.2 : -5.2,
        }),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      alert("Test notification created successfully!")
    } catch (err) {
      setError("Failed to create test notification: " + err.message)
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Get the trend data to display in the chart
  const getChartData = () => {
    if (currentTrend && currentTrend.data) {
      return currentTrend.data
    }

    if (selectedTrend) {
      const trend = savedTrends.find((t) => t.keyword === selectedTrend)
      return trend?.data || []
    }

    return savedTrends.length > 0 ? savedTrends[0].data : []
  }

  // Get the chart title
  const getChartTitle = () => {
    if (currentTrend && currentTrend.keyword) {
      return `Trend for ${currentTrend.keyword}`
    }

    if (selectedTrend) {
      return `Trend for ${selectedTrend}`
    }

    return savedTrends.length > 0 ? `Recent Trend: ${savedTrends[0].keyword}` : "No Trend Data"
  }

  // Get the effective time range for charts
  const getEffectiveTimeRange = () => {
    if (currentTrend && currentTrend.timeRange) {
      return currentTrend.timeRange
    }
    return userPreferences.defaultTimeRange
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400">Welcome back, {currentUser?.displayName || "User"}!</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex justify-center my-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 dark:border-indigo-400"></div>
        </div>
      )}

      <div className="mb-6">
        <nav className="flex space-x-4 border-b border-gray-200 dark:border-gray-700">
          {/* Tab navigation buttons */}
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-3 py-2 text-sm font-medium ${
              activeTab === "overview"
                ? "border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("search")}
            className={`px-3 py-2 text-sm font-medium ${
              activeTab === "search"
                ? "border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            Search Trends
          </button>
          <button
            onClick={() => setActiveTab("saved")}
            className={`px-3 py-2 text-sm font-medium ${
              activeTab === "saved"
                ? "border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            Saved Trends
          </button>
          <button
            onClick={() => setActiveTab("compare")}
            className={`px-3 py-2 text-sm font-medium ${
              activeTab === "compare"
                ? "border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            Compare
          </button>
        </nav>
      </div>

      {activeTab === "overview" && (
        <div className="grid grid-cols-1 gap-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-gray-100">Saved Trends</h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{savedTrends.length}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-gray-100">Active Notifications</h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {savedTrends.filter((t) => t.notificationsEnabled).length}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-gray-100">Last Updated</h3>
              <p className="text-lg text-gray-900 dark:text-gray-100">
                {savedTrends.length > 0
                  ? new Date(Math.max(...savedTrends.map((t) => new Date(t.lastUpdated)))).toLocaleDateString()
                  : "No trends saved"}
              </p>
            </div>
          </div>

          {/* <div className="flex justify-end space-x-4">
            <button
              onClick={handleCreateTestNotification}
              className="bg-indigo-600 dark:bg-indigo-700 text-white py-2 px-4 rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-900"
            >
              Create Test Notification
            </button>

            <button
              onClick={() => {
                debugSavedTrends()
                fetchSavedTrends().then(() => {
                  debugSavedTrends()
                  alert("Saved trends refreshed and logged to console")
                })
              }}
              className="bg-gray-600 dark:bg-gray-700 text-white py-2 px-4 rounded-md hover:bg-gray-700 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-offset-gray-900"
            >
              Debug Saved Trends
            </button>
          </div> */}

          {savedTrends.length > 0 && (
            <div className="grid grid-cols-1 gap-6">
              <TrendChart 
                data={getChartData()} 
                title={getChartTitle()} 
                timeRange={getEffectiveTimeRange()}
                keyword={currentTrend?.keyword || selectedTrend}
              />

            {/* md:grid-cols-2 */}
              <div className="grid grid-cols-1 gap-6"> 
                <SavedTrendsList
                  savedTrends={savedTrends.slice(0, 3)}
                  onRemove={handleRemoveTrend}
                  onView={handleViewTrend}
                  onToggleNotification={handleToggleNotification}
                  onUpdateNotificationFrequency={handleUpdateNotificationFrequency}
                />

                {/* <GeographicMap
                  data={
                    currentTrend?.geoData ||
                    (selectedTrend
                      ? savedTrends.find((t) => t.keyword === selectedTrend)?.geoData || { regions: [] }
                      : { regions: [] })
                  }
                  title="Geographic Interest"
                /> */}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "search" && (
        <div className="grid grid-cols-1 gap-6">
          <TrendSearch onSearch={handleSearch} />

          {currentTrend && (
            <>
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Results for "{currentTrend.keyword}"
                </h2>
                <button
                  onClick={handleSaveTrend}
                  className="bg-indigo-600 dark:bg-indigo-700 text-white py-2 px-4 rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-900"
                >
                  Save Trend
                </button>
              </div>

              <TrendChart 
                data={currentTrend.data} 
                title={`Trend for ${currentTrend.keyword}`} 
                timeRange={getEffectiveTimeRange()}
                keyword={currentTrend.keyword}
              />

              {/* <GeographicMap data={currentTrend.geoData} title={`Geographic Interest for ${currentTrend.keyword}`} /> */}
            </>
          )}
        </div>
      )}

      {activeTab === "saved" && (
        <div className="grid grid-cols-1 gap-6">
          <SavedTrendsList
            savedTrends={savedTrends}
            onRemove={handleRemoveTrend}
            onView={handleViewTrend}
            onToggleNotification={handleToggleNotification}
            onUpdateNotificationFrequency={handleUpdateNotificationFrequency}
          />

          {currentTrend && (
            <TrendChart 
              data={currentTrend.data} 
              title={`Trend for ${currentTrend.keyword}`} 
              timeRange={getEffectiveTimeRange()}
              keyword={currentTrend.keyword}
            />
          )}
          
          {/* {currentTrend && (
            <GeographicMap 
              data={currentTrend.geoData} 
              title={`Geographic Interest for ${currentTrend.keyword}`} 
            />
          )} */}
        </div>
      )}

      {activeTab === "compare" && (
        <div className="grid grid-cols-1 gap-6">
          <TrendComparison trends={savedTrends} userPreferences={userPreferences} />
        </div>
      )}
    </div>
  )
}

export default Dashboard

