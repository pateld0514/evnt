import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Calendar, MessageSquare, Star } from "lucide-react";

export default function QuickStats({ bookings, messages, reviews }) {
  const pendingBookings = bookings.filter(b => b.status === 'pending').length;
  const unreadMessages = messages.filter(m => !m.read).length;
  const avgRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "N/A";
  const confirmedBookings = bookings.filter(b => 
    b.status === 'confirmed' || b.status === 'in_progress'
  ).length;

  const stats = [
    { label: "Pending Requests", value: pendingBookings, icon: Calendar, color: "text-yellow-600", bg: "bg-yellow-50" },
    { label: "Unread Messages", value: unreadMessages, icon: MessageSquare, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Active Bookings", value: confirmedBookings, icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
    { label: "Avg Rating", value: avgRating, icon: Star, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <Card key={idx} className="border-2 border-gray-200">
            <CardContent className={`p-4 ${stat.bg}`}>
              <div className="flex items-center justify-between mb-2">
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <p className="text-2xl font-black">{stat.value}</p>
              <p className="text-xs text-gray-600 font-medium">{stat.label}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}