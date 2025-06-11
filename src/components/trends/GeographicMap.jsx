"use client"

import { useState, useEffect, useContext, useRef } from "react"
import { ThemeContext } from "../../context/ThemeContext"
import { Search } from "lucide-react"
import * as d3 from "d3"
import * as topojson from "topojson-client"
import ExportButton from '../ExportButton'

// Standalone map component with guaranteed rendering
function GeographicMap({ data, title, keyword }) {
  const { darkMode } = useContext(ThemeContext)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [mapData, setMapData] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCountry, setSelectedCountry] = useState(null)
  const [worldData, setWorldData] = useState(null)
  const mapRef = useRef(null)

  // Extended default data with more countries
  const defaultData = {
    regions: [
      { code: "US", name: "United States", value: 100 },
      { code: "GB", name: "United Kingdom", value: 80 },
      { code: "CA", name: "Canada", value: 70 },
      { code: "AU", name: "Australia", value: 65 },
      { code: "DE", name: "Germany", value: 60 },
      { code: "FR", name: "France", value: 55 },
      { code: "JP", name: "Japan", value: 50 },
      { code: "BR", name: "Brazil", value: 45 },
      { code: "IN", name: "India", value: 40 },
      { code: "RU", name: "Russia", value: 35 },
      { code: "CN", name: "China", value: 75 },
      { code: "IT", name: "Italy", value: 48 },
      { code: "ES", name: "Spain", value: 42 },
      { code: "MX", name: "Mexico", value: 38 },
      { code: "KR", name: "South Korea", value: 58 },
      { code: "NL", name: "Netherlands", value: 52 },
      { code: "SE", name: "Sweden", value: 47 },
      { code: "CH", name: "Switzerland", value: 56 },
      { code: "SG", name: "Singapore", value: 62 },
      { code: "ZA", name: "South Africa", value: 33 },
      { code: "AE", name: "United Arab Emirates", value: 44 },
      { code: "AR", name: "Argentina", value: 36 },
      { code: "NO", name: "Norway", value: 51 },
      { code: "NZ", name: "New Zealand", value: 49 },
      { code: "PL", name: "Poland", value: 39 },
    ],
  }

  // Load the world topology data
  useEffect(() => {
    const fetchWorldData = async () => {
      try {
        const response = await fetch('https://unpkg.com/world-atlas@2.0.2/countries-110m.json');
        const data = await response.json();
        setWorldData(data);
      } catch (err) {
        console.error("Error loading world map data:", err);
        setError("Failed to load world map data");
      }
    };
    
    fetchWorldData();
  }, []);

  // Debug the incoming data
  useEffect(() => {
    console.log("GeographicMap component mounted")
    console.log("GeographicMap received data:", data)

    try {
      // Validate data format
      if (!data || !data.regions || !Array.isArray(data.regions) || data.regions.length === 0) {
        console.warn("Invalid or empty data format received by GeographicMap, using default data")
        setMapData(defaultData)
      } else {
        console.log("Valid data format received by GeographicMap")

        // Add country names if they don't exist and normalize values
        const enhancedData = {
          regions: data.regions.map((region) => {
            // Ensure we have a name
            let name = region.name || region.code

            // If we still don't have a name, try to find it in the default data
            if (!name || name === region.code) {
              const defaultRegion = defaultData.regions.find((r) => r.code === region.code)
              name = defaultRegion?.name || region.code
            }

            // Ensure value is a number between 0-100
            let value = region.value
            if (typeof value !== "number") {
              value = Number.parseInt(value) || 0
            }
            value = Math.max(0, Math.min(100, value)) // Clamp between 0-100

            return {
              ...region,
              name,
              value,
            }
          }),
        }

        setMapData(enhancedData)
      }
    } catch (err) {
      console.error("Error processing map data:", err)
      setError("Error processing map data: " + err.message)
      setMapData(defaultData)
    } finally {
      // Always set loading to false after processing data
      setLoading(false)
    }
  }, [data])

  // Render the D3 map when data and world topology are available
  useEffect(() => {
    if (!mapRef.current || !worldData || !mapData) return;
    
    // Clear previous SVG
    d3.select(mapRef.current).selectAll("*").remove();
    
    const width = mapRef.current.clientWidth;
    const height = 400;
    
    // Create the SVG
    const svg = d3.select(mapRef.current)
      .append("svg")
      .attr("width", "100%")
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .attr("style", "max-width: 100%; height: auto;");
    
    // Create a map of country ISO codes to their data
    const countryDataMap = new Map();
    mapData.regions.forEach(region => {
      countryDataMap.set(region.code, region);
    });
    
    // Color scale
    const colorScale = d3.scaleSequential(d3.interpolateBlues)
      .domain([0, 100]);
    
    // Create a projection and path
    const projection = d3.geoNaturalEarth1()
      .fitSize([width, height], topojson.feature(worldData, worldData.objects.countries));
    
    const path = d3.geoPath().projection(projection);
    
    // Draw the countries
    const countries = svg.append("g")
      .selectAll("path")
      .data(topojson.feature(worldData, worldData.objects.countries).features)
      .join("path")
      .attr("fill", d => {
        // Find the ISO code for this country from TopoJSON
        const countryCode = d.id;
        // Get the data for this country if it exists
        const countryData = countryDataMap.get(countryCode);
        return countryData ? colorScale(countryData.value) : "#eee";
      })
      .attr("d", path)
      .attr("stroke", darkMode ? "#333" : "#fff")
      .attr("stroke-width", 0.5)
      .attr("class", "country")
      // Add hover effects and click handling
      .on("mouseover", function(event, d) {
        d3.select(this).attr("stroke-width", 1.5).attr("stroke", "#333");
        
        // Find the country data
        const countryCode = d.id;
        const countryData = countryDataMap.get(countryCode);
        
        if (countryData) {
          // Show tooltip with country data
          const tooltip = d3.select(mapRef.current).append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("background", darkMode ? "#333" : "#fff")
            .style("color", darkMode ? "#fff" : "#333")
            .style("padding", "5px")
            .style("border-radius", "3px")
            .style("box-shadow", "0 0 10px rgba(0,0,0,0.1)")
            .style("pointer-events", "none")
            .style("left", `${event.pageX - mapRef.current.offsetLeft}px`)
            .style("top", `${event.pageY - mapRef.current.offsetTop - 40}px`);
          
          tooltip.html(`
            <div><strong>${countryData.name}</strong></div>
            <div>Interest: ${countryData.value}</div>
          `);
        }
      })
      .on("mouseout", function() {
        d3.select(this).attr("stroke-width", 0.5).attr("stroke", darkMode ? "#333" : "#fff");
        d3.select(mapRef.current).selectAll(".tooltip").remove();
      })
      .on("click", function(event, d) {
        const countryCode = d.id;
        const countryData = countryDataMap.get(countryCode);
        if (countryData) {
          handleCountrySelect(countryData);
        }
      });
    
    // Add a legend
    const legendWidth = 200;
    const legendHeight = 20;
    const legendX = width - legendWidth - 20;
    const legendY = height - 50;
    
    const legendScale = d3.scaleLinear()
      .domain([0, 100])
      .range([0, legendWidth]);
    
    const legendAxis = d3.axisBottom(legendScale)
      .ticks(5)
      .tickSize(6);
    
    const defs = svg.append("defs");
    
    const linearGradient = defs.append("linearGradient")
      .attr("id", "map-color-gradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "100%")
      .attr("y2", "0%");
    
    linearGradient.selectAll("stop")
      .data(d3.range(0, 101, 20).map(d => ({ offset: d, color: colorScale(d) })))
      .enter().append("stop")
      .attr("offset", d => `${d.offset}%`)
      .attr("stop-color", d => d.color);
    
    svg.append("g")
      .attr("transform", `translate(${legendX}, ${legendY})`)
      .append("rect")
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .style("fill", "url(#map-color-gradient)");
    
    svg.append("g")
      .attr("transform", `translate(${legendX}, ${legendY + legendHeight})`)
      .call(legendAxis)
      .select(".domain")
      .remove();
    
    svg.append("text")
      .attr("x", legendX)
      .attr("y", legendY - 5)
      .attr("font-size", "12px")
      .attr("fill", darkMode ? "#ccc" : "#666")
      .text("Interest Level");
      
  }, [worldData, mapData, darkMode]);

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value)
    setSelectedCountry(null)
  }

  // Handle country selection
  const handleCountrySelect = (country) => {
    setSelectedCountry(country)
    setSearchTerm("")
  }

  // Filter countries based on search term
  const getFilteredCountries = () => {
    try {
      if (!mapData || !mapData.regions || !Array.isArray(mapData.regions)) {
        console.warn("Invalid map data in getFilteredCountries")
        return defaultData.regions
      }

      if (!searchTerm || !searchTerm.trim()) return mapData.regions

      const term = searchTerm.toLowerCase().trim()
      return mapData.regions.filter(
        (region) =>
          (region.code && region.code.toLowerCase().includes(term)) ||
          (region.name && region.name.toLowerCase().includes(term)),
      )
    } catch (error) {
      console.error("Error in getFilteredCountries:", error)
      return defaultData.regions
    }
  }

  // Get color based on value (0-100)
  const getColorForValue = (value) => {
    // Simple blue color scale
    if (value >= 80) return "#1e40af" // Very high (dark blue)
    if (value >= 60) return "#3b82f6" // High (medium blue)
    if (value >= 40) return "#60a5fa" // Medium (light blue)
    if (value >= 20) return "#93c5fd" // Low (very light blue)
    return "#dbeafe" // Very low (extremely light blue)
  }

  // Render a simple visualization of the data
  const renderDataVisualization = () => {
    try {
      // Ensure we have data to display
      const dataToRender = mapData || defaultData
      console.log("Rendering map with data:", dataToRender)

      return (
        <div className="w-full">
          <div className="mb-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="Search countries..."
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
          </div>

          {/* D3 World Map Container */}
          <div 
            ref={mapRef} 
            className="w-full h-[400px] mb-4 bg-white dark:bg-gray-800 rounded-lg shadow-inner"
          ></div>

          {selectedCountry ? (
            <div className="mb-6">
              <div className="p-6 rounded-lg shadow-md bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {selectedCountry.name || selectedCountry.code}
                  </h3>
                  <button
                    onClick={() => setSelectedCountry(null)}
                    className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    &times;
                  </button>
                </div>
                <div className="flex items-center justify-center mb-4">
                  <div
                    className="w-24 h-24 rounded-full flex items-center justify-center text-white text-2xl font-bold"
                    style={{ backgroundColor: getColorForValue(selectedCountry.value) }}
                  >
                    {selectedCountry.value}
                  </div>
                </div>
                <div className="text-center text-gray-700 dark:text-gray-300">
                  <p>Interest level: {selectedCountry.value}/100</p>
                  <p className="mt-2 text-sm">
                    {selectedCountry.value >= 80
                      ? "Very high interest"
                      : selectedCountry.value >= 60
                        ? "High interest"
                        : selectedCountry.value >= 40
                          ? "Medium interest"
                          : selectedCountry.value >= 20
                            ? "Low interest"
                            : "Very low interest"}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 mt-4">
            {searchTerm && getFilteredCountries().length > 0 ? (
              getFilteredCountries().map((region, index) => (
                <div
                  key={index}
                  className="p-4 rounded flex flex-col items-center justify-center text-white cursor-pointer transition-transform hover:scale-105"
                  style={{
                    backgroundColor: getColorForValue(region.value),
                    height: "100px",
                  }}
                  onClick={() => handleCountrySelect(region)}
                >
                  <div className="text-lg font-bold">{region.code}</div>
                  <div className="text-sm mt-1">{region.name || ""}</div>
                  <div className="text-sm mt-1">Value: {region.value}</div>
                </div>
              ))
            ) : searchTerm ? (
              <div className="col-span-full text-center py-4 text-gray-500 dark:text-gray-400">
                No countries match your search.
              </div>
            ) : null}
          </div>
        </div>
      )
    } catch (error) {
      console.error("Error rendering data visualization:", error)
      return (
        <div className="text-center py-8 text-red-500 dark:text-red-400">
          Error rendering map data. Please try refreshing the page.
        </div>
      )
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md transition-colors duration-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{title || "Geographic Interest"}</h3>
        <ExportButton
          data={mapData}
          keyword={keyword}
          dataType="geographic"
          elementId="geographic-map-container"
        />
      </div>

      {error && (
        <div className="text-red-500 dark:text-red-400 mb-4 text-center p-2 bg-red-50 dark:bg-red-900/20 rounded">
          {error}
        </div>
      )}

      <div id="geographic-map-container" className="relative" style={{ minHeight: "400px" }}>
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-gray-800/50 z-10 rounded-lg">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 dark:border-indigo-400"></div>
          </div>
        ) : (
          <div className="w-full">
            {renderDataVisualization()}
          </div>
        )}
      </div>
    </div>
  )
}

export default GeographicMap

