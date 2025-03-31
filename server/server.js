// server.js
import express from "express"
import cors from "cors"
import mongoose from "mongoose"
import dotenv from "dotenv"
import trendsRoutes from "./routes/trends.js"
import userRoutes from "./routes/user.js"
import savedTrendsRoutes from "./routes/savedTrends.js"
import notificationsRoutes from "./routes/notifications.js" // Add this line
import { startScheduledTasks } from "./scheduledTasks.js" // Add this line

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5001

// Middleware
app.use(cors())
app.use(express.json())

// Routes
app.use("/api/trends", trendsRoutes)
app.use("/api/users", userRoutes)
app.use("/api/saved-trends", savedTrendsRoutes)
app.use("/api/notifications", notificationsRoutes) // Add this line

// Connect to MongoDB
mongoose
 .connect(process.env.MONGODB_URI)
 .then(() => {
   console.log("Connected to MongoDB Atlas")
   app.listen(PORT, () => console.log(`Server running on port: ${PORT}`))
   
   // Start scheduled tasks after server is running
   startScheduledTasks()
 })
 .catch((error) => console.log("Error connecting to MongoDB:", error.message))