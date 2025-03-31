// models/Notification.js
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  keyword: { type: String },
  percentChange: { type: Number },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// Index for faster queries by userId
notificationSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model("Notification", notificationSchema);