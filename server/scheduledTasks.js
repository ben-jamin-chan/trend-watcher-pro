// scheduledTasks.js
import cron from "node-cron"
import SavedTrend from "./models/SavedTrend.js"
import Notification from "./models/Notification.js"
import { searchTrends } from "./services/trendsService.js"

// Helper function to determine if notification should be sent based on frequency
function shouldSendNotification(trend, now) {
  const lastUpdated = trend.lastUpdated ? new Date(trend.lastUpdated) : new Date(0)
  const frequency = trend.notificationFrequency || "24h"
  const minutesSinceLastUpdate = (now - lastUpdated) / (1000 * 60)

  console.log(`Checking trend "${trend.keyword}" with frequency "${frequency}"`)
  console.log(`Last updated: ${lastUpdated.toISOString()}`)
  console.log(`Minutes since last update: ${minutesSinceLastUpdate.toFixed(2)}`)

  let shouldSend = false

  switch (frequency) {
    case "15m":
      shouldSend = minutesSinceLastUpdate >= 15
      break
    case "1h":
      shouldSend = minutesSinceLastUpdate >= 60
      break
    case "3h":
      shouldSend = minutesSinceLastUpdate >= 180
      break
    case "6h":
      shouldSend = minutesSinceLastUpdate >= 360
      break
    case "24h":
      shouldSend = minutesSinceLastUpdate >= 1440
      break
    default:
      shouldSend = minutesSinceLastUpdate >= 1440 // Default to 24h
  }

  console.log(`Should send notification: ${shouldSend}`)
  return shouldSend
}

// Function to check trends and create notifications
async function checkTrendsAndNotify() {
  console.log("Running scheduled trend check...")
  const now = new Date()

  try {
    // Get all saved trends with notifications enabled
    const trendsWithNotifications = await SavedTrend.find({
      notificationsEnabled: true,
    })

    console.log(`Found ${trendsWithNotifications.length} trends with notifications enabled`)

    // Process each trend
    for (const trend of trendsWithNotifications) {
      // Check if it's time to send notification based on frequency
      if (!shouldSendNotification(trend, now)) {
        continue
      }

      try {
        // Get current trend data
        const params = {
          keyword: trend.keyword,
          timeRange: trend.timeRange || "1m",
        }

        console.log(`Fetching current data for trend: ${trend.keyword}`)
        const trendData = await searchTrends(params)
        const formattedData = formatTrendData(trendData)

        if (!formattedData || formattedData.length === 0) {
          console.log(`No data found for trend: ${trend.keyword}`)
          continue
        }

        // Get the latest value
        const currentValue = formattedData[formattedData.length - 1].value
        const previousValue = trend.currentValue || 0

        console.log(`Previous value: ${previousValue}, Current value: ${currentValue}`)

        // Calculate percent change
        let percentChange = 0
        if (previousValue > 0) {
          percentChange = ((currentValue - previousValue) / previousValue) * 100
        } else if (currentValue > 0) {
          percentChange = 100 // If previous was 0, and current is not, that's a 100% increase
        }

        console.log(`Percent change for ${trend.keyword}: ${percentChange.toFixed(2)}%`)

        // Always create a notification when it's time based on frequency
        const direction = percentChange > 0 ? "up" : "down"
        let message = ""

        if (Math.abs(percentChange) >= 5) {
          message = `Interest has gone ${direction} by ${Math.abs(percentChange).toFixed(1)}%`
        } else {
          message = `No significant change in interest (${percentChange.toFixed(1)}%)`
        }

        // Create notification
        const notification = new Notification({
          userId: trend.userId,
          title: `Trend Alert: ${trend.keyword}`,
          message: message,
          keyword: trend.keyword,
          percentChange: percentChange,
          read: false,
        })

        await notification.save()

        // Update trend with new value
        trend.currentValue = currentValue
        trend.lastUpdated = now
        await trend.save()

        console.log(`Created notification for ${trend.keyword} (User: ${trend.userId})`)
      } catch (error) {
        console.error(`Error processing trend ${trend.keyword}:`, error)
      }
    }

    console.log("Scheduled trend check completed")
  } catch (error) {
    console.error("Error in scheduled trend check:", error)
  }
}

// Helper function to format trend data
function formatTrendData(apiData) {
  if (!apiData || !apiData.default || !apiData.default.timelineData) {
    return []
  }

  return apiData.default.timelineData.map((point) => ({
    date: point.formattedTime,
    value: point.value[0],
  }))
}

// Schedule tasks to run
export function startScheduledTasks() {
  // Run every 15 minutes
  cron.schedule("*/15 * * * *", checkTrendsAndNotify)

  // Also run once at startup for testing
  console.log("Running initial trend check for testing...")
  setTimeout(() => {
    checkTrendsAndNotify()
  }, 5000) // Wait 5 seconds after server start

  console.log("Scheduled tasks started")
}

