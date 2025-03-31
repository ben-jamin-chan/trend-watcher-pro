"use client"

import { createContext, useState, useEffect } from "react"
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth"
import { initializeApp } from "firebase/app"

// Create context
export const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Initialize Firebase - in a real app, you would use environment variables
  const firebaseConfig = {
    apiKey: "AIzaSyAWimRWgNLcskIuA7WvlXB0V8E9lO5P7E8",
    authDomain: "trend-watcher-pro.firebaseapp.com",
    projectId: "trend-watcher-pro",
    storageBucket: "trend-watcher-pro.firebasestorage.app",
    messagingSenderId: "929055926076",
    appId: "1:929055926076:web:e2da93da2f8f0253da6039"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig)
  const auth = getAuth(app)

  // Sign up function
  const signup = async (email, password, displayName) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      // Update profile with display name
      await updateProfile(userCredential.user, { displayName })
      return userCredential.user
    } catch (error) {
      throw error
    }
  }

  // Login function
  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      return userCredential.user
    } catch (error) {
      throw error
    }
  }

  // Logout function
  const logout = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      throw error
    }
  }

  // Update user profile
  const updateUserProfile = async (data) => {
    try {
      if (currentUser) {
        await updateProfile(currentUser, data)
        // Force refresh the user to get updated data
        setCurrentUser({ ...currentUser, ...data })
      }
    } catch (error) {
      throw error
    }
  }

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)
      setLoading(false)
    })

    // Cleanup subscription
    return unsubscribe
  }, [auth])

  const value = {
    currentUser,
    loading,
    signup,
    login,
    logout,
    updateUserProfile,
  }

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>
}

