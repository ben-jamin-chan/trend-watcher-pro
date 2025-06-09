// services/trendsService.js
import googleTrends from "google-trends-api";

// Rate limiting variables
let lastApiCall = 0;
const MIN_API_INTERVAL = 30000; // Minimum 30 seconds between API calls

// Helper function to add delay between requests
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Rate limiter function
const checkRateLimit = async () => {
  const now = Date.now();
  const timeSinceLastCall = now - lastApiCall;
  
  if (timeSinceLastCall < MIN_API_INTERVAL) {
    const waitTime = MIN_API_INTERVAL - timeSinceLastCall;
    console.log(`Rate limiting: waiting ${waitTime}ms before next API call`);
    await delay(waitTime);
  }
  
  lastApiCall = Date.now();
};

// Function to search trends
export async function searchTrends(params) {
  try {
    const { keyword, timeRange, geo, category } = params;
    
    if (!keyword) {
      throw new Error("Keyword parameter is required");
    }
    
    // Convert timeRange to proper format
    let startTime;
    const now = new Date();
    
    switch (timeRange) {
      case "1d":
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "7d":
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "1m":
        startTime = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case "3m":
        startTime = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        break;
      case "12m":
        startTime = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      case "5y":
        startTime = new Date(now.getFullYear() - 5, now.getMonth(), now.getDate());
        break;
      default:
        startTime = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    }
    
    const options = {
      keyword,
      startTime,
      endTime: new Date(),
      geo: geo || "",
      category: Number.parseInt(category) || 0,
    };
    
    // For very short time ranges, set granularTimeResolution to true
    if (timeRange === "1d") {
      options.granularTimeResolution = true;
    }
    
    // Add mock data for testing in case the API fails
    const mockData = {
      default: {
        timelineData: (() => {
          const timelineData = Array.from({ length: 30 }, (_, i) => ({
            time: Math.floor(startTime.getTime() / 1000) + i * 24 * 60 * 60,
            formattedTime: new Date(startTime.getTime() + i * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
            value: [Math.floor(Math.random() * 100)],
          }));

          // Always add today's date if it's not already included
          const now = new Date();
          const lastDate = timelineData.length > 0 ? new Date(timelineData[timelineData.length - 1].formattedTime) : null;
          if (!lastDate || lastDate.toISOString().split('T')[0] !== now.toISOString().split('T')[0]) {
            timelineData.push({
              time: Math.floor(now.getTime() / 1000),
              formattedTime: now.toISOString().split('T')[0],
              value: [Math.floor(Math.random() * 100)],
            });
          }

          return timelineData;
        })(),
      },
    };
    
    try {
      // Apply rate limiting
      await checkRateLimit();
      
      // Try to get real data from Google Trends
      const results = await googleTrends.interestOverTime(options);
      return JSON.parse(results);
    } catch (apiError) {
      console.error("Error from Google Trends API:", apiError);
      console.log("Falling back to mock data");
      
      // If the API fails, return mock data
      return mockData;
    }
  } catch (error) {
    console.error("Error in searchTrends:", error);
    throw error;
  }
}

// Function to get real-time trends
export async function getRealTimeTrends(params) {
  try {
    const { geo, category, hl } = params;
    
    // Validate geo parameter - it's required for realTimeTrends
    if (!geo) {
      throw new Error("Geo parameter is required for real-time trends");
    }
    
    const options = {
      geo: geo, // Required parameter
      category: category || 'all', // Optional: 'all', 'b' (business), 'e' (entertainment), etc.
      hl: hl || 'en-US' // Language setting
    };
    
    try {
      // Apply rate limiting
      await checkRateLimit();
      
      // Get real-time trends from Google Trends API
      const results = await googleTrends.realTimeTrends(options);
      
      // Check if the response looks like HTML (rate limited or error response)
      if (typeof results === 'string' && results.trim().startsWith('<')) {
        throw new Error('API returned HTML instead of JSON (likely rate limited)');
      }
      
      const parsedResults = JSON.parse(results);
      
      // Format the data for our chart component
      // Real-time trends returns storySummaries with trendingStories
      const formattedData = {
        default: {
          timelineData: []
        }
      };
      
      if (parsedResults?.storySummaries?.trendingStories) {
        // Convert trending stories to our timeline format
        formattedData.default.timelineData = parsedResults.storySummaries.trendingStories.map((story, index) => {
          // Create a date slightly in the past for each story to show progression
          const storyTime = new Date();
          storyTime.setMinutes(storyTime.getMinutes() - (index * 10)); // Space stories 10 minutes apart
          
          return {
            time: Math.floor(storyTime.getTime() / 1000),
            formattedTime: storyTime.toISOString(),
            formattedAxisTime: storyTime.toLocaleString(),
            value: [story.entityNames?.length ? 100 - (index * 5) : 50], // Create a trend line
            title: story.title,
            entityNames: story.entityNames
          };
        });
      }
      
      return formattedData;
      
    } catch (apiError) {
      console.error("Error from Google Trends realTimeTrends API:", apiError);
      
      // Don't log the full error for rate limiting cases
      if (apiError.message?.includes('HTML instead of JSON')) {
        console.log("Google Trends API rate limited - using mock data");
      }
      
      // Return mock real-time data
      const mockRealTimeData = {
        default: {
          timelineData: Array.from({ length: 12 }, (_, i) => {
            const time = new Date();
            time.setMinutes(time.getMinutes() - (i * 15)); // 15-minute intervals going back
            
            return {
              time: Math.floor(time.getTime() / 1000),
              formattedTime: time.toISOString(),
              formattedAxisTime: time.toLocaleString(),
              value: [Math.floor(Math.random() * 100)],
              title: `Trending topic ${i+1}`,
            };
          })
        }
      };
      
      return mockRealTimeData;
    }
  } catch (error) {
    console.error("Error in getRealTimeTrends:", error);
    throw error;
  }
}