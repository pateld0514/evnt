import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, Trash2, Mail, Phone, MapPin, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const categoryIcons = {
  venue: "🏛️",
  dj: "🎧",
  caterer: "🍽️",
  photographer: "📸",
  videographer: "🎥",
  florist: "🌸",
  baker: "🎂",
  decorator: "✨",
  planner: "📋"
};

export default function SavedPage() {
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const { data: savedVendors = [], isLoading: loadingSaved } = useQuery({
    queryKey: ['saved-vendors'],
    queryFn: () => base44.entities.SavedVendor.list('-created_date'),
    initialData: [],
  });

  const { data: allVendors = [] } = useQuery({
    queryKey: ['vendors'],
    queryFn: () => base44.entities.Vendor.list(),
    initialData: [],
  });

  const deleteMutation = useMutation({
    mutationFn: (savedVendorId) => base44.entities.SavedVendor.delete(savedVendorId),
    onSuccess: () => {
      queryClient.invalidateQueries(['saved-vendors']);
      toast.success("Removed from favorites");
    },
  });

  const filteredSaved = savedVendors.filter(saved => 
    selectedCategory === "all" || saved.vendor_category === selectedCategory
  );

  const getVendorDetails = (vendorId) => {
    return allVendors.find(v => v.id === vendorId);
  };

  const handleViewDetails = (saved) => {
    const vendor = getVendorDetails(saved.vendor_id);
    if (vendor) {
      setSelectedVendor(vendor);
      setDetailsOpen(true);
    }
  };

  const categories = [
    { value: "all", label: "All", icon: "❤️" },
    { value: "venue", label: "Venues", icon: "🏛️" },
    { value: "dj", label: "DJs", icon: "🎧" },
    { value: "caterer", label: "Caterers", icon: "🍽️" },
    { value: "photographer", label: "Photographers", icon: "📸" },
  ];

  if (loadingSaved) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-pink-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 mb-4">
          <Heart className="w-8 h-8 text-pink-600" fill="currentColor" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Your Favorite Vendors
        </h1>
        <p className="text-lg text-gray-600">
          {savedVendors.length} vendor{savedVendors.length !== 1 ? 's' : ''} saved
        </p>
      </div>

      {/* Category Tabs */}
      <div className="mb-8 flex justify-center">
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full max-w-2xl">
          <TabsList className="grid w-full grid-cols-5 h-auto p-1">
            {categories.map(cat => (
              <TabsTrigger key={cat.value} value={cat.value} className="py-2">
                <span className="mr-1">{cat.icon}</span>
                <span className="hidden sm:inline">{cat.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Vendors Grid */}
      {filteredSaved.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="w-12 h-12 text-pink-300" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            No Saved Vendors Yet
          </h3>
          <p className="text-gray-600 mb-6">
            Start swiping to find and save your favorite vendors!
          </p>
          <Button
            className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
            onClick={() => window.location.href = '/swipe'}
          >
            Start Swiping
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSaved.map((saved) => {
            const vendor = getVendorDetails(saved.vendor_id);
            if (!vendor) return null;

            return (
              <Card key={saved.id} className="overflow-hidden hover:shadow-xl transition-shadow">
                <div className="relative h-48">
                  <img
                    src={vendor.image_url || `https://images.unsplash.com/photo-1519167758481-83f29da8c556?w=400&h=300&fit=crop`}
                    alt={vendor.business_name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-white/90 backdrop-blur-sm text-gray-900">
                      {categoryIcons[vendor.category]} {vendor.category}
                    </Badge>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm hover:bg-red-50"
                    onClick={() => deleteMutation.mutate(saved.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>

                <CardContent className="p-5">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
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
                    {vendor.contact_email && (
                      <a
                        href={`mailto:${vendor.contact_email}`}
                        className="flex items-center gap-2 text-sm text-pink-600 hover:text-pink-700"
                      >
                        <Mail className="w-4 h-4" />
                        Email
                      </a>
                    )}
                    {vendor.contact_phone && (
                      <a
                        href={`tel:${vendor.contact_phone}`}
                        className="flex items-center gap-2 text-sm text-pink-600 hover:text-pink-700"
                      >
                        <Phone className="w-4 h-4" />
                        Call
                      </a>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleViewDetails(saved)}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Vendor Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedVendor && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedVendor.business_name}</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {selectedVendor.image_url && (
                  <img
                    src={selectedVendor.image_url}
                    alt={selectedVendor.business_name}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                )}

                <div>
                  <h3 className="font-semibold text-lg mb-2">About</h3>
                  <p className="text-gray-700">{selectedVendor.description}</p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {selectedVendor.location && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-5 h-5 text-pink-600 mt-0.5" />
                      <div>
                        <p className="font-medium">Location</p>
                        <p className="text-gray-600">{selectedVendor.location}</p>
                      </div>
                    </div>
                  )}
                </div>

                {selectedVendor.specialties && selectedVendor.specialties.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Specialties</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedVendor.specialties.map((specialty, idx) => (
                        <Badge key={idx} variant="secondary">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="font-semibold text-lg mb-3">Contact</h3>
                  <div className="space-y-2">
                    {selectedVendor.contact_email && (
                      <a
                        href={`mailto:${selectedVendor.contact_email}`}
                        className="flex items-center gap-2 text-pink-600 hover:text-pink-700"
                      >
                        <Mail className="w-4 h-4" />
                        {selectedVendor.contact_email}
                      </a>
                    )}
                    {selectedVendor.contact_phone && (
                      <a
                        href={`tel:${selectedVendor.contact_phone}`}
                        className="flex items-center gap-2 text-pink-600 hover:text-pink-700"
                      >
                        <Phone className="w-4 h-4" />
                        {selectedVendor.contact_phone}
                      </a>
                    )}
                    {selectedVendor.website && (
                      <a
                        href={selectedVendor.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-pink-600 hover:text-pink-700"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Visit Website
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}