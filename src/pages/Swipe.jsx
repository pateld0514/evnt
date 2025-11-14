import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { X, Heart, Loader2, Filter, SlidersHorizontal } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SwipeCard from "../components/swipe/SwipeCard";
import { toast } from "sonner";

const categories = [
  { value: "all", label: "All Vendors" },
  { value: "venue", label: "Venues" },
  { value: "dj", label: "DJs" },
  { value: "caterer", label: "Caterers" },
  { value: "photographer", label: "Photographers" },
  { value: "videographer", label: "Videographers" },
  { value: "florist", label: "Florists" },
  { value: "baker", label: "Bakers" },
  { value: "decorator", label: "Decorators" },
  { value: "planner", label: "Event Planners" }
];

export default function SwipePage() {
  const queryClient = useQueryClient();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
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
    const notSwiped = !swipedVendors.some(swipe => swipe.vendor_id === vendor.id);
    const matchesCategory = selectedCategory === "all" || vendor.category === selectedCategory;
    return notSwiped && matchesCategory;
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
    setSelectedCategory("all");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-pink-600" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Find Your Perfect {eventType.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Vendors
        </h1>
        <p className="text-gray-600">
          Swipe right to save, left to pass
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="w-full flex items-center justify-center gap-2"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filter by Category
          {selectedCategory !== "all" && (
            <span className="ml-2 px-2 py-0.5 bg-pink-100 text-pink-700 rounded-full text-xs">
              {categories.find(c => c.value === selectedCategory)?.label}
            </span>
          )}
        </Button>

        {showFilters && (
          <div className="mt-4 p-4 bg-white rounded-xl border border-pink-100">
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Vendor Category
            </label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
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
        )}
      </div>

      {/* Swipe Card */}
      <div className="relative h-[600px] mb-8">
        {currentVendor ? (
          <SwipeCard
            vendor={currentVendor}
            onSwipe={handleSwipe}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white rounded-3xl border-2 border-dashed border-pink-200">
            <div className="text-center px-8">
              <div className="w-24 h-24 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="w-12 h-12 text-pink-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                You've Seen All Vendors!
              </h3>
              <p className="text-gray-600 mb-6">
                {selectedCategory !== "all" 
                  ? `No more ${categories.find(c => c.value === selectedCategory)?.label.toLowerCase()} to show.`
                  : "No more vendors to show in this category."
                }
              </p>
              <Button
                onClick={handleReset}
                className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
              >
                Change Filters
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
            className="w-20 h-20 rounded-full border-2 border-gray-200 hover:border-red-300 hover:bg-red-50"
            onClick={() => handleSwipe("left")}
          >
            <X className="w-8 h-8 text-red-500" />
          </Button>
          
          <Button
            size="lg"
            className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
            onClick={() => handleSwipe("right")}
          >
            <Heart className="w-8 h-8 text-white" fill="white" />
          </Button>
        </div>
      )}

      {/* Progress */}
      <div className="text-center mt-6 text-sm text-gray-500">
        {filteredVendors.length > 0 && (
          <>
            {currentIndex + 1} / {filteredVendors.length} vendors
          </>
        )}
      </div>
    </div>
  );
}