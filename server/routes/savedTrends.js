import express from "express"
const router = express.Router()
import SavedTrend from "../models/SavedTrend.js"

// Get all saved trends for a user
router.get("/user/:userId", async (req, res) => {
  try {
    console.log("=== GET SAVED TRENDS REQUEST ===")
    console.log("Request params:", req.params)
    console.log("User ID from params:", req.params.userId)
    
    const savedTrends = await SavedTrend.find({ userId: req.params.userId })
    
    console.log("=== DATABASE QUERY RESULTS ===")
    console.log("Number of saved trends found:", savedTrends.length)
    
    if (savedTrends.length > 0) {
      savedTrends.forEach((trend, index) => {
        console.log(`DB Trend ${index + 1}:`, {
          _id: trend._id,
          keyword: trend.keyword,
          userId: trend.userId,
          timeRange: trend.timeRange,
          notificationsEnabled: trend.notificationsEnabled,
          lastUpdated: trend.lastUpdated
        })
      })
    } else {
      console.log("No saved trends found in database for userId:", req.params.userId)
    }
    
    res.json(savedTrends)
  } catch (error) {
    console.error("=== GET SAVED TRENDS ERROR ===")
    console.error("Error fetching saved trends:", error)
    res.status(500).json({ message: error.message })
  }
})

// Save a new trend
router.post("/", async (req, res) => {
  try {
    console.log("=== SAVE TREND REQUEST RECEIVED ===")
    console.log("Request body:", req.body)
    console.log("Request headers:", req.headers)
    
    const { userId, keyword, timeRange, currentValue, data, notificationsEnabled, notificationFrequency } = req.body

    if (!userId || !keyword) {
      console.log("Missing required fields:", { userId, keyword })
      return res.status(400).json({ message: "userId and keyword are required" })
    }

    console.log(`Checking for existing trend: userId=${userId}, keyword=${keyword}`)
    
    // Check if this trend already exists by the user with timeout
    let existingTrend
    try {
      console.log("Starting database query...")
      existingTrend = await Promise.race([
        SavedTrend.findOne({ userId, keyword }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database query timeout')), 10000)
        )
      ])
      console.log("Database query completed. Existing trend found:", !!existingTrend)
      if (existingTrend) {
        console.log("Existing trend details:", {
          _id: existingTrend._id,
          keyword: existingTrend.keyword,
          userId: existingTrend.userId,
          lastUpdated: existingTrend.lastUpdated
        })
      }
    } catch (dbError) {
      console.error("=== DATABASE QUERY ERROR ===")
      console.error("Error details:", dbError)
      console.error("Query parameters:", { userId, keyword })
      return res.status(500).json({ 
        message: "Database query failed", 
        error: dbError.message,
        details: "Unable to check for existing trend"
      })
    }

    if (existingTrend) {
      // Update existing trend
      existingTrend.timeRange = timeRange || existingTrend.timeRange
      existingTrend.lastUpdated = new Date()
      existingTrend.currentValue = currentValue !== undefined ? currentValue : existingTrend.currentValue
      existingTrend.data = data || existingTrend.data

      // Only update these fields if they are provided
      if (notificationsEnabled !== undefined) {
        existingTrend.notificationsEnabled = notificationsEnabled
      }

      if (notificationFrequency) {
        existingTrend.notificationFrequency = notificationFrequency
      }

      console.log("=== UPDATING EXISTING TREND ===")
      try {
        const updatedTrend = await existingTrend.save()
        console.log("Trend updated successfully:", {
          _id: updatedTrend._id,
          keyword: updatedTrend.keyword,
          lastUpdated: updatedTrend.lastUpdated
        })
        return res.status(200).json(updatedTrend)
      } catch (saveError) {
        console.error("Error saving existing trend:", saveError)
        return res.status(500).json({ 
          message: "Failed to update existing trend", 
          error: saveError.message 
        })
      }
    } else {
      console.log("=== CREATING NEW TREND ===")
      try {
        // Create new saved trend
        const newTrend = new SavedTrend({
          userId,
          keyword,
          timeRange,
          currentValue,
          data,
          notificationsEnabled: notificationsEnabled || false,
          notificationFrequency: notificationFrequency || "24h",
        })

        console.log("Attempting to save new trend...")
        const savedTrend = await newTrend.save()
        
        console.log("=== NEW TREND SAVED SUCCESSFULLY ===")
        console.log("Saved trend details:", {
          _id: savedTrend._id,
          keyword: savedTrend.keyword,
          userId: savedTrend.userId,
          timeRange: savedTrend.timeRange,
          lastUpdated: savedTrend.lastUpdated
        })
        
        res.status(201).json(savedTrend)
      } catch (saveError) {
        console.error("=== ERROR CREATING NEW TREND ===")
        console.error("Save error details:", saveError)
        return res.status(500).json({ 
          message: "Failed to create new trend", 
          error: saveError.message,
          stack: saveError.stack
        })
      }
    }
  } catch (error) {
    console.error("Error saving trend:", error)
    res.status(500).json({ message: error.message })
  }
})

// Toggle notifications for a saved trend
router.patch("/keyword/:keyword/toggle-notification", async (req, res) => {
  try {
    const { keyword } = req.params
    const { userId } = req.query // Add userId as a query parameter

    // Find the trend by keyword and userId
    const query = { keyword }
    if (userId) {
      query.userId = userId
    }

    const savedTrend = await SavedTrend.findOne(query)

    if (!savedTrend) {
      return res.status(404).json({ message: "Saved trend not found" })
    }

    savedTrend.notificationsEnabled = !savedTrend.notificationsEnabled
    await savedTrend.save()

    res.json(savedTrend)
  } catch (error) {
    console.error("Error toggling notification:", error)
    res.status(500).json({ message: error.message })
  }
})

// Update notification frequency for a saved trend
router.patch("/keyword/:keyword/notification-frequency", async (req, res) => {
  try {
    const { keyword } = req.params
    const { frequency, userId } = req.body

    console.log(
      `Received request to update frequency for keyword: ${keyword}, userId: ${userId}, frequency: ${frequency}`,
    )

    if (!frequency) {
      console.log("Frequency is missing in request")
      return res.status(400).json({ message: "Frequency is required" })
    }

    // Validate frequency value
    const validFrequencies = ["15m", "1h", "3h", "6h", "24h"]
    if (!validFrequencies.includes(frequency)) {
      console.log(`Invalid frequency value: ${frequency}`)
      return res.status(400).json({
        message: "Invalid frequency value. Must be one of: 15m, 1h, 3h, 6h, 24h",
      })
    }

    // Find the trend by keyword and userId
    const query = { keyword }
    if (userId) {
      query.userId = userId
    }

    console.log(`Looking for trend with query:`, query)
    const savedTrend = await SavedTrend.findOne(query)

    if (!savedTrend) {
      console.log(`Trend not found for query:`, query)
      return res.status(404).json({ message: "Saved trend not found" })
    }

    console.log(`Found trend:`, savedTrend)

    // Update the notification frequency
    savedTrend.notificationFrequency = frequency

    // If notifications aren't enabled, enable them
    if (!savedTrend.notificationsEnabled) {
      savedTrend.notificationsEnabled = true
    }

    // Save the updated trend
    await savedTrend.save()

    console.log(`Updated notification frequency for ${keyword} to ${frequency}`)
    console.log(`Updated trend:`, savedTrend)

    res.json(savedTrend)
  } catch (error) {
    console.error("Error updating notification frequency:", error)
    res.status(500).json({ message: error.message })
  }
})

// DELETE a saved trend by keyword
router.delete("/keyword/:keyword", async (req, res) => {
  try {
    const { keyword } = req.params
    const { userId } = req.query // Add userId as a query parameter

    console.log(`Backend received request to delete trend with keyword: ${keyword}`)

    // Find the trend by keyword and userId
    const query = { keyword }
    if (userId) {
      query.userId = userId
    }

    // Find the trend by keyword
    const savedTrend = await SavedTrend.findOne(query)

    if (!savedTrend) {
      console.log(`Trend with keyword "${keyword}" not found`)
      return res.status(404).json({ message: "Saved trend not found" })
    }

    // Delete the trend
    await SavedTrend.findByIdAndDelete(savedTrend._id)
    console.log(`Trend with keyword "${keyword}" deleted successfully`)

    res.json({ message: "Saved trend deleted successfully" })
  } catch (error) {
    console.error("Error deleting trend:", error)
    res.status(500).json({ message: error.message })
  }
})

export default router

