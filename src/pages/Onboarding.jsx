import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Store, Users, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleUserTypeSelect = async (userType) => {
    setLoading(true);
    try {
      await base44.auth.updateMe({
        user_type: userType,
        onboarding_complete: userType === "client"
      });

      if (userType === "vendor") {
        navigate(createPageUrl("VendorSetup"));
      } else {
        navigate(createPageUrl("Home"));
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-16 h-16 bg-black rounded-xl flex items-center justify-center">
              <span className="text-4xl font-black text-white">E</span>
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-black mb-4">
            Welcome to EVNT
          </h1>
          <p className="text-xl text-gray-600">
            Are you looking for vendors or offering services?
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card
            className="border-2 border-black hover:bg-black group transition-all cursor-pointer"
            onClick={() => !loading && handleUserTypeSelect("client")}
          >
            <CardHeader className="pb-4">
              <div className="w-20 h-20 bg-black group-hover:bg-white rounded-xl flex items-center justify-center mb-6 transition-colors mx-auto">
                <Users className="w-10 h-10 text-white group-hover:text-black transition-colors" />
              </div>
              <CardTitle className="text-center text-2xl font-bold text-black group-hover:text-white transition-colors">
                I'm Planning an Event
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-gray-600 group-hover:text-gray-300 mb-6 transition-colors">
                Find and connect with the perfect vendors for your wedding, birthday, baby shower, or any celebration.
              </p>
              <Button
                className="w-full bg-white group-hover:bg-black text-black group-hover:text-white border-2 border-black group-hover:border-white font-bold"
                disabled={loading}
              >
                Continue as Client
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </CardContent>
          </Card>

          <Card
            className="border-2 border-black hover:bg-black group transition-all cursor-pointer"
            onClick={() => !loading && handleUserTypeSelect("vendor")}
          >
            <CardHeader className="pb-4">
              <div className="w-20 h-20 bg-black group-hover:bg-white rounded-xl flex items-center justify-center mb-6 transition-colors mx-auto">
                <Store className="w-10 h-10 text-white group-hover:text-black transition-colors" />
              </div>
              <CardTitle className="text-center text-2xl font-bold text-black group-hover:text-white transition-colors">
                I'm a Vendor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-gray-600 group-hover:text-gray-300 mb-6 transition-colors">
                Showcase your services to clients planning their special events. Venues, DJs, caterers, photographers & more.
              </p>
              <Button
                className="w-full bg-white group-hover:bg-black text-black group-hover:text-white border-2 border-black group-hover:border-white font-bold"
                disabled={loading}
              >
                Continue as Vendor
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}