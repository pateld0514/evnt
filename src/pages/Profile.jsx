import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Store, LogOut, Loader2, RefreshCw } from "lucide-react";

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
          const vendors = await base44.entities.Vendor.filter({ id: currentUser.vendor_id });
          if (vendors && vendors.length > 0) {
            setVendor(vendors[0]);
          }
        }
      } catch (error) {
        console.error("Error loading profile:", error);
        base44.auth.redirectToLogin();
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleLogout = () => {
    base44.auth.logout();
  };

  const isAdmin = user?.email === "pateld0514@gmail.com";

  const switchView = (type) => {
    if (type === "vendor") {
      navigate(createPageUrl("VendorDashboard"));
    } else if (type === "client") {
      navigate(createPageUrl("Home"));
    } else if (type === "admin") {
      navigate(createPageUrl("AdminDashboard"));
    }
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
            <User className="w-6 h-6" />
            {user?.user_type ? (user.user_type === "vendor" ? "Vendor Account" : "Client Account") : "Account"}
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
            {user?.user_type && (
              <div>
                <p className="text-sm text-gray-500 font-medium">Account Type</p>
                <p className="text-lg font-bold capitalize">{user.user_type}</p>
              </div>
            )}
            {user?.location && (
              <div>
                <p className="text-sm text-gray-500 font-medium">Location</p>
                <p className="text-lg font-bold">{user.location}</p>
              </div>
            )}
            {user?.phone && (
              <div>
                <p className="text-sm text-gray-500 font-medium">Phone</p>
                <p className="text-lg font-bold">{user.phone}</p>
              </div>
            )}
            {user?.budget_range && (
              <div>
                <p className="text-sm text-gray-500 font-medium">Budget Range</p>
                <p className="text-lg font-bold capitalize">{user.budget_range.replace(/_/g, ' ')}</p>
              </div>
            )}
            {user?.event_interests && user.event_interests.length > 0 && (
              <div>
                <p className="text-sm text-gray-500 font-medium">Event Interests</p>
                <p className="text-lg font-bold">{user.event_interests.join(', ')}</p>
              </div>
            )}
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
              {vendor.years_in_business && (
                <div>
                  <p className="text-sm text-gray-500 font-medium">Experience</p>
                  <p className="text-lg font-bold">{vendor.years_in_business} years</p>
                </div>
              )}
              {vendor.willing_to_travel && (
                <div>
                  <p className="text-sm text-gray-500 font-medium">Travel</p>
                  <p className="text-lg font-bold">Available (up to {vendor.travel_radius || 'any'} miles)</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {isAdmin && (
          <Card className="border-2 border-purple-600 bg-purple-50">
            <CardContent className="p-4">
              <div>
                <p className="font-bold text-purple-900 mb-3">👑 Admin Controls</p>
                <div className="grid grid-cols-3 gap-3">
                  <Button
                    onClick={() => switchView("admin")}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold"
                  >
                    Admin Panel
                  </Button>
                  <Button
                    onClick={() => switchView("client")}
                    variant="outline"
                    className="border-2 border-black font-bold"
                  >
                    View as Client
                  </Button>
                  <Button
                    onClick={() => switchView("vendor")}
                    variant="outline"
                    className="border-2 border-black font-bold"
                  >
                    View as Vendor
                  </Button>
                </div>
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
    </div>
  );
}