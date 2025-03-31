// routes/notifications.js
import express from "express";
import Notification from "../models/Notification.js";

const router = express.Router();

// Get all notifications for a user
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, unreadOnly } = req.query;
    
    // Build query
    const query = { userId };
    if (unreadOnly === 'true') {
      query.read = false;
    }
    
    // Get notifications, sorted by newest first
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: error.message });
  }
});

// Mark a notification as read
router.patch("/:notificationId/read", async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { read: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    
    res.json(notification);
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ message: error.message });
  }
});

// Mark all notifications as read for a user
router.patch("/user/:userId/read-all", async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = await Notification.updateMany(
      { userId, read: false },
      { read: true }
    );
    
    res.json({ 
      message: "All notifications marked as read",
      count: result.modifiedCount
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ message: error.message });
  }
});

// Create a new notification (for testing)
router.post("/", async (req, res) => {
  try {
    const { userId, title, message, keyword, percentChange } = req.body;
    
    const notification = new Notification({
      userId,
      title,
      message,
      keyword,
      percentChange,
      read: false
    });
    
    await notification.save();
    res.status(201).json(notification);
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(500).json({ message: error.message });
  }
});

export default router;