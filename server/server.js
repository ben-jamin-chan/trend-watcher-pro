// server.js
import express from "express"
import cors from "cors"
import mongoose from "mongoose"
import dotenv from "dotenv"
import path from "path"
import { fileURLToPath } from "url"
import trendsRoutes from "./routes/trends.js"
import userRoutes from "./routes/user.js"
import savedTrendsRoutes from "./routes/savedTrends.js"
import notificationsRoutes from "./routes/notifications.js" // Add this line
import exportRoutes from "./routes/export.js" // Add export routes
import { startScheduledTasks } from "./scheduledTasks.js" // Add this line

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5001

// Middleware
app.use(cors())
app.use(express.json())

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, '../dist')))

// API Routes
app.use("/api/trends", trendsRoutes)
app.use("/api/export", exportRoutes) // Add export routes

// MongoDB connection (optional for testing trends functionality)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/trend-tracker-pro'

if (MONGODB_URI && MONGODB_URI !== 'undefined') {
  // Connect to MongoDB
  mongoose
   .connect(MONGODB_URI)
   .then(() => {
     console.log("Connected to MongoDB")
     // Only add database-dependent routes if MongoDB is connected
     app.use("/api/users", userRoutes)
     app.use("/api/saved-trends", savedTrendsRoutes)
     app.use("/api/notifications", notificationsRoutes)
     
     // Start scheduled tasks after database is connected
     startScheduledTasks()
   })
   .catch((error) => {
     console.log("Warning: Could not connect to MongoDB:", error.message)
     console.log("Server will run without database functionality")
   })
} else {
  console.log("No MongoDB URI configured. Running without database functionality.")
}

// Catch all handler: serve React app for any non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'))
})

// Start server regardless of database connection
app.listen(PORT, () => {
  console.log(`Server running on port: ${PORT}`)
  console.log("Google Trends API routes available at /api/trends")
  console.log("React app served at root URL")
  if (!MONGODB_URI || MONGODB_URI === 'undefined') {
    console.log("Note: Database-dependent features (users, saved trends, notifications) are disabled")
  }
})