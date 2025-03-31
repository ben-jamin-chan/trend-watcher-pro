// models/SavedTrend.js
import mongoose from "mongoose"

const savedTrendSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  keyword: { type: String, required: true },
  timeRange: { type: String, default: "1m" },
  lastUpdated: { type: Date, default: Date.now },
  currentValue: { type: Number },
  notificationsEnabled: { type: Boolean, default: false },
  notificationFrequency: {
    type: String,
    enum: ["15m", "1h", "3h", "6h", "24h"],
    default: "24h",
  },
  data: [
    {
      date: { type: String },
      value: { type: Number },
    },
  ],
})

// Compound index to ensure a user doesn't save the same keyword multiple times
savedTrendSchema.index({ userId: 1, keyword: 1 }, { unique: true })

export default mongoose.model("SavedTrend", savedTrendSchema)

