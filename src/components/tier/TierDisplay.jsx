import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, TrendingUp, Star, Zap } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function TierDisplay({ userEmail, userType, vendorId }) {
  const isVendor = userType === "vendor";

  const { data: tierData, isLoading } = useQuery({
    queryKey: ['tier', userEmail, vendorId, userType],
    queryFn: async () => {
      if (isVendor && vendorId) {
        const tiers = await base44.entities.VendorTier.filter({ vendor_id: vendorId });
        return tiers.length > 0 ? tiers[0] : null;
      } else if (!isVendor && userEmail) {
        const tiers = await base44.entities.ClientTier.filter({ client_email: userEmail });
        return tiers.length > 0 ? tiers[0] : null;
      }
      return null;
    },
    enabled: !!(isVendor ? vendorId : userEmail),
    staleTime: 60000,
  });

  if (isLoading || !tierData) {
    return null;
  }

  // Vendor tier thresholds
  const vendorTiers = [
    { name: 'bronze', min: 0, max: 30, color: 'bg-orange-700', discount: 0 },
    { name: 'silver', min: 31, max: 80, color: 'bg-gray-400', discount: 1.0 },
    { name: 'gold', min: 81, max: Infinity, color: 'bg-yellow-500', discount: 2.5 }
  ];

  // Client tier thresholds
  const clientTiers = [
    { name: 'starter', min: 0, max: 15, color: 'bg-blue-500', discount: 0 },
    { name: 'regular', min: 16, max: 45, color: 'bg-purple-500', discount: 1 },
    { name: 'vip', min: 46, max: Infinity, color: 'bg-pink-500', discount: 3 }
  ];

  const tiers = isVendor ? vendorTiers : clientTiers;
  const currentTier = tiers.find(t => t.name === tierData.tier_level);
  const currentCount = isVendor ? tierData.completed_bookings : tierData.total_bookings;
  const nextTier = tiers[tiers.indexOf(currentTier) + 1];
  
  const progressToNext = nextTier 
    ? Math.min(100, ((currentCount - currentTier.min) / (nextTier.min - currentTier.min)) * 100)
    : 100;

  return (
    <Card className="border-2 border-black">
      <CardHeader className={`${currentTier.color} text-white`}>
        <CardTitle className="flex items-center gap-2 font-black">
          <Award className="w-6 h-6" />
          {currentTier.name.toUpperCase()} {isVendor ? 'Vendor' : 'Member'}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Current Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="text-2xl font-black text-black">{currentCount}</div>
              <div className="text-xs text-gray-600">Completed Bookings</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-3 border-2 border-green-300">
              <div className="text-2xl font-black text-green-700">
                {isVendor 
                  ? `${tierData.fee_discount_percent}%`
                  : `${tierData.discount_percent}%`}
              </div>
              <div className="text-xs text-green-700 font-medium">
                {isVendor ? 'Fee Discount' : 'Booking Discount'}
              </div>
            </div>
          </div>

          {/* Progress to Next Tier */}
          {nextTier && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">Progress to {nextTier.name.toUpperCase()}</span>
                <Badge variant="outline" className="font-bold">
                  {currentCount} / {nextTier.min}
                </Badge>
              </div>
              <Progress value={progressToNext} className="h-2" />
              <p className="text-xs text-gray-600">
                {nextTier.min - currentCount} more {nextTier.min - currentCount === 1 ? 'booking' : 'bookings'} to unlock{' '}
                <strong>{isVendor ? `${nextTier.discount}% fee discount` : `${nextTier.discount}% booking discount`}</strong>
              </p>
            </div>
          )}

          {/* Current Benefits */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-bold text-blue-900">Current Benefits:</span>
            </div>
            <ul className="text-xs text-blue-800 space-y-1">
              {currentTier.discount > 0 && (
                <li className="flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  {isVendor 
                    ? `${currentTier.discount}% lower platform fees on all bookings`
                    : `${currentTier.discount}% discount on all bookings`}
                </li>
              )}
              {isVendor && tierData.bookings_this_month >= 10 && (
                <li className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Extra 1.5% volume discount active (10+ bookings this month)
                </li>
              )}
              {!isVendor && tierData.tier_level === 'vip' && (
                <li className="flex items-center gap-1">
                  <Award className="w-3 h-3" />
                  VIP priority support
                </li>
              )}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}