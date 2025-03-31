// src/firebase.js
import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore, collection, addDoc, getDocs, query, where, writeBatch } from "firebase/firestore"
import { getMessaging, getToken, onMessage } from "firebase/messaging"
import { getFunctions } from "firebase/functions"

const firebaseConfig = {
  apiKey: "AIzaSyAWimRWgNLcskIuA7WvlXB0V8E9lO5P7E8",
  authDomain: "trend-watcher-pro.firebaseapp.com",
  projectId: "trend-watcher-pro",
  storageBucket: "trend-watcher-pro.firebasestorage.app",
  messagingSenderId: "929055926076",
  appId: "1:929055926076:web:e2da93da2f8f0253da6039",
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)
const functions = getFunctions(app)
let messaging = null

// Initialize Firebase Cloud Messaging in browser environment only
if (typeof window !== "undefined") {
  try {
    messaging = getMessaging(app)
  } catch (error) {
    console.error("Firebase messaging failed to initialize:", error)
  }
}

// Request permission and get FCM token
export const requestNotificationPermission = async () => {
  if (typeof window === "undefined" || !messaging) return null

  try {
    console.log("Checking notification permission status...")

    // Check current permission status
    if (Notification.permission === "denied") {
      console.log("Notifications are blocked by the browser")
      // Return a special value to indicate blocked permissions
      return "blocked"
    }

    // Check if service workers are supported
    if (!("serviceWorker" in navigator)) {
      console.log("Service workers not supported")
      return null
    }

    let registration
    try {
      // Register service worker first
      registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
        scope: "/",
      })
      console.log("Service worker registered")
    } catch (swError) {
      console.error("Error registering service worker:", swError)
      // Continue anyway - we might still be able to get permission without the service worker
    }

    // Request permission
    const permission = await Notification.requestPermission()
    console.log("Notification permission status:", permission)

    if (permission === "granted") {
      try {
        // Get FCM token
        const token = await getToken(messaging, {
          vapidKey: "zbXjPLZbMCsBtOB7UUf97Byi63MiaWR84vnPmvfAy18",
          serviceWorkerRegistration: registration,
        })

        console.log("FCM Token:", token)

        // Store the token in Firestore
        const user = auth.currentUser
        if (user) {
          // Check if this token is already stored
          const tokensRef = collection(db, "users", user.uid, "fcmTokens")
          const q = query(tokensRef, where("token", "==", token))
          const querySnapshot = await getDocs(q)

          if (querySnapshot.empty) {
            // Add the new token
            await addDoc(tokensRef, {
              token,
              device: navigator.userAgent,
              createdAt: new Date(),
            })
          }
        }

        return token
      } catch (tokenError) {
        console.error("Error getting FCM token:", tokenError)
        // Return a special value that indicates permission is granted but token failed
        // This will still allow the UI to show notification settings
        return "permission-granted"
      }
    } else {
      console.log("Notification permission not granted:", permission)
      return null
    }
  } catch (error) {
    console.error("Error getting notification permission:", error)
    return null
  }
}

// Handle foreground messages
export const onForegroundMessage = (callback) => {
  if (typeof window === "undefined" || !messaging) return () => {}

  return onMessage(messaging, (payload) => {
    console.log("Message received in foreground:", payload)
    callback(payload)
  })
}

// Save trend with notification preferences to Firestore
export const saveTrendWithNotifications = async (
  userId,
  trendData,
  notificationsEnabled = false,
  frequency = "24h",
) => {
  try {
    // Create a reference to the user's saved trends collection
    const trendsRef = collection(db, "users", userId, "savedTrends")

    // Check if this trend already exists
    const q = query(trendsRef, where("keyword", "==", trendData.keyword))
    const querySnapshot = await getDocs(q)

    if (!querySnapshot.empty) {
      // Update existing trend
      const trendDoc = querySnapshot.docs[0]
      const batch = writeBatch(db)

      batch.update(trendDoc.ref, {
        ...trendData,
        notificationsEnabled,
        notificationFrequency: frequency,
        lastUpdated: new Date(),
      })

      await batch.commit()
      return { id: trendDoc.id, ...trendData, notificationsEnabled, notificationFrequency: frequency }
    } else {
      // Create new trend
      const docRef = await addDoc(trendsRef, {
        ...trendData,
        notificationsEnabled,
        notificationFrequency: frequency,
        createdAt: new Date(),
        lastUpdated: new Date(),
      })

      return { id: docRef.id, ...trendData, notificationsEnabled, notificationFrequency: frequency }
    }
  } catch (error) {
    console.error("Error saving trend with notifications:", error)
    throw error
  }
}

// Add this function to help check notification permission status
export const checkNotificationPermission = () => {
  if (typeof Notification === "undefined") {
    return "unsupported"
  }

  return Notification.permission
}

export { app, auth, db, functions, messaging }

