"use client"

import { useState } from "react"

function UserProfile({ user, onUpdateProfile, onUpdatePreferences }) {
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [profileData, setProfileData] = useState({
    displayName: user.displayName || "",
    email: user.email || "",
  })

  const [preferences, setPreferences] = useState({
    emailNotifications: user.preferences?.emailNotifications || false,
    notificationFrequency: user.preferences?.notificationFrequency || "daily",
    defaultTimeRange: user.preferences?.defaultTimeRange || "1m",
    defaultRegion: user.preferences?.defaultRegion || "US",
  })

  const handleProfileChange = (e) => {
    const { name, value } = e.target
    setProfileData({
      ...profileData,
      [name]: value,
    })
  }

  const handlePreferenceChange = (e) => {
    const { name, value, type, checked } = e.target
    setPreferences({
      ...preferences,
      [name]: type === "checkbox" ? checked : value,
    })
  }

  const handleProfileSubmit = (e) => {
    e.preventDefault()
    onUpdateProfile(profileData)
    setIsEditingProfile(false)
  }

  // Add state for feedback messages
  const [preferencesSaved, setPreferencesSaved] = useState(false)
  const [preferencesError, setPreferencesError] = useState(null)

  // Update the handlePreferencesSubmit function to be async and show feedback
  const handlePreferencesSubmit = async (e) => {
    e.preventDefault()
    try {
      setPreferencesSaved(false)
      setPreferencesError(null)

      console.log("Submitting preferences:", preferences)

      // Show loading state
      const submitButton = e.target.querySelector('button[type="submit"]')
      if (submitButton) {
        submitButton.disabled = true
        submitButton.innerText = "Saving..."
      }

      await onUpdatePreferences(preferences)

      // Show success message
      setPreferencesSaved(true)
      setTimeout(() => setPreferencesSaved(false), 3000)
    } catch (error) {
      console.error("Error saving preferences:", error)
      setPreferencesError(error.message || "Failed to save preferences. Please try again.")
    } finally {
      // Reset button state
      const submitButton = e.target.querySelector('button[type="submit"]')
      if (submitButton) {
        submitButton.disabled = false
        submitButton.innerText = "Save Preferences"
      }
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-colors duration-200">
      <div className="px-6 py-4 bg-indigo-600 dark:bg-indigo-700">
        <h2 className="text-xl font-bold text-white">User Profile</h2>
      </div>

      <div className="p-6">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Profile Information</h3>
            <button
              type="button"
              onClick={() => setIsEditingProfile(!isEditingProfile)}
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
            >
              {isEditingProfile ? "Cancel" : "Edit Profile"}
            </button>
          </div>

          {isEditingProfile ? (
            <form onSubmit={handleProfileSubmit}>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label
                    htmlFor="displayName"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Display Name
                  </label>
                  <input
                    type="text"
                    id="displayName"
                    name="displayName"
                    value={profileData.displayName}
                    onChange={handleProfileChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={profileData.email}
                    onChange={handleProfileChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 cursor-not-allowed opacity-75"
                    disabled
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Email cannot be changed</p>
                </div>

                <div className="mt-2">
                  <button
                    type="submit"
                    className="w-full bg-indigo-600 dark:bg-indigo-700 text-white py-2 px-4 rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-900"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              <div>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Display Name</div>
                <div className="text-lg text-gray-900 dark:text-gray-100">{user.displayName || "Not set"}</div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</div>
                <div className="text-lg text-gray-900 dark:text-gray-100">{user.email}</div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-gray-100">Preferences</h3>

          <form onSubmit={handlePreferencesSubmit}>
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="emailNotifications"
                  name="emailNotifications"
                  checked={preferences.emailNotifications}
                  onChange={handlePreferenceChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded"
                />
                <label htmlFor="emailNotifications" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Receive email notifications
                </label>
              </div>

              {preferences.emailNotifications && (
                <div>
                  <label
                    htmlFor="notificationFrequency"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Notification Frequency
                  </label>
                  <select
                    id="notificationFrequency"
                    name="notificationFrequency"
                    value={preferences.notificationFrequency}
                    onChange={handlePreferenceChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="significant">Only Significant Changes</option>
                  </select>
                </div>
              )}

              <div>
                <label
                  htmlFor="defaultTimeRange"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Default Time Range
                </label>
                <select
                  id="defaultTimeRange"
                  name="defaultTimeRange"
                  value={preferences.defaultTimeRange}
                  onChange={handlePreferenceChange}
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
                <label
                  htmlFor="defaultRegion"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Default Region
                </label>
                <select
                  id="defaultRegion"
                  name="defaultRegion"
                  value={preferences.defaultRegion}
                  onChange={handlePreferenceChange}
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

              {preferencesSaved && (
                <div className="p-2 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded">
                  Preferences saved successfully!
                </div>
              )}
              {preferencesError && (
                <div className="p-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded">
                  {preferencesError}
                </div>
              )}

              <div className="mt-2">
                <button
                  type="submit"
                  className="w-full bg-indigo-600 dark:bg-indigo-700 text-white py-2 px-4 rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-900"
                >
                  Save Preferences
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default UserProfile

  