import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Heart, Calendar, TrendingUp, DollarSign, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Normalize event type to Title Case (e.g. "wedding" → "Wedding", "corporate event" → "Corporate Event")
function toTitleCase(str) {
  if (!str) return "Unknown";
  return str.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase());
}

// Format currency with commas, no decimals
function formatCurrency(value) {
  const num = Number(value) || 0;
  return "$" + num.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

// Pluralize helper: pluralize(5, "Booking") → "5 Bookings"
function pluralize(count, word) {
  const n = Number(count) || 0;
  return `${n} ${n === 1 ? word : word + "s"}`;
}

export default function VendorAnalytics({ vendor, views = [], swipes = [], bookings = [] }) {
  const rightSwipes = swipes.filter(s => s.direction === "right").length;
  const leftSwipes = swipes.filter(s => s.direction === "left").length;
  const totalSwipes = swipes.length;

  // Like Rate = Likes / (Likes + Passes) * 100  — guards against divide-by-zero
  const likeRate = totalSwipes > 0 ? ((rightSwipes / totalSwipes) * 100).toFixed(0) : 0;

  const acceptedBookings = bookings.filter(b =>
    b.status === "confirmed" || b.status === "completed" || b.status === "in_progress"
  ).length;

  const pendingCount = bookings.filter(b => b.status === "pending").length;

  // Conversion Rate = Bookings / Likes * 100  — guards against divide-by-zero
  const conversionRate = rightSwipes > 0 ? ((acceptedBookings / rightSwipes) * 100).toFixed(1) : 0;

  // Revenue from accepted/completed bookings
  const revenueBookings = bookings.filter(b =>
    b.status === "confirmed" || b.status === "completed" || b.status === "in_progress"
  );
  const totalRevenue = revenueBookings.reduce((sum, b) => sum + (b.agreed_price || b.budget || 0), 0);

  // Average Booking Value = Total Revenue / Total Bookings  — guards against divide-by-zero
  const avgBookingValue = acceptedBookings > 0 ? totalRevenue / acceptedBookings : 0;

  // Total Potential Revenue = Average Booking Value * Total Bookings (all, not just accepted)
  const totalPotentialRevenue = avgBookingValue * bookings.length;

  // Unique views based on viewer_email if available, else all records
  const uniqueViewerEmails = new Set(views.map(v => v.viewer_email).filter(Boolean));
  const uniqueVisitors = uniqueViewerEmails.size > 0 ? uniqueViewerEmails.size : views.length;

  // Profile engagement bar: cap at views.length vs. a reasonable max (use max of views + swipes as denominator)
  const engagementDenominator = Math.max(views.length, 1);

  return (
    <div className="space-y-6">
      {/* Top Stats Grid */}
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
            <p className="text-xs text-gray-500 mt-1">
              {uniqueVisitors} unique {uniqueVisitors === 1 ? "visitor" : "visitors"}
            </p>
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
                {pluralize(leftSwipes, "Pass")}
              </Badge>
              {totalSwipes > 0 && (
                <span className="text-xs text-gray-500">{likeRate}% like rate</span>
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
              {pluralize(pendingCount, "pending")}
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

      {/* Revenue Insights */}
      <Card className="border-2 border-black">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Revenue Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Average Booking Value</p>
              <p className="text-3xl font-black">{formatCurrency(avgBookingValue)}</p>
              <p className="text-xs text-gray-400 mt-1">Per confirmed booking</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Potential Revenue</p>
              <p className="text-3xl font-black">{formatCurrency(totalPotentialRevenue)}</p>
              <p className="text-xs text-gray-400 mt-1">Avg × all {bookings.length} {bookings.length === 1 ? "booking" : "bookings"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Confirmed Revenue</p>
              <p className="text-3xl font-black">{formatCurrency(totalRevenue)}</p>
              <p className="text-xs text-gray-400 mt-1">From {pluralize(acceptedBookings, "booking")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Breakdown */}
      <Card className="border-2 border-black">
        <CardHeader>
          <CardTitle>Performance Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Profile Engagement</span>
                <span className="text-sm text-gray-500">{pluralize(views.length, "view")}</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all"
                  style={{ width: `${Math.min((views.length / Math.max(views.length, 50)) * 100, 100)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Client Interest</span>
                <span className="text-sm text-gray-500">{pluralize(rightSwipes, "like")} · {likeRate}% like rate</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-pink-600 transition-all"
                  style={{ width: `${totalSwipes > 0 ? (rightSwipes / totalSwipes) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Booking Success</span>
                <span className="text-sm text-gray-500">{pluralize(acceptedBookings, "booking")} · {conversionRate}% conversion</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-600 transition-all"
                  style={{ width: `${Math.min(Number(conversionRate), 100)}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}