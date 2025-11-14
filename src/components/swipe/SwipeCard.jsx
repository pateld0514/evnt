import React, { useState } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, DollarSign, Sparkles, Mail, Phone, Globe, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import BookingForm from "../booking/BookingForm";

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

export default function SwipeCard({ vendor, onSwipe }) {
  const [showDetails, setShowDetails] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);

  const handleDragEnd = (event, info) => {
    if (Math.abs(info.offset.x) > 100) {
      onSwipe(info.offset.x > 0 ? "right" : "left");
    }
  };

  return (
    <>
      <motion.div
        className="absolute inset-0"
        style={{ x, rotate }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        onDragEnd={handleDragEnd}
        whileTap={{ cursor: "grabbing" }}
      >
        <Card className="h-full overflow-hidden bg-white shadow-2xl border-4 border-black cursor-grab active:cursor-grabbing">
          <div className="relative h-2/3">
            <img
              src={vendor.image_url || `https://images.unsplash.com/photo-1519167758481-83f29da8c556?w=800&h=600&fit=crop`}
              alt={vendor.business_name}
              className="w-full h-full object-cover"
            />
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            
            <div className="absolute top-4 right-4">
              <Badge className="bg-white text-black text-sm px-3 py-1.5 font-bold border-2 border-black">
                {categoryIcons[vendor.category]} {categoryLabels[vendor.category]}
              </Badge>
            </div>

            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              style={{ opacity: useTransform(x, [0, 100], [0, 1]) }}
            >
              <div className="bg-green-500 text-white text-4xl font-black px-8 py-4 rounded-2xl border-4 border-white rotate-[-20deg]">
                LIKE
              </div>
            </motion.div>
            
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              style={{ opacity: useTransform(x, [-100, 0], [1, 0]) }}
            >
              <div className="bg-red-500 text-white text-4xl font-black px-8 py-4 rounded-2xl border-4 border-white rotate-[20deg]">
                PASS
              </div>
            </motion.div>
          </div>

          <div className="p-6 h-1/3 flex flex-col">
            <div className="flex-1">
              <h2 className="text-2xl font-black text-black mb-2">
                {vendor.business_name}
              </h2>
              
              <p className="text-gray-600 mb-4 line-clamp-2">
                {vendor.description}
              </p>

              <div className="flex flex-wrap gap-2 mb-3">
                {vendor.location && (
                  <Badge variant="outline" className="flex items-center gap-1 border-2 border-gray-300">
                    <MapPin className="w-3 h-3" />
                    {vendor.location}
                  </Badge>
                )}
                {vendor.price_range && (
                  <Badge variant="outline" className="flex items-center gap-1 border-2 border-gray-300">
                    <DollarSign className="w-3 h-3" />
                    {vendor.price_range}
                  </Badge>
                )}
                {vendor.starting_price && (
                  <Badge variant="outline" className="flex items-center gap-1 border-2 border-gray-300">
                    From ${vendor.starting_price}
                  </Badge>
                )}
                {vendor.specialties && vendor.specialties.length > 0 && (
                  <Badge variant="outline" className="flex items-center gap-1 border-2 border-gray-300">
                    <Sparkles className="w-3 h-3" />
                    {vendor.specialties[0]}
                  </Badge>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="border-2 border-black hover:bg-black hover:text-white font-bold"
                onClick={() => setShowDetails(true)}
              >
                View Details
              </Button>
              <Button
                className="bg-black text-white hover:bg-gray-800 font-bold"
                onClick={() => setBookingOpen(true)}
              >
                <Calendar className="w-4 h-4 mr-1" />
                Book
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
            {vendor.image_url && (
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
                    <Mail className="w-4 h-4" />
                    {vendor.contact_email}
                  </a>
                )}
                {vendor.contact_phone && (
                  <a
                    href={`tel:${vendor.contact_phone}`}
                    className="flex items-center gap-2 text-black hover:underline font-medium"
                  >
                    <Phone className="w-4 h-4" />
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
                    <Globe className="w-4 h-4" />
                    Visit Website
                  </a>
                )}
              </div>
            </div>

            <Button
              onClick={() => {
                setShowDetails(false);
                setBookingOpen(true);
              }}
              className="w-full bg-black text-white hover:bg-gray-800 font-bold"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Book This Vendor
            </Button>
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