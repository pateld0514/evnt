import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Gift, Star, TrendingUp, Award, DollarSign } from "lucide-react";

export default function VendorRewardsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-black rounded-full mb-4">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-black mb-4">
            Vendor Rewards Program
          </h1>
          <p className="text-xl text-gray-600">
            Get rewarded for delivering exceptional experiences
          </p>
        </div>

        {/* How It Works */}
        <Card className="border-4 border-black mb-8">
          <CardHeader className="bg-black text-white">
            <CardTitle className="text-2xl font-black">How Our Rewards System Works</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-gray-700 leading-relaxed mb-6">
              At EVNT, we believe in rewarding vendors who consistently deliver outstanding service. 
              Our rewards program is designed to recognize your hard work, build your reputation, and 
              increase your booking potential on our platform.
            </p>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2">Complete Bookings Successfully</h3>
                  <p className="text-gray-600">
                    Every booking you complete successfully earns you reward points and builds your track record.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Star className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2">Receive 5-Star Reviews</h3>
                  <p className="text-gray-600">
                    Client reviews boost your profile visibility and help you stand out to potential customers.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2">Level Up Your Profile</h3>
                  <p className="text-gray-600">
                    As you complete more bookings, you earn badges and priority placement in search results.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reward Tiers */}
        <Card className="border-4 border-black mb-8">
          <CardHeader className="bg-black text-white">
            <CardTitle className="text-2xl font-black">Vendor Tier Levels</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div className="bg-gray-100 border-2 border-gray-300 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Award className="w-8 h-8 text-gray-500" />
                  <h3 className="text-xl font-black">Bronze Tier</h3>
                  <span className="text-sm text-gray-600">(0-5 completed bookings)</span>
                </div>
                <ul className="space-y-2 text-gray-700">
                  <li>• Standard profile visibility</li>
                  <li>• Access to booking requests</li>
                  <li>• Basic analytics dashboard</li>
                </ul>
              </div>

              <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Award className="w-8 h-8 text-blue-600" />
                  <h3 className="text-xl font-black">Silver Tier</h3>
                  <span className="text-sm text-gray-600">(6-15 completed bookings)</span>
                </div>
                <ul className="space-y-2 text-gray-700">
                  <li>• <strong>+20% higher placement</strong> in search results</li>
                  <li>• "Experienced Vendor" badge on profile</li>
                  <li>• Priority email support</li>
                  <li>• Advanced analytics and insights</li>
                </ul>
              </div>

              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Award className="w-8 h-8 text-yellow-600" />
                  <h3 className="text-xl font-black">Gold Tier</h3>
                  <span className="text-sm text-gray-600">(16+ completed bookings)</span>
                </div>
                <ul className="space-y-2 text-gray-700">
                  <li>• <strong>+50% higher placement</strong> in search results</li>
                  <li>• "Top Rated Vendor" badge on profile</li>
                  <li>• Featured in "Recommended Vendors" section</li>
                  <li>• <strong>Reduced platform fees</strong> on future bookings</li>
                  <li>• Dedicated account manager</li>
                  <li>• Early access to new features</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Benefits */}
        <Card className="border-4 border-black mb-8">
          <CardHeader className="bg-black text-white">
            <CardTitle className="text-2xl font-black">Additional Perks & Bonuses</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Gift className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold mb-1">Referral Bonuses</h4>
                    <p className="text-sm text-gray-600">
                      Earn $50 credit for every vendor you refer who completes their first booking
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Star className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold mb-1">Review Incentives</h4>
                    <p className="text-sm text-gray-600">
                      Maintain a 4.5+ star rating to unlock exclusive promotional features
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <DollarSign className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold mb-1">Volume Discounts</h4>
                    <p className="text-sm text-gray-600">
                      Complete 5+ bookings per month to receive a 2% reduction on platform fees
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <TrendingUp className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold mb-1">Marketing Support</h4>
                    <p className="text-sm text-gray-600">
                      Top performers featured in EVNT's social media and email campaigns
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-black to-gray-800 rounded-lg p-8 text-center text-white">
          <h2 className="text-3xl font-black mb-4">Ready to Start Earning Rewards?</h2>
          <p className="text-lg text-gray-300 mb-6">
            Join EVNT today and start building your reputation while growing your business
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/Onboarding" 
              className="inline-block bg-white text-black px-8 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors"
            >
              Become a Vendor
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

// Import CheckCircle for the icon
import { CheckCircle } from "lucide-react";