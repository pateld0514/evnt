import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Heart, Calendar, TrendingUp, DollarSign, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function VendorAnalytics({ vendor, views, swipes, bookings }) {
  const rightSwipes = swipes.filter(s => s.direction === "right").length;
  const leftSwipes = swipes.filter(s => s.direction === "left").length;
  const totalSwipes = swipes.length;
  
  const acceptedBookings = bookings.filter(b => b.status === "accepted" || b.status === "completed").length;
  const conversionRate = rightSwipes > 0 ? ((acceptedBookings / rightSwipes) * 100).toFixed(1) : 0;
  
  const totalRevenue = bookings
    .filter(b => b.status === "accepted" || b.status === "completed")
    .reduce((sum, b) => sum + (b.budget || 0), 0);
  
  const avgBudget = acceptedBookings > 0 ? (totalRevenue / acceptedBookings).toFixed(0) : 0;

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-2 border-black">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-600" />
              Profile Views
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black">{views.length}</p>
            <p className="text-xs text-gray-500 mt-1">Unique visitors</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-black">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Heart className="w-4 h-4 text-pink-600" />
              Likes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black">{rightSwipes}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {leftSwipes} passes
              </Badge>
              {totalSwipes > 0 && (
                <span className="text-xs text-gray-500">
                  {((rightSwipes / totalSwipes) * 100).toFixed(0)}% like rate
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-black">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4 text-green-600" />
              Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black">{acceptedBookings}</p>
            <p className="text-xs text-gray-500 mt-1">
              {bookings.filter(b => b.status === "pending").length} pending
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-black">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              Conversion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black">{conversionRate}%</p>
            <p className="text-xs text-gray-500 mt-1">Likes to bookings</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-2 border-black">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Revenue Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Average Client Budget</p>
              <p className="text-3xl font-black">${Number(avgBudget).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Potential Revenue</p>
              <p className="text-3xl font-black">${totalRevenue.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-black">
        <CardHeader>
          <CardTitle>Performance Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Profile Engagement</span>
                <span className="text-sm text-gray-500">{views.length} views</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600"
                  style={{ width: `${Math.min((views.length / 100) * 100, 100)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Client Interest</span>
                <span className="text-sm text-gray-500">{rightSwipes} likes</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-pink-600"
                  style={{ width: `${totalSwipes > 0 ? (rightSwipes / totalSwipes) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Booking Success</span>
                <span className="text-sm text-gray-500">{acceptedBookings} confirmed</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-600"
                  style={{ width: `${conversionRate}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}