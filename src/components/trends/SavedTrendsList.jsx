"use client"

import { useState, useContext, useEffect } from "react"
import { StarIcon, BellIcon, TrashIcon, ChartBarIcon, ChevronDownIcon } from "@heroicons/react/24/outline"
import { AuthContext } from "../../context/AuthContext"
import { doc, updateDoc } from "firebase/firestore"
import { db, requestNotificationPermission } from "../../firebase"

function SavedTrendsList({ savedTrends, onRemove, onView, onToggleNotification, onUpdateNotificationFrequency }) {
  const [sortBy, setSortBy] = useState("date")
  const { currentUser } = useContext(AuthContext)
  const [permissionBlocked, setPermissionBlocked] = useState(false)
  const [openFrequencyMenu, setOpenFrequencyMenu] = useState(null)
  const [permissionStatus, setPermissionStatus] = useState("default")

  // Handle notification toggle with Firebase
  const handleNotificationToggle = async (keyword) => {
    try {
      // Check current permission status first
      if (Notification.permission === "denied") {
        setPermissionBlocked(true)
        alert(
          "Notifications are blocked by your browser. Please enable them in your browser settings to receive trend alerts.",
        )
        return
      }

      // If permission is not granted yet, request it
      if (Notification.permission !== "granted") {
        const result = await requestNotificationPermission()

        if (result === "blocked") {
          setPermissionBlocked(true)
          alert(
            "Notifications are blocked by your browser. Please enable them in your browser settings to receive trend alerts.",
          )
          return
        }

        if (!result) {
          alert("Notification permission was denied. You won't receive trend alerts.")
          return
        }

        // Store FCM token in user document
        if (currentUser) {
          await updateDoc(doc(db, "users", currentUser.uid), {
            fcmToken: result,
          })
        }
      }

      // Call the original toggle function
      onToggleNotification(keyword)
    } catch (error) {
      console.error("Error toggling notification:", error)
      alert("There was an error enabling notifications: " + error.message)
    }
  }

  // Handle frequency selection
  const handleFrequencySelect = async (keyword, frequency) => {
    try {
      // Call the function to update frequency
      await onUpdateNotificationFrequency(keyword, frequency)
      // Close the dropdown
      setOpenFrequencyMenu(null)
    } catch (error) {
      console.error("Error updating notification frequency:", error)
      alert("There was an error updating notification frequency: " + error.message)
    }
  }

  // Toggle frequency dropdown menu
  const toggleFrequencyMenu = (keyword) => {
    if (openFrequencyMenu === keyword) {
      setOpenFrequencyMenu(null)
    } else {
      setOpenFrequencyMenu(keyword)
    }
  }

  // Get frequency display text
  const getFrequencyText = (frequency) => {
    switch (frequency) {
      case "15m":
        return "15 minutes"
      case "1h":
        return "1 hour"
      case "3h":
        return "3 hours"
      case "6h":
        return "6 hours"
      case "24h":
        return "24 hours"
      default:
        return "24 hours"
    }
  }

  // Sort trends based on selected criteria
  const sortedTrends = [...savedTrends].sort((a, b) => {
    if (sortBy === "date") {
      return new Date(b.lastUpdated) - new Date(a.lastUpdated)
    } else if (sortBy === "name") {
      return a.keyword.localeCompare(b.keyword)
    } else if (sortBy === "value") {
      return b.currentValue - a.currentValue
    }
    return 0
  })

  // Close dropdown when clicking outside
  const handleClickOutside = (e, keyword) => {
    if (e.target.closest(`#frequency-menu-${keyword}`) === null) {
      setOpenFrequencyMenu(null)
    }
  }

  // Add event listener for clicking outside
  useEffect(() => {
    if (openFrequencyMenu) {
      const handleOutsideClick = (e) => handleClickOutside(e, openFrequencyMenu)
      document.addEventListener("mousedown", handleOutsideClick)
      return () => {
        document.removeEventListener("mousedown", handleOutsideClick)
      }
    }
  }, [openFrequencyMenu])

  useEffect(() => {
    // Check notification permission status on mount
    if (typeof Notification !== "undefined") {
      setPermissionStatus(Notification.permission)

      // If permission is denied, set permissionBlocked to true
      if (Notification.permission === "denied") {
        setPermissionBlocked(true)
      }
    }
  }, [])

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md transition-colors duration-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Saved Trends</h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-sm border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="date">Last Updated</option>
            <option value="name">Name</option>
            <option value="value">Current Value</option>
          </select>
        </div>
      </div>

      {permissionBlocked && (
        <div className="mb-4 p-3 bg-yellow-100 dark:bg-yellow-900 border border-yellow-400 dark:border-yellow-700 text-yellow-700 dark:text-yellow-200 rounded">
          <p className="font-medium">Notifications are blocked</p>
          <p className="text-sm mt-1">
            To enable notifications, please follow these steps:
            <ol className="list-decimal ml-5 mt-1">
              <li>Click the lock/info icon in your browser's address bar</li>
              <li>Find "Notifications" in the site settings</li>
              <li>Change the setting from "Block" to "Allow"</li>
              <li>Refresh this page</li>
            </ol>
          </p>
        </div>
      )}

      {sortedTrends.length === 0 ? (
        <div className="text-center py-10 text-gray-500 dark:text-gray-400">
          You haven't saved any trends yet. Search for trends and save them to monitor over time.
        </div>
      ) : (
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {sortedTrends.map((trend, index) => (
            <li key={index} className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                      <ChartBarIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{trend.keyword}</h3>
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <span>Current value: {trend.currentValue}</span>
                      <span className="mx-2">•</span>
                      <span>Last updated: {new Date(trend.lastUpdated).toLocaleDateString()}</span>
                      {trend.notificationsEnabled && (
                        <>
                          <span className="mx-2">•</span>
                          <span>Alerts: every {getFrequencyText(trend.notificationFrequency || "24h")}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <button
                      onClick={() => handleNotificationToggle(trend.keyword)}
                      className={`p-2 rounded-full ${
                        trend.notificationsEnabled
                          ? "bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400"
                      }`}
                      title={
                        trend.notificationsEnabled
                          ? `Notifications enabled (every ${getFrequencyText(trend.notificationFrequency || "24h")})`
                          : "Enable notifications"
                      }
                    >
                      <BellIcon className="w-5 h-5" />
                    </button>

                    {trend.notificationsEnabled && (
                      <button
                        onClick={() => toggleFrequencyMenu(trend.keyword)}
                        className="p-1 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 absolute -top-1 -right-1"
                        title="Set notification frequency"
                      >
                        <ChevronDownIcon className="w-3 h-3" />
                      </button>
                    )}

                    {/* Add a small badge showing frequency when notifications are enabled */}
                    {trend.notificationsEnabled && (
                      <span className="absolute -bottom-1 -right-1 text-[8px] font-bold bg-indigo-600 text-white rounded-full px-1 py-0.5 leading-none">
                        {trend.notificationFrequency || "24h"}
                      </span>
                    )}

                    {openFrequencyMenu === trend.keyword && (
                      <div
                        id={`frequency-menu-${trend.keyword}`}
                        className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 border border-gray-200 dark:border-gray-700"
                      >
                        <div className="py-1">
                          <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                            Notification Frequency
                          </div>
                          {[
                            { value: "15m", label: "Every 15 minutes" },
                            { value: "1h", label: "Every hour" },
                            { value: "3h", label: "Every 3 hours" },
                            { value: "6h", label: "Every 6 hours" },
                            { value: "24h", label: "Every 24 hours" },
                          ].map((option) => (
                            <button
                              key={option.value}
                              className={`block w-full text-left px-4 py-2 text-sm ${
                                (trend.notificationFrequency || "24h") === option.value
                                  ? "bg-indigo-50 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300"
                                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                              }`}
                              onClick={() => handleFrequencySelect(trend.keyword, option.value)}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => onView(trend.keyword)}
                    className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    title="View trend details"
                  >
                    <StarIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => onRemove(trend.keyword)}
                    className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                    title="Remove from saved trends"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      {/* {process.env.NODE_ENV === "development" && (
        <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded text-xs">
          <div className="font-bold mb-1">Debug Info:</div>
          <div>Notification Permission: {permissionStatus}</div>
          <div>Permission Blocked UI State: {permissionBlocked ? "Yes" : "No"}</div>
          <div>Trends with Notifications: {savedTrends.filter((t) => t.notificationsEnabled).length}</div>
        </div>
      )} */}
    </div>
  )
}

export default SavedTrendsList

