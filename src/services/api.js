// src/services/api.js
// Safely get the API URL with fallback
const getApiUrl = () => {
  try {
    return process.env.REACT_APP_API_URL || "http://localhost:5001/api"
  } catch (error) {
    console.warn("Error accessing environment variables, using fallback URL")
    return "http://localhost:5001/api"
  }
}

const API_URL = getApiUrl()

console.log("API URL being used:", API_URL)

// Update the DEFAULT_GEO_DATA to include country names
const DEFAULT_GEO_DATA = {
  regions: [
    { code: "US", name: "United States", value: 100 },
    { code: "GB", name: "United Kingdom", value: 80 },
    { code: "CA", name: "Canada", value: 70 },
    { code: "AU", name: "Australia", value: 65 },
    { code: "DE", name: "Germany", value: 60 },
    { code: "FR", name: "France", value: 55 },
    { code: "JP", name: "Japan", value: 50 },
    { code: "BR", name: "Brazil", value: 45 },
    { code: "IN", name: "India", value: 40 },
    { code: "RU", name: "Russia", value: 35 },
    { code: "CN", name: "China", value: 30 },
    { code: "IT", name: "Italy", value: 48 },
    { code: "ES", name: "Spain", value: 42 },
    { code: "MX", name: "Mexico", value: 38 },
    { code: "KR", name: "South Korea", value: 58 },
    { code: "NL", name: "Netherlands", value: 52 },
    { code: "SE", name: "Sweden", value: 47 },
    { code: "CH", name: "Switzerland", value: 56 },
    { code: "SG", name: "Singapore", value: 62 },
    { code: "ZA", name: "South Africa", value: 33 },
  ],
}

// ISO code mapping for standardization
const COUNTRY_CODE_MAP = {
  // Common variations to standardized ISO codes
  "USA": "US",
  "United States": "US",
  "UK": "GB",
  "England": "GB",
  "Britain": "GB",
  "United Kingdom": "GB",
  "Deutschland": "DE",
  "Germany": "DE",
  "France": "FR",
  "Italia": "IT",
  "Italy": "IT",
  "Japan": "JP",
  "Brasil": "BR",
  "Brazil": "BR",
  "Россия": "RU",
  "Russia": "RU",
  "Canada": "CA",
  "Australia": "AU",
  "India": "IN",
  "China": "CN",
  "中国": "CN",
  "España": "ES",
  "Spain": "ES",
  "Mexico": "MX", 
  "México": "MX",
  "South Korea": "KR",
  "Korea": "KR",
  "대한민국": "KR",
  "Nederland": "NL",
  "Netherlands": "NL",
  "Sverige": "SE",
  "Sweden": "SE",
  "Switzerland": "CH",
  "Schweiz": "CH",
  "Suisse": "CH",
  "Singapore": "SG",
  "South Africa": "ZA",
};

// Helper function to generate mock data based on timeRange
const generateMockTimelineData = (timeRange) => {
  const now = new Date()
  let startTime
  let dataPoints = 30 // Default for 1m
  let interval = 24 * 60 * 60 * 1000 // Default daily interval

  // Determine start time and data points based on time range
  switch (timeRange) {
    case "1d":
      startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      dataPoints = 24
      interval = 60 * 60 * 1000 // Hourly
      break
    case "7d":
      startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      dataPoints = 7
      interval = 24 * 60 * 60 * 1000 // Daily
      break
    case "1m":
      startTime = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
      dataPoints = 30
      interval = 24 * 60 * 60 * 1000 // Daily
      break
    case "3m":
      startTime = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
      dataPoints = 12
      interval = 7 * 24 * 60 * 60 * 1000 // Weekly
      break
    case "12m":
      startTime = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
      dataPoints = 12
      interval = 30 * 24 * 60 * 60 * 1000 // Monthly
      break
    case "5y":
      startTime = new Date(now.getFullYear() - 5, now.getMonth(), now.getDate())
      dataPoints = 20
      interval = 3 * 30 * 24 * 60 * 60 * 1000 // Quarterly
      break
    default:
      startTime = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
  }

  // Generate data points
  return Array.from({ length: dataPoints }, (_, i) => {
    const date = new Date(startTime.getTime() + i * interval)
    return {
      time: Math.floor(date.getTime() / 1000),
      formattedTime: date.toISOString().split("T")[0],
      value: [Math.floor(Math.random() * 100)],
    }
  })
}

// Helper function to safely format trend data
export const formatTrendData = (apiData, timeRange) => {
  try {
    // Check if we have valid data
    if (!apiData || !apiData.default || !apiData.default.timelineData) {
      console.warn("Invalid trend data format received, using mock data")

      // Generate mock data based on time range
      const mockTimelineData = generateMockTimelineData(timeRange)

      return mockTimelineData.map((point) => ({
        date: point.formattedTime,
        value: point.value[0],
      }))
    }

    // Format the data
    return apiData.default.timelineData.map((point) => ({
      date: point.formattedTime,
      value: point.value[0],
    }))
  } catch (error) {
    console.error("Error formatting trend data:", error)

    // Return mock data on error
    const mockTimelineData = generateMockTimelineData(timeRange)
    return mockTimelineData.map((point) => ({
      date: point.formattedTime,
      value: point.value[0],
    }))
  }
}

// Helper function to safely format geo data
export const formatGeoData = (apiData) => {
  try {
    // Check if we have valid data
    if (!apiData || !apiData.default || !apiData.default.geoMapData || !Array.isArray(apiData.default.geoMapData)) {
      console.warn("Invalid geo data format received, using default data")
      return DEFAULT_GEO_DATA
    }

    // Format the data
    const formattedRegions = apiData.default.geoMapData
      .map((region) => {
        if (!region) return null

        // Extract the value - handle both array and direct value formats
        let value = 0
        if (Array.isArray(region.value) && region.value.length > 0) {
          value = region.value[0]
        } else if (typeof region.value === "number") {
          value = region.value
        } else if (region.formattedValue) {
          // Some API responses use formattedValue instead
          value = Number.parseInt(region.formattedValue.replace("%", "")) || 0
        }

        // Get the region code, standardizing it if necessary
        let code = region.geoCode || region.countryCode || region.code || "XX"
        const name = region.geoName || region.country || region.name || code

        // Check if the code needs standardization via our mapping
        if (COUNTRY_CODE_MAP[code]) {
          code = COUNTRY_CODE_MAP[code]
        } else if (COUNTRY_CODE_MAP[name]) {
          code = COUNTRY_CODE_MAP[name]
        }

        // Ensure code is uppercase
        code = code.toUpperCase()

        return {
          code: code,
          name: name,
          value: Math.min(100, Math.max(0, value)), // Clamp value between 0-100
        }
      })
      .filter((region) => region && region.code !== "XX") // Filter out invalid regions

    // If we don't have enough data, supplement with some default regions
    if (formattedRegions.length < 5) {
      console.warn("Not enough geo data points, supplementing with default data")
      
      // Get codes we already have
      const existingCodes = new Set(formattedRegions.map(region => region.code))
      
      // Add some default regions if they don't already exist
      DEFAULT_GEO_DATA.regions.forEach(defaultRegion => {
        if (!existingCodes.has(defaultRegion.code)) {
          // Add with lower values to distinguish from real data
          formattedRegions.push({
            ...defaultRegion,
            value: Math.floor(defaultRegion.value * 0.5) // Use 50% of default value
          })
          
          // Only add a few to supplement
          if (formattedRegions.length >= 15) return
        }
      })
    }

    return {
      regions: formattedRegions,
    }
  } catch (error) {
    console.error("Error formatting geo data:", error)
    return DEFAULT_GEO_DATA
  }
}

// Safe fetch wrapper with error handling and timeout
const safeFetch = async (url, options = {}) => {
  try {
    // Add timeout to fetch
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error(`Error fetching ${url}:`, error)
    throw error
  }
}

// Function to get notifications for a user
export const getNotifications = async (userId) => {
  try {
    return await safeFetch(`${API_URL}/notifications/user/${userId}`)
  } catch (error) {
    console.error("Error fetching notifications:", error)
    // Return empty array as fallback
    return []
  }
}

// Function to mark a notification as read
export const markNotificationAsRead = async (notificationId) => {
  try {
    return await safeFetch(`${API_URL}/notifications/${notificationId}/read`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
    })
  } catch (error) {
    console.error("Error marking notification as read:", error)
    // Return mock success response
    return { success: true, message: "Notification marked as read (offline mode)" }
  }
}

// Function to mark all notifications as read for a user
export const markAllNotificationsAsRead = async (userId) => {
  try {
    return await safeFetch(`${API_URL}/notifications/user/${userId}/read-all`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
    })
  } catch (error) {
    console.error("Error marking all notifications as read:", error)
    // Return mock success response
    return { success: true, message: "All notifications marked as read (offline mode)" }
  }
}

// Function to get saved trends for a user
export const getSavedTrends = async (userId) => {
  try {
    return await safeFetch(`${API_URL}/saved-trends/user/${userId}`)
  } catch (error) {
    console.error("Error fetching saved trends:", error)
    // Return empty array as fallback
    return []
  }
}

// Function to save a trend
export const saveTrend = async (trendData) => {
  try {
    return await safeFetch(`${API_URL}/saved-trends`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(trendData),
    })
  } catch (error) {
    console.error("Error saving trend:", error)
    // Return mock success response with the data that was attempted to be saved
    return { ...trendData, id: "local-" + Date.now(), message: "Saved locally (offline mode)" }
  }
}

// Function to delete a saved trend
export const deleteSavedTrend = async (keyword, userId) => {
  try {
    return await safeFetch(`${API_URL}/saved-trends/keyword/${encodeURIComponent(keyword)}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    })
  } catch (error) {
    console.error("Error deleting saved trend:", error)
    // Return mock success response
    return { success: true, message: "Trend deleted (offline mode)" }
  }
}

// Function to search trends
export const searchTrends = async (searchParams) => {
  try {
    const { keyword, timeRange, geo, category } = searchParams
    let url = `${API_URL}/trends/search?keyword=${encodeURIComponent(keyword)}`
    if (timeRange) url += `&timeRange=${timeRange}`
    if (geo) url += `&geo=${geo}`
    if (category) url += `&category=${category}`

    console.log("Searching trends with URL:", url)

    const result = await safeFetch(url)
    console.log("Search result:", result)
    return result
  } catch (error) {
    console.error("Error searching trends:", error)

    // Return mock data based on the time range
    return {
      default: {
        timelineData: generateMockTimelineData(searchParams.timeRange || "1m"),
      },
    }
  }
}

// Function to toggle trend notification
export const toggleTrendNotification = async (keyword, userId) => {
  try {
    return await safeFetch(`${API_URL}/saved-trends/keyword/${encodeURIComponent(keyword)}/toggle-notification`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
    })
  } catch (error) {
    console.error("Error toggling trend notification:", error)
    // Return mock success response
    return { success: true, message: "Notification toggled (offline mode)" }
  }
}

// Function to get geographic data
export const getGeoData = async (keyword, timeRange) => {
  try {
    let url = `${API_URL}/trends/geo?keyword=${encodeURIComponent(keyword)}`
    if (timeRange) {
      url += `&timeRange=${timeRange}`
    }

    console.log("Fetching geo data with URL:", url)

    const response = await safeFetch(url)
    return response
  } catch (error) {
    console.error("Error fetching geo data:", error)
    // Generate mock geo data based on keyword
    return generateMockGeoData(keyword)
  }
}

// Helper function to generate mock geo data that varies by keyword
const generateMockGeoData = (keyword) => {
  // Create a seed from the keyword for consistent but varied results
  const seedValue = keyword.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)
  
  // Simple pseudo-random number generator
  const seededRandom = (min, max) => {
    const seed = (seedValue * (max - min)) % 83;
    return Math.floor(min + (seed % (max - min + 1)));
  };
  
  // Base data with all countries that will be used
  const baseCountries = [
    { geoCode: "US", geoName: "United States" },
    { geoCode: "IN", geoName: "India" },
    { geoCode: "GB", geoName: "United Kingdom" },
    { geoCode: "CA", geoName: "Canada" },
    { geoCode: "AU", geoName: "Australia" },
    { geoCode: "DE", geoName: "Germany" },
    { geoCode: "FR", geoName: "France" },
    { geoCode: "BR", geoName: "Brazil" },
    { geoCode: "JP", geoName: "Japan" },
    { geoCode: "RU", geoName: "Russia" },
    { geoCode: "CN", geoName: "China" },
    { geoCode: "IT", geoName: "Italy" },
    { geoCode: "ES", geoName: "Spain" },
    { geoCode: "MX", geoName: "Mexico" },
    { geoCode: "KR", geoName: "South Korea" },
    { geoCode: "NL", geoName: "Netherlands" },
    { geoCode: "SE", geoName: "Sweden" },
    { geoCode: "CH", geoName: "Switzerland" },
    { geoCode: "SG", geoName: "Singapore" },
    { geoCode: "ZA", geoName: "South Africa" },
  ];
  
  // Different patterns based on keyword categories
  const keywordPatterns = {
    tech: ["US", "IN", "CN", "JP", "KR", "SG", "DE", "GB"],
    food: ["IT", "FR", "JP", "MX", "IN", "US", "ES"],
    travel: ["FR", "IT", "ES", "US", "AU", "JP", "CH"],
    finance: ["US", "GB", "CH", "SG", "JP", "DE", "HK"],
    sports: ["BR", "US", "GB", "ES", "DE", "FR", "AU"],
    health: ["US", "GB", "CA", "AU", "IN", "DE", "FR"],
    entertainment: ["US", "GB", "IN", "KR", "JP", "BR", "FR"],
    fashion: ["FR", "IT", "US", "GB", "JP", "KR", "ES"],
  };
  
  // Try to match the keyword to a category
  const techKeywords = ["computer", "software", "tech", "digital", "app", "web", "phone", "ai", "cloud", "crypto"];
  const foodKeywords = ["food", "recipe", "cook", "restaurant", "cuisine", "chef", "eat", "diet", "drink"];
  const travelKeywords = ["travel", "vacation", "hotel", "flight", "tourism", "destination", "beach", "mountain"];
  const financeKeywords = ["finance", "invest", "stock", "market", "bank", "money", "economic", "fund"];
  const sportsKeywords = ["sport", "football", "soccer", "basketball", "tennis", "baseball", "athlete", "game"];
  const healthKeywords = ["health", "fitness", "exercise", "wellness", "medical", "doctor", "hospital", "diet"];
  const entertainmentKeywords = ["movie", "music", "celebrity", "tv", "show", "concert", "actor", "film"];
  const fashionKeywords = ["fashion", "style", "clothing", "dress", "design", "model", "brand", "wear"];
  
  let category = "general"; // Default category
  const lowerKeyword = keyword.toLowerCase();
  
  if (techKeywords.some(k => lowerKeyword.includes(k))) category = "tech";
  else if (foodKeywords.some(k => lowerKeyword.includes(k))) category = "food";
  else if (travelKeywords.some(k => lowerKeyword.includes(k))) category = "travel";
  else if (financeKeywords.some(k => lowerKeyword.includes(k))) category = "finance";
  else if (sportsKeywords.some(k => lowerKeyword.includes(k))) category = "sports";
  else if (healthKeywords.some(k => lowerKeyword.includes(k))) category = "health";
  else if (entertainmentKeywords.some(k => lowerKeyword.includes(k))) category = "entertainment";
  else if (fashionKeywords.some(k => lowerKeyword.includes(k))) category = "fashion";
  
  // Create a pattern of high-value countries based on the category
  const highValueCountries = keywordPatterns[category] || ["US", "GB", "IN", "CA", "AU"];
  
  // Generate the map data with values influenced by the category
  const geoMapData = baseCountries.map(country => {
    let baseValue;
    
    if (highValueCountries.includes(country.geoCode)) {
      // High value for priority countries in this category
      baseValue = seededRandom(65, 100);
    } else {
      // Lower values for others
      baseValue = seededRandom(10, 65);
    }
    
    // Add some randomness
    let finalValue = Math.max(5, Math.min(100, baseValue + seededRandom(-10, 10)));
    
    return {
      ...country,
      value: [finalValue]
    };
  });
  
  return {
    default: {
      geoMapData
    }
  };
};

// Add these functions to handle user preferences

// Function to get user preferences
export const getUserPreferences = async (userId) => {
  try {
    const response = await fetch(`${API_URL}/users/${userId}`)

    if (response.status === 404) {
      console.log("User not found, creating default preferences")
      // User doesn't exist yet, return default preferences
      return {
        emailNotifications: false,
        notificationFrequency: "daily",
        defaultTimeRange: "1m",
        defaultRegion: "US",
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `Server responded with status ${response.status}`)
    }

    const userData = await response.json()
    console.log("Got user data from API:", userData)

    return (
      userData.preferences || {
        emailNotifications: false,
        notificationFrequency: "daily",
        defaultTimeRange: "1m",
        defaultRegion: "US",
      }
    )
  } catch (error) {
    console.error("Error fetching user preferences:", error)
    // Return default preferences as fallback
    return {
      emailNotifications: false,
      notificationFrequency: "daily",
      defaultTimeRange: "1m",
      defaultRegion: "US",
    }
  }
}

// Function to update user preferences
export const updateUserPreferences = async (userId, preferences) => {
  try {
    console.log(`Sending preferences update to ${API_URL}/users/${userId}/preferences:`, preferences)

    const response = await fetch(`${API_URL}/users/${userId}/preferences`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ preferences }),
    })

    // If user not found, try to create the user first
    if (response.status === 404) {
      console.log("User not found during preference update, attempting to create user")

      // Try to create a default user with these preferences
      const createResponse = await fetch(`${API_URL}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uid: userId,
          displayName: "User", // Default name
          email: `${userId}@example.com`, // Default email
          preferences: preferences,
        }),
      })

      if (!createResponse.ok) {
        throw new Error("Failed to create user record")
      }

      return {
        success: true,
        message: "Created new user with preferences",
        preferences: preferences,
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `Server responded with status ${response.status}`)
    }

    const data = await response.json()
    console.log("Preferences update response:", data)
    return data
  } catch (error) {
    console.error("Error updating user preferences:", error)
    throw error
  }
}

// Add this function to the existing api.js file

// Function to create or update a user
export const createOrUpdateUser = async (userData) => {
  try {
    console.log("Creating/updating user:", userData)

    const response = await fetch(`${API_URL}/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `Server responded with status ${response.status}`)
    }

    const data = await response.json()
    console.log("User create/update response:", data)
    return data
  } catch (error) {
    console.error("Error creating/updating user:", error)
    throw error
  }
}

