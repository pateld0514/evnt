import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Heart, Loader2, SlidersHorizontal } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import SwipeCard from "../components/swipe/SwipeCard";
import { toast } from "sonner";

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
  const queryClient = useQueryClient();
  const [currentIndex, setCurrentIndex] = useState(0);
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

  const { data: vendors = [], isLoading } = useQuery({
    queryKey: ['vendors'],
    queryFn: () => base44.entities.Vendor.list(),
    initialData: [],
  });

  const { data: swipedVendors = [] } = useQuery({
    queryKey: ['user-swipes'],
    queryFn: () => base44.entities.UserSwipe.list(),
    initialData: [],
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['reviews'],
    queryFn: () => base44.entities.Review.list(),
    initialData: [],
  });

  const swipeMutation = useMutation({
    mutationFn: ({ vendorId, direction, vendor }) => {
      const swipePromise = base44.entities.UserSwipe.create({
        vendor_id: vendorId,
        direction,
        event_type: eventType
      });

      if (direction === "right") {
        const savePromise = base44.entities.SavedVendor.create({
          vendor_id: vendorId,
          vendor_name: vendor.business_name,
          vendor_category: vendor.category,
          event_type: eventType
        });
        return Promise.all([swipePromise, savePromise]);
      }
      
      return swipePromise;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['user-swipes']);
      if (variables.direction === "right") {
        queryClient.invalidateQueries(['saved-vendors']);
        toast.success("Added to your favorites! ❤️");
      }
    },
  });

  const filteredVendors = vendors.filter(vendor => {
    const isApproved = vendor.approval_status === "approved";
    const notSwiped = !swipedVendors.some(swipe => swipe.vendor_id === vendor.id);
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
        matchesRating = false; // No reviews, exclude from rated filter
      }
    }
    
    return isApproved && notSwiped && matchesCategory && matchesPriceRange && matchesPrice && matchesLocation && matchesRating;
  });

  const currentVendor = filteredVendors[currentIndex];

  const handleSwipe = (direction) => {
    if (!currentVendor) return;
    
    swipeMutation.mutate({
      vendorId: currentVendor.id,
      direction,
      vendor: currentVendor
    });

    setCurrentIndex(prev => prev + 1);
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setFilters({
      category: "all",
      priceRange: "all",
      minPrice: "",
      maxPrice: "",
      location: "",
      minRating: "all"
    });
  };

  // Reset index when filters change
  useEffect(() => {
    setCurrentIndex(0);
  }, [filters]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-black" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-black text-black mb-2">
          Find Your Perfect Vendors
        </h1>
        <p className="text-gray-600">
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
                    {categories.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
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
                <Input
                  value={filters.location}
                  onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="e.g. Washington, DC"
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
            vendor={currentVendor}
            onSwipe={handleSwipe}
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
        <div className="flex justify-center gap-6">
          <Button
            size="lg"
            variant="outline"
            className="w-20 h-20 rounded-full border-4 border-black hover:bg-red-50"
            onClick={() => handleSwipe("left")}
          >
            <X className="w-8 h-8 text-black" />
          </Button>
          
          <Button
            size="lg"
            className="w-20 h-20 rounded-full bg-black hover:bg-gray-800"
            onClick={() => handleSwipe("right")}
          >
            <Heart className="w-8 h-8 text-white" fill="white" />
          </Button>
        </div>
      )}

      <div className="text-center mt-6 text-sm text-gray-500 font-medium">
        {filteredVendors.length > 0 && (
          <>
            {currentIndex + 1} / {filteredVendors.length} vendors
          </>
        )}
      </div>
    </div>
  );
}