import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, DollarSign, Globe, Instagram, Facebook, Twitter, Music2, Star, Award, MessageSquare, Calendar, Heart, TrendingUp, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import ReviewsList from "../components/vendor/ReviewsList";
import { useQuery } from "@tanstack/react-query";

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

  // Load portfolio items
  const { data: portfolioItems = [] } = useQuery({
    queryKey: ['portfolio', vendorId],
    queryFn: () => base44.entities.PortfolioItem.filter({ vendor_id: vendorId }, 'display_order'),
    enabled: !!vendorId
  });

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

  // Calculate rating distribution
  const ratingDistribution = [5, 4, 3, 2, 1].map(star => ({
    stars: star,
    count: reviews.filter(r => r.rating === star).length,
    percentage: reviews.length > 0 ? (reviews.filter(r => r.rating === star).length / reviews.length) * 100 : 0
  }));

  const tier = getTier(completedBookings);

  const handleShare = async () => {
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
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-12">
      {/* Hero Section */}
      <div className="relative h-80 md:h-96 bg-black">
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
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 md:gap-4 mb-3 md:mb-4">
                  <h1 className="text-4xl md:text-6xl font-black text-white">{vendor.business_name}</h1>
                  <Badge className={`${tier.color} border-2 text-base md:text-xl px-3 md:px-4 py-1.5 font-black`}>
                    {tier.icon} {tier.name}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-3 md:gap-6 text-white text-sm md:text-base">
                  {vendor.location && (
                    <div className="flex items-center gap-1 md:gap-2">
                      <MapPin className="w-4 h-4 md:w-5 md:h-5" />
                      <span className="font-medium">{vendor.location}</span>
                    </div>
                  )}
                  {vendor.price_range && (
                    <div className="flex items-center gap-1 md:gap-2">
                      <DollarSign className="w-4 h-4 md:w-5 md:h-5" />
                      <span className="font-bold">{vendor.price_range}</span>
                    </div>
                  )}
                  {averageRating && (
                    <div className="flex items-center gap-1 md:gap-2">
                      <Star className="w-4 h-4 md:w-5 md:h-5 fill-yellow-400 text-yellow-400" />
                      <span className="font-bold">{averageRating}</span>
                      <span className="text-xs md:text-sm opacity-80">({reviews.length})</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 md:gap-2">
                    <Award className="w-4 h-4 md:w-5 md:h-5" />
                    <span className="font-medium">{completedBookings} events</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 md:gap-3">
                <Button
                  onClick={handleSaveVendor}
                  variant={isSaved ? "default" : "outline"}
                  size="sm"
                  className={`${isSaved ? 'bg-red-500 hover:bg-red-600' : 'bg-white hover:bg-gray-100'} h-10 md:h-14 px-3 md:px-6 font-bold`}
                >
                  <Heart className={`w-4 h-4 md:w-5 md:h-5 md:mr-2 ${isSaved ? 'fill-white' : ''}`} />
                  <span className="hidden md:inline">{isSaved ? "Saved" : "Save"}</span>
                </Button>
                <Button
                  onClick={handleMessageVendor}
                  variant="outline"
                  size="sm"
                  className="bg-white hover:bg-gray-100 h-10 md:h-14 px-3 md:px-6 font-bold"
                >
                  <MessageSquare className="w-4 h-4 md:w-5 md:h-5 md:mr-2" />
                  <span className="hidden md:inline">Message</span>
                </Button>
                <Button
                  onClick={handleBookVendor}
                  size="sm"
                  className="bg-white text-black hover:bg-gray-200 h-10 md:h-14 px-4 md:px-8 font-bold"
                >
                  <Calendar className="w-4 h-4 md:w-5 md:h-5 md:mr-2" />
                  <span className="hidden md:inline">Book Now</span>
                  <span className="md:hidden">Book</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 mt-6 md:mt-8">
        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6 md:space-y-8">
            {/* About */}
            <Card className="border-4 border-black shadow-lg">
              <CardContent className="p-6 md:p-10">
                <h2 className="text-2xl md:text-3xl font-black mb-4 md:mb-6">About</h2>
                <p className="text-gray-700 text-lg md:text-xl leading-relaxed whitespace-pre-wrap">
                  {vendor.description}
                </p>
              </CardContent>
            </Card>

            {/* Portfolio Showcases */}
            {portfolioItems.length > 0 && (
              <Card className="border-4 border-black shadow-lg">
                <CardContent className="p-6 md:p-10">
                  <h2 className="text-2xl md:text-3xl font-black mb-6">Portfolio Showcases</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    {portfolioItems.map((item) => (
                      <div key={item.id} className="border-3 border-gray-300 rounded-xl overflow-hidden hover:border-black hover:shadow-xl transition-all">
                        <div className="aspect-video bg-gray-100">
                          {item.type === "image" ? (
                            <img src={item.url} alt={item.title} className="w-full h-full object-cover" />
                          ) : (
                            <video src={item.url} className="w-full h-full object-cover" controls />
                          )}
                        </div>
                        <div className="p-5">
                          <h3 className="font-black text-xl mb-2">{item.title}</h3>
                          {item.event_type && (
                            <p className="text-sm text-gray-500 mb-3 font-bold uppercase tracking-wide">{item.event_type}</p>
                          )}
                          {item.description && (
                            <p className="text-base text-gray-700 leading-relaxed">{item.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Legacy Gallery (if no portfolio items but has old images) */}
            {portfolioItems.length === 0 && vendor.additional_images && vendor.additional_images.length > 0 && (
              <Card className="border-2 border-black">
                <CardContent className="p-4 md:p-8">
                  <h2 className="text-xl md:text-2xl font-black mb-3 md:mb-4">Portfolio</h2>
                  <div className="grid grid-cols-2 gap-3 md:gap-4">
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

            {/* Client Reviews and Ratings */}
            <Card className="border-4 border-black shadow-lg">
              <CardContent className="p-6 md:p-10">
                <h2 className="text-2xl md:text-3xl font-black mb-8">Client Reviews & Ratings</h2>
                
                {reviews.length > 0 ? (
                  <div>
                    {/* Rating Summary */}
                    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-4 border-yellow-300 rounded-xl p-8 mb-8 shadow-md">
                      <div className="grid md:grid-cols-2 gap-8">
                        <div className="text-center md:text-left">
                          <div className="flex items-center justify-center md:justify-start gap-4 mb-3">
                            <Star className="w-16 h-16 fill-yellow-400 text-yellow-400" />
                            <div>
                              <p className="text-6xl font-black">{averageRating}</p>
                              <p className="text-gray-600 text-lg font-bold">out of 5</p>
                            </div>
                          </div>
                          <p className="text-gray-600 font-bold text-lg">{reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}</p>
                        </div>
                        
                        <div className="space-y-3">
                          {ratingDistribution.map(({ stars, count, percentage }) => (
                            <div key={stars} className="flex items-center gap-4">
                              <span className="text-base font-bold w-16">{stars} stars</span>
                              <div className="flex-1 bg-gray-200 rounded-full h-3">
                                <div 
                                  className="bg-yellow-400 h-3 rounded-full transition-all"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <span className="text-base text-gray-700 font-bold w-10">{count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Reviews List */}
                    <ReviewsList reviews={reviews} />
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg font-medium">No reviews yet</p>
                    <p className="text-gray-400 text-sm">Be the first to review {vendor.business_name}!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 md:space-y-6">
            {/* Pricing */}
            <Card className="border-4 border-black shadow-lg">
              <CardContent className="p-5 md:p-8">
                <h3 className="text-xl md:text-2xl font-black mb-4 md:mb-6">Pricing</h3>
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
            <Card className="border-4 border-black shadow-lg">
              <CardContent className="p-5 md:p-8">
                <h3 className="text-xl md:text-2xl font-black mb-4 md:mb-6">Contact</h3>
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
              <Card className="border-4 border-black shadow-lg">
                <CardContent className="p-5 md:p-8">
                  <h3 className="text-xl md:text-2xl font-black mb-4 md:mb-6">Connect</h3>
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


          </div>
        </div>
      </div>
    </div>
  );
}