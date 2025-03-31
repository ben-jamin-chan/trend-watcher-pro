"use client"

import { createContext, useState, useEffect } from "react"

export const ThemeContext = createContext()

// Add this script to the head of the document to prevent flash of wrong theme
// This script runs before React hydration
const themeScript = `
  (function() {
    // Check if theme is stored in localStorage
    const darkMode = localStorage.getItem('darkMode');
    
    // Apply dark mode if it was previously enabled
    if (darkMode === 'true') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  })()
`

export function ThemeProvider({ children }) {
  // Initialize state from localStorage or system preference
  const [darkMode, setDarkMode] = useState(() => {
    // Check if we're in the browser
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("darkMode")

      // Return saved preference if it exists
      if (savedTheme !== null) {
        return savedTheme === "true"
      }

      // Otherwise use system preference
      return window.matchMedia("(prefers-color-scheme: dark)").matches
    }

    // Default to false on server
    return false
  })

  // Add theme script to head on mount
  useEffect(() => {
    // Add the script to prevent flash of wrong theme
    const script = document.createElement("script")
    script.innerHTML = themeScript
    document.head.appendChild(script)

    return () => {
      // Clean up
      document.head.removeChild(script)
    }
  }, [])

  // Update document class and localStorage when darkMode changes
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark")
      localStorage.setItem("darkMode", "true")
      console.log("Dark mode enabled and saved to localStorage")
    } else {
      document.documentElement.classList.remove("dark")
      localStorage.setItem("darkMode", "false")
      console.log("Light mode enabled and saved to localStorage")
    }
  }, [darkMode])

  const toggleDarkMode = () => {
    setDarkMode((prevMode) => !prevMode)
  }

  return <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>{children}</ThemeContext.Provider>
}

