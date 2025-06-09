// routes/trends.js
import express from "express"
import googleTrends from "google-trends-api"
import { searchTrends, getRealTimeTrends } from "../services/trendsService.js"

const router = express.Router()

// Helper function to add delay between requests
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Helper function to get start time based on timeRange
const getStartTimeFromRange = (timeRange) => {
  const now = new Date()

  switch (timeRange) {
    case "1d":
      return new Date(now.getTime() - 24 * 60 * 60 * 1000)
    case "7d":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    case "1m":
      return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
    case "3m":
      return new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
    case "12m":
      return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
    case "5y":
      return new Date(now.getFullYear() - 5, now.getMonth(), now.getDate())
    default:
      return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
  }
}

// Helper function to generate mock data based on timeRange
const generateMockData = (timeRange) => {
  const now = new Date()
  const startTime = getStartTimeFromRange(timeRange)

  // Calculate the number of data points based on time range
  let dataPoints = 30 // Default for 1m
  let interval = 24 * 60 * 60 * 1000 // Default daily interval

  switch (timeRange) {
    case "1d":
      dataPoints = 24
      interval = 60 * 60 * 1000 // Hourly
      break
    case "7d":
      dataPoints = 7
      interval = 24 * 60 * 60 * 1000 // Daily
      break
    case "1m":
      dataPoints = 30
      interval = 24 * 60 * 60 * 1000 // Daily
      break
    case "3m":
      dataPoints = 12
      interval = 7 * 24 * 60 * 60 * 1000 // Weekly
      break
    case "12m":
      dataPoints = 12
      interval = 30 * 24 * 60 * 60 * 1000 // Monthly
      break
    case "5y":
      dataPoints = 20
      interval = 3 * 30 * 24 * 60 * 60 * 1000 // Quarterly
      break
  }

  // Generate data points up to now
  const timelineData = []
  for (let i = 0; i < dataPoints; i++) {
    const date = new Date(startTime.getTime() + i * interval)
    // Ensure we don't generate future dates
    if (date > now) break
    timelineData.push({
      time: Math.floor(date.getTime() / 1000),
      formattedTime: date.toISOString().split('T')[0],
      value: [Math.floor(Math.random() * 100)],
    })
  }

  // Always add today's date if it's not already included
  const lastDate = timelineData.length > 0 ? new Date(timelineData[timelineData.length - 1].formattedTime) : null
  if (!lastDate || lastDate.toISOString().split('T')[0] !== now.toISOString().split('T')[0]) {
    timelineData.push({
      time: Math.floor(now.getTime() / 1000),
      formattedTime: now.toISOString().split('T')[0],
      value: [Math.floor(Math.random() * 100)],
    })
  }

  return {
    default: {
      timelineData,
    },
  }
}

// GET search trends data
router.get("/search", async (req, res) => {
  try {
    const { keyword, timeRange, geo, category } = req.query

    if (!keyword) {
      return res.status(400).json({ message: "Keyword parameter is required" })
    }

    console.log(`Searching for "${keyword}" with timeRange: ${timeRange || "default"}`)

    // Get start time based on timeRange
    const startTime = getStartTimeFromRange(timeRange)
    const now = new Date()

    console.log(`Using date range: ${startTime.toISOString()} to ${now.toISOString()}`)

    const options = {
      keyword,
      startTime,
      endTime: now,
      geo: geo || "",
      category: Number.parseInt(category) || 0,
    }

    try {
      // Add a small delay to avoid hitting rate limits
      await delay(1000);
      
      // Try to get real data from Google Trends
      const results = await googleTrends.interestOverTime(options)
      
      // Check if the response looks like HTML (rate limited or error response)
      if (typeof results === 'string' && results.trim().startsWith('<')) {
        throw new Error('API returned HTML instead of JSON (likely rate limited)');
      }
      
      return res.json(JSON.parse(results))
    } catch (apiError) {
      console.error("Error from Google Trends API:", apiError)
      console.log("Falling back to mock data")

      // If the API fails, return mock data based on the requested time range
      const mockData = generateMockData(timeRange)
      return res.json(mockData)
    }
  } catch (error) {
    console.error("Error in /search route:", error)
    res.status(500).json({
      message: "Failed to search trends",
      error: error.message,
    })
  }
})

// GET geographic interest data with improved error handling and data formatting
router.get("/geo", async (req, res) => {
  try {
    const { keyword, timeRange } = req.query

    if (!keyword) {
      return res.status(400).json({ message: "Keyword parameter is required" })
    }

    // Get start time based on timeRange
    const startTime = getStartTimeFromRange(timeRange)
    const now = new Date()

    console.log(`Fetching geographic data for "${keyword}" from ${startTime.toISOString()} to now`)

    const options = {
      keyword,
      startTime,
      endTime: now,
      resolution: "COUNTRY", // This ensures we get country-level data
    }

    try {
      // Add a small delay to avoid hitting rate limits
      await delay(1000);
      
      // Try to get real data from Google Trends
      const results = await googleTrends.interestByRegion(options)
      
      // Check if the response looks like HTML (rate limited or error response)
      if (typeof results === 'string' && results.trim().startsWith('<')) {
        throw new Error('API returned HTML instead of JSON (likely rate limited)');
      }
      
      const parsedResults = JSON.parse(results)

      // Log the structure to help with debugging
      console.log(
        "Google Trends API returned geo data structure:",
        Object.keys(parsedResults),
        parsedResults.default ? Object.keys(parsedResults.default) : "No default key",
      )

      // Transform the data to match our expected format if needed
      if (parsedResults && parsedResults.default && parsedResults.default.geoMapData) {
        // The API already returned the expected format
        res.json(parsedResults)
      } else if (parsedResults && parsedResults.default && parsedResults.default.data) {
        // Transform to expected format if the structure is different
        const transformedData = {
          default: {
            geoMapData: parsedResults.default.data.map((item) => ({
              geoCode: item.geoCode || item.geo,
              geoName: item.geoName || item.region,
              value: [item.value || Number.parseInt(item.formattedValue) || 0],
            })),
          },
        }
        res.json(transformedData)
      } else {
        // If we can't parse the data properly, fall back to mock data
        throw new Error("Unexpected API response format")
      }
    } catch (apiError) {
      console.error("Error from Google Trends API:", apiError)
      console.log("Falling back to mock data for geo")

      // If the API fails, return enhanced mock data with more countries
      const mockGeoData = {
        default: {
          geoMapData: [
            { geoCode: "US", geoName: "United States", value: [100] },
            { geoCode: "IN", geoName: "India", value: [85] },
            { geoCode: "GB", geoName: "United Kingdom", value: [78] },
            { geoCode: "CA", geoName: "Canada", value: [72] },
            { geoCode: "AU", geoName: "Australia", value: [68] },
            { geoCode: "DE", geoName: "Germany", value: [65] },
            { geoCode: "FR", geoName: "France", value: [60] },
            { geoCode: "BR", geoName: "Brazil", value: [55] },
            { geoCode: "JP", geoName: "Japan", value: [50] },
            { geoCode: "RU", geoName: "Russia", value: [45] },
            { geoCode: "CN", geoName: "China", value: [75] },
            { geoCode: "IT", geoName: "Italy", value: [48] },
            { geoCode: "ES", geoName: "Spain", value: [42] },
            { geoCode: "MX", geoName: "Mexico", value: [38] },
            { geoCode: "KR", geoName: "South Korea", value: [58] },
            { geoCode: "NL", geoName: "Netherlands", value: [52] },
            { geoCode: "SE", geoName: "Sweden", value: [47] },
            { geoCode: "CH", geoName: "Switzerland", value: [56] },
            { geoCode: "SG", geoName: "Singapore", value: [62] },
            { geoCode: "ZA", geoName: "South Africa", value: [33] },
          ],
        },
      }
      res.json(mockGeoData)
    }
  } catch (error) {
    console.error("Error in /geo route:", error)
    res.status(500).json({
      message: "Failed to fetch geographic data",
      error: error.message,
    })
  }
})

// GET real-time trends data
router.get("/realtime", async (req, res) => {
  try {
    const { geo, category, hl } = req.query;

    if (!geo) {
      return res.status(400).json({ message: "Geo parameter is required for real-time trends" });
    }

    console.log(`Fetching real-time trends for geo: ${geo}, category: ${category || 'all'}`);

    try {
      // Get real-time trends data from our service
      const results = await getRealTimeTrends({ geo, category, hl });
      return res.json(results);
    } catch (error) {
      console.error("Error fetching real-time trends:", error);
      return res.status(500).json({
        message: "Failed to fetch real-time trends",
        error: error.message,
      });
    }
  } catch (error) {
    console.error("Error in /realtime route:", error);
    res.status(500).json({
      message: "Failed to fetch real-time trends",
      error: error.message,
    });
  }
});

// Keep your other routes...

export default router

