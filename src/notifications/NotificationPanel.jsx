"use client"

import { useState, useEffect, useContext, useRef } from "react"
import { BellIcon, XMarkIcon, CheckIcon } from "@heroicons/react/24/outline"
import { AuthContext } from "../context/AuthContext"
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from "../services/api"

function NotificationsPanel() {
  const { currentUser } = useContext(AuthContext)
  const [notifications, setNotifications] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [hasUnread, setHasUnread] = useState(false)
  const [loading, setLoading] = useState(false)
  const panelRef = useRef(null)

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!currentUser) return

    try {
      setLoading(true)
      console.log("Fetching notifications for user:", currentUser.uid)
      const data = await getNotifications(currentUser.uid)
      console.log("Fetched notifications:", data)
      setNotifications(data)

      // Check if there are any unread notifications
      const hasAnyUnread = data.some((n) => !n.read)
      setHasUnread(hasAnyUnread)
    } catch (error) {
      console.error("Error fetching notifications:", error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch notifications on mount and when user changes
  useEffect(() => {
    fetchNotifications()

    // Set up polling to check for new notifications every minute
    const intervalId = setInterval(fetchNotifications, 60000)

    return () => clearInterval(intervalId)
  }, [currentUser])

  // Handle click outside to close panel
  useEffect(() => {
    function handleClickOutside(event) {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handleMarkAsRead = async (notificationId) => {
    if (!currentUser) return

    try {
      await markNotificationAsRead(notificationId)

      // Update local state
      setNotifications(
        notifications.map((notification) =>
          notification._id === notificationId ? { ...notification, read: true } : notification,
        ),
      )

      // Check if there are still unread notifications
      const stillHasUnread = notifications.some((n) => n._id !== notificationId && !n.read)
      setHasUnread(stillHasUnread)
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const handleMarkAllAsRead = async () => {
    if (!currentUser || notifications.length === 0) return

    try {
      await markAllNotificationsAsRead(currentUser.uid)

      // Update local state
      setNotifications(notifications.map((notification) => ({ ...notification, read: true })))
      setHasUnread(false)
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
    }
  }

  const togglePanel = () => {
    setIsOpen(!isOpen)

    // If opening the panel, fetch latest notifications
    if (!isOpen) {
      fetchNotifications()
    }
  }

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now - date) / 1000)

    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
    return `${Math.floor(diffInSeconds / 86400)} days ago`
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="relative" ref={panelRef}>
      <button onClick={togglePanel} className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
        <BellIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
        {hasUnread && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 max-h-[80vh] flex flex-col border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Notifications</h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center"
                >
                  <CheckIcon className="h-3 w-3 mr-1" />
                  Mark all as read
                </button>
              )}
              <button onClick={togglePanel}>
                <XMarkIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto flex-grow">
            {loading ? (
              <div className="flex justify-center items-center p-4">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-500 dark:border-indigo-400"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">No notifications</div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${!notification.read ? "bg-blue-50 dark:bg-blue-900/30" : ""}`}
                  onClick={() => handleMarkAsRead(notification._id)}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                        <BellIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      </div>
                    </div>
                    <div className="ml-3 flex-grow">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{notification.title}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{notification.message}</p>
                      <div className="flex justify-between items-center mt-1">
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {formatTimeAgo(notification.createdAt)}
                        </p>
                        {notification.keyword && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-300">
                            {notification.keyword}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-2 border-t border-gray-200 dark:border-gray-700 text-center">
              <button
                onClick={fetchNotifications}
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
              >
                Refresh notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default NotificationsPanel

