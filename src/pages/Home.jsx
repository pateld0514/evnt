import React from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heart, Sparkles, ArrowRight, PartyPopper, Cake, Baby } from "lucide-react";

const eventTypes = [
  {
    name: "Wedding",
    icon: Heart,
    color: "from-rose-400 to-pink-600",
    description: "Find the perfect vendors for your special day"
  },
  {
    name: "Sweet 16",
    icon: PartyPopper,
    color: "from-purple-400 to-indigo-600",
    description: "Make their milestone celebration unforgettable"
  },
  {
    name: "Baby Shower",
    icon: Baby,
    color: "from-blue-400 to-cyan-600",
    description: "Celebrate the new arrival in style"
  },
  {
    name: "Birthday",
    icon: Cake,
    color: "from-orange-400 to-red-600",
    description: "Throw an amazing birthday bash"
  },
  {
    name: "Anniversary",
    icon: Sparkles,
    color: "from-amber-400 to-yellow-600",
    description: "Honor your years together"
  },
  {
    name: "Other",
    icon: PartyPopper,
    color: "from-teal-400 to-emerald-600",
    description: "Any celebration you can imagine"
  }
];

export default function Home() {
  const navigate = useNavigate();

  const handleEventSelect = (eventType) => {
    navigate(createPageUrl("Swipe") + `?event=${eventType.toLowerCase().replace(/\s+/g, '-')}`);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-indigo-500/20" />
        <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-24">
          <div className="text-center space-y-6 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-pink-200">
              <Sparkles className="w-4 h-4 text-pink-600" />
              <span className="text-sm font-medium text-pink-600">Event Planning Made Simple</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold">
              <span className="bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Swipe Your Way
              </span>
              <br />
              <span className="text-gray-900">To The Perfect Event</span>
            </h1>
            
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              No more calling hundreds of vendors or endless emails. Find DJs, venues, caterers, and more with a simple swipe.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button
                size="lg"
                className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-lg h-14 px-8"
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
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            What Are You Planning?
          </h2>
          <p className="text-lg text-gray-600">
            Select your event type to start discovering vendors
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {eventTypes.map((event, index) => {
            const Icon = event.icon;
            return (
              <Card
                key={index}
                className="group relative overflow-hidden border-2 border-transparent hover:border-pink-200 transition-all duration-300 cursor-pointer hover:shadow-xl"
                onClick={() => handleEventSelect(event.name)}
              >
                <div className="p-8">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${event.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {event.name}
                  </h3>
                  
                  <p className="text-gray-600 mb-6">
                    {event.description}
                  </p>
                  
                  <div className="flex items-center text-pink-600 font-medium group-hover:gap-3 gap-2 transition-all">
                    <span>Start Planning</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
                
                <div className={`absolute inset-0 bg-gradient-to-br ${event.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
              </Card>
            );
          })}
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-white/50 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600">
              Three simple steps to plan your perfect event
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-bold mb-2">Browse Vendors</h3>
              <p className="text-gray-600">
                Swipe through DJs, venues, caterers, photographers and more
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-bold mb-2">Save Your Favorites</h3>
              <p className="text-gray-600">
                Swipe right on vendors you love to save them to your collection
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-bold mb-2">Book & Connect</h3>
              <p className="text-gray-600">
                Contact your saved vendors and book everything in one place
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}