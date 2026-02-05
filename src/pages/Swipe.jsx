import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Heart, Loader2, SlidersHorizontal, Undo } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import SwipeCard from "../components/swipe/SwipeCard";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import CityAutocomplete from "../components/forms/CityAutocomplete";

const categories = [
  { value: "all", label: "All Vendors" },
  { value: "dj", label: "DJs" },
  { value: "photographer", label: "Photographers" },
  { value: "videographer", label: "Videographers" },
  { value: "photo_booth", label: "Photo Booth" },
  { value: "caterer", label: "Caterers" },
  { value: "food_truck", label: "Food Trucks" },
  { value: "baker", label: "Bakers" },
  { value: "balloon_decorator", label: "Balloon Decorators" },
  { value: "event_stylist", label: "Event Stylists" },
  { value: "banquet_hall", label: "Banquet Halls" },
  { value: "rental_services", label: "Rental Services" },
  { value: "event_planner", label: "Event Planners" },
  { value: "luxury_car_rental", label: "Luxury Car Rental" }
];

export default function SwipePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeHistory, setSwipeHistory] = useState([]);
  const swipeLockRef = React.useRef(false);
  const [filters, setFilters] = useState({
    category: "all",
    priceRange: "all",
    minPrice: "",
    maxPrice: "",
    location: "",
    minRating: "all"
  });
  const urlParams = new URLSearchParams(window.location.search);
  const eventType = urlParams.get('event') || 'event';

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const user = await base44.auth.me();
        if (!user.onboarding_complete) {
          navigate(createPageUrl("Onboarding"));
        }
      } catch (error) {
        console.error(error);
      }
    };
    checkOnboarding();
  }, [navigate]);

  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      const user = await base44.auth.me();
      setCurrentUser(user);
    };
    loadUser();
  }, []);

  const { data: vendors = [], isLoading: vendorsLoading } = useQuery({
    queryKey: ['vendors'],
    queryFn: () => base44.entities.Vendor.list(),
    initialData: [],
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const { data: swipedVendors = [] } = useQuery({
    queryKey: ['user-swipes', currentUser?.email],
    queryFn: async () => {
      if (!currentUser) return [];
      return await base44.entities.UserSwipe.filter({ created_by: currentUser.email });
    },
    enabled: !!currentUser,
    initialData: [],
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const { data: savedVendors = [] } = useQuery({
    queryKey: ['saved-vendors', currentUser?.email],
    queryFn: async () => {
      if (!currentUser) return [];
      return await base44.entities.SavedVendor.filter({ created_by: currentUser.email });
    },
    enabled: !!currentUser,
    initialData: [],
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['all-bookings'],
    queryFn: () => base44.entities.Booking.list(),
    initialData: [],
    staleTime: 10 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['reviews'],
    queryFn: () => base44.entities.Review.list(),
    initialData: [],
    staleTime: 10 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
  });

  const [localSwipedIds, setLocalSwipedIds] = useState(new Set());

  // Track which vendors have been swiped (left or right) to exclude from display
  const allSwipedVendorIds = React.useMemo(() => {
    const ids = new Set();
    swipedVendors.forEach(swipe => ids.add(swipe.vendor_id));
    savedVendors.forEach(saved => ids.add(saved.vendor_id));
    localSwipedIds.forEach(id => ids.add(id));
    return ids;
  }, [swipedVendors, savedVendors, localSwipedIds]);

  const [isSwipeInProgress, setIsSwipeInProgress] = useState(false);
  const lastSwipeTimeRef = React.useRef(0);
  const SWIPE_COOLDOWN_MS = 400; // Rate limit: min 400ms between swipes

  const swipeMutation = useMutation({
    mutationFn: async ({ vendorId, direction, vendor }) => {
      // Prevent local duplicate swipes
      if (localSwipedIds.has(vendorId)) {
        console.log('[MUTATION] Duplicate swipe prevented locally:', vendorId);
        return { id: vendorId };
      }

      const swipePromise = base44.entities.UserSwipe.create({
        vendor_id: vendorId,
        direction,
        event_type: eventType
      });

      if (direction === "right") {
        // Check if vendor is already saved to prevent duplicates
        const alreadySaved = savedVendors.some(sv => sv.vendor_id === vendorId);
        
        if (!alreadySaved) {
          const savePromise = base44.entities.SavedVendor.create({
            vendor_id: vendorId,
            vendor_name: vendor.business_name,
            vendor_category: vendor.category,
            event_type: eventType
          });
          return Promise.all([swipePromise, savePromise]);
        }
      }
      
      return swipePromise;
    },
    onSuccess: (result, variables) => {
          if (variables.direction === "right") {
            toast.success("Added to your favorites! ❤️");
          }

          const swipeId = Array.isArray(result) ? result[0].id : result.id;
          const savedId = Array.isArray(result) && result.length > 1 ? result[1].id : null;
          setSwipeHistory(prev => [...prev, { 
            swipeId, 
            savedId,
            vendorId: variables.vendorId,
            direction: variables.direction,
            vendor: variables.vendor 
          }]);

          swipeLockRef.current = false;
          setIsSwipeInProgress(false);
          queryClient.invalidateQueries({ queryKey: ['user-swipes', currentUser?.email] });
          queryClient.invalidateQueries({ queryKey: ['saved-vendors', currentUser?.email] });
        },
    onError: (error) => {
      // Remove from local tracking if error
      setLocalSwipedIds(prev => {
        const updated = new Set(prev);
        updated.delete(error.vendorId);
        return updated;
      });
      toast.error("Something went wrong");
      swipeLockRef.current = false;
      setIsSwipeInProgress(false);
    },
  });

  // Get available categories from approved vendors
  const availableCategories = vendors
    .filter(v => v.approval_status === "approved" && v.profile_complete === true)
    .map(v => v.category);
  
  const uniqueAvailableCategories = [...new Set(availableCategories)];

  // Calculate vendor tier based on completed bookings
  const getVendorTier = (vendorId) => {
    const completedCount = bookings.filter(b => b.vendor_id === vendorId && b.status === "completed").length;
    if (completedCount >= 100) return 5; // Elite
    if (completedCount >= 51) return 4;  // Master
    if (completedCount >= 16) return 3;  // Expert
    if (completedCount >= 6) return 2;   // Pro
    return 1; // Rising Star
  };

  const filteredVendors = vendors.filter(vendor => {
    const isApproved = vendor.approval_status === "approved";
    const profileComplete = vendor.profile_complete === true;
    // Exclude all swiped vendors (both left and right)
    const hasBeenSwiped = allSwipedVendorIds.has(vendor.id);
    const matchesCategory = filters.category === "all" || vendor.category === filters.category;
    const matchesPriceRange = filters.priceRange === "all" || vendor.price_range === filters.priceRange;
    
    let matchesPrice = true;
    if (filters.minPrice && vendor.starting_price) {
      matchesPrice = vendor.starting_price >= parseFloat(filters.minPrice);
    }
    if (filters.maxPrice && vendor.starting_price) {
      matchesPrice = matchesPrice && vendor.starting_price <= parseFloat(filters.maxPrice);
    }
    
    const matchesLocation = !filters.location || 
      vendor.location?.toLowerCase().includes(filters.location.toLowerCase());

    // Rating filter
    let matchesRating = true;
    if (filters.minRating !== "all") {
      const vendorReviews = reviews.filter(r => r.vendor_id === vendor.id);
      if (vendorReviews.length > 0) {
        const avgRating = vendorReviews.reduce((sum, r) => sum + r.rating, 0) / vendorReviews.length;
        matchesRating = avgRating >= parseFloat(filters.minRating);
      } else {
        matchesRating = false;
      }
    }
    
    return isApproved && profileComplete && !hasBeenSwiped && matchesCategory && matchesPriceRange && matchesPrice && matchesLocation && matchesRating;
  }).sort((a, b) => {
    // 1. HIGHEST PRIORITY: Vendor tier (based on completed bookings)
    const tierA = getVendorTier(a.id);
    const tierB = getVendorTier(b.id);
    if (tierA !== tierB) return tierB - tierA;
    
    // 2. Exact location match
    if (!currentUser) return 0;
    const userLocation = currentUser.location?.toLowerCase() || filters.location?.toLowerCase() || "";
    const aLocationMatch = a.location?.toLowerCase() === userLocation;
    const bLocationMatch = b.location?.toLowerCase() === userLocation;
    if (aLocationMatch !== bLocationMatch) {
      return aLocationMatch ? -1 : 1;
    }

    // 3. Location contains user's city/state
    const aLocationPartial = userLocation && a.location?.toLowerCase().includes(userLocation);
    const bLocationPartial = userLocation && b.location?.toLowerCase().includes(userLocation);
    if (aLocationPartial !== bLocationPartial) {
      return aLocationPartial ? -1 : 1;
    }
    
    // 4. Event type specialties match
    const aSpecialtiesMatch = a.specialties?.some(s => s.toLowerCase().includes(eventType.toLowerCase()));
    const bSpecialtiesMatch = b.specialties?.some(s => s.toLowerCase().includes(eventType.toLowerCase()));
    if (aSpecialtiesMatch !== bSpecialtiesMatch) {
      return aSpecialtiesMatch ? -1 : 1;
    }
    
    // 5. Better rating (if reviews exist)
    const aReviews = reviews.filter(r => r.vendor_id === a.id);
    const bReviews = reviews.filter(r => r.vendor_id === b.id);
    if (aReviews.length > 0 && bReviews.length > 0) {
      const aAvgRating = aReviews.reduce((sum, r) => sum + r.rating, 0) / aReviews.length;
      const bAvgRating = bReviews.reduce((sum, r) => sum + r.rating, 0) / bReviews.length;
      if (aAvgRating !== bAvgRating) return bAvgRating - aAvgRating;
    }
    
    // 6. More reviews = more popular
    if (aReviews.length !== bReviews.length) return bReviews.length - aReviews.length;
    
    return 0;
  });

  const currentVendor = filteredVendors[currentIndex];

  const handleSwipe = (direction, source = 'unknown') => {
    if (!currentVendor) return;
    if (swipeLockRef.current) return;
    
    const now = Date.now();
    if (now - lastSwipeTimeRef.current < SWIPE_COOLDOWN_MS) return;
    lastSwipeTimeRef.current = now;
    
    swipeLockRef.current = true;
    setIsSwipeInProgress(true);
    
    const vendorToSwipe = currentVendor;
    
    // Optimistic update: move to next card immediately (smooth UI)
    setCurrentIndex(prev => prev + 1);
    setLocalSwipedIds(prev => new Set([...prev, vendorToSwipe.id]));
    
    // Save to database
    swipeMutation.mutate({
        vendorId: vendorToSwipe.id,
        direction,
        vendor: vendorToSwipe
      }, {
        onError: () => {
          // Rollback optimistic update on error
          setCurrentIndex(prev => prev - 1);
          setLocalSwipedIds(prev => {
            const updated = new Set(prev);
            updated.delete(vendorToSwipe.id);
            return updated;
          });
        }
      });
    };

  const handleUndo = async () => {
    if (swipeHistory.length === 0) return;
    
    const lastSwipe = swipeHistory[swipeHistory.length - 1];
    
    try {
      await base44.entities.UserSwipe.delete(lastSwipe.swipeId);
      
      if (lastSwipe.savedId) {
        await base44.entities.SavedVendor.delete(lastSwipe.savedId);
      }
      
      // Remove from local tracking
      setLocalSwipedIds(prev => {
        const updated = new Set(prev);
        updated.delete(lastSwipe.vendorId);
        return updated;
      });
      
      setSwipeHistory(prev => prev.slice(0, -1));
      toast.success("Undone!");
    } catch (error) {
      toast.error("Failed to undo");
    }
  };

  const handleReset = async () => {
    try {
      for (const swipe of swipedVendors) {
        await base44.entities.UserSwipe.delete(swipe.id);
      }

      queryClient.invalidateQueries({ queryKey: ['user-swipes', currentUser?.email] });

      setCurrentIndex(0);
      setSwipeHistory([]);
      setLocalSwipedIds(new Set());
      setFilters({
        category: "all",
        priceRange: "all",
        minPrice: "",
        maxPrice: "",
        location: "",
        minRating: "all"
      });

      toast.success("All vendors restored!");
    } catch (error) {
      toast.error("Failed to reset");
    }
  };

  // Reset index when filters change
  useEffect(() => {
    setCurrentIndex(0);
  }, [filters]);

  if (vendorsLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-black text-black mb-3">
            Find Your Perfect Vendors
          </h1>
          <p className="text-lg md:text-xl text-gray-600 font-medium">
            Swipe right to save, left to pass
          </p>
        </div>
        <div className="relative h-[600px] mb-8 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-black" />
            <p className="text-gray-600 font-medium">Loading vendors...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-black text-black mb-3">
          Find Your Perfect Vendors
        </h1>
        <p className="text-lg md:text-xl text-gray-600 font-medium">
          Swipe right to save, left to pass
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              className="w-full flex items-center justify-center gap-2 border-2 border-black hover:bg-black hover:text-white font-bold"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {(filters.category !== "all" || filters.priceRange !== "all" || filters.location || filters.minRating !== "all") && (
                <span className="ml-2 px-2 py-0.5 bg-black text-white rounded-full text-xs">
                  Active
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle className="text-2xl font-black">Filter Vendors</SheetTitle>
            </SheetHeader>
            <div className="space-y-6 mt-6">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={filters.category} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger className="border-2 border-gray-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => {
                      const isAvailable = cat.value === "all" || uniqueAvailableCategories.includes(cat.value);
                      return (
                        <SelectItem 
                          key={cat.value} 
                          value={cat.value}
                          disabled={!isAvailable}
                          className={!isAvailable ? "text-gray-400 cursor-not-allowed" : ""}
                        >
                          {cat.label} {!isAvailable && "(No vendors)"}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Price Range</Label>
                <Select value={filters.priceRange} onValueChange={(value) => setFilters(prev => ({ ...prev, priceRange: value }))}>
                  <SelectTrigger className="border-2 border-gray-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Prices</SelectItem>
                    <SelectItem value="$">$ - Budget</SelectItem>
                    <SelectItem value="$$">$$ - Moderate</SelectItem>
                    <SelectItem value="$$$">$$$ - Premium</SelectItem>
                    <SelectItem value="$$$$">$$$$ - Luxury</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Budget Range</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-gray-500">Min ($)</Label>
                    <Input
                      type="number"
                      value={filters.minPrice}
                      onChange={(e) => setFilters(prev => ({ ...prev, minPrice: e.target.value }))}
                      placeholder="Min"
                      className="border-2 border-gray-300"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Max ($)</Label>
                    <Input
                      type="number"
                      value={filters.maxPrice}
                      onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: e.target.value }))}
                      placeholder="Max"
                      className="border-2 border-gray-300"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Location</Label>
                <CityAutocomplete
                  value={filters.location}
                  onChange={(value) => setFilters(prev => ({ ...prev, location: value }))}
                  className="border-2 border-gray-300"
                />
              </div>

              <div className="space-y-2">
                <Label>Minimum Rating</Label>
                <Select value={filters.minRating} onValueChange={(value) => setFilters(prev => ({ ...prev, minRating: value }))}>
                  <SelectTrigger className="border-2 border-gray-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Ratings</SelectItem>
                    <SelectItem value="4">4+ Stars</SelectItem>
                    <SelectItem value="4.5">4.5+ Stars</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleReset}
                variant="outline"
                className="w-full border-2 border-black"
              >
                Reset All Filters
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Swipe Card */}
      <div className="relative h-[600px] mb-8">
        {currentVendor ? (
            <SwipeCard
              key={currentVendor.id}
              vendor={currentVendor}
              onSwipe={handleSwipe}
              disabled={isSwipeInProgress}
              savedVendorIds={savedVendors.map(s => s.vendor_id)}
            />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white rounded-3xl border-4 border-dashed border-gray-300">
            <div className="text-center px-8">
              <div className="w-24 h-24 bg-black rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-2xl font-black text-black mb-3">
                No More Vendors!
              </h3>
              <p className="text-gray-600 mb-6">
                You've seen all vendors matching your filters.
              </p>
              <Button
                onClick={handleReset}
                className="bg-black text-white hover:bg-gray-800 font-bold"
              >
                Reset Filters
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {currentVendor && (
        <div className="flex justify-center items-center gap-6" style={{ pointerEvents: isSwipeInProgress ? 'none' : 'auto' }}>
          {swipeHistory.length > 0 && (
            <Button
              size="lg"
              variant="outline"
              className="w-16 h-16 rounded-full border-4 border-gray-300 hover:bg-gray-50"
              onClick={handleUndo}
              disabled={isSwipeInProgress}
            >
              <Undo className="w-6 h-6 text-gray-600" />
            </Button>
          )}

          <Button
            size="lg"
            variant="outline"
            className="w-20 h-20 rounded-full border-4 border-black hover:bg-red-50 transition-all disabled:opacity-50"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleSwipe("left", 'button-click-reject');
            }}
            disabled={isSwipeInProgress}
          >
            <X className="w-8 h-8 text-black" />
          </Button>

          <Button
            size="lg"
            className="w-20 h-20 rounded-full bg-black hover:bg-gray-800 transition-all disabled:opacity-50"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleSwipe("right", 'button-click-like');
            }}
            disabled={isSwipeInProgress}
          >
            <Heart className="w-8 h-8 text-white" fill="white" />
          </Button>
        </div>
      )}

      <div className="text-center mt-6 text-base text-gray-600 font-bold">
        {filteredVendors.length > 0 && currentIndex < filteredVendors.length && (
          <>
            {currentIndex + 1} / {filteredVendors.length} vendors
          </>
        )}
        {currentIndex >= filteredVendors.length && filteredVendors.length > 0 && (
          <>
            {filteredVendors.length} / {filteredVendors.length} vendors
          </>
        )}
      </div>
    </div>
  );
}