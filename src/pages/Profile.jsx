"use client"

import { useState, useContext, useEffect } from "react"
import UserProfile from "../components/user/UserProfile"
import { AuthContext } from "../context/AuthContext"
import { getUserPreferences, updateUserPreferences } from "../services/api" // Add this import

function Profile() {
  const { currentUser, updateUserProfile } = useContext(AuthContext)
  const [preferences, setPreferences] = useState({
    emailNotifications: false,
    notificationFrequency: "daily",
    defaultTimeRange: "1m",
    defaultRegion: "US",
  })
  const [loading, setLoading] = useState(true)

  // Load user preferences when component mounts
  useEffect(() => {
    async function loadUserPreferences() {
      if (!currentUser) return

      try {
        setLoading(true)
        const userPrefs = await getUserPreferences(currentUser.uid)
        if (userPrefs) {
          console.log("Loaded user preferences:", userPrefs)
          setPreferences(userPrefs)
        }
      } catch (error) {
        console.error("Error loading user preferences:", error)
      } finally {
        setLoading(false)
      }
    }

    loadUserPreferences()
  }, [currentUser])

  const handleUpdateProfile = async (profileData) => {
    try {
      await updateUserProfile({
        displayName: profileData.displayName,
      })
    } catch (error) {
      console.error("Error updating profile:", error)
    }
  }

  const handleUpdatePreferences = async (newPreferences) => {
    try {
      console.log("Updating preferences:", newPreferences)

      // Save to database
      if (currentUser) {
        const result = await updateUserPreferences(currentUser.uid, newPreferences)
        console.log("Preferences update result:", result)

        if (!result.success && result.message) {
          throw new Error(result.message)
        }

        // Update local state
        setPreferences(newPreferences)
        return true
      } else {
        throw new Error("User not authenticated")
      }
    } catch (error) {
      console.error("Error updating preferences:", error)
      throw error
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Your Profile</h1>

      <UserProfile
        user={{
          ...currentUser,
          preferences,
        }}
        onUpdateProfile={handleUpdateProfile}
        onUpdatePreferences={handleUpdatePreferences}
      />
    </div>
  )
}

export default Profile

