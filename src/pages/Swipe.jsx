import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Heart, Loader2, SlidersHorizontal, Undo, RotateCcw } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
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
  const [displayableVendors, setDisplayableVendors] = useState([]);
  const [swipeHistory, setSwipeHistory] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [animatingVendorId, setAnimatingVendorId] = useState(null);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [filters, setFilters] = useState(() => {
    try {
      const saved = sessionStorage.getItem('swipe_filters');
      return saved ? JSON.parse(saved) : {
        category: "all",
        priceRange: "all",
        minPrice: "",
        maxPrice: "",
        location: "",
        minRating: "all"
      };
    } catch {
      return { category: "all", priceRange: "all", minPrice: "", maxPrice: "", location: "", minRating: "all" };
    }
  });
  const urlParams = new URLSearchParams(window.location.search);
  const eventType = urlParams.get('event') || 'event';

  // Load current user - fires immediately
  const { data: currentUser = null, isLoading: userLoading } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  // Redirect if onboarding not complete
  useEffect(() => {
    if (currentUser && !currentUser.onboarding_complete) {
      navigate(createPageUrl("Onboarding"));
    }
  }, [currentUser, navigate]);

  // All data queries fire in parallel immediately (vendors/bookings/reviews/users don't need auth)
  const { data: vendors = [], isLoading } = useQuery({
    queryKey: ['vendors'],
    queryFn: () => base44.entities.Vendor.list(),
    initialData: [],
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // ISSUE 3 FIX: Removed all-bookings fetch — use vendor.is_test_vendor flag instead (Issue 4 fix too)
  // Tier badges now use VendorTier entity data embedded on vendor record (no user/booking leak)
  const { data: reviews = [] } = useQuery({
    queryKey: ['reviews'],
    queryFn: () => base44.entities.Review.list(),
    initialData: [],
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // User-specific queries — enabled as soon as email is known
  const { data: swipedVendors = [] } = useQuery({
    queryKey: ['user-swipes', currentUser?.email],
    queryFn: () => base44.entities.UserSwipe.filter({ created_by: currentUser.email }),
    enabled: !!currentUser?.email,
    initialData: [],
    staleTime: 1 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchInterval: 30000,
  });

  const { data: savedVendors = [] } = useQuery({
    queryKey: ['saved-vendors', currentUser?.email],
    queryFn: () => base44.entities.SavedVendor.filter({ created_by: currentUser.email }),
    enabled: !!currentUser?.email,
    initialData: [],
    staleTime: 1 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchInterval: 30000,
  });

  // Real-time subscription for vendors
  useEffect(() => {
    const unsubscribe = base44.entities.Vendor.subscribe(() => {
      queryClient.invalidateQueries(['vendors']);
    });
    return () => unsubscribe();
  }, [queryClient]);

  useEffect(() => {
    if (userLoading) return;
    if (!currentUser || vendors.length === 0) {
      setDisplayableVendors([]);
      return;
    }

    const filteredAndSorted = vendors.filter(vendor => {
      const isApproved = vendor.approval_status === "approved";
      const profileComplete = vendor.profile_complete === true;
      // Use the is_test_vendor flag directly — no User list fetch needed
      const isTestVendor = vendor.is_test_vendor === true;
      const notSwipedLeft = !swipedVendors.some(swipe => swipe.vendor_id === vendor.id && swipe.direction === "left");
      const notSaved = !savedVendors.some(saved => saved.vendor_id === vendor.id);
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
      
      // Fix: Validate price inputs are non-negative numbers
      let minPriceValid = true;
      let maxPriceValid = true;
      if (filters.minPrice) {
        const minVal = parseFloat(filters.minPrice);
        minPriceValid = !isNaN(minVal) && minVal >= 0;
      }
      if (filters.maxPrice) {
        const maxVal = parseFloat(filters.maxPrice);
        maxPriceValid = !isNaN(maxVal) && maxVal >= 0;
      }
      if (!minPriceValid || !maxPriceValid) return false;
      
      return isApproved && profileComplete && !isTestVendor && notSwipedLeft && notSaved && matchesCategory && matchesPriceRange && matchesPrice && matchesLocation && matchesRating;
    }).sort((a, b) => {
      
      const userLocation = currentUser.location?.toLowerCase() || filters.location?.toLowerCase() || "";
      const aLocationMatch = a.location?.toLowerCase() === userLocation;
      const bLocationMatch = b.location?.toLowerCase() === userLocation;
      if (aLocationMatch && !bLocationMatch) return -1;
      if (!aLocationMatch && bLocationMatch) return 1;
      
      const aLocationPartial = userLocation && a.location?.toLowerCase().includes(userLocation);
      const bLocationPartial = userLocation && b.location?.toLowerCase().includes(userLocation);
      if (aLocationPartial && !bLocationPartial) return -1;
      if (!aLocationPartial && bLocationPartial) return 1;
      
      const aSpecialtiesMatch = a.specialties?.some(s => s.toLowerCase().includes(eventType.toLowerCase()));
      const bSpecialtiesMatch = b.specialties?.some(s => s.toLowerCase().includes(eventType.toLowerCase()));
      if (aSpecialtiesMatch && !bSpecialtiesMatch) return -1;
      if (!aSpecialtiesMatch && bSpecialtiesMatch) return 1;
      
      const aReviews = reviews.filter(r => r.vendor_id === a.id);
      const bReviews = reviews.filter(r => r.vendor_id === b.id);
      if (aReviews.length > 0 && bReviews.length > 0) {
        const aAvgRating = aReviews.reduce((sum, r) => sum + r.rating, 0) / aReviews.length;
        const bAvgRating = bReviews.reduce((sum, r) => sum + r.rating, 0) / bReviews.length;
        if (aAvgRating !== bAvgRating) return bAvgRating - aAvgRating;
      }
      
      if (aReviews.length !== bReviews.length) return bReviews.length - aReviews.length;
      
      return 0;
    });
    setDisplayableVendors(filteredAndSorted);
  }, [vendors, swipedVendors, savedVendors, filters, reviews, currentUser, eventType, userLoading]);

  const swipeMutation = useMutation({
    mutationFn: async ({ vendorId, direction, vendor }) => {
      if (!currentUser) {
        throw new Error("You must be logged in to swipe");
      }
      
      const swipeResult = await base44.entities.UserSwipe.create({
        vendor_id: vendorId,
        direction,
        event_type: eventType
      });

      let savedVendorId = null;
      if (direction === "right") {
        const existingSavedVendors = await base44.entities.SavedVendor.filter({
          vendor_id: vendorId,
          created_by: currentUser.email
        });

        if (existingSavedVendors.length === 0) {
          const savedVendor = await base44.entities.SavedVendor.create({
            vendor_id: vendorId,
            vendor_name: vendor.business_name,
            vendor_category: vendor.category,
            event_type: eventType
          });
          savedVendorId = savedVendor.id;
          toast.success("Added to your favorites! ❤️");
        } else {
          savedVendorId = existingSavedVendors[0].id;
        }
      }
      
      return { swipeId: swipeResult.id, savedVendorId };
    },
    onSuccess: (result, variables) => {
      setSwipeHistory(prev => [...prev, { 
        swipeId: result.swipeId, 
        savedId: result.savedVendorId,
        vendorId: variables.vendorId,
        direction: variables.direction,
        vendor: variables.vendor 
      }]);
      
      // Refresh queries and continue immediately
      queryClient.invalidateQueries(['user-swipes']);
      if (variables.direction === "right") {
        queryClient.invalidateQueries(['saved-vendors']);
      }
      setAnimatingVendorId(null);
      setIsProcessing(false);
    },
    onError: () => {
      toast.error("Failed to process swipe");
      setAnimatingVendorId(null);
      setIsProcessing(false);
    }
  });

  const uniqueAvailableCategories = React.useMemo(() => {
    const cats = vendors
      .filter(v => v.approval_status === "approved" && v.profile_complete === true && !v.is_test_vendor)
      .map(v => v.category);
    return [...new Set(cats)];
  }, [vendors]);

  const currentVendor = displayableVendors[0];

  const handleSwipe = (direction) => {
    if (!currentVendor || !currentUser || isProcessing) return;
    
    setIsProcessing(true);
    setAnimatingVendorId(currentVendor.id);
    
    // Optimistically update UI first for smooth experience
    setDisplayableVendors(prev => {
      const updated = [...prev];
      updated.shift(); // Remove current card immediately
      return updated;
    });
    
    swipeMutation.mutate({
      vendorId: currentVendor.id,
      direction,
      vendor: currentVendor
    });
  };

  const handleUndo = async () => {
    if (swipeHistory.length === 0 || isProcessing) return;
    
    const lastSwipe = swipeHistory[swipeHistory.length - 1];
    
    try {
      setIsProcessing(true);
      
      // Verify ownership before deleting
      const swipe = swipedVendors.find(s => s.id === lastSwipe.swipeId);
      if (swipe && swipe.created_by !== currentUser.email) {
        throw new Error("Unauthorized: You can only undo your own swipes");
      }
      
      await base44.entities.UserSwipe.delete(lastSwipe.swipeId);
      
      if (lastSwipe.savedId) {
        const saved = savedVendors.find(s => s.id === lastSwipe.savedId);
        if (saved && saved.created_by !== currentUser.email) {
          throw new Error("Unauthorized: You can only remove your own saved vendors");
        }
        await base44.entities.SavedVendor.delete(lastSwipe.savedId);
      }
      
      setSwipeHistory(prev => prev.slice(0, -1));
      
      queryClient.invalidateQueries(['user-swipes']);
      queryClient.invalidateQueries(['saved-vendors']);
      
      toast.success("Undone!");
    } catch (error) {
      toast.error("Failed to undo");
    } finally {
      setIsProcessing(false);
    }
  };

  // Persist filters to sessionStorage whenever they change
  useEffect(() => {
    sessionStorage.setItem('swipe_filters', JSON.stringify(filters));
  }, [filters]);

  // M-3 FIX: Separate "clear filters" (safe) from "reset seen vendors" (destructive, needs confirmation)
  const clearFilters = () => {
    const emptyFilters = { category: "all", priceRange: "all", minPrice: "", maxPrice: "", location: "", minRating: "all" };
    setFilters(emptyFilters);
    sessionStorage.removeItem('swipe_filters');
  };

  const handleResetSwipes = async () => {
    if (isProcessing) return;
    setResetConfirmOpen(false);
    try {
      setIsProcessing(true);
      // Only reset LEFT swipes (skipped/passed vendors) — saved vendors stay
      const leftSwipes = swipedVendors.filter(swipe => swipe.direction === "left");
      await Promise.all(leftSwipes.map(swipe => base44.entities.UserSwipe.delete(swipe.id)));
      setSwipeHistory([]);
      clearFilters();
      queryClient.invalidateQueries(['user-swipes']);
      toast.success("Passed vendors restored! Saved vendors remain.");
    } catch (error) {
      toast.error("Failed to reset");
    } finally {
      setIsProcessing(false);
    }
  };

  if (userLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="w-10 h-10 md:w-12 md:h-12 animate-spin text-black mb-4" />
        <p className="text-gray-600 font-medium">Loading...</p>
      </div>
    );
  }

  const visibleVendors = displayableVendors.slice(0, 3);

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 py-6 md:py-8">
      <div className="text-center mb-6 md:mb-8">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-black mb-2 md:mb-3">
          Find Your Perfect Vendors
        </h1>
        <p className="text-base md:text-lg lg:text-xl text-gray-600 font-medium">
          Swipe right to save, left to pass
        </p>
      </div>

      <div className="mb-4 md:mb-6">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              className="w-full flex items-center justify-center gap-2 border-2 border-black hover:bg-black hover:text-white font-bold h-11 md:h-12"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="text-sm md:text-base">Filters</span>
              {(filters.category !== "all" || filters.priceRange !== "all" || filters.location || filters.minRating !== "all") && (
                <span className="ml-2 px-2 py-0.5 bg-black text-white rounded-full text-xs font-bold">
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
                onClick={clearFilters}
                variant="outline"
                className="w-full border-2 border-black"
              >
                Clear Filters
              </Button>
              <Button
                onClick={() => setResetConfirmOpen(true)}
                variant="outline"
                className="w-full border-2 border-red-600 text-red-600 hover:bg-red-50"
                disabled={isProcessing}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset Seen Vendors
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="relative h-[460px] md:h-[540px] mt-2 mb-6 md:mb-8">
        {visibleVendors.length > 0 ? (
          visibleVendors.map((vendor, index) => (
            <SwipeCard
              key={vendor.id}
              vendor={vendor}
              onSwipe={index === 0 ? handleSwipe : null}
              isRemoving={vendor.id === animatingVendorId}
              completedBookingsCount={0}
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                zIndex: visibleVendors.length - index,
                transform: `scale(${1 - index * 0.04}) translateY(${index * 12}px)`,
                opacity: index === 0 ? 1 : index === 1 ? 0.85 : 0.7,
                pointerEvents: index === 0 && !isProcessing ? 'auto' : 'none'
              }}
            />
          ))
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
                onClick={clearFilters}
                variant="outline"
                className="border-2 border-black font-bold mb-2"
              >
                Clear Filters
              </Button>
              <Button
                onClick={() => setResetConfirmOpen(true)}
                className="bg-black text-white hover:bg-gray-800 font-bold"
                disabled={isProcessing}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset Seen Vendors
              </Button>
            </div>
          </div>
        )}
      </div>

      {visibleVendors.length > 0 && (
        <div className="flex justify-center items-center gap-4 md:gap-6">
          {swipeHistory.length > 0 && (
            <Button
              size="lg"
              variant="outline"
              className="w-14 h-14 md:w-16 md:h-16 rounded-full border-4 border-gray-300 hover:bg-gray-50 flex-shrink-0"
              onClick={handleUndo}
              disabled={isProcessing}
            >
              <Undo className="w-5 h-5 md:w-6 md:h-6 text-gray-600" />
            </Button>
          )}

          <Button
            size="lg"
            variant="outline"
            className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-black hover:bg-red-50 flex-shrink-0"
            onClick={() => handleSwipe("left")}
            disabled={isProcessing}
          >
            <X className="w-7 h-7 md:w-8 md:h-8 text-black" />
          </Button>

          <Button
            size="lg"
            className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-black hover:bg-gray-800 flex-shrink-0"
            onClick={() => handleSwipe("right")}
            disabled={isProcessing}
          >
            <Heart className="w-7 h-7 md:w-8 md:h-8 text-white" fill="white" />
          </Button>
        </div>
      )}

      <div className="text-center mt-4 md:mt-6 text-sm md:text-base text-gray-600 font-bold">
        {visibleVendors.length > 0 && (
          <>
            {displayableVendors.length} vendor{displayableVendors.length !== 1 ? 's' : ''} remaining
          </>
        )}
      </div>

      {/* M-3 FIX: Confirmation dialog for destructive reset action */}
      <AlertDialog open={resetConfirmOpen} onOpenChange={setResetConfirmOpen}>
        <AlertDialogContent className="border-2 border-black">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black">Reset Seen Vendors?</AlertDialogTitle>
            <AlertDialogDescription className="text-base text-gray-700">
              This will restore all vendors you previously passed on. Your saved favorites will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel className="border-2 border-gray-300 font-bold">Keep History</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetSwipes}
              className="bg-black hover:bg-gray-800 text-white font-bold"
            >
              Yes, Reset
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}