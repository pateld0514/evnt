import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, CreditCard, DollarSign, Shield, Heart, Zap, MessageSquare } from "lucide-react";

export default function AboutPage() {
  const [platformFee, setPlatformFee] = useState(null);

  useEffect(() => {
    const loadPlatformFee = async () => {
      try {
        const settings = await base44.entities.PlatformSettings.filter({ setting_key: "platform_fee_percent" }, '-created_date', 1);
        if (settings && settings.length > 0) {
          setPlatformFee(parseFloat(settings[0].setting_value));
        } else {
          setPlatformFee(0);
        }
      } catch (error) {
        console.error("Failed to load platform fee:", error);
        setPlatformFee(0);
      }
    };
    loadPlatformFee();
  }, []);

  if (platformFee === null) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-black text-white py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-6 md:px-8 text-center">
          <div className="inline-flex items-center gap-2 mb-6">
            <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center">
              <span className="text-4xl font-black text-black">E</span>
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-black mb-6">About EVNT</h1>
          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto font-medium leading-relaxed">
            The modern way to plan events. Swipe, connect, and book all your vendors in one place.
          </p>
          <div className="mt-6">
            <a 
              href="/Rewards" 
              className="inline-block bg-white text-black px-6 py-3 rounded-lg font-bold hover:bg-gray-200 transition-colors"
            >
              🏆 Rewards Program
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 md:px-8 py-12 md:py-16">
        {/* How It Works */}
        <section className="mb-16 md:mb-20">
          <h2 className="text-4xl md:text-5xl font-black text-black mb-10 md:mb-12 text-center">How EVNT Works</h2>
          
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <Card className="border-4 border-black shadow-lg">
              <CardHeader>
                <div className="w-16 h-16 bg-black rounded-xl flex items-center justify-center mb-4">
                  <span className="text-3xl font-black text-white">1</span>
                </div>
                <CardTitle className="font-black text-xl md:text-2xl">Browse & Swipe</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-base md:text-lg leading-relaxed">
                  Swipe through vendors like DJs, photographers, caterers, and more. Right to save, left to pass.
                </p>
              </CardContent>
            </Card>

            <Card className="border-4 border-black shadow-lg">
              <CardHeader>
                <div className="w-16 h-16 bg-black rounded-xl flex items-center justify-center mb-4">
                  <span className="text-3xl font-black text-white">2</span>
                </div>
                <CardTitle className="font-black text-xl md:text-2xl">Connect & Book</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-base md:text-lg leading-relaxed">
                  Message vendors directly, compare options, and send booking requests with your event details.
                </p>
              </CardContent>
            </Card>

            <Card className="border-4 border-black shadow-lg">
              <CardHeader>
                <div className="w-16 h-16 bg-black rounded-xl flex items-center justify-center mb-4">
                  <span className="text-3xl font-black text-white">3</span>
                </div>
                <CardTitle className="font-black text-xl md:text-2xl">Manage Everything</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-base md:text-lg leading-relaxed">
                  Track bookings, messages, and favorites all in one place. Your entire event planning hub.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-10 border-4 border-black shadow-lg">
            <h3 className="text-3xl md:text-4xl font-black mb-6 flex items-center gap-3">
              <Sparkles className="w-8 h-8" />
              Why EVNT is Different
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-start gap-4">
                <Heart className="w-6 h-6 text-black mt-1 flex-shrink-0" />
                <div>
                  <p className="font-black text-lg mb-1">No Endless Searching</p>
                  <p className="text-base text-gray-600">Swipe-based discovery makes finding vendors fun and fast</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Zap className="w-6 h-6 text-black mt-1 flex-shrink-0" />
                <div>
                  <p className="font-black text-lg mb-1">All-in-One Platform</p>
                  <p className="text-base text-gray-600">Browse, message, and book without leaving the app</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <MessageSquare className="w-6 h-6 text-black mt-1 flex-shrink-0" />
                <div>
                  <p className="font-black text-lg mb-1">Direct Communication</p>
                  <p className="text-base text-gray-600">Message vendors instantly, no middleman</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Shield className="w-6 h-6 text-black mt-1 flex-shrink-0" />
                <div>
                  <p className="font-black text-lg mb-1">Transparent Pricing</p>
                  <p className="text-base text-gray-600">See rates and packages upfront before you book</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Payment & Fees */}
        <section className="mb-16 md:mb-20">
          <h2 className="text-4xl md:text-5xl font-black text-black mb-10 md:mb-12 text-center">Payment & Fees</h2>
          
          <div className="space-y-8">
            <Card className="border-4 border-black shadow-lg">
              <CardHeader className="bg-black text-white">
                <CardTitle className="flex items-center gap-3 font-black text-2xl">
                  <CreditCard className="w-7 h-7" />
                  For Clients (Event Planners)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-5">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge className="bg-green-100 text-green-800 border-2 border-green-300 font-black text-base px-4 py-1.5">
                      SECURE PAYMENTS
                    </Badge>
                  </div>
                  <p className="text-gray-700 text-lg leading-relaxed">
                    Pay the agreed price to book your vendor. All payments processed securely through Stripe with buyer protection and escrow until service completion.
                  </p>
                </div>
                
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border-2 border-gray-300">
                  <p className="font-black mb-3 text-lg">✓ What You Get:</p>
                  <ul className="space-y-2 text-base text-gray-700">
                    <li className="font-medium">• Unlimited vendor browsing and swiping</li>
                    <li className="font-medium">• Direct messaging and price negotiation</li>
                    <li className="font-medium">• Secure payment processing via Stripe</li>
                    <li className="font-medium">• Escrow protection until event completion</li>
                    <li className="font-medium">• Professional contracts and invoices</li>
                    <li className="font-medium">• 24-hour dispute window after events</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="border-4 border-black shadow-lg">
              <CardHeader className="bg-black text-white">
                <CardTitle className="flex items-center gap-3 font-black text-2xl">
                  <DollarSign className="w-7 h-7" />
                  For Vendors (Service Providers)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-5">
                <div>
                   <p className="font-black mb-3 text-lg">How Vendor Payments Work</p>
                   <p className="text-gray-700 text-lg mb-4 leading-relaxed">
                     EVNT takes a {platformFee}% service fee from each booking's agreed price. For example, if you agree to a $1,000 booking in Kentucky (6% sales tax): Client pays $1,060 total ($1,000 service + $60 tax). EVNT receives ${(1000 * platformFee / 100).toFixed(0)} ({platformFee}% fee) + $60 (tax). You receive ${(1000 - (1000 * platformFee / 100)).toFixed(0)} after the fee is deducted.
                   </p>
                 </div>

                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border-2 border-gray-300 space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-black text-lg">Platform Fee:</span>
                      <Badge className="bg-black text-white font-black text-base px-4 py-1.5">{platformFee}% of booking total</Badge>
                    </div>
                    <p className="text-base text-gray-600 font-medium">
                      Deducted from agreed price after service completion
                    </p>
                  </div>

                  <div className="border-t-2 border-gray-300 pt-4">
                    <p className="font-black mb-3 text-lg">✓ What Vendors Get:</p>
                    <ul className="space-y-2 text-base text-gray-700">
                      <li className="font-medium">• Profile page with photos and pricing</li>
                      <li className="font-medium">• Exposure to thousands of event planners</li>
                      <li className="font-medium">• Direct messaging with potential clients</li>
                      <li className="font-medium">• Booking request management dashboard</li>
                      <li className="font-medium">• No upfront costs or monthly fees</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* How Payments Work */}
        <section className="mb-16 md:mb-20">
          <h2 className="text-4xl md:text-5xl font-black text-black mb-10 md:mb-12 text-center">How Payments Work</h2>
          
          <Card className="border-4 border-black shadow-lg">
            <CardContent className="p-8 md:p-10">
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center text-white font-black text-xl">
                      1
                    </div>
                    <h3 className="text-xl md:text-2xl font-black">Client Sends Booking Request</h3>
                  </div>
                  <p className="text-gray-600 ml-16 text-base md:text-lg">
                    Clients browse your profile and send booking requests with their event details and initial budget.
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center text-white font-black text-xl">
                      2
                    </div>
                    <h3 className="text-xl md:text-2xl font-black">Negotiate Final Price</h3>
                  </div>
                  <p className="text-gray-600 ml-16 text-base md:text-lg">
                    Review the request and submit your pricing proposal. Include your service fee, any additional charges (travel, equipment, etc.), and service details. Client accepts to proceed to payment.
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center text-white font-black text-xl">
                      3
                    </div>
                    <h3 className="text-xl md:text-2xl font-black">Secure Payment via Stripe</h3>
                  </div>
                  <p className="text-gray-600 ml-16 text-base md:text-lg">
                    Client pays the agreed total price through Stripe. Funds are held securely in escrow to protect both parties until service completion.
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center text-white font-black text-xl">
                      4
                    </div>
                    <h3 className="text-xl md:text-2xl font-black">Sign Contract & Deliver Service</h3>
                  </div>
                  <p className="text-gray-600 ml-16 text-base md:text-lg">
                    Both parties digitally sign the service agreement. Provide your amazing service on the event date. You can upload your own custom contracts if preferred.
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center text-white font-black text-xl">
                      5
                    </div>
                    <h3 className="text-xl md:text-2xl font-black">Get Paid</h3>
                  </div>
                  <p className="text-gray-600 ml-16 text-base md:text-lg">
                    After the event, your payout ({(100 - platformFee).toFixed(0)}% of the agreed price) is released from escrow to your account within 24-48 hours. EVNT retains {platformFee}% as the platform service fee.
                  </p>
                </div>

                <div className="bg-green-50 rounded-xl p-6 border-2 border-green-300 mt-6">
                   <p className="font-black text-green-900 mb-3 text-lg">💡 Fee & Tax Breakdown:</p>
                   <ul className="space-y-2 text-base text-green-800">
                     <li className="font-medium">• <strong>EVNT Fee:</strong> {platformFee}% of agreed service price (deducted from vendor payout)</li>
                     <li className="font-medium">• <strong>Sales Tax:</strong> Applied based on event location, added to client total</li>
                     <li className="font-medium">• <strong>Client Pays:</strong> Service price + applicable sales tax</li>
                     <li className="font-medium">• <strong>Vendor Receives:</strong> Service price minus EVNT's {platformFee}% fee</li>
                     <li className="font-medium">• <strong>EVNT Gets:</strong> {platformFee}% fee + all collected sales taxes</li>
                     <li className="font-medium">• <strong>Example:</strong> $1,000 booking in KY (6% tax): Client pays $1,060 • Vendor receives $900 • EVNT gets $100 fee + $60 tax</li>
                   </ul>
                 </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Trust & Safety */}
        <section>
          <Card className="border-4 border-black bg-gradient-to-br from-gray-50 to-gray-100 shadow-lg">
            <CardContent className="p-10 md:p-12 text-center">
              <Shield className="w-20 h-20 mx-auto mb-6 text-black" />
              <h3 className="text-3xl md:text-4xl font-black mb-4">Trust & Safety</h3>
              <p className="text-gray-700 text-lg md:text-xl max-w-2xl mx-auto mb-6 leading-relaxed">
                All vendors are verified before joining the platform. We encourage honest reviews and transparent communication to build trust in our community.
              </p>
              <p className="text-base text-gray-600 font-medium">
                Have questions? Contact us at <a href="mailto:info@joinevnt.com" className="font-black underline hover:text-black">info@joinevnt.com</a>
              </p>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}