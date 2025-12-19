import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Store, Loader2 } from "lucide-react";

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const user = await base44.auth.me();
      if (user.onboarding_complete) {
        if (user.user_type === "vendor") {
          navigate(createPageUrl("VendorDashboard"));
        } else {
          navigate(createPageUrl("Home"));
        }
      }
    };
    checkUser();
  }, [navigate]);

  const handleUserTypeSelect = async (userType) => {
    setLoading(true);
    
    if (userType === "client") {
      navigate(createPageUrl("ClientRegistration"));
    } else {
      navigate(createPageUrl("VendorRegistration"));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-black text-black mb-4">Welcome to EVNT</h1>
          <p className="text-xl text-gray-600">Let's get you set up. How will you be using EVNT?</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card 
            className="border-4 border-black hover:shadow-2xl transition-all group"
          >
            <CardHeader className="text-center pb-4">
              <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <CardTitle className="text-3xl font-black">I'm Planning an Event</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 mb-6 text-lg">
                Find and book amazing vendors for your special occasion
              </p>
              <Button 
                type="button"
                onClick={() => !loading && handleUserTypeSelect("client")}
                className="w-full bg-black text-white hover:bg-gray-800 text-lg h-14 font-bold"
                disabled={loading}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Continue as Client"}
              </Button>
            </CardContent>
          </Card>

          <Card 
            className="border-4 border-black hover:shadow-2xl transition-all group"
          >
            <CardHeader className="text-center pb-4">
              <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Store className="w-10 h-10 text-white" />
              </div>
              <CardTitle className="text-3xl font-black">I'm a Vendor</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 mb-6 text-lg">
                Grow your event business by connecting with clients
              </p>
              <Button 
                type="button"
                onClick={() => !loading && handleUserTypeSelect("vendor")}
                className="w-full bg-black text-white hover:bg-gray-800 text-lg h-14 font-bold"
                disabled={loading}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Continue as Vendor"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}