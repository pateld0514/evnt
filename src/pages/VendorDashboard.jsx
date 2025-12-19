import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MessageSquare, Heart, TrendingUp, Loader2, Store, DollarSign, BarChart3, Sparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import VendorAnalytics from "../components/analytics/VendorAnalytics";

export default function VendorDashboard() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiInsights, setAiInsights] = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);

        if (user.user_type === "vendor" && user.approval_status !== "approved" && user.email !== "pateld0514@gmail.com") {
          navigate(createPageUrl("VendorPending"));
          return;
        }

        if (user.user_type !== "vendor" && user.email !== "pateld0514@gmail.com") {
          navigate(createPageUrl("Home"));
          return;
        }

        if (user.vendor_id) {
          const vendors = await base44.entities.Vendor.filter({ id: user.vendor_id });
          if (vendors && vendors.length > 0) {
            setVendor(vendors[0]);
          }
        } else if (user.email === "pateld0514@gmail.com") {
          // Admin viewing vendor side without a vendor profile
          const allVendors = await base44.entities.Vendor.list();
          if (allVendors.length > 0) {
            setVendor(allVendors[0]);
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

  const { data: vendorViews = [] } = useQuery({
    queryKey: ['vendor-views', vendor?.id],
    queryFn: async () => {
      if (!vendor?.id) return [];
      return await base44.entities.VendorView.filter({ vendor_id: vendor.id });
    },
    enabled: !!vendor?.id,
    initialData: [],
  });

  const { data: vendorSwipes = [] } = useQuery({
    queryKey: ['vendor-swipes', vendor?.id],
    queryFn: async () => {
      if (!vendor?.id) return [];
      return await base44.entities.UserSwipe.filter({ vendor_id: vendor.id });
    },
    enabled: !!vendor?.id,
    initialData: [],
  });

  const pendingBookings = bookings.filter(b => b.status === "pending").length;
  const unreadMessages = messages.filter(m => !m.read && m.recipient_email === currentUser?.email).length;

  // Sales calculations
  const completedBookings = bookings.filter(b => b.status === "completed" || b.status === "accepted");
  const totalRevenue = completedBookings.reduce((sum, b) => sum + (b.budget || 0), 0);
  const vendorRevenue = totalRevenue * 0.92; // 92% after 8% platform fee
  const avgBookingValue = completedBookings.length > 0 ? totalRevenue / completedBookings.length : 0;

  // Analytics
  const bookingsByLocation = bookings.reduce((acc, b) => {
    const loc = b.location || "Unknown";
    acc[loc] = (acc[loc] || 0) + 1;
    return acc;
  }, {});

  const bookingsByEventType = bookings.reduce((acc, b) => {
    acc[b.event_type] = (acc[b.event_type] || 0) + 1;
    return acc;
  }, {});

  const conversionRate = bookings.length > 0 
    ? ((bookings.filter(b => b.status === "accepted" || b.status === "completed").length / bookings.length) * 100).toFixed(1)
    : 0;

  const generateAIInsights = async () => {
    if (!vendor || bookings.length === 0) return;
    
    setLoadingInsights(true);
    try {
      const insights = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a business analytics expert for event vendors. Analyze this data and provide actionable insights.

Vendor: ${vendor.business_name}
Category: ${vendor.category}
Location: ${vendor.location}
Price Range: ${vendor.price_range}

Booking Data:
- Total Bookings: ${bookings.length}
- Accepted/Completed: ${completedBookings.length}
- Pending: ${pendingBookings}
- Declined: ${bookings.filter(b => b.status === "declined").length}
- Conversion Rate: ${conversionRate}%
- Total Revenue: $${totalRevenue.toLocaleString()}
- Average Booking Value: $${avgBookingValue.toFixed(0)}

Bookings by Location: ${JSON.stringify(bookingsByLocation)}
Bookings by Event Type: ${JSON.stringify(bookingsByEventType)}

Provide 4-5 specific, actionable insights in this JSON format:
{
  "top_locations": ["location names where they get most bookings"],
  "growth_opportunities": ["specific suggestions for expansion"],
  "pricing_insights": "specific pricing recommendation",
  "marketing_tips": ["2-3 actionable marketing suggestions"],
  "seasonal_trends": "any patterns or recommendations"
}`,
        response_json_schema: {
          type: "object",
          properties: {
            top_locations: { type: "array", items: { type: "string" } },
            growth_opportunities: { type: "array", items: { type: "string" } },
            pricing_insights: { type: "string" },
            marketing_tips: { type: "array", items: { type: "string" } },
            seasonal_trends: { type: "string" }
          }
        }
      });
      setAiInsights(insights);
    } catch (error) {
      console.error("Failed to generate insights:", error);
    } finally {
      setLoadingInsights(false);
    }
  };

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
          <p className="text-gray-600 mb-8">No vendors registered in the system yet.</p>
          <Button
            onClick={() => navigate(createPageUrl("Home"))}
            className="bg-black text-white hover:bg-gray-800 h-12 text-lg font-bold"
          >
            Go to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8 md:py-12">
      <div className="mb-10">
        <h1 className="text-4xl md:text-5xl font-black text-black mb-3">Vendor Dashboard</h1>
        <p className="text-xl text-gray-600">Welcome back, {vendor.business_name}!</p>
      </div>

      <Tabs defaultValue="analytics" className="mb-8">
        <TabsList className="grid w-full grid-cols-4 h-auto p-1 bg-gray-100 border-2 border-black">
          <TabsTrigger value="analytics" className="py-3 data-[state=active]:bg-black data-[state=active]:text-white font-bold">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="overview" className="py-3 data-[state=active]:bg-black data-[state=active]:text-white font-bold">
            Overview
          </TabsTrigger>
          <TabsTrigger value="sales" className="py-3 data-[state=active]:bg-black data-[state=active]:text-white font-bold">
            Revenue
          </TabsTrigger>
          <TabsTrigger value="insights" className="py-3 data-[state=active]:bg-black data-[state=active]:text-white font-bold">
            AI Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="mt-6">
          <VendorAnalytics 
            vendor={vendor}
            views={vendorViews}
            swipes={vendorSwipes}
            bookings={bookings}
          />
        </TabsContent>

        <TabsContent value="overview" className="mt-6">

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
            <div className="flex items-center justify-between">
              <CardTitle className="font-black">Your Profile</CardTitle>
              <Button
                onClick={() => navigate(createPageUrl("VendorProfile"))}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-gray-800"
              >
                Edit
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {vendor.image_url && (
                <img src={vendor.image_url} alt="Profile" className="w-full h-32 object-cover rounded-lg border-2 border-gray-300" />
              )}
              <div>
                <p className="text-sm text-gray-500 font-medium">Business Name</p>
                <p className="font-bold">{vendor.business_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Category</p>
                <p className="font-bold capitalize">{vendor.category?.replace(/_/g, ' ')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Location</p>
                <p className="font-bold">{vendor.location}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Price Range</p>
                <p className="font-bold">{vendor.price_range} • Starting at ${vendor.starting_price}</p>
              </div>
              {(vendor.website || vendor.instagram) && (
                <Button
                  onClick={() => navigate(createPageUrl("VendorProfile"))}
                  variant="outline"
                  size="sm"
                  className="w-full border-2 border-black hover:bg-black hover:text-white font-bold"
                >
                  View Full Profile
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
        </div>
        </TabsContent>

        {/* Sales Tab */}
        <TabsContent value="sales" className="mt-6">
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="border-2 border-green-600">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-3xl font-black text-black">${vendorRevenue.toLocaleString()}</p>
                <p className="text-sm text-gray-600 font-medium">Your Revenue (92%)</p>
                <p className="text-xs text-gray-500 mt-1">After 8% platform fee</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-600">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="w-8 h-8 text-blue-600" />
                </div>
                <p className="text-3xl font-black text-black">${avgBookingValue.toFixed(0)}</p>
                <p className="text-sm text-gray-600 font-medium">Avg Booking Value</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-purple-600">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <BarChart3 className="w-8 h-8 text-purple-600" />
                </div>
                <p className="text-3xl font-black text-black">{conversionRate}%</p>
                <p className="text-sm text-gray-600 font-medium">Conversion Rate</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-2 border-black">
              <CardHeader className="bg-black text-white">
                <CardTitle className="font-black">Bookings by Location</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {Object.keys(bookingsByLocation).length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No location data yet</p>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(bookingsByLocation)
                      .sort((a, b) => b[1] - a[1])
                      .map(([location, count]) => (
                        <div key={location} className="flex items-center justify-between p-3 bg-gray-50 rounded border-2 border-gray-200">
                          <span className="font-bold">{location}</span>
                          <Badge className="bg-black text-white">{count} bookings</Badge>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-2 border-black">
              <CardHeader className="bg-black text-white">
                <CardTitle className="font-black">Bookings by Event Type</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {Object.keys(bookingsByEventType).length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No event data yet</p>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(bookingsByEventType)
                      .sort((a, b) => b[1] - a[1])
                      .map(([eventType, count]) => (
                        <div key={eventType} className="flex items-center justify-between p-3 bg-gray-50 rounded border-2 border-gray-200">
                          <span className="font-bold">{eventType}</span>
                          <Badge className="bg-black text-white">{count} bookings</Badge>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* AI Insights Tab */}
        <TabsContent value="insights" className="mt-6">
          <Card className="border-2 border-black mb-6">
            <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-6 h-6" />
                  <CardTitle className="font-black">AI-Powered Business Insights</CardTitle>
                </div>
                <Button
                  onClick={generateAIInsights}
                  disabled={loadingInsights || bookings.length === 0}
                  className="bg-white text-purple-600 hover:bg-gray-100 font-bold"
                >
                  {loadingInsights ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    "Generate Insights"
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {!aiInsights && !loadingInsights && (
                <div className="text-center py-12">
                  <Sparkles className="w-16 h-16 mx-auto mb-4 text-purple-600" />
                  <h3 className="text-xl font-bold mb-2">Get AI-Powered Recommendations</h3>
                  <p className="text-gray-600 mb-4">
                    Click "Generate Insights" to get personalized recommendations for growing your business
                  </p>
                  {bookings.length === 0 && (
                    <p className="text-sm text-gray-500">You need at least one booking to generate insights</p>
                  )}
                </div>
              )}

              {loadingInsights && (
                <div className="text-center py-12">
                  <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-purple-600" />
                  <p className="text-gray-600">Analyzing your business data...</p>
                </div>
              )}

              {aiInsights && (
                <div className="space-y-6">
                  {/* Top Locations */}
                  {aiInsights.top_locations && aiInsights.top_locations.length > 0 && (
                    <div>
                      <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                        <span className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                        Top Performing Locations
                      </h3>
                      <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-200">
                        <ul className="space-y-2">
                          {aiInsights.top_locations.map((loc, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
                              <span className="font-medium">{loc}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Growth Opportunities */}
                  {aiInsights.growth_opportunities && aiInsights.growth_opportunities.length > 0 && (
                    <div>
                      <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                        <span className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                        Growth Opportunities
                      </h3>
                      <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
                        <ul className="space-y-2">
                          {aiInsights.growth_opportunities.map((opp, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="w-2 h-2 bg-green-600 rounded-full mt-2"></span>
                              <span>{opp}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Pricing Insights */}
                  {aiInsights.pricing_insights && (
                    <div>
                      <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                        <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                        Pricing Strategy
                      </h3>
                      <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                        <p>{aiInsights.pricing_insights}</p>
                      </div>
                    </div>
                  )}

                  {/* Marketing Tips */}
                  {aiInsights.marketing_tips && aiInsights.marketing_tips.length > 0 && (
                    <div>
                      <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                        <span className="w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
                        Marketing Recommendations
                      </h3>
                      <div className="bg-orange-50 p-4 rounded-lg border-2 border-orange-200">
                        <ul className="space-y-2">
                          {aiInsights.marketing_tips.map((tip, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="w-2 h-2 bg-orange-600 rounded-full mt-2"></span>
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Seasonal Trends */}
                  {aiInsights.seasonal_trends && (
                    <div>
                      <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                        <span className="w-8 h-8 bg-pink-600 text-white rounded-full flex items-center justify-center text-sm font-bold">5</span>
                        Seasonal Trends
                      </h3>
                      <div className="bg-pink-50 p-4 rounded-lg border-2 border-pink-200">
                        <p>{aiInsights.seasonal_trends}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}