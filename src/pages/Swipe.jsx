import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { X, Heart, Undo, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import SwipeCard from "../components/swipe/SwipeCard";

export default function SwipePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeHistory, setSwipeHistory] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch (error) {
        navigate(createPageUrl("Home"));
      }
    };
    loadUser();
  }, [navigate]);

  const { data: vendors = [], isLoading } = useQuery({
    queryKey: ["vendors"],
    queryFn: () => base44.entities.Vendor.list(),
    initialData: [],
  });

  const { data: swipedVendors = [] } = useQuery({
    queryKey: ["user-swipes", currentUser?.email],
    queryFn: async () => {
      if (!currentUser) return [];
      return await base44.entities.UserSwipe.filter({
        created_by: currentUser.email,
      });
    },
    enabled: !!currentUser,
    initialData: [],
  });

  const { data: savedVendors = [] } = useQuery({
    queryKey: ["saved-vendors", currentUser?.email],
    queryFn: async () => {
      if (!currentUser) return [];
      return await base44.entities.SavedVendor.filter({
        created_by: currentUser.email,
      });
    },
    enabled: !!currentUser,
    initialData: [],
  });

  const swipeMutation = useMutation({
    mutationFn: async ({ vendorId, direction, vendor }) => {
      // Check if already swiped to prevent double swipes
      const alreadySwiped = swipedVendors.some((s) => s.vendor_id === vendorId);
      if (alreadySwiped) {
        throw new Error("Already swiped on this vendor");
      }

      // Create swipe record
      await base44.entities.UserSwipe.create({
        vendor_id: vendorId,
        direction,
      });

      // If right swipe, also save vendor
      if (direction === "right") {
        const alreadySaved = savedVendors.some(
          (sv) => sv.vendor_id === vendorId
        );
        if (!alreadySaved) {
          await base44.entities.SavedVendor.create({
            vendor_id: vendorId,
            vendor_name: vendor.business_name,
            vendor_category: vendor.category,
          });
        }
        return { saved: true };
      }

      return { saved: false };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: ["user-swipes", currentUser?.email],
      });
      queryClient.invalidateQueries({
        queryKey: ["saved-vendors", currentUser?.email],
      });

      if (result.saved) {
        toast.success("Saved! 💖");
        setTimeout(() => {
          navigate(createPageUrl("Saved"));
        }, 500);
      } else {
        toast.success("Passed");
        setCurrentIndex((prev) => prev + 1);
        setSwipeHistory((prev) => [
          ...prev,
          { vendorId: filteredVendors[currentIndex].id },
        ]);
      }
    },
    onError: () => {
      toast.error("Something went wrong");
    },
  });

  // Get all swiped vendor IDs
  const swipedIds = swipedVendors.map((s) => s.vendor_id);

  // Filter out already swiped vendors
  const filteredVendors = vendors.filter(
    (v) =>
      v.approval_status === "approved" &&
      v.profile_complete === true &&
      !swipedIds.includes(v.id)
  );

  const currentVendor = filteredVendors[currentIndex];

  const handleSwipe = (direction) => {
    if (!currentVendor) return;
    swipeMutation.mutate({
      vendorId: currentVendor.id,
      direction,
      vendor: currentVendor,
    });
  };

  const handleUndo = async () => {
    if (swipeHistory.length === 0) return;

    const lastSwipe = swipeHistory[swipeHistory.length - 1];

    try {
      const swipeToDelete = swipedVendors.find(
        (s) => s.vendor_id === lastSwipe.vendorId
      );
      if (swipeToDelete) {
        await base44.entities.UserSwipe.delete(swipeToDelete.id);
      }

      const savedToDelete = savedVendors.find(
        (s) => s.vendor_id === lastSwipe.vendorId
      );
      if (savedToDelete) {
        await base44.entities.SavedVendor.delete(savedToDelete.id);
      }

      setSwipeHistory((prev) => prev.slice(0, -1));
      setCurrentIndex((prev) => Math.max(0, prev - 1));

      queryClient.invalidateQueries({
        queryKey: ["user-swipes", currentUser?.email],
      });
      queryClient.invalidateQueries({
        queryKey: ["saved-vendors", currentUser?.email],
      });

      toast.success("Undone");
    } catch (error) {
      toast.error("Failed to undo");
    }
  };

  const handleReset = async () => {
    try {
      // Only delete swipes where direction is "left" (passes)
      const passedSwipes = swipedVendors.filter((s) => s.direction === "left");
      for (const swipe of passedSwipes) {
        await base44.entities.UserSwipe.delete(swipe.id);
      }

      setCurrentIndex(0);
      setSwipeHistory([]);

      queryClient.invalidateQueries({
        queryKey: ["user-swipes", currentUser?.email],
      });

      toast.success("Reset! Check out vendors you passed again");
    } catch (error) {
      toast.error("Failed to reset");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col h-screen">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-black text-black mb-2">Find Vendors</h1>
        <p className="text-gray-600">Swipe or tap to find your perfect match</p>
      </div>

      {/* Card */}
      <div className="flex-1 mb-8 min-h-[500px]">
        {currentVendor ? (
          <SwipeCard
            key={currentVendor.id}
            vendor={currentVendor}
            onSwipe={handleSwipe}
            disabled={swipeMutation.isPending}
            isSaved={false}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center bg-white rounded-3xl border-4 border-dashed border-gray-300">
            <div className="text-center px-8">
              <div className="w-24 h-24 bg-black rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-2xl font-black text-black mb-3">
                All Done!
              </h3>
              <p className="text-gray-600 mb-6">
                You've seen all vendors. Reset to see the ones you passed.
              </p>
              <Button
                onClick={handleReset}
                className="bg-black text-white hover:bg-gray-800 font-bold"
              >
                Reset
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      {currentVendor && (
        <div className="flex justify-center items-center gap-6 pb-8">
          {swipeHistory.length > 0 && (
            <Button
              size="lg"
              variant="outline"
              className="w-14 h-14 rounded-full border-2 border-gray-400"
              onClick={handleUndo}
              disabled={swipeMutation.isPending}
            >
              <Undo className="w-5 h-5" />
            </Button>
          )}

          <Button
            size="lg"
            variant="outline"
            className="w-16 h-16 rounded-full border-3 border-black hover:bg-red-50"
            onClick={() => handleSwipe("left")}
            disabled={swipeMutation.isPending}
          >
            <X className="w-7 h-7" />
          </Button>

          <Button
            size="lg"
            className="w-16 h-16 rounded-full bg-black hover:bg-gray-800"
            onClick={() => handleSwipe("right")}
            disabled={swipeMutation.isPending}
          >
            <Heart className="w-7 h-7 text-white fill-white" />
          </Button>
        </div>
      )}

      {/* Counter */}
      {currentVendor && (
        <div className="text-center text-sm text-gray-600 pb-4">
          {currentIndex + 1} / {filteredVendors.length}
        </div>
      )}
    </div>
  );
}