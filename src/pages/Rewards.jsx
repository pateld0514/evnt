import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Gift, Star, TrendingUp, Award, DollarSign, CheckCircle, Heart } from "lucide-react";

export default function RewardsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-black rounded-full mb-4">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-black mb-4">
            EVNT Rewards Program
          </h1>
          <p className="text-xl text-gray-600">
            Everyone wins when you use EVNT - clients save more, vendors earn more
          </p>
        </div>

        <Tabs defaultValue="vendors" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="vendors" className="text-lg font-bold">For Vendors</TabsTrigger>
            <TabsTrigger value="clients" className="text-lg font-bold">For Clients</TabsTrigger>
          </TabsList>

          {/* Vendor Rewards */}
          <TabsContent value="vendors">
            <Card className="border-4 border-black mb-8">
              <CardHeader className="bg-black text-white">
                <CardTitle className="text-2xl font-black">How Vendor Rewards Work</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-gray-700 leading-relaxed mb-6">
                  Complete bookings, earn great reviews, and watch your benefits grow. 
                  The more you deliver, the more you save on fees.
                </p>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="flex flex-col items-center text-center gap-2">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <h3 className="font-bold">Complete Bookings</h3>
                    <p className="text-sm text-gray-600">Every successful event counts</p>
                  </div>
                  <div className="flex flex-col items-center text-center gap-2">
                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                      <Star className="w-6 h-6 text-yellow-600" />
                    </div>
                    <h3 className="font-bold">Get 5-Star Reviews</h3>
                    <p className="text-sm text-gray-600">Boost your visibility</p>
                  </div>
                  <div className="flex flex-col items-center text-center gap-2">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="font-bold">Level Up</h3>
                    <p className="text-sm text-gray-600">Unlock better placement & fees</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-4 border-black mb-8">
              <CardHeader className="bg-black text-white">
                <CardTitle className="text-2xl font-black">Vendor Tier Levels</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  <div className="bg-gray-100 border-2 border-gray-300 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <Award className="w-8 h-8 text-gray-500" />
                      <h3 className="text-xl font-black">Bronze</h3>
                      <span className="text-sm text-gray-600">(0-5 bookings)</span>
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
                      <h3 className="text-xl font-black">Silver</h3>
                      <span className="text-sm text-gray-600">(6-15 bookings)</span>
                    </div>
                    <ul className="space-y-2 text-gray-700">
                      <li>• <strong>0.5% fee reduction</strong> on all bookings</li>
                      <li>• <strong>+20% higher placement</strong> in search</li>
                      <li>• "Experienced Vendor" badge</li>
                      <li>• Priority email support</li>
                    </ul>
                  </div>

                  <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <Award className="w-8 h-8 text-yellow-600" />
                      <h3 className="text-xl font-black">Gold</h3>
                      <span className="text-sm text-gray-600">(16+ bookings)</span>
                    </div>
                    <ul className="space-y-2 text-gray-700">
                      <li>• <strong>1.5% fee reduction</strong> on all bookings</li>
                      <li>• <strong>+50% higher placement</strong> in search</li>
                      <li>• "Top Rated Vendor" badge</li>
                      <li>• Featured in recommended section</li>
                      <li>• Dedicated account manager</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-4 border-black">
              <CardHeader className="bg-black text-white">
                <CardTitle className="text-2xl font-black">Vendor Bonuses</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="flex items-start gap-3">
                    <Gift className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-bold mb-1">Referral Rewards</h4>
                      <p className="text-sm text-gray-600">
                        $25 credit for every vendor/client you refer who books
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <DollarSign className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-bold mb-1">Volume Discount</h4>
                      <p className="text-sm text-gray-600">
                        +1% fee reduction for 5+ bookings per month
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Star className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-bold mb-1">Review Incentives</h4>
                      <p className="text-sm text-gray-600">
                        4.5+ rating unlocks exclusive promotions
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <TrendingUp className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-bold mb-1">Marketing Support</h4>
                      <p className="text-sm text-gray-600">
                        Top performers featured on social media
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Client Rewards */}
          <TabsContent value="clients">
            <Card className="border-4 border-black mb-8">
              <CardHeader className="bg-black text-white">
                <CardTitle className="text-2xl font-black">How Client Rewards Work</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-gray-700 leading-relaxed mb-6">
                  The more events you plan with EVNT, the more you save. 
                  Book once, save forever on all future events.
                </p>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="flex flex-col items-center text-center gap-2">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <h3 className="font-bold">Book Events</h3>
                    <p className="text-sm text-gray-600">Each event moves you up</p>
                  </div>
                  <div className="flex flex-col items-center text-center gap-2">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="font-bold">Unlock Savings</h3>
                    <p className="text-sm text-gray-600">Lower fees on all bookings</p>
                  </div>
                  <div className="flex flex-col items-center text-center gap-2">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <Star className="w-6 h-6 text-purple-600" />
                    </div>
                    <h3 className="font-bold">Get Perks</h3>
                    <p className="text-sm text-gray-600">Priority support & more</p>
                  </div>
                </div>
              </CardContent>
            </Card>

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
                      <span className="text-sm text-gray-600">(0-2 bookings)</span>
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
                      <span className="text-sm text-gray-600">(3-9 bookings)</span>
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
                      <span className="text-sm text-gray-600">(10+ bookings)</span>
                    </div>
                    <ul className="space-y-2 text-gray-700">
                      <li>• <strong>2% discount</strong> on platform fees</li>
                      <li>• Dedicated account manager</li>
                      <li>• VIP badge on profile</li>
                      <li>• First pick on premium vendors</li>
                      <li>• Special seasonal promotions</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-4 border-black">
              <CardHeader className="bg-black text-white">
                <CardTitle className="text-2xl font-black">Client Bonuses</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="flex items-start gap-3">
                    <Gift className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-bold mb-1">Referral Rewards</h4>
                      <p className="text-sm text-gray-600">
                        $25 credit for every friend who books an event
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Star className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-bold mb-1">Review Rewards</h4>
                      <p className="text-sm text-gray-600">
                        Earn credits for detailed vendor reviews
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <DollarSign className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-bold mb-1">Loyalty Savings</h4>
                      <p className="text-sm text-gray-600">
                        Discounts stack with tier benefits
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Heart className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-bold mb-1">Birthday Bonus</h4>
                      <p className="text-sm text-gray-600">
                        Special discount on your birthday month
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-black to-gray-800 rounded-lg p-8 text-center text-white mt-8">
          <h2 className="text-3xl font-black mb-4">Start Earning Rewards Today</h2>
          <p className="text-lg text-gray-300 mb-6">
            Join thousands of vendors and clients already saving with EVNT
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/Onboarding" 
              className="inline-block bg-white text-black px-8 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors"
            >
              Get Started
            </a>
            <a 
              href="/About" 
              className="inline-block border-2 border-white text-white px-8 py-3 rounded-lg font-bold hover:bg-white hover:text-black transition-colors"
            >
              Learn More
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}