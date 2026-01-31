import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Gift, Star, Heart, Award, DollarSign, CheckCircle } from "lucide-react";

export default function ClientRewardsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-black rounded-full mb-4">
            <Heart className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-black mb-4">
            Client Rewards Program
          </h1>
          <p className="text-xl text-gray-600">
            Save more as you plan more events with EVNT
          </p>
        </div>

        {/* How It Works */}
        <Card className="border-4 border-black mb-8">
          <CardHeader className="bg-black text-white">
            <CardTitle className="text-2xl font-black">How Rewards Work</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-gray-700 leading-relaxed mb-6">
              At EVNT, we believe in rewarding loyal clients who trust us to make their events amazing. 
              The more events you plan with us, the more you save.
            </p>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2">Complete Bookings</h3>
                  <p className="text-gray-600">
                    Every successful event you book through EVNT counts toward your tier level.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2">Unlock Savings</h3>
                  <p className="text-gray-600">
                    As you level up, you'll receive discounts on platform fees for all future bookings.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Star className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2">Enjoy Exclusive Perks</h3>
                  <p className="text-gray-600">
                    Get priority support, early access to top vendors, and special promotional offers.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Client Tiers */}
        <Card className="border-4 border-black mb-8">
          <CardHeader className="bg-black text-white">
            <CardTitle className="text-2xl font-black">Client Tier Levels</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div className="bg-gray-100 border-2 border-gray-300 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Award className="w-8 h-8 text-gray-500" />
                  <h3 className="text-xl font-black">Starter</h3>
                  <span className="text-sm text-gray-600">(0-2 completed bookings)</span>
                </div>
                <ul className="space-y-2 text-gray-700">
                  <li>• Access to all vendors</li>
                  <li>• Standard booking features</li>
                  <li>• Email support</li>
                </ul>
              </div>

              <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Award className="w-8 h-8 text-blue-600" />
                  <h3 className="text-xl font-black">Regular</h3>
                  <span className="text-sm text-gray-600">(3-9 completed bookings)</span>
                </div>
                <ul className="space-y-2 text-gray-700">
                  <li>• <strong>1% discount</strong> on platform fees</li>
                  <li>• Priority email support</li>
                  <li>• Exclusive vendor recommendations</li>
                  <li>• Early access to new features</li>
                </ul>
              </div>

              <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Award className="w-8 h-8 text-purple-600" />
                  <h3 className="text-xl font-black">VIP</h3>
                  <span className="text-sm text-gray-600">(10+ completed bookings)</span>
                </div>
                <ul className="space-y-2 text-gray-700">
                  <li>• <strong>2% discount</strong> on platform fees</li>
                  <li>• Dedicated account manager</li>
                  <li>• VIP badge on profile</li>
                  <li>• First pick on premium vendors</li>
                  <li>• Special seasonal promotions</li>
                  <li>• Priority customer support</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Perks */}
        <Card className="border-4 border-black mb-8">
          <CardHeader className="bg-black text-white">
            <CardTitle className="text-2xl font-black">Additional Perks</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Gift className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold mb-1">Referral Bonuses</h4>
                    <p className="text-sm text-gray-600">
                      Earn $25 credit for every friend you refer who books their first event
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Star className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold mb-1">Review Rewards</h4>
                    <p className="text-sm text-gray-600">
                      Leave detailed reviews to help other clients and earn bonus credits
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <DollarSign className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold mb-1">Loyalty Discounts</h4>
                    <p className="text-sm text-gray-600">
                      The more you book, the more you save - discounts stack with tier benefits
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Heart className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold mb-1">Birthday Bonus</h4>
                    <p className="text-sm text-gray-600">
                      Get a special discount code on your birthday month to celebrate with EVNT
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-black to-gray-800 rounded-lg p-8 text-center text-white">
          <h2 className="text-3xl font-black mb-4">Start Planning & Start Saving</h2>
          <p className="text-lg text-gray-300 mb-6">
            Join EVNT today and unlock rewards with every event you plan
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/Swipe" 
              className="inline-block bg-white text-black px-8 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors"
            >
              Browse Vendors
            </a>
            <a 
              href="/About" 
              className="inline-block border-2 border-white text-white px-8 py-3 rounded-lg font-bold hover:bg-white hover:text-black transition-colors"
            >
              Learn More About EVNT
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}