import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, TrendingUp, Zap, Gift, Users, Star } from "lucide-react";

export default function VendorRewardsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-black rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Award className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-black text-black mb-4">Vendor Rewards Program</h1>
          <p className="text-xl text-gray-600 font-medium">Grow your business, reduce fees, and earn more</p>
        </div>

        {/* Tier System */}
        <Card className="border-4 border-black mb-8">
          <CardHeader className="bg-black text-white">
            <CardTitle className="text-3xl font-black flex items-center gap-3">
              <TrendingUp className="w-8 h-8" />
              Vendor Tier System
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <p className="text-lg text-gray-700 mb-8 leading-relaxed">
              Complete more bookings to unlock lower platform fees and exclusive benefits. Your tier is calculated based on total completed and paid bookings.
            </p>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Bronze */}
              <Card className="border-2 border-orange-700">
                <CardHeader className="bg-orange-700 text-white">
                  <CardTitle className="font-black flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    BRONZE
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div>
                    <Badge className="bg-orange-100 text-orange-800 font-bold mb-3">0-30 bookings</Badge>
                    <p className="text-3xl font-black text-orange-700">0% discount</p>
                  </div>
                  <div className="space-y-2 text-sm text-gray-700">
                    <p className="font-bold">✓ Benefits:</p>
                    <ul className="space-y-1">
                      <li>• Full platform access</li>
                      <li>• Vendor profile & portfolio</li>
                      <li>• Direct client messaging</li>
                      <li>• Booking management</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Silver */}
              <Card className="border-2 border-gray-400">
                <CardHeader className="bg-gray-400 text-white">
                  <CardTitle className="font-black flex items-center gap-2">
                    <Star className="w-5 h-5" />
                    SILVER
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div>
                    <Badge className="bg-gray-100 text-gray-800 font-bold mb-3">31-80 bookings</Badge>
                    <p className="text-3xl font-black text-gray-600">1.0% fee discount</p>
                  </div>
                  <div className="space-y-2 text-sm text-gray-700">
                    <p className="font-bold">✓ All Bronze benefits, plus:</p>
                    <ul className="space-y-1">
                      <li>• 1% platform fee discount</li>
                      <li>• Priority support</li>
                      <li>• Featured in search results</li>
                      <li>• Analytics dashboard</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Gold */}
              <Card className="border-2 border-yellow-500">
                <CardHeader className="bg-yellow-500 text-white">
                  <CardTitle className="font-black flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    GOLD
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div>
                    <Badge className="bg-yellow-100 text-yellow-800 font-bold mb-3">81+ bookings</Badge>
                    <p className="text-3xl font-black text-yellow-600">2.5% fee discount</p>
                  </div>
                  <div className="space-y-2 text-sm text-gray-700">
                    <p className="font-bold">✓ All Silver benefits, plus:</p>
                    <ul className="space-y-1">
                      <li>• 2.5% platform fee discount</li>
                      <li>• Gold badge on profile</li>
                      <li>• Top search placement</li>
                      <li>• Dedicated account manager</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Volume Bonus */}
        <Card className="border-4 border-purple-600 mb-8">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
            <CardTitle className="text-3xl font-black flex items-center gap-3">
              <Zap className="w-8 h-8" />
              Volume Bonus
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-purple-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-12 h-12 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-2xl font-black text-purple-900 mb-3">
                  Extra 1.5% Fee Discount
                </p>
                <p className="text-lg text-gray-700 leading-relaxed">
                  Complete <strong>10 or more bookings in a single month</strong> and earn an additional 1.5% platform fee discount that <strong>stacks with your tier discount</strong>!
                </p>
                <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4 mt-4">
                  <p className="text-sm text-purple-900 font-bold">
                    Example: Gold vendor (2.5%) + Volume bonus (1.5%) = <span className="text-2xl">4% total discount</span>
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Referral Program */}
        <Card className="border-4 border-green-600">
          <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
            <CardTitle className="text-3xl font-black flex items-center gap-3">
              <Gift className="w-8 h-8" />
              Referral Program
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-6">
              <div>
                <p className="text-2xl font-black text-green-900 mb-3">
                  Earn Commission-Free Bookings
                </p>
                <p className="text-lg text-gray-700 leading-relaxed">
                  Invite other vendors to join EVNT. When they complete their first booking, <strong>you both receive 1 booking with 0% commission</strong>!
                </p>
              </div>

              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
                <p className="font-black text-green-900 mb-4 text-xl flex items-center gap-2">
                  <Users className="w-6 h-6" />
                  How It Works
                </p>
                <ol className="space-y-3 text-base text-gray-700">
                  <li className="flex items-start gap-3">
                    <span className="font-black text-green-700 text-lg">1.</span>
                    <span className="font-medium">Share your unique referral link from your profile</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="font-black text-green-700 text-lg">2.</span>
                    <span className="font-medium">Your friend signs up as a vendor and gets approved</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="font-black text-green-700 text-lg">3.</span>
                    <span className="font-medium">They complete their first paid booking</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="font-black text-green-700 text-lg">4.</span>
                    <span className="font-medium">You both get 1 booking with 0% platform fee!</span>
                  </li>
                </ol>
              </div>

              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl p-6">
                <p className="text-lg font-black text-yellow-900 mb-2">🚀 Unlimited Earning Potential</p>
                <p className="text-gray-700 font-medium">
                  No limits! Refer 5 vendors, get 5 commission-free bookings. Refer 100, get 100 free bookings. Stack them up and watch your profits grow!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}