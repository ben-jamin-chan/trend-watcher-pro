"use client"

import { useEffect, useRef, useContext } from "react"
import Chart from "chart.js/auto"
import { ThemeContext } from "../../context/ThemeContext"
import RealTimeTrendChart from './RealTimeTrendChart.jsx'
import ExportButton from '../ExportButton'

function TrendChart({ data, title, timeRange, isComparison = false, keyword }) {
  const chartRef = useRef(null)
  const chartInstance = useRef(null)
  const { darkMode } = useContext(ThemeContext)

  // Extract timeRange from title if not provided directly
  const getTimeRangeFromTitle = () => {
    if (timeRange) return timeRange

    if (title) {
      if (title.includes("hour")) return "1h"
      if (title.includes("4 hours")) return "4h"
      if (title.includes("day")) return "1d"
      if (title.includes("7 days")) return "7d"
      if (title.includes("30 days")) return "30d"
      if (title.includes("90 days")) return "90d"
      if (title.includes("12 months")) return "12m"
      if (title.includes("5 years")) return "5y"
      if (title.includes("2004")) return "all"
    }

    // If no timeRange is found in the title, try to infer from data
    if (Array.isArray(data) && data.length > 0) {
      const firstDate = new Date(data[0].date)
      const lastDate = new Date(data[data.length - 1].date)
      const diffHours = Math.round((lastDate - firstDate) / (1000 * 60 * 60))

      if (diffHours <= 1) return "1h"
      if (diffHours <= 4) return "4h"
      if (diffHours <= 24) return "1d"
      if (diffHours <= 168) return "7d" // 7 * 24
      if (diffHours <= 720) return "30d" // 30 * 24
      if (diffHours <= 2160) return "90d" // 90 * 24
      if (diffHours <= 8760) return "12m" // 365 * 24
      if (diffHours <= 43800) return "5y" // 5 * 365 * 24
      return "all"
    }

    return "1h" // Default to 1h instead of 1m
  }

  // Update formatDateLabel function
  const formatDateLabel = (dateStr) => {
    try {
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) {
        console.warn("Invalid date:", dateStr)
        return dateStr
      }

      const effectiveTimeRange = getTimeRangeFromTitle()

      switch (effectiveTimeRange) {
        case '1h':
          return date.toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          })
        
        case '4h':
          return date.toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          })

        case '1d':
          return date.toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          })

        case '7d':
          return date.toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          })

        case '30d':
          // For 30 days, show month and day
          return date.toLocaleString(undefined, {
            month: 'short',
            day: 'numeric'
          })

        case '90d':
          // For 90 days, show month and day
          return date.toLocaleString(undefined, {
            month: 'short',
            day: 'numeric'
          })

        case '12m':
          // For 12 months, show month and year
          return date.toLocaleString(undefined, {
            month: 'short',
            year: 'numeric'
          })

        case '5y':
          // For 5 years, show year
          return date.getFullYear().toString()

        case 'all':
          // For all time, show year
          return date.getFullYear().toString()

        default:
          // Default format for month and day
          return date.toLocaleString(undefined, {
            month: 'short',
            day: 'numeric'
          })
      }
    } catch (e) {
      console.error("Error formatting date:", e, "for date string:", dateStr)
      return dateStr
    }
  }

  useEffect(() => {
    // Add debugging at the start of the useEffect
    if (Array.isArray(data) && data.length > 0) {
      console.log("Google Trends Data:", {
        sample: data.slice(0, 3),
        timeRange: getTimeRangeFromTitle(),
        count: data.length
      });
    }

    // Clean up previous chart if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy()
      chartInstance.current = null
    }

    // Safety check for data
    if (!data) {
      console.warn("No data provided to TrendChart")
      return
    }

    try {
      const ctx = chartRef.current?.getContext("2d")
      if (!ctx) {
        console.warn("Could not get canvas context")
        return
      }

      // Set chart colors based on theme
      const gridColor = darkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"
      const textColor = darkMode ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.7)"

      // Parse and transform the data to ensure proper date formatting
      let transformedData = data
      if (Array.isArray(data) && !isComparison) {
        // Ensure proper date objects for Google Trends API data
        transformedData = data.map(point => {
          // Google Trends API might return data in different formats
          // The date could be in formattedAxisTime, time, or date fields
          const timestamp = point.formattedAxisTime || point.time || point.date
          
          if (timestamp) {
            // Try to create a proper date object
            const date = new Date(timestamp)
            return {
              ...point,
              date: date.toISOString(), // Ensure consistent date format
              value: point.value || point.formattedValue || 0
            }
          }
          return point
        })
        
        console.log("Transformed data sample:", transformedData.slice(0, 3));
      }

      // Common chart options
      const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "top",
            labels: {
              color: textColor,
              padding: 20,
              font: {
                size: 12
              }
            }
          },
          tooltip: {
            mode: "index",
            intersect: false,
            callbacks: {
              title: (tooltipItems) => {
                const item = tooltipItems[0]
                const dataPoint = isComparison ? 
                  item.label : 
                  transformedData[item.dataIndex]?.date || item.label
                
                try {
                  const date = new Date(dataPoint)
                  if (!isNaN(date.getTime())) {
                    // Format like "Mar 30, 2025 at 2:40 PM"
                    return date.toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    }).replace(',', '').replace(',', ' at')
                  }
                } catch (e) {
                  console.warn("Error formatting tooltip date:", e)
                }
                return dataPoint
              }
            },
            padding: 10,
            backgroundColor: darkMode ? "rgba(0, 0, 0, 0.8)" : "rgba(255, 255, 255, 0.8)",
            titleColor: darkMode ? "#fff" : "#000",
            bodyColor: darkMode ? "#fff" : "#000",
            borderColor: gridColor,
            borderWidth: 1
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            grid: {
              color: gridColor,
              drawBorder: false
            },
            ticks: {
              color: textColor,
              padding: 10,
              font: {
                size: 11
              }
            },
            title: {
              display: true,
              text: "Interest",
              color: textColor,
              font: {
                size: 12,
                weight: "normal"
              }
            }
          },
          x: {
            grid: {
              color: gridColor,
              drawBorder: false,
              display: true
            },
            ticks: {
              color: textColor,
              maxRotation: 45,
              minRotation: 0,
              padding: 10,
              autoSkip: false,
              font: {
                size: 11
              },
              callback: (value, index) => {
                const dataPoint = isComparison ? data.labels[index] : data[index]?.date
                if (!dataPoint) return ""

                try {
                  const date = new Date(dataPoint)
                  if (isNaN(date.getTime())) return ""

                  const effectiveTimeRange = getTimeRangeFromTitle()
                  const dataLength = data.length
                  
                  // For hourly views (similar to Google Trends time-based view)
                  if (effectiveTimeRange === '1h' || effectiveTimeRange === '4h') {
                    // Show about 6 time points
                    const showEvery = Math.max(1, Math.ceil(dataLength / 6))
                    if (index % showEvery === 0 || index === 0 || index === dataLength - 1) {
                      return date.toLocaleString(undefined, {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      }).replace(/\s/g, '')
                    }
                  } 
                  // For daily/weekly views (similar to your screenshot)
                  else if (effectiveTimeRange === '1d' || effectiveTimeRange === '7d') {
                    // For daily views, show about 5-6 dates
                    const showEvery = Math.max(1, Math.ceil(dataLength / 5))
                    if (index % showEvery === 0 || index === 0 || index === dataLength - 1) {
                      return date.toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric'
                      })
                    }
                  }
                  // For monthly views
                  else if (effectiveTimeRange === '30d' || effectiveTimeRange === '90d') {
                    // For monthly views, show about 5-6 dates
                    const showEvery = Math.max(1, Math.ceil(dataLength / 6))
                    if (index % showEvery === 0 || index === 0 || index === dataLength - 1) {
                      return date.toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric'
                      })
                    }
                  }
                  // For yearly views
                  else {
                    const showEvery = Math.max(1, Math.ceil(dataLength / 8))
                    if (index % showEvery === 0 || index === 0 || index === dataLength - 1) {
                      return date.toLocaleString(undefined, {
                        month: 'short',
                        year: 'numeric'
                      })
                    }
                  }
                } catch (e) {
                  console.error("Error formatting tick date:", e, dataPoint)
                }
                
                return ""
              }
            },
            title: {
              display: true,
              text: getTimeRangeFromTitle().startsWith('1h') || 
                   getTimeRangeFromTitle().startsWith('4h') ? "Time" : "Date",
              color: textColor,
              font: {
                size: 12,
                weight: "normal"
              }
            }
          }
        },
        elements: {
          line: {
            tension: 0.4, // Smoother curve
            borderWidth: 2
          },
          point: {
            radius: 3,
            hoverRadius: 5
          }
        }
      }

      // Handle different data formats (single trend vs comparison)
      let chartData
      let chartOptions

      if (isComparison) {
        chartData = {
          ...data,
          datasets: data.datasets.map((dataset) => ({
            ...dataset,
            borderColor: dataset.borderColor,
            backgroundColor: dataset.backgroundColor,
          })),
        }
        chartOptions = commonOptions
      } else {
        if (!Array.isArray(transformedData)) {
          console.warn("Invalid data format for single trend chart")
          return
        }

        chartData = {
          labels: transformedData.map((point) => point?.date || ""),
          datasets: [
            {
              label: title || "Trend Interest Over Time",
              data: transformedData.map((point) => point?.value || 0),
              fill: false,
              backgroundColor: darkMode ? "rgb(129, 140, 248)" : "rgb(79, 70, 229)",
              borderColor: darkMode ? "rgba(129, 140, 248, 0.8)" : "rgba(79, 70, 229, 0.8)",
            },
          ],
        }
        chartOptions = commonOptions
      }

      // Create the chart
      chartInstance.current = new Chart(ctx, {
        type: "line",
        data: chartData,
        options: chartOptions,
      })
    } catch (error) {
      console.error("Error creating chart:", error)
    }

    // Clean up on unmount
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
    }
  }, [data, title, timeRange, isComparison, darkMode])

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md transition-colors duration-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          {title || "Trend Interest Over Time"}
        </h3>
        <ExportButton
          data={data}
          keyword={keyword}
          dataType={isComparison ? 'comparison' : 'timeline'}
          elementId="trend-chart-container"
          customOptions={{ timeRange }}
        />
      </div>
      <div id="trend-chart-container" className="h-[400px]"> {/* Fixed height container */}
        <canvas ref={chartRef}></canvas>
      </div>
      <RealTimeTrendChart 
  geo="US" 
  category="all" 
  refreshInterval={60000} // Refresh every minute
/>
    </div>
  )
}

export default TrendChart

