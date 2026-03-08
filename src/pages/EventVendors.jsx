import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageSquare, Calendar, MapPin, Loader2, ArrowLeft, Share2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import BookingForm from "../components/booking/BookingForm";
import VendorSearch from "../components/search/VendorSearch";

const categoryIcons = {
  dj: "🎧",
  photographer: "📸",
  videographer: "🎥",
  photo_booth: "📷",
  caterer: "🍽️",
  food_truck: "🚚",
  baker: "🎂",
  balloon_decorator: "🎈",
  event_stylist: "✨",
  banquet_hall: "🏛️",
  rental_services: "🪑",
  event_planner: "📋",
  luxury_car_rental: "🚗"
};

const categoryLabels = {
  dj: "DJ",
  photographer: "Photographer",
  videographer: "Videographer",
  photo_booth: "Photo Booth",
  caterer: "Caterer",
  food_truck: "Food Truck",
  baker: "Baker",
  balloon_decorator: "Balloon Decorator",
  event_stylist: "Event Stylist",
  banquet_hall: "Banquet Hall",
  rental_services: "Rental Services",
  event_planner: "Event Planner",
  luxury_car_rental: "Luxury Car Rental"
};

export default function EventVendorsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const eventType = urlParams.get('event') || 'event';
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

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

  const { data: allVendors = [], isLoading } = useQuery({
    queryKey: ['vendors'],
    queryFn: () => base44.entities.Vendor.list(),
    initialData: [],
  });

  const vendors = allVendors.filter(v => {
    const isApproved = v.approval_status === "approved" && v.profile_complete === true;
    if (!isApproved) return false;
    // Use is_test_vendor flag directly — no User list fetch needed
    if (v.is_test_vendor === true) return false;
    
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        v.business_name?.toLowerCase().includes(search) ||
        v.description?.toLowerCase().includes(search) ||
        v.location?.toLowerCase().includes(search) ||
        v.category?.toLowerCase().includes(search)
      );
    }
    
    return true;
  });

  const { data: savedVendors = [] } = useQuery({
    queryKey: ['saved-vendors'],
    queryFn: () => base44.entities.SavedVendor.list(),
    initialData: [],
  });

  const saveMutation = useMutation({
    mutationFn: (vendor) => base44.entities.SavedVendor.create({
      vendor_id: vendor.id,
      vendor_name: vendor.business_name,
      vendor_category: vendor.category,
      event_type: eventType
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['saved-vendors']);
      toast.success("Added to favorites! ❤️");
    },
  });

  const unsaveMutation = useMutation({
    mutationFn: (savedVendorId) => base44.entities.SavedVendor.delete(savedVendorId),
    onSuccess: () => {
      queryClient.invalidateQueries(['saved-vendors']);
      toast.success("Removed from favorites");
    },
  });

  const handleMessage = (vendor) => {
    navigate(createPageUrl("Messages") + `?vendor=${vendor.id}`);
  };

  const handleBook = (vendor) => {
    setSelectedVendor(vendor);
    setBookingOpen(true);
  };

  const handleViewDetails = (vendor) => {
    setSelectedVendor(vendor);
    setDetailsOpen(true);
  };

  const handleToggleSave = (vendor) => {
    const saved = savedVendors.find(s => s.vendor_id === vendor.id);
    if (saved) {
      unsaveMutation.mutate(saved.id);
    } else {
      saveMutation.mutate(vendor);
    }
  };

  const isVendorSaved = (vendorId) => {
    return savedVendors.some(s => s.vendor_id === vendorId);
  };

  const getEventTitle = () => {
    return eventType.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const handleShare = async (vendor) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: vendor.business_name,
          text: `Check out ${vendor.business_name} on EVNT!`,
          url: window.location.href
        });
      } catch (error) {
        // User cancelled or error
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-black" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl("Home"))}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>
        
        <div className="text-center mb-6">
          <h1 className="text-4xl font-black text-black mb-2">
            {getEventTitle()} Vendors
          </h1>
          <p className="text-lg text-gray-600">
            Browse vendors perfect for your {getEventTitle().toLowerCase()}
          </p>
        </div>
        
        <div className="max-w-2xl mx-auto">
          <VendorSearch 
            onSearch={setSearchTerm}
            placeholder="Search by name, location, or description..."
          />
        </div>
      </div>

      {vendors.length === 0 && searchTerm && (
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg">No vendors found matching "{searchTerm}"</p>
          <Button
            variant="outline"
            className="mt-4 border-2 border-black"
            onClick={() => setSearchTerm("")}
          >
            Clear Search
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vendors.map((vendor) => (
          <Card key={vendor.id} className="overflow-hidden hover:shadow-2xl transition-shadow border-2 border-black">
            <div className="relative h-48">
              <img
                src={vendor.image_url || `https://images.unsplash.com/photo-1519167758481-83f29da8c556?w=400&h=300&fit=crop`}
                alt={vendor.business_name}
                className="w-full h-full object-cover"
                onError={(e) => { e.target.src = `https://images.unsplash.com/photo-1519167758481-83f29da8c556?w=400&h=300&fit=crop`; }}
              />
              <div className="absolute top-3 right-3">
                <Badge className="bg-white text-black border-2 border-black font-bold">
                  {categoryIcons[vendor.category]}
                </Badge>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className={`absolute top-3 left-3 border-2 border-black ${
                  isVendorSaved(vendor.id) 
                    ? "bg-red-50 hover:bg-red-100" 
                    : "bg-white hover:bg-gray-100"
                }`}
                onClick={() => handleToggleSave(vendor)}
              >
                <Heart 
                  className={`w-4 h-4 ${isVendorSaved(vendor.id) ? "fill-red-500 text-red-500" : "text-black"}`}
                />
              </Button>
            </div>

            <CardContent className="p-5">
              <h3 className="text-xl font-black text-black mb-2">
                {vendor.business_name}
              </h3>
              
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {vendor.description}
              </p>

              <div className="space-y-2 mb-4">
                {vendor.location && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    {vendor.location}
                  </div>
                )}
                {vendor.price_range && (
                  <div className="text-sm font-bold text-black">
                    {vendor.price_range}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-4 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-2 border-black hover:bg-black hover:text-white font-bold"
                  onClick={() => handleViewDetails(vendor)}
                >
                  View
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-2 border-black hover:bg-black hover:text-white font-bold"
                  onClick={() => handleMessage(vendor)}
                >
                  <MessageSquare className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-2 border-black hover:bg-black hover:text-white font-bold"
                  onClick={() => handleShare(vendor)}
                >
                  <Share2 className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  className="bg-black text-white hover:bg-gray-800 font-bold"
                  onClick={() => handleBook(vendor)}
                >
                  <Calendar className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Vendor Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border-4 border-black">
          {selectedVendor && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-black">{selectedVendor.business_name}</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {selectedVendor.image_url && (
                  <img
                    src={selectedVendor.image_url}
                    alt={selectedVendor.business_name}
                    className="w-full h-64 object-cover rounded-lg border-2 border-black"
                  />
                )}

                <div>
                  <h3 className="font-bold text-lg mb-2">About</h3>
                  <p className="text-gray-700">{selectedVendor.description}</p>
                </div>

                {selectedVendor.specialties && selectedVendor.specialties.length > 0 && (
                  <div>
                    <h3 className="font-bold text-lg mb-2">Specialties</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedVendor.specialties.map((specialty, idx) => (
                        <Badge key={idx} className="bg-black text-white">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setDetailsOpen(false);
                      handleBook(selectedVendor);
                    }}
                    className="flex-1 bg-black text-white hover:bg-gray-800 font-bold"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Book Now
                  </Button>
                  <Button
                    onClick={() => {
                      setDetailsOpen(false);
                      handleMessage(selectedVendor);
                    }}
                    variant="outline"
                    className="flex-1 border-2 border-black hover:bg-black hover:text-white font-bold"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Message
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Booking Dialog */}
      <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
        <DialogContent className="max-w-2xl border-4 border-black max-h-[90vh] overflow-y-auto">
          {selectedVendor && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-black">
                  Book {selectedVendor.business_name}
                </DialogTitle>
              </DialogHeader>
              
              <BookingForm
                vendor={selectedVendor}
                onSuccess={() => setBookingOpen(false)}
                onCancel={() => setBookingOpen(false)}
              />
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}