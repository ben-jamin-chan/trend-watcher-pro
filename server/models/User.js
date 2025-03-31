// models/User.js
import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  displayName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  preferences: {
    emailNotifications: { type: Boolean, default: false },
    notificationFrequency: { type: String, default: 'daily' },
    defaultTimeRange: { type: String, default: '1m' },
    defaultRegion: { type: String, default: 'US' }
  },
  createdAt: { type: Date, default: Date.now }
})

export default mongoose.model('User', userSchema)