import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gift, TrendingUp, CheckCircle, Clock, Users } from "lucide-react";

export default function ReferralTracker({ userEmail, userType }) {
  const isVendor = userType === "vendor";

  const { data: referrals = [], isLoading } = useQuery({
    queryKey: ['referrals', userEmail],
    queryFn: async () => {
      return await base44.entities.ReferralReward.filter({ 
        referrer_email: userEmail 
      });
    },
    enabled: !!userEmail,
    staleTime: 60000,
  });

  const pendingCount = referrals.filter(r => r.status === 'pending').length;
  const earnedCount = referrals.filter(r => r.status === 'earned').length;
  const totalRewards = earnedCount;

  if (isLoading) {
    return null;
  }

  if (referrals.length === 0) {
    return null;
  }

  return (
    <Card className="border-2 border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50">
      <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <CardTitle className="flex items-center gap-2 font-black">
          <Gift className="w-6 h-6" />
          Your Referral Stats
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="text-3xl font-black text-purple-600">{referrals.length}</div>
            <div className="text-sm text-gray-600 font-medium flex items-center justify-center gap-1">
              <Users className="w-3 h-3" />
              Total
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-black text-yellow-600">{pendingCount}</div>
            <div className="text-sm text-gray-600 font-medium flex items-center justify-center gap-1">
              <Clock className="w-3 h-3" />
              Pending
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-black text-green-600">{earnedCount}</div>
            <div className="text-sm text-gray-600 font-medium flex items-center justify-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Earned
            </div>
          </div>
        </div>

        <div className="bg-white border-2 border-purple-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-gray-700">Total Rewards Earned:</span>
            <Badge className="bg-green-500 text-white text-lg px-3 py-1 font-black">
              {isVendor 
                ? `${totalRewards} Free ${totalRewards === 1 ? 'Booking' : 'Bookings'}`
                : `$${totalRewards * 25}`}
            </Badge>
          </div>
          {pendingCount > 0 && (
            <p className="text-xs text-gray-600 mt-2">
              💡 {pendingCount} {pendingCount === 1 ? 'referral is' : 'referrals are'} waiting to complete their first booking
            </p>
          )}
        </div>

        {earnedCount > 0 && (
          <div className="mt-4 flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">
            <TrendingUp className="w-4 h-4" />
            <span className="font-medium">
              {isVendor 
                ? `Keep referring! Each referral = 1 commission-free booking.`
                : `Keep sharing! You've earned $${earnedCount * 25} in credits so far.`}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}