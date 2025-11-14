import React, { useState } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, DollarSign, Sparkles, Mail, Phone, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
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

export default function SwipeCard({ vendor, onSwipe }) {
  const [showDetails, setShowDetails] = useState(false);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

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
        <Card className="h-full overflow-hidden bg-white shadow-2xl cursor-grab active:cursor-grabbing">
          {/* Image */}
          <div className="relative h-2/3">
            <img
              src={vendor.image_url || `https://images.unsplash.com/photo-1519167758481-83f29da8c556?w=800&h=600&fit=crop`}
              alt={vendor.business_name}
              className="w-full h-full object-cover"
            />
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            
            {/* Category Badge */}
            <div className="absolute top-4 right-4">
              <Badge className="bg-white/90 backdrop-blur-sm text-gray-900 text-sm px-3 py-1.5">
                {categoryIcons[vendor.category]} {vendor.category}
              </Badge>
            </div>

            {/* Swipe Indicators */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              style={{ opacity: useTransform(x, [0, 100], [0, 1]) }}
            >
              <div className="bg-green-500 text-white text-4xl font-bold px-8 py-4 rounded-2xl border-4 border-white rotate-[-20deg]">
                LIKE
              </div>
            </motion.div>
            
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              style={{ opacity: useTransform(x, [-100, 0], [1, 0]) }}
            >
              <div className="bg-red-500 text-white text-4xl font-bold px-8 py-4 rounded-2xl border-4 border-white rotate-[20deg]">
                PASS
              </div>
            </motion.div>
          </div>

          {/* Content */}
          <div className="p-6 h-1/3 flex flex-col">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {vendor.business_name}
              </h2>
              
              <p className="text-gray-600 mb-4 line-clamp-2">
                {vendor.description}
              </p>

              <div className="flex flex-wrap gap-2 mb-3">
                {vendor.location && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {vendor.location}
                  </Badge>
                )}
                {vendor.price_range && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    {vendor.price_range}
                  </Badge>
                )}
                {vendor.specialties && vendor.specialties.length > 0 && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    {vendor.specialties[0]}
                  </Badge>
                )}
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowDetails(true)}
            >
              View Details
            </Button>
          </div>
        </Card>
      </motion.div>

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">{vendor.business_name}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {vendor.image_url && (
              <img
                src={vendor.image_url}
                alt={vendor.business_name}
                className="w-full h-64 object-cover rounded-lg"
              />
            )}

            <div>
              <h3 className="font-semibold text-lg mb-2">About</h3>
              <p className="text-gray-700">{vendor.description}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {vendor.location && (
                <div className="flex items-start gap-2">
                  <MapPin className="w-5 h-5 text-pink-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Location</p>
                    <p className="text-gray-600">{vendor.location}</p>
                  </div>
                </div>
              )}

              {vendor.price_range && (
                <div className="flex items-start gap-2">
                  <DollarSign className="w-5 h-5 text-pink-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Price Range</p>
                    <p className="text-gray-600">{vendor.price_range}</p>
                  </div>
                </div>
              )}
            </div>

            {vendor.specialties && vendor.specialties.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg mb-2">Specialties</h3>
                <div className="flex flex-wrap gap-2">
                  {vendor.specialties.map((specialty, idx) => (
                    <Badge key={idx} variant="secondary">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="font-semibold text-lg mb-3">Contact Information</h3>
              <div className="space-y-2">
                {vendor.contact_email && (
                  <a
                    href={`mailto:${vendor.contact_email}`}
                    className="flex items-center gap-2 text-pink-600 hover:text-pink-700"
                  >
                    <Mail className="w-4 h-4" />
                    {vendor.contact_email}
                  </a>
                )}
                {vendor.contact_phone && (
                  <a
                    href={`tel:${vendor.contact_phone}`}
                    className="flex items-center gap-2 text-pink-600 hover:text-pink-700"
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
                    className="flex items-center gap-2 text-pink-600 hover:text-pink-700"
                  >
                    <Globe className="w-4 h-4" />
                    Visit Website
                  </a>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}