import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { MapPin } from "lucide-react";

// Extracted from the comprehensive US cities CSV - prioritizing DMV area and major cities
const US_CITIES = [
  // DMV Area cities (comprehensive)
  "Washington, DC", "Alexandria, VA", "Arlington, VA", "Annandale, VA", "Ashburn, VA", "Burke, VA", "Centreville, VA", "Chantilly, VA", "Dale City, VA", "Fairfax, VA", "Falls Church, VA", "Franconia, VA", "Herndon, VA", "Leesburg, VA", "Manassas, VA", "McLean, VA", "Mount Vernon, VA", "Reston, VA", "Springfield, VA", "Sterling, VA", "Tysons, VA", "Vienna, VA", "Woodbridge, VA",
  "Annapolis, MD", "Baltimore, MD", "Bethesda, MD", "Bowie, MD", "College Park, MD", "Columbia, MD", "Frederick, MD", "Gaithersburg, MD", "Germantown, MD", "Greenbelt, MD", "Hagerstown, MD", "Hyattsville, MD", "Laurel, MD", "Montgomery Village, MD", "Rockville, MD", "Silver Spring, MD", "Takoma Park, MD", "Towson, MD", "Waldorf, MD", "Wheaton, MD", "Glen Burnie, MD", "Ellicott City, MD", "Bethesda, MD", "Severn, MD", "Dundalk, MD", "Catonsville, MD", "Essex, MD", "Parkville, MD", "Owings Mills, MD", "Randallstown, MD", "Reisterstown, MD", "Pikesville, MD", "Eldersburg, MD", "Odenton, MD",
  // Major US Cities (top 200)
  "New York, NY", "Los Angeles, CA", "Chicago, IL", "Houston, TX", "Phoenix, AZ", "Philadelphia, PA", "San Antonio, TX", "San Diego, CA", "Dallas, TX", "San Jose, CA", "Austin, TX", "Jacksonville, FL", "Fort Worth, TX", "Columbus, OH", "Charlotte, NC", "San Francisco, CA", "Indianapolis, IN", "Seattle, WA", "Denver, CO", "Boston, MA", "El Paso, TX", "Nashville, TN", "Detroit, MI", "Oklahoma City, OK", "Portland, OR", "Las Vegas, NV", "Memphis, TN", "Louisville, KY", "Milwaukee, WI", "Albuquerque, NM", "Tucson, AZ", "Fresno, CA", "Mesa, AZ", "Sacramento, CA", "Atlanta, GA", "Kansas City, MO", "Colorado Springs, CO", "Raleigh, NC", "Miami, FL", "Long Beach, CA", "Virginia Beach, VA", "Omaha, NE", "Oakland, CA", "Minneapolis, MN", "Tulsa, OK", "Tampa, FL", "Arlington, TX", "New Orleans, LA", "Wichita, KS", "Cleveland, OH", "Bakersfield, CA", "Aurora, CO", "Anaheim, CA", "Honolulu, HI", "Santa Ana, CA", "Riverside, CA", "Corpus Christi, TX", "Lexington, KY", "Henderson, NV", "Stockton, CA", "Saint Paul, MN", "Cincinnati, OH", "St. Louis, MO", "Pittsburgh, PA", "Greensboro, NC", "Lincoln, NE", "Anchorage, AK", "Plano, TX", "Orlando, FL", "Irvine, CA", "Newark, NJ", "Durham, NC", "Chula Vista, CA", "Toledo, OH", "Fort Wayne, IN", "St. Petersburg, FL", "Laredo, TX", "Jersey City, NJ", "Chandler, AZ", "Madison, WI", "Lubbock, TX", "Scottsdale, AZ", "Reno, NV", "Buffalo, NY", "Gilbert, AZ", "Glendale, AZ", "North Las Vegas, NV", "Winston-Salem, NC", "Chesapeake, VA", "Norfolk, VA", "Fremont, CA", "Garland, TX", "Irving, TX", "Hialeah, FL", "Richmond, VA", "Boise, ID", "Spokane, WA", "Baton Rouge, LA", "Tacoma, WA", "San Bernardino, CA", "Modesto, CA", "Fontana, CA", "Des Moines, IA", "Moreno Valley, CA", "Santa Clarita, CA", "Fayetteville, NC", "Birmingham, AL", "Oxnard, CA", "Rochester, NY", "Port St. Lucie, FL", "Grand Rapids, MI", "Huntsville, AL", "Salt Lake City, UT", "Frisco, TX", "Yonkers, NY", "Amarillo, TX", "Glendale, CA", "Huntington Beach, CA", "McKinney, TX", "Montgomery, AL", "Augusta, GA", "Aurora, IL", "Akron, OH", "Little Rock, AR", "Tempe, AZ", "Columbus, GA", "Overland Park, KS", "Grand Prairie, TX", "Tallahassee, FL", "Cape Coral, FL", "Mobile, AL", "Knoxville, TN", "Shreveport, LA", "Worcester, MA", "Ontario, CA", "Vancouver, WA", "Sioux Falls, SD", "Chattanooga, TN", "Brownsville, TX", "Fort Lauderdale, FL", "Providence, RI", "Newport News, VA", "Rancho Cucamonga, CA", "Santa Rosa, CA", "Peoria, AZ", "Oceanside, CA", "Elk Grove, CA", "Salem, OR", "Pembroke Pines, FL", "Eugene, OR", "Garden Grove, CA", "Cary, NC", "Fort Collins, CO", "Corona, CA", "Springfield, MO", "Jackson, MS", "Alexandria, VA", "Hayward, CA", "Lancaster, CA", "Lakewood, CO", "Clarksville, TN", "Palmdale, CA", "Salinas, CA", "Springfield, MA", "Pasadena, TX", "Macon, GA", "Pomona, CA", "Kansas City, KS", "Sunnyvale, CA", "Hollywood, FL", "Roseville, CA", "Charleston, SC", "Escondido, CA", "Joliet, IL", "Jackson, TN", "Bellevue, WA", "Surprise, AZ", "Savannah, GA", "Bridgeport, CT", "Torrance, CA", "McAllen, TX", "Naperville, IL", "Mesquite, TX", "Olathe, KS", "Syracuse, NY", "Dayton, OH", "Pasadena, CA", "Orange, CA", "Fullerton, CA", "Killeen, TX", "Hampton, VA", "Warren, MI", "West Valley City, UT", "Columbia, SC", "Cedar Rapids, IA", "Sterling Heights, MI", "New Haven, CT", "Stamford, CT", "Concord, CA", "Elizabeth, NJ", "Visalia, CA", "Thousand Oaks, CA", "Santa Clara, CA", "Hartford, CT", "Abilene, TX", "Gainesville, FL", "Simi Valley, CA", "Topeka, KS", "Denton, TX", "Roswell, GA", "Midland, TX", "Waco, TX", "Carrollton, TX", "Pearland, TX", "Columbia, MO", "Victorville, CA", "Coral Springs, FL", "Round Rock, TX", "Sterling Heights, MI", "Kent, WA", "Santa Maria, CA", "New Braunfels, TX"
].sort();

export default function CityAutocomplete({ value, onChange, placeholder = "City, State", className = "" }) {
  const [inputValue, setInputValue] = useState(value || "");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredCities, setFilteredCities] = useState([]);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    setInputValue(value || "");
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    // Close dropdown on scroll or resize so it doesn't appear misaligned
    const handleScrollOrResize = () => setShowSuggestions(false);

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, []);

  const updateDropdownPosition = () => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: 'fixed',
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        zIndex: 9999,
      });
    }
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);

    if (newValue.length > 0) {
      const filtered = US_CITIES.filter(city =>
        city.toLowerCase().includes(newValue.toLowerCase())
      ).slice(0, 10);
      setFilteredCities(filtered);
      updateDropdownPosition();
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
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => { if (inputValue) { updateDropdownPosition(); setShowSuggestions(true); } }}
          placeholder={placeholder}
          className={className}
          autoComplete="off"
        />
        <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
      </div>
      
      {showSuggestions && filteredCities.length > 0 && (
        <div style={dropdownStyle} className="bg-white border-2 border-black rounded-lg shadow-2xl max-h-60 overflow-y-auto">
          {filteredCities.map((city, index) => (
            <button
              key={index}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); handleSelectCity(city); }}
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