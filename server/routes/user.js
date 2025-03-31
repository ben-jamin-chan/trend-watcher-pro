// routes/users.js
import express from "express"
import User from "../models/User.js"

const router = express.Router()

// Create or update user
router.post("/", async (req, res) => {
  try {
    const { uid, displayName, email, preferences } = req.body

    // Check if user exists
    let user = await User.findOne({ uid })

    if (user) {
      // Update existing user
      user.displayName = displayName || user.displayName
      user.email = email || user.email
      if (preferences) {
        user.preferences = { ...user.preferences, ...preferences }
      }
      await user.save()
    } else {
      // Create new user
      user = new User({
        uid,
        displayName,
        email,
        preferences,
      })
      await user.save()
    }

    res.status(201).json(user)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Get user by uid
router.get("/:uid", async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.params.uid })
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }
    res.json(user)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Update user preferences
router.patch("/:uid/preferences", async (req, res) => {
  try {
    const { uid } = req.params
    const { preferences } = req.body

    console.log(`Received preferences update for user ${uid}:`, preferences)

    if (!preferences) {
      return res.status(400).json({ message: "Preferences are required" })
    }

    // Find the user
    let user = await User.findOne({ uid })

    // If user doesn't exist, create a new one
    if (!user) {
      console.log(`User ${uid} not found. Creating new user record.`)
      user = new User({
        uid,
        displayName: "User", // Default display name
        email: `${uid}@example.com`, // Default email (will be updated later)
        preferences: preferences,
      })
    } else {
      // Update preferences for existing user
      user.preferences = {
        ...user.preferences,
        ...preferences,
      }
    }

    await user.save()

    console.log(`Updated preferences for user ${uid}:`, user.preferences)

    // Return a proper success response
    return res.json({
      success: true,
      message: "Preferences updated successfully",
      preferences: user.preferences,
    })
  } catch (error) {
    console.error("Error updating user preferences:", error)
    return res.status(500).json({
      success: false,
      message: error.message || "An error occurred while updating preferences",
    })
  }
})

export default router

