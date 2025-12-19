import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { MapPin } from "lucide-react";

// Comprehensive DMV + major US cities
const US_CITIES = [
  // DMV Area - Maryland
  "Annapolis, MD", "Baltimore, MD", "Bethesda, MD", "Bowie, MD", "College Park, MD", 
  "Columbia, MD", "Frederick, MD", "Gaithersburg, MD", "Germantown, MD", "Greenbelt, MD",
  "Hagerstown, MD", "Hyattsville, MD", "Laurel, MD", "Montgomery Village, MD", "Rockville, MD",
  "Silver Spring, MD", "Takoma Park, MD", "Towson, MD", "Waldorf, MD", "Wheaton, MD",
  
  // DMV Area - Virginia
  "Alexandria, VA", "Annandale, VA", "Arlington, VA", "Ashburn, VA", "Burke, VA",
  "Centreville, VA", "Chantilly, VA", "Dale City, VA", "Fairfax, VA", "Falls Church, VA",
  "Franconia, VA", "Herndon, VA", "Leesburg, VA", "Manassas, VA", "McLean, VA",
  "Mount Vernon, VA", "Reston, VA", "Springfield, VA", "Sterling, VA", "Tysons, VA",
  "Vienna, VA", "Woodbridge, VA",
  
  // DMV Area - DC
  "Washington, DC",
  
  // Major US Cities
  "New York, NY", "Los Angeles, CA", "Chicago, IL", "Houston, TX", "Phoenix, AZ",
  "Philadelphia, PA", "San Antonio, TX", "San Diego, CA", "Dallas, TX", "San Jose, CA",
  "Austin, TX", "Jacksonville, FL", "Fort Worth, TX", "Columbus, OH", "Charlotte, NC",
  "San Francisco, CA", "Indianapolis, IN", "Seattle, WA", "Denver, CO", "Boston, MA",
  "El Paso, TX", "Nashville, TN", "Detroit, MI", "Oklahoma City, OK", "Portland, OR",
  "Las Vegas, NV", "Memphis, TN", "Louisville, KY", "Baltimore, MD", "Milwaukee, WI",
  "Albuquerque, NM", "Tucson, AZ", "Fresno, CA", "Mesa, AZ", "Sacramento, CA",
  "Atlanta, GA", "Kansas City, MO", "Colorado Springs, CO", "Raleigh, NC", "Miami, FL",
  "Long Beach, CA", "Virginia Beach, VA", "Omaha, NE", "Oakland, CA", "Minneapolis, MN",
  "Tulsa, OK", "Tampa, FL", "Arlington, TX", "New Orleans, LA", "Wichita, KS",
  "Cleveland, OH", "Bakersfield, CA", "Aurora, CO", "Anaheim, CA", "Honolulu, HI",
  "Santa Ana, CA", "Riverside, CA", "Corpus Christi, TX", "Lexington, KY", "Henderson, NV",
  "Stockton, CA", "Saint Paul, MN", "Cincinnati, OH", "St. Louis, MO", "Pittsburgh, PA",
  "Greensboro, NC", "Lincoln, NE", "Anchorage, AK", "Plano, TX", "Orlando, FL",
  "Irvine, CA", "Newark, NJ", "Durham, NC", "Chula Vista, CA", "Toledo, OH",
  "Fort Wayne, IN", "St. Petersburg, FL", "Laredo, TX", "Jersey City, NJ", "Chandler, AZ",
  "Madison, WI", "Lubbock, TX", "Scottsdale, AZ", "Reno, NV", "Buffalo, NY",
  "Gilbert, AZ", "Glendale, AZ", "North Las Vegas, NV", "Winston-Salem, NC", "Chesapeake, VA",
  "Norfolk, VA", "Fremont, CA", "Garland, TX", "Irving, TX", "Hialeah, FL",
  "Richmond, VA", "Boise, ID", "Spokane, WA", "Baton Rouge, LA"
].sort();

export default function CityAutocomplete({ value, onChange, placeholder = "City, State", className = "" }) {
  const [inputValue, setInputValue] = useState(value || "");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredCities, setFilteredCities] = useState([]);
  const wrapperRef = useRef(null);

  useEffect(() => {
    setInputValue(value || "");
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);

    if (newValue.length > 0) {
      const filtered = US_CITIES.filter(city =>
        city.toLowerCase().includes(newValue.toLowerCase())
      ).slice(0, 10);
      setFilteredCities(filtered);
      setShowSuggestions(true);
    } else {
      setFilteredCities([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectCity = (city) => {
    setInputValue(city);
    onChange(city);
    setShowSuggestions(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Input
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => inputValue && setShowSuggestions(true)}
          placeholder={placeholder}
          className={className}
          autoComplete="off"
        />
        <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
      </div>
      
      {showSuggestions && filteredCities.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border-2 border-black rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filteredCities.map((city, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSelectCity(city)}
              className="w-full px-4 py-3 text-left hover:bg-gray-100 flex items-center gap-2 border-b border-gray-200 last:border-0"
            >
              <MapPin className="w-4 h-4 text-gray-400" />
              <span className="font-medium">{city}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}