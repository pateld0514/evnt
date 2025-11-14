import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Store, LogOut, Loader2 } from "lucide-react";

export default function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);

        if (currentUser.user_type === "vendor" && currentUser.vendor_id) {
          const { data: vendors } = await base44.entities.Vendor.filter({ id: currentUser.vendor_id });
          if (vendors && vendors.length > 0) {
            setVendor(vendors[0]);
          }
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleLogout = async () => {
    await base44.auth.logout();
    navigate(createPageUrl("SignUp"));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-black" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-black text-black mb-2">Profile</h1>
      </div>

      <Card className="border-2 border-black mb-6">
        <CardHeader className="bg-black text-white">
          <CardTitle className="flex items-center gap-2 font-black">
            {user?.user_type === "vendor" ? <Store className="w-6 h-6" /> : <User className="w-6 h-6" />}
            {user?.user_type === "vendor" ? "Vendor Account" : "Client Account"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 font-medium">Name</p>
              <p className="text-lg font-bold">{user?.full_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Email</p>
              <p className="text-lg font-bold">{user?.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Account Type</p>
              <p className="text-lg font-bold capitalize">{user?.user_type}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {user?.user_type === "vendor" && vendor && (
        <Card className="border-2 border-black mb-6">
          <CardHeader className="bg-black text-white">
            <CardTitle className="font-black">Business Information</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 font-medium">Business Name</p>
                <p className="text-lg font-bold">{vendor.business_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Category</p>
                <p className="text-lg font-bold capitalize">{vendor.category}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Location</p>
                <p className="text-lg font-bold">{vendor.location}</p>
              </div>
              {vendor.price_range && (
                <div>
                  <p className="text-sm text-gray-500 font-medium">Price Range</p>
                  <p className="text-lg font-bold">{vendor.price_range}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Button
        onClick={handleLogout}
        variant="outline"
        className="w-full border-2 border-black hover:bg-black hover:text-white font-bold"
      >
        <LogOut className="w-5 h-5 mr-2" />
        Log Out
      </Button>
    </div>
  );
}