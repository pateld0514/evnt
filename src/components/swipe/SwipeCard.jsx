import React, { useState, useEffect } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, DollarSign, Sparkles, Mail, Phone, Globe, Calendar, Star, MessageSquare, Instagram, Facebook, Twitter, Music2, Award, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import BookingForm from "../booking/BookingForm";
import ReviewsList from "../vendor/ReviewsList";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

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
  event_planner: "📋"
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
  event_planner: "Event Planner"
};

export default function SwipeCard({ vendor, onSwipe, disabled }) {
  const navigate = useNavigate();
  const [showDetails, setShowDetails] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [viewTracked, setViewTracked] = useState(false);
  const [completedBookings, setCompletedBookings] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);

  useEffect(() => {
    const loadBookings = async () => {
      const bookings = await base44.entities.Booking.filter({ vendor_id: vendor.id, status: "completed" });
      setCompletedBookings(bookings.length);
    };
    loadBookings();
  }, [vendor.id]);

  const getTier = (completedCount) => {
    if (completedCount >= 100) return { name: "Elite", icon: "👑", color: "bg-purple-100 text-purple-800 border-purple-300" };
    if (completedCount >= 51) return { name: "Master", icon: "⭐", color: "bg-yellow-100 text-yellow-800 border-yellow-300" };
    if (completedCount >= 16) return { name: "Expert", icon: "🔥", color: "bg-orange-100 text-orange-800 border-orange-300" };
    if (completedCount >= 6) return { name: "Pro", icon: "💎", color: "bg-blue-100 text-blue-800 border-blue-300" };
    return { name: "Rising Star", icon: "🌟", color: "bg-green-100 text-green-800 border-green-300" };
  };

  const tier = getTier(completedBookings);

  useEffect(() => {
    const trackView = async () => {
      if (!viewTracked && showDetails) {
        try {
          const user = await base44.auth.me();
          await base44.entities.VendorView.create({
            vendor_id: vendor.id,
            viewer_email: user.email
          });
          setViewTracked(true);
        } catch (error) {
          // Silent fail
        }
      }
    };
    trackView();
  }, [showDetails, vendor.id, viewTracked]);

  const { data: reviews = [] } = useQuery({
    queryKey: ['vendor-reviews', vendor.id],
    queryFn: async () => {
      return await base44.entities.Review.filter({ vendor_id: vendor.id }, '-created_date');
    },
    enabled: showDetails,
    initialData: [],
  });

  const avgRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const handleDragStart = () => {
    console.log('[CARD] DragStart', { vendorId: vendor.id });
    setIsDragging(true);
  };

  const handleDragEnd = (event, info) => {
    setIsDragging(false);
    
    if (disabled) {
      x.set(0);
      return;
    }
    
    const threshold = 100;
    const velocity = info.velocity.x;
    
    if (Math.abs(info.offset.x) > threshold || Math.abs(velocity) > 500) {
      const direction = info.offset.x > 0 ? "right" : "left";
      onSwipe(direction, 'drag-gesture');
    } else {
      x.set(0);
    }
  };

  return (
    <>
      <motion.div
        className="absolute inset-0"
        style={{ x, rotate }}
        drag={disabled ? false : "x"}
        dragConstraints={{ left: -300, right: 300 }}
        dragElastic={0.2}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        whileTap={disabled ? {} : { cursor: "grabbing" }}
        animate={{ x: 0, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 25, mass: 1 }}
      >
        <Card className="h-full bg-white shadow-2xl border-4 border-black cursor-grab active:cursor-grabbing flex flex-col overflow-hidden">
          <div className="relative flex-shrink-0" style={{ height: '55%' }}>
            <img
              src={vendor.image_url || `https://images.unsplash.com/photo-1519167758481-83f29da8c556?w=800&h=600&fit=crop`}
              alt={vendor.business_name}
              className="w-full h-full object-cover"
            />
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            
            <div className="absolute top-4 right-4 flex gap-2">
              <Badge className="bg-white text-black text-sm px-3 py-1.5 font-bold border-2 border-black">
                {categoryIcons[vendor.category]} {categoryLabels[vendor.category]}
              </Badge>
              <Badge className={`${tier.color} border-2 text-sm px-3 py-1.5 font-bold`}>
                {tier.icon} {tier.name}
              </Badge>
            </div>

            <motion.div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              style={{ opacity: useTransform(x, [0, 200], [0, 1]) }}
            >
              <div className="bg-green-500 text-white text-5xl font-black px-10 py-5 rounded-3xl border-4 border-white rotate-[-20deg] shadow-2xl">
                LIKE ❤️
              </div>
            </motion.div>
            
            <motion.div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              style={{ opacity: useTransform(x, [-200, 0], [1, 0]) }}
            >
              <div className="bg-red-500 text-white text-5xl font-black px-10 py-5 rounded-3xl border-4 border-white rotate-[20deg] shadow-2xl">
                PASS ✕
              </div>
            </motion.div>
          </div>

          <div className="flex flex-col" style={{ height: '45%', padding: '1rem' }}>
            <div className="flex-1 overflow-hidden mb-3">
              <h2 className="text-lg md:text-xl font-black text-black mb-1.5 leading-tight">
                {vendor.business_name}
              </h2>
              
              <p className="text-xs md:text-sm text-gray-600 mb-2 line-clamp-2 leading-snug">
                {vendor.description}
              </p>

              <div className="flex flex-wrap gap-1">
                {vendor.location && (
                  <Badge variant="outline" className="flex items-center gap-1 border-2 border-gray-300 text-xs font-bold py-0.5 px-1.5">
                    <MapPin className="w-3 h-3" />
                    {vendor.location}
                  </Badge>
                )}
                {avgRating && (
                  <Badge variant="outline" className="flex items-center gap-1 border-2 border-yellow-300 bg-yellow-50 text-xs font-bold py-0.5 px-1.5">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    {avgRating}
                  </Badge>
                )}
                {vendor.price_range && (
                  <Badge variant="outline" className="flex items-center gap-1 border-2 border-gray-300 text-xs font-bold py-0.5 px-1.5">
                    <DollarSign className="w-3 h-3" />
                    {vendor.price_range}
                  </Badge>
                )}
                {vendor.starting_price && (
                  <Badge variant="outline" className="flex items-center gap-1 border-2 border-gray-300 text-xs font-bold py-0.5 px-1.5">
                    From ${vendor.starting_price}
                  </Badge>
                )}
                <Badge variant="outline" className="flex items-center gap-1 border-2 border-gray-300 text-xs font-bold py-0.5 px-1.5">
                  <Award className="w-3 h-3" />
                  {completedBookings} events
                </Badge>
                {vendor.specialties && vendor.specialties.length > 0 && (
                  <Badge variant="outline" className="flex items-center gap-1 border-2 border-gray-300 text-xs font-bold py-0.5 px-1.5">
                    <Sparkles className="w-3 h-3" />
                    {vendor.specialties[0]}
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2 flex-shrink-0" onPointerDown={(e) => e.stopPropagation()}>
              <Button
                variant="outline"
                className="border-2 border-black hover:bg-black hover:text-white font-bold h-10 text-xs md:text-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(createPageUrl("VendorView") + `?id=${vendor.id}`);
                }}
              >
                View Profile
              </Button>
              <Button
                variant="outline"
                className={`border-2 font-bold h-10 text-xs md:text-sm ${isSaved ? 'border-red-500 bg-red-50 text-red-500' : 'border-black hover:bg-black hover:text-white'}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSwipe("right", 'heart-button');
                  setIsSaved(true);
                }}
              >
                <Heart className={`w-3.5 h-3.5 ${isSaved ? 'fill-red-500' : ''}`} />
              </Button>
              <Button
                className="bg-black text-white hover:bg-gray-800 font-bold h-10 text-xs md:text-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setBookingOpen(true);
                }}
              >
                <Calendar className="w-3.5 h-3.5 mr-1" />
                Book Now
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border-4 border-black">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">{vendor.business_name}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Media Gallery */}
            {vendor.additional_images && vendor.additional_images.length > 0 ? (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  {vendor.additional_images.slice(0, 4).map((url, idx) => (
                    <div key={idx} className="aspect-square">
                      {url.includes('video') || url.endsWith('.mp4') || url.endsWith('.mov') ? (
                        <video src={url} className="w-full h-full object-cover rounded-lg border-2 border-black" controls />
                      ) : (
                        <img src={url} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover rounded-lg border-2 border-black" />
                      )}
                    </div>
                  ))}
                </div>
                {vendor.additional_images.length > 4 && (
                  <p className="text-sm text-gray-500 text-center">+{vendor.additional_images.length - 4} more</p>
                )}
              </div>
            ) : vendor.image_url && (
              <img
                src={vendor.image_url}
                alt={vendor.business_name}
                className="w-full h-64 object-cover rounded-lg border-2 border-black"
              />
            )}

            <div>
              <h3 className="font-bold text-lg mb-2">About</h3>
              <p className="text-gray-700">{vendor.description}</p>
            </div>

            {/* Reviews Section */}
            <div className="border-t-2 border-gray-200 pt-6">
              <h3 className="text-xl font-black mb-4 flex items-center gap-2">
                Reviews
                {avgRating && (
                  <span className="flex items-center gap-1 text-lg">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    {avgRating} ({reviews.length})
                  </span>
                )}
              </h3>
              <ReviewsList reviews={reviews} />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {vendor.location && (
                <div className="flex items-start gap-2">
                  <MapPin className="w-5 h-5 text-black mt-0.5" />
                  <div>
                    <p className="font-bold">Location</p>
                    <p className="text-gray-600">{vendor.location}</p>
                  </div>
                </div>
              )}

              {vendor.price_range && (
                <div className="flex items-start gap-2">
                  <DollarSign className="w-5 h-5 text-black mt-0.5" />
                  <div>
                    <p className="font-bold">Price Range</p>
                    <p className="text-gray-600">{vendor.price_range}</p>
                  </div>
                </div>
              )}
            </div>

            {vendor.specialties && vendor.specialties.length > 0 && (
              <div>
                <h3 className="font-bold text-lg mb-2">Specialties</h3>
                <div className="flex flex-wrap gap-2">
                  {vendor.specialties.map((specialty, idx) => (
                    <Badge key={idx} className="bg-black text-white border-2 border-black">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="font-bold text-lg mb-3">Contact Information</h3>
              <div className="space-y-2">
                {vendor.contact_email && (
                  <a
                    href={`mailto:${vendor.contact_email}`}
                    className="flex items-center gap-2 text-black hover:underline font-medium"
                  >
                    <Mail className="w-4 h-4 text-gray-500" />
                    {vendor.contact_email}
                  </a>
                )}
                {vendor.contact_phone && (
                  <a
                    href={`tel:${vendor.contact_phone}`}
                    className="flex items-center gap-2 text-black hover:underline font-medium"
                  >
                    <Phone className="w-4 h-4 text-gray-500" />
                    {vendor.contact_phone}
                  </a>
                )}
                {vendor.website && (
                  <a
                    href={vendor.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-black hover:underline font-medium"
                  >
                    <Globe className="w-4 h-4 text-gray-500" />
                    Visit Website
                  </a>
                )}
              </div>
            </div>

            {(vendor.instagram || vendor.facebook || vendor.twitter || vendor.tiktok) && (
              <div>
                <h3 className="font-bold text-lg mb-3">Social Media</h3>
                <div className="space-y-2">
                  {vendor.instagram && (
                    <div className="flex items-center gap-2">
                      <Instagram className="w-4 h-4 text-pink-600" />
                      <span className="text-gray-700">{vendor.instagram}</span>
                    </div>
                  )}
                  {vendor.facebook && (
                    <div className="flex items-center gap-2">
                      <Facebook className="w-4 h-4 text-blue-600" />
                      <span className="text-gray-700">{vendor.facebook}</span>
                    </div>
                  )}
                  {vendor.twitter && (
                    <div className="flex items-center gap-2">
                      <Twitter className="w-4 h-4 text-blue-400" />
                      <span className="text-gray-700">{vendor.twitter}</span>
                    </div>
                  )}
                  {vendor.tiktok && (
                    <div className="flex items-center gap-2">
                      <Music2 className="w-4 h-4 text-black" />
                      <span className="text-gray-700">{vendor.tiktok}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                onClick={() => navigate(createPageUrl("Messages") + `?vendor=${vendor.id}`)}
                className="border-2 border-black hover:bg-black hover:text-white font-bold"
              >
                <MessageSquare className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  const shareUrl = `${window.location.origin}${createPageUrl("VendorView")}?id=${vendor.id}`;
                  if (navigator.share) {
                    try {
                      await navigator.share({
                        title: vendor.business_name,
                        text: `Check out ${vendor.business_name} on EVNT!`,
                        url: shareUrl
                      });
                      toast.success("Shared successfully!");
                    } catch (error) {
                      if (error.name !== 'AbortError') {
                        navigator.clipboard.writeText(shareUrl);
                        toast.success("Link copied to clipboard!");
                      }
                    }
                  } else {
                    navigator.clipboard.writeText(shareUrl);
                    toast.success("Link copied to clipboard!");
                  }
                }}
                className="border-2 border-black hover:bg-black hover:text-white font-bold"
              >
                <Globe className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => {
                  setShowDetails(false);
                  setBookingOpen(true);
                }}
                className="bg-black text-white hover:bg-gray-800 font-bold"
              >
                <Calendar className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Booking Dialog */}
      <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
        <DialogContent className="max-w-2xl border-4 border-black max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">
              Book {vendor.business_name}
            </DialogTitle>
          </DialogHeader>
          
          <BookingForm
            vendor={vendor}
            onSuccess={() => setBookingOpen(false)}
            onCancel={() => setBookingOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}