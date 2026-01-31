import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heart, Sparkles, ArrowRight, PartyPopper, Cake, Baby, Loader2, MessageSquare } from "lucide-react";

const eventTypes = [
  {
    name: "Wedding",
    icon: Heart,
    description: "Find the perfect vendors for your special day"
  },
  {
    name: "Sweet 16",
    icon: PartyPopper,
    description: "Make their milestone celebration unforgettable"
  },
  {
    name: "Baby Shower",
    icon: Baby,
    description: "Celebrate the new arrival in style"
  },
  {
    name: "Birthday",
    icon: Cake,
    description: "Throw an amazing birthday bash"
  },
  {
    name: "Anniversary",
    icon: Sparkles,
    description: "Honor your years together"
  },
  {
    name: "Other",
    icon: PartyPopper,
    description: "Any celebration you can imagine"
  }
];

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);

        if (!currentUser.onboarding_complete && currentUser.email !== "pateld0514@gmail.com") {
          navigate(createPageUrl("Onboarding"));
        } else if (currentUser.user_type === "vendor" && currentUser.email !== "pateld0514@gmail.com") {
          if (currentUser.approval_status === "pending" || currentUser.approval_status === "rejected") {
            navigate(createPageUrl("VendorPending"));
          } else {
            navigate(createPageUrl("VendorDashboard"));
          }
        }
      } catch (error) {
        // User not authenticated - stay on home page
        setUser(null);
      }
    };
    
    checkUser();
  }, [navigate]);

  const handleEventSelect = (eventType) => {
    const eventSlug = eventType.toLowerCase().replace(/\s+/g, '-');
    if (eventType === "Other") {
      navigate(createPageUrl("Swipe") + `?event=${eventSlug}`);
    } else {
      navigate(createPageUrl("EventVendors") + `?event=${eventSlug}`);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-black">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900" />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-20 md:py-32">
          <div className="text-center space-y-8 max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-white rounded-full border border-gray-200">
              <Sparkles className="w-5 h-5 text-black" />
              <span className="font-bold text-black">Event Planning Simplified</span>
            </div>

            <h1 className="text-6xl md:text-7xl lg:text-8xl font-black text-white leading-tight">
              Find Perfect Vendors
              <br />
              For Your Event
            </h1>
            
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              No more calling hundreds of vendors or endless emails. Find DJs, venues, caterers, and more with a simple swipe.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button
                size="lg"
                className="bg-white text-black hover:bg-gray-100 text-lg h-14 px-8 font-bold"
                onClick={() => navigate(createPageUrl("Swipe"))}
              >
                Start Swiping
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Event Types Grid */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-black mb-4">
            What Are You Planning?
          </h2>
          <p className="text-xl text-gray-600">
            Select your event type to start discovering vendors
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {eventTypes.map((event, index) => {
            const Icon = event.icon;
            return (
              <Card
                key={index}
                className="group relative overflow-hidden border-2 border-black hover:bg-black transition-all duration-300 cursor-pointer hover:shadow-2xl"
                onClick={() => handleEventSelect(event.name)}
              >
                <div className="p-8">
                  <div className="w-16 h-16 rounded-lg bg-black group-hover:bg-white flex items-center justify-center mb-6 transition-colors">
                    <Icon className="w-8 h-8 text-white group-hover:text-black transition-colors" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-black group-hover:text-white mb-2 transition-colors">
                    {event.name}
                  </h3>
                  
                  <p className="text-gray-600 group-hover:text-gray-300 mb-6 transition-colors">
                    {event.description}
                  </p>
                  
                  <div className="flex items-center text-black group-hover:text-white font-bold group-hover:gap-3 gap-2 transition-all">
                    <span>Start Planning</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-black text-black mb-4">
              Quick Actions
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Button
              size="lg"
              className="h-24 bg-black text-white hover:bg-gray-800 font-bold text-lg flex flex-col items-center justify-center gap-2"
              onClick={() => navigate(createPageUrl("Swipe"))}
            >
              <Sparkles className="w-6 h-6" />
              Browse All Vendors
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-24 border-2 border-black hover:bg-black hover:text-white font-bold text-lg flex flex-col items-center justify-center gap-2"
              onClick={() => navigate(createPageUrl("Saved"))}
            >
              <Heart className="w-6 h-6" />
              View Favorites
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-24 border-2 border-black hover:bg-black hover:text-white font-bold text-lg flex flex-col items-center justify-center gap-2"
              onClick={() => navigate(createPageUrl("Messages"))}
            >
              <MessageSquare className="w-6 h-6" />
              Messages
            </Button>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-black mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Three simple steps to plan your perfect event
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-black">
                1
              </div>
              <h3 className="text-xl font-bold mb-2">Browse Vendors</h3>
              <p className="text-gray-600">
                Swipe through DJs, venues, caterers, photographers and more
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-black">
                2
              </div>
              <h3 className="text-xl font-bold mb-2">Save Your Favorites</h3>
              <p className="text-gray-600">
                Swipe right on vendors you love to save them to your collection
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-black">
                3
              </div>
              <h3 className="text-xl font-bold mb-2">Connect & Book</h3>
              <p className="text-gray-600">
                Message your saved vendors and book everything in one place
              </p>
            </div>
          </div>
        </div>
      </div>
      </div>
      );
      }