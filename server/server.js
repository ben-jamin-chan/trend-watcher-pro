// server.js
import express from "express"
import cors from "cors"
import mongoose from "mongoose"
import dotenv from "dotenv"
import path from "path"
import { fileURLToPath } from 'url'
import fs from 'fs'
import trendsRoutes from "./routes/trends.js"
import userRoutes from "./routes/user.js"
import savedTrendsRoutes from "./routes/savedTrends.js"
import notificationsRoutes from "./routes/notifications.js"
import exportRoutes from "./routes/export.js"
import { startScheduledTasks } from "./scheduledTasks.js"

dotenv.config()

console.log('Starting server initialization...')

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 5001

console.log(`PORT configured as: ${PORT}`)
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'development'}`)

// Middleware
app.use(cors())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

console.log('Middleware configured')

// Serve static files from the React app build
const distPath = path.join(__dirname, '../dist');
const indexPath = path.join(distPath, 'index.html');

// Check if dist folder exists
if (fs.existsSync(distPath)) {
  console.log('Dist folder found, serving static files from:', distPath);
  app.use(express.static(distPath));
} else {
  console.warn('Dist folder not found at path:', distPath);
  console.warn('Frontend assets will not be served. Run "npm run build" to create the dist folder.');
}

console.log('Static file serving configured')

// Routes
app.use("/api/trends", trendsRoutes)
app.use("/api/export", exportRoutes)

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

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Catch all handler: send back React's index.html file for any non-API routes
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api/')) {
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send('Frontend not built. Run "npm run build" first.');
    }
  } else {
    res.status(404).json({ error: 'API endpoint not found' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).json({
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message
  });
});

// Start server regardless of database connection
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port: ${PORT}`)
  console.log(`Server bound to 0.0.0.0:${PORT}`)
  console.log("Google Trends API routes available at /api/trends")
  if (!MONGODB_URI || MONGODB_URI === 'undefined') {
    console.log("Note: Database-dependent features (users, saved trends, notifications) are disabled")
  }
})