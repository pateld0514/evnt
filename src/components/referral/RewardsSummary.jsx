import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Gift, Zap, Clock } from "lucide-react";

export default function RewardsSummary({ user, userType }) {
  const isVendor = userType === "vendor";

  const { data: referrals = [] } = useQuery({
    queryKey: ["referrals-summary", user?.email],
    queryFn: () => base44.entities.ReferralReward.filter({ referrer_email: user.email }),
    enabled: !!user?.email,
    staleTime: 30000,
  });

  const referralCredit = user?.referral_credit || 0;
  const commissionFreeBookings = user?.commission_free_bookings || 0;
  const pendingReferrals = referrals.filter(r => r.status === "pending").length;
  const earnedReferrals = referrals.filter(r => r.status === "earned" || r.status === "paid").length;

  // No rewards at all to show
  if (!isVendor && referralCredit === 0 && referrals.length === 0) return null;
  if (isVendor && commissionFreeBookings === 0 && referrals.length === 0) return null;

  return (
    <Card className="border-2 border-green-500 bg-green-50">
      <CardHeader className="bg-green-600 text-white py-4">
        <CardTitle className="flex items-center gap-2 font-black text-lg">
          <Gift className="w-5 h-5" />
          Your Available Rewards
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 space-y-4">
        {/* Active Rewards */}
        {!isVendor && referralCredit > 0 && (
          <div className="flex items-center justify-between bg-white border-2 border-green-300 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-black text-gray-900">Referral Credit</p>
                <p className="text-xs text-gray-600">Automatically applied to your next booking</p>
              </div>
            </div>
            <Badge className="bg-green-600 text-white text-lg px-4 py-2 font-black">
              ${referralCredit.toFixed(2)}
            </Badge>
          </div>
        )}

        {isVendor && commissionFreeBookings > 0 && (
          <div className="flex items-center justify-between bg-white border-2 border-green-300 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Zap className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-black text-gray-900">Commission-Free Bookings</p>
                <p className="text-xs text-gray-600">Applied automatically on your next completed booking</p>
              </div>
            </div>
            <Badge className="bg-green-600 text-white text-lg px-4 py-2 font-black">
              {commissionFreeBookings}x
            </Badge>
          </div>
        )}

        {/* Pending Referrals */}
        {pendingReferrals > 0 && (
          <div className="flex items-center justify-between bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="font-black text-gray-900">Pending Referrals</p>
                <p className="text-xs text-gray-600">Waiting for referrals to complete first booking</p>
              </div>
            </div>
            <Badge className="bg-yellow-500 text-white px-3 py-1 font-black">
              {pendingReferrals} waiting
            </Badge>
          </div>
        )}

        {/* Lifetime earned */}
        {earnedReferrals > 0 && (
          <p className="text-xs text-green-700 font-medium text-center">
            🎉 {earnedReferrals} referral reward{earnedReferrals > 1 ? 's' : ''} earned lifetime
            {!isVendor ? ` — $${earnedReferrals * 25} total` : ''}
          </p>
        )}

        {/* No active rewards but has referrals */}
        {isVendor && commissionFreeBookings === 0 && pendingReferrals > 0 && (
          <p className="text-sm text-gray-600 text-center">
            Rewards unlock when your referrals complete their first booking.
          </p>
        )}
        {!isVendor && referralCredit === 0 && pendingReferrals > 0 && (
          <p className="text-sm text-gray-600 text-center">
            Your $25 credit will appear here once your referral completes their first booking.
          </p>
        )}
      </CardContent>
    </Card>
  );
}