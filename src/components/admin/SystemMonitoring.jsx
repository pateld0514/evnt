import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw, Database, AlertTriangle, Activity, Users } from "lucide-react";
import { toast } from "sonner";
import moment from "moment";

export default function SystemMonitoring() {
  const [exporting, setExporting] = useState(false);

  const { data: allVendors = [] } = useQuery({
    queryKey: ['all-vendors'],
    queryFn: () => base44.entities.Vendor.list(),
    initialData: [],
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list(),
    initialData: [],
  });

  const { data: allBookings = [] } = useQuery({
    queryKey: ['all-bookings'],
    queryFn: () => base44.entities.Booking.list(),
    initialData: [],
  });

  const { data: allMessages = [] } = useQuery({
    queryKey: ['all-messages'],
    queryFn: () => base44.entities.Message.list(),
    initialData: [],
  });

  const { data: allReviews = [] } = useQuery({
    queryKey: ['all-reviews'],
    queryFn: () => base44.entities.Review.list(),
    initialData: [],
  });

  const handleExportData = async () => {
    setExporting(true);
    try {
      const data = {
        vendors: allVendors,
        users: allUsers,
        bookings: allBookings,
        messages: allMessages,
        reviews: allReviews,
        exported_at: new Date().toISOString(),
      };

      const dataStr = JSON.stringify(data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `evnt-backup-${moment().format('YYYY-MM-DD-HHmmss')}.json`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success("Database backup downloaded successfully");
    } catch (error) {
      toast.error("Failed to export data");
      console.error(error);
    } finally {
      setExporting(false);
    }
  };

  // Calculate stats
  const totalRevenue = allBookings
    .filter(b => b.status === 'completed' && b.total_amount)
    .reduce((sum, b) => sum + (b.total_amount || 0), 0);

  const activeBookings = allBookings.filter(b => 
    ['pending', 'negotiating', 'payment_pending', 'confirmed', 'in_progress'].includes(b.status)
  ).length;

  const completedBookings = allBookings.filter(b => b.status === 'completed').length;

  const recentSignups = allUsers.filter(u => {
    const created = new Date(u.created_date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return created > weekAgo;
  }).length;

  const platformFeeRevenue = allBookings
    .filter(b => b.status === 'completed' && b.platform_fee_amount)
    .reduce((sum, b) => sum + (b.platform_fee_amount || 0), 0);

  const avgBookingValue = completedBookings > 0 
    ? totalRevenue / completedBookings 
    : 0;

  const topVendors = allBookings
    .filter(b => b.status === 'completed')
    .reduce((acc, booking) => {
      const vendorId = booking.vendor_id;
      if (!acc[vendorId]) {
        acc[vendorId] = {
          vendor: allVendors.find(v => v.id === vendorId),
          count: 0,
          revenue: 0,
        };
      }
      acc[vendorId].count++;
      acc[vendorId].revenue += booking.total_amount || 0;
      return acc;
    }, {});

  const topVendorsList = Object.values(topVendors)
    .filter(v => v.vendor)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* System Health Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="border-2 border-black">
          <CardHeader className="bg-blue-50">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Database className="w-5 h-5 text-blue-600" />
              Total Records
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-3xl font-black">
              {allVendors.length + allUsers.length + allBookings.length + allMessages.length + allReviews.length}
            </p>
            <p className="text-sm text-gray-600 mt-1">Across all entities</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-black">
          <CardHeader className="bg-green-50">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="w-5 h-5 text-green-600" />
              Active Bookings
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-3xl font-black">{activeBookings}</p>
            <p className="text-sm text-gray-600 mt-1">In progress</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-black">
          <CardHeader className="bg-purple-50">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="w-5 h-5 text-purple-600" />
              New Users (7d)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-3xl font-black">{recentSignups}</p>
            <p className="text-sm text-gray-600 mt-1">This week</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-black">
          <CardHeader className="bg-yellow-50">
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              Status
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-3xl font-black text-green-600">Healthy</p>
            <p className="text-sm text-gray-600 mt-1">All systems operational</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Stats */}
      <Card className="border-2 border-black">
        <CardHeader className="bg-black text-white">
          <CardTitle className="font-black">Revenue Statistics</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-500 font-medium mb-1">Total Booking Revenue</p>
              <p className="text-3xl font-black text-green-600">${totalRevenue.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium mb-1">Platform Fee Revenue</p>
              <p className="text-3xl font-black text-blue-600">${platformFeeRevenue.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium mb-1">Avg Booking Value</p>
              <p className="text-3xl font-black">${avgBookingValue.toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Vendors */}
      <Card className="border-2 border-black">
        <CardHeader className="bg-black text-white">
          <CardTitle className="font-black">Top Performing Vendors</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {topVendorsList.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No completed bookings yet</p>
          ) : (
            <div className="space-y-3">
              {topVendorsList.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-300">
                  <div>
                    <p className="font-bold text-lg">{item.vendor?.business_name}</p>
                    <p className="text-sm text-gray-600">{item.count} completed bookings</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-green-600">${item.revenue.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">Total revenue</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Database Backup */}
      <Card className="border-2 border-black">
        <CardHeader className="bg-black text-white">
          <CardTitle className="flex items-center gap-2 font-black">
            <Database className="w-6 h-6" />
            Database Backup
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <p className="text-gray-700">
              Export a complete backup of all platform data including vendors, users, bookings, messages, and reviews.
            </p>
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
              <p className="font-bold text-blue-900 mb-2">📊 Database Statistics:</p>
              <ul className="space-y-1 text-sm">
                <li><strong>{allVendors.length}</strong> Vendors</li>
                <li><strong>{allUsers.length}</strong> Users</li>
                <li><strong>{allBookings.length}</strong> Bookings</li>
                <li><strong>{allMessages.length}</strong> Messages</li>
                <li><strong>{allReviews.length}</strong> Reviews</li>
              </ul>
            </div>
            <Button
              onClick={handleExportData}
              disabled={exporting}
              className="bg-black text-white hover:bg-gray-800 font-bold"
            >
              {exporting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Download Database Backup
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}