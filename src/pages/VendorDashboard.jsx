import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MessageSquare, Heart, TrendingUp, Loader2, Store } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function VendorDashboard() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);

        if (user.user_type !== "vendor") {
          navigate(createPageUrl("Home"));
          return;
        }

        if (user.vendor_id) {
          const vendors = await base44.entities.Vendor.filter({ id: user.vendor_id });
          if (vendors && vendors.length > 0) {
            setVendor(vendors[0]);
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [navigate]);

  const { data: bookings = [] } = useQuery({
    queryKey: ['vendor-bookings', vendor?.id],
    queryFn: async () => {
      if (!vendor?.id) return [];
      return await base44.entities.Booking.filter({ vendor_id: vendor.id }, '-created_date');
    },
    enabled: !!vendor?.id,
    initialData: [],
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['vendor-messages', vendor?.id],
    queryFn: async () => {
      if (!vendor?.id) return [];
      return await base44.entities.Message.filter({ vendor_id: vendor.id }, '-created_date');
    },
    enabled: !!vendor?.id,
    initialData: [],
  });

  const pendingBookings = bookings.filter(b => b.status === "pending").length;
  const unreadMessages = messages.filter(m => !m.read && m.recipient_email === currentUser?.email).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-black" />
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md px-4">
          <div className="w-24 h-24 bg-black rounded-full flex items-center justify-center mx-auto mb-6">
            <Store className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-black text-black mb-3">No Vendor Profile Found</h2>
          <p className="text-gray-600 mb-8">Complete your vendor setup to start receiving bookings and connecting with clients.</p>
          <Button
            onClick={() => navigate(createPageUrl("VendorSetup"))}
            className="bg-black text-white hover:bg-gray-800 h-12 text-lg font-bold"
          >
            Sign Up Now
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-black mb-2">Vendor Dashboard</h1>
        <p className="text-lg text-gray-600">Welcome back, {vendor.business_name}!</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="border-2 border-black cursor-pointer hover:shadow-xl transition-shadow" onClick={() => navigate(createPageUrl("Bookings"))}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="w-8 h-8 text-black" />
              {pendingBookings > 0 && (
                <Badge className="bg-red-500 text-white">{pendingBookings}</Badge>
              )}
            </div>
            <p className="text-3xl font-black text-black">{bookings.length}</p>
            <p className="text-sm text-gray-600 font-medium">Total Bookings</p>
            {pendingBookings > 0 && (
              <p className="text-xs text-red-600 font-bold mt-1">{pendingBookings} pending</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-2 border-black cursor-pointer hover:shadow-xl transition-shadow" onClick={() => navigate(createPageUrl("Messages"))}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <MessageSquare className="w-8 h-8 text-black" />
              {unreadMessages > 0 && (
                <Badge className="bg-red-500 text-white">{unreadMessages}</Badge>
              )}
            </div>
            <p className="text-3xl font-black text-black">{messages.length}</p>
            <p className="text-sm text-gray-600 font-medium">Messages</p>
            {unreadMessages > 0 && (
              <p className="text-xs text-red-600 font-bold mt-1">{unreadMessages} unread</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-2 border-black">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-black" />
            </div>
            <p className="text-3xl font-black text-black">{bookings.filter(b => b.status === "completed").length}</p>
            <p className="text-sm text-gray-600 font-medium">Completed Events</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-black">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Heart className="w-8 h-8 text-black" />
            </div>
            <p className="text-3xl font-black text-black">{bookings.filter(b => b.status === "accepted").length}</p>
            <p className="text-sm text-gray-600 font-medium">Accepted Bookings</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-2 border-black">
          <CardHeader className="bg-black text-white">
            <CardTitle className="font-black">Recent Bookings</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {bookings.slice(0, 5).length === 0 ? (
              <p className="text-gray-500 text-center py-8">No bookings yet</p>
            ) : (
              <div className="space-y-4">
                {bookings.slice(0, 5).map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded border-2 border-gray-200">
                    <div>
                      <p className="font-bold">{booking.client_name}</p>
                      <p className="text-sm text-gray-600">{booking.event_type}</p>
                    </div>
                    <Badge className={
                      booking.status === "pending" ? "bg-yellow-100 text-yellow-800 border-yellow-300" :
                      booking.status === "accepted" ? "bg-green-100 text-green-800 border-green-300" :
                      "bg-gray-100 text-gray-800 border-gray-300"
                    }>
                      {booking.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-2 border-black">
          <CardHeader className="bg-black text-white">
            <CardTitle className="font-black">Your Profile</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 font-medium">Business Name</p>
                <p className="font-bold">{vendor.business_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Category</p>
                <p className="font-bold capitalize">{vendor.category}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Location</p>
                <p className="font-bold">{vendor.location}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Price Range</p>
                <p className="font-bold">{vendor.price_range}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}