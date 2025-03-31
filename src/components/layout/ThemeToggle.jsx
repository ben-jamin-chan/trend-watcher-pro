"use client"

import { useContext } from "react"
import { ThemeContext } from "../../context/ThemeContext"
import { Moon, Sun } from "lucide-react"

function ThemeToggle() {
  const { darkMode, toggleDarkMode } = useContext(ThemeContext)

  return (
    <button
      onClick={toggleDarkMode}
      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
    >
      {darkMode ? <Sun className="h-5 w-5 text-yellow-400" /> : <Moon className="h-5 w-5 text-gray-500" />}
    </button>
  )
}

export default ThemeToggle

