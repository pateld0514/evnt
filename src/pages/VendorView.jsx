import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, DollarSign, Globe, Instagram, Facebook, Twitter, Music2, Star, Award, MessageSquare, Calendar, Heart, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import ReviewsList from "../components/vendor/ReviewsList";

export default function VendorViewPage() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const vendorId = urlParams.get('id');
  
  const [vendor, setVendor] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [completedBookings, setCompletedBookings] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);

        const vendors = await base44.entities.Vendor.filter({ id: vendorId });
        if (!vendors || vendors.length === 0) {
          navigate(createPageUrl("Home"));
          return;
        }
        setVendor(vendors[0]);

        // Load reviews
        const allReviews = await base44.entities.Review.filter({ vendor_id: vendorId });
        setReviews(allReviews);

        // Load completed bookings count
        const bookings = await base44.entities.Booking.filter({ vendor_id: vendorId, status: "completed" });
        setCompletedBookings(bookings.length);

        // Check if saved
        const savedVendors = await base44.entities.SavedVendor.filter({ 
          created_by: user.email,
          vendor_id: vendorId 
        });
        setIsSaved(savedVendors.length > 0);

      } catch (error) {
        console.error(error);
        navigate(createPageUrl("Home"));
      } finally {
        setLoading(false);
      }
    };

    if (vendorId) {
      loadData();
    } else {
      navigate(createPageUrl("Home"));
    }
  }, [vendorId, navigate]);

  const handleSaveVendor = async () => {
    if (!currentUser) {
      toast.error("Please log in to save vendors");
      return;
    }

    try {
      if (isSaved) {
        const saved = await base44.entities.SavedVendor.filter({ 
          created_by: currentUser.email,
          vendor_id: vendorId 
        });
        if (saved.length > 0) {
          await base44.entities.SavedVendor.delete(saved[0].id);
          setIsSaved(false);
          toast.success("Removed from favorites");
        }
      } else {
        await base44.entities.SavedVendor.create({
          vendor_id: vendor.id,
          vendor_name: vendor.business_name,
          vendor_category: vendor.category,
        });
        setIsSaved(true);
        toast.success("Added to favorites!");
      }
    } catch (error) {
      toast.error("Failed to update favorites");
    }
  };

  const handleMessageVendor = () => {
    navigate(createPageUrl("Messages") + `?vendor=${vendorId}`);
  };

  const handleBookVendor = () => {
    navigate(createPageUrl("Bookings") + `?vendor=${vendorId}`);
  };

  const getTier = (completedCount) => {
    if (completedCount >= 100) return { name: "Elite", icon: "👑", color: "bg-purple-100 text-purple-800 border-purple-300" };
    if (completedCount >= 51) return { name: "Master", icon: "⭐", color: "bg-yellow-100 text-yellow-800 border-yellow-300" };
    if (completedCount >= 16) return { name: "Expert", icon: "🔥", color: "bg-orange-100 text-orange-800 border-orange-300" };
    if (completedCount >= 6) return { name: "Pro", icon: "💎", color: "bg-blue-100 text-blue-800 border-blue-300" };
    return { name: "Rising Star", icon: "🌟", color: "bg-green-100 text-green-800 border-green-300" };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-black" />
      </div>
    );
  }

  if (!vendor) return null;

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const tier = getTier(completedBookings);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-12">
      {/* Hero Section */}
      <div className="relative h-96 bg-black">
        {vendor.image_url ? (
          <img 
            src={vendor.image_url} 
            alt={vendor.business_name}
            className="w-full h-full object-cover opacity-60"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-8xl font-black text-white opacity-20">
              {vendor.business_name[0]}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        
        {/* Back Button */}
        <Button
          onClick={() => navigate(-1)}
          variant="ghost"
          className="absolute top-6 left-6 text-white hover:bg-white/20 font-bold"
        >
          ← Back
        </Button>

        {/* Vendor Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-end justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h1 className="text-5xl font-black text-white">{vendor.business_name}</h1>
                  <Badge className={`${tier.color} border-2 text-lg px-3 py-1 font-bold`}>
                    {tier.icon} {tier.name}
                  </Badge>
                </div>
                <div className="flex items-center gap-6 text-white">
                  {vendor.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      <span className="text-lg font-medium">{vendor.location}</span>
                    </div>
                  )}
                  {vendor.price_range && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      <span className="text-lg font-bold">{vendor.price_range}</span>
                    </div>
                  )}
                  {averageRating && (
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      <span className="text-lg font-bold">{averageRating}</span>
                      <span className="text-sm opacity-80">({reviews.length} reviews)</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    <span className="text-lg font-medium">{completedBookings} events completed</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={handleSaveVendor}
                  variant={isSaved ? "default" : "outline"}
                  className={`${isSaved ? 'bg-red-500 hover:bg-red-600' : 'bg-white hover:bg-gray-100'} h-14 px-6 font-bold`}
                >
                  <Heart className={`w-5 h-5 mr-2 ${isSaved ? 'fill-white' : ''}`} />
                  {isSaved ? "Saved" : "Save"}
                </Button>
                <Button
                  onClick={handleMessageVendor}
                  variant="outline"
                  className="bg-white hover:bg-gray-100 h-14 px-6 font-bold"
                >
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Message
                </Button>
                <Button
                  onClick={handleBookVendor}
                  className="bg-white text-black hover:bg-gray-200 h-14 px-8 font-bold text-lg"
                >
                  <Calendar className="w-5 h-5 mr-2" />
                  Book Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-8 -mt-8">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-8">
            {/* About */}
            <Card className="border-2 border-black">
              <CardContent className="p-8">
                <h2 className="text-2xl font-black mb-4">About</h2>
                <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-wrap">
                  {vendor.description}
                </p>
              </CardContent>
            </Card>

            {/* Gallery */}
            {vendor.additional_images && vendor.additional_images.length > 0 && (
              <Card className="border-2 border-black">
                <CardContent className="p-8">
                  <h2 className="text-2xl font-black mb-4">Portfolio</h2>
                  <div className="grid grid-cols-2 gap-4">
                    {vendor.additional_images.map((url, index) => (
                      <div key={index} className="aspect-video rounded-lg overflow-hidden">
                        {url.includes('video') || url.endsWith('.mp4') || url.endsWith('.mov') ? (
                          <video src={url} className="w-full h-full object-cover" controls />
                        ) : (
                          <img src={url} alt={`Portfolio ${index + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reviews */}
            <Card className="border-2 border-black">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-black">Reviews</h2>
                  {averageRating && (
                    <div className="flex items-center gap-2">
                      <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                      <span className="text-3xl font-black">{averageRating}</span>
                      <span className="text-gray-500">/ 5.0</span>
                    </div>
                  )}
                </div>
                {reviews.length > 0 ? (
                  <ReviewsList reviews={reviews} />
                ) : (
                  <p className="text-gray-500 text-center py-8">No reviews yet. Be the first to review!</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pricing */}
            <Card className="border-2 border-black">
              <CardContent className="p-6">
                <h3 className="text-xl font-black mb-4">Pricing</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Starting at</span>
                    <span className="text-2xl font-black">${vendor.starting_price}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Price Range</span>
                    <span className="text-xl font-bold">{vendor.price_range}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card className="border-2 border-black">
              <CardContent className="p-6">
                <h3 className="text-xl font-black mb-4">Contact</h3>
                <div className="space-y-3">
                  {vendor.contact_email && (
                    <div className="text-sm">
                      <span className="text-gray-600 block mb-1">Email</span>
                      <a href={`mailto:${vendor.contact_email}`} className="text-black font-medium hover:underline">
                        {vendor.contact_email}
                      </a>
                    </div>
                  )}
                  {vendor.contact_phone && (
                    <div className="text-sm">
                      <span className="text-gray-600 block mb-1">Phone</span>
                      <a href={`tel:${vendor.contact_phone}`} className="text-black font-medium hover:underline">
                        {vendor.contact_phone}
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Social Links */}
            {(vendor.website || vendor.instagram || vendor.facebook || vendor.twitter || vendor.tiktok) && (
              <Card className="border-2 border-black">
                <CardContent className="p-6">
                  <h3 className="text-xl font-black mb-4">Connect</h3>
                  <div className="space-y-3">
                    {vendor.website && (
                      <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                        <Globe className="w-5 h-5 text-gray-600" />
                        <span className="font-medium">Website</span>
                      </a>
                    )}
                    {vendor.instagram && (
                      <a href={vendor.instagram.startsWith('http') ? vendor.instagram : `https://instagram.com/${vendor.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                        <Instagram className="w-5 h-5 text-pink-600" />
                        <span className="font-medium">Instagram</span>
                      </a>
                    )}
                    {vendor.facebook && (
                      <a href={vendor.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                        <Facebook className="w-5 h-5 text-blue-600" />
                        <span className="font-medium">Facebook</span>
                      </a>
                    )}
                    {vendor.twitter && (
                      <a href={vendor.twitter.startsWith('http') ? vendor.twitter : `https://twitter.com/${vendor.twitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                        <Twitter className="w-5 h-5 text-blue-400" />
                        <span className="font-medium">Twitter</span>
                      </a>
                    )}
                    {vendor.tiktok && (
                      <a href={vendor.tiktok.startsWith('http') ? vendor.tiktok : `https://tiktok.com/@${vendor.tiktok.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                        <Music2 className="w-5 h-5 text-black" />
                        <span className="font-medium">TikTok</span>
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Performance Badge */}
            <Card className={`border-2 ${tier.color.includes('purple') ? 'border-purple-500 bg-purple-50' : tier.color.includes('yellow') ? 'border-yellow-500 bg-yellow-50' : tier.color.includes('orange') ? 'border-orange-500 bg-orange-50' : tier.color.includes('blue') ? 'border-blue-500 bg-blue-50' : 'border-green-500 bg-green-50'}`}>
              <CardContent className="p-6 text-center">
                <div className="text-6xl mb-2">{tier.icon}</div>
                <h3 className="text-2xl font-black mb-1">{tier.name} Vendor</h3>
                <p className="text-sm text-gray-600 mb-3">{completedBookings} successful events</p>
                <div className="flex items-center justify-center gap-2 text-sm">
                  <TrendingUp className="w-4 h-4" />
                  <span className="font-medium">Top-rated professional</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}