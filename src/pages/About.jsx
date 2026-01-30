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
          <h1 className="text-4xl md:text-5xl font-black mb-4">About EVNT</h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
            The modern way to plan events. Swipe, connect, and book all your vendors in one place.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 md:px-8 py-12 md:py-16">
        {/* How It Works */}
        <section className="mb-16 md:mb-20">
          <h2 className="text-3xl md:text-4xl font-black text-black mb-8 md:mb-10 text-center">How EVNT Works</h2>
          
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="border-2 border-black">
              <CardHeader>
                <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl font-black text-white">1</span>
                </div>
                <CardTitle className="font-black">Browse & Swipe</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Swipe through vendors like DJs, photographers, caterers, and more. Right to save, left to pass.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-black">
              <CardHeader>
                <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl font-black text-white">2</span>
                </div>
                <CardTitle className="font-black">Connect & Book</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Message vendors directly, compare options, and send booking requests with your event details.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-black">
              <CardHeader>
                <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl font-black text-white">3</span>
                </div>
                <CardTitle className="font-black">Manage Everything</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Track bookings, messages, and favorites all in one place. Your entire event planning hub.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="bg-gray-50 rounded-2xl p-8 border-2 border-black">
            <h3 className="text-2xl font-black mb-4 flex items-center gap-2">
              <Sparkles className="w-6 h-6" />
              Why EVNT is Different
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Heart className="w-5 h-5 text-black mt-1" />
                <div>
                  <p className="font-bold">No Endless Searching</p>
                  <p className="text-sm text-gray-600">Swipe-based discovery makes finding vendors fun and fast</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-black mt-1" />
                <div>
                  <p className="font-bold">All-in-One Platform</p>
                  <p className="text-sm text-gray-600">Browse, message, and book without leaving the app</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MessageSquare className="w-5 h-5 text-black mt-1" />
                <div>
                  <p className="font-bold">Direct Communication</p>
                  <p className="text-sm text-gray-600">Message vendors instantly, no middleman</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-black mt-1" />
                <div>
                  <p className="font-bold">Transparent Pricing</p>
                  <p className="text-sm text-gray-600">See rates and packages upfront before you book</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Payment & Fees */}
        <section className="mb-16 md:mb-20">
          <h2 className="text-3xl md:text-4xl font-black text-black mb-8 md:mb-10 text-center">Payment & Fees</h2>
          
          <div className="space-y-6">
            <Card className="border-2 border-black">
              <CardHeader className="bg-black text-white">
                <CardTitle className="flex items-center gap-2 font-black">
                  <CreditCard className="w-6 h-6" />
                  For Clients (Event Planners)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-green-100 text-green-800 border-2 border-green-300 font-bold">
                      SECURE PAYMENTS
                    </Badge>
                  </div>
                  <p className="text-gray-700">
                    Pay the agreed price plus a {platformFee}% platform service fee. All payments processed securely through Stripe with buyer protection.
                  </p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
                  <p className="font-bold mb-2">✓ What You Get:</p>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>• Unlimited vendor browsing and swiping</li>
                    <li>• Direct messaging and price negotiation</li>
                    <li>• Secure payment processing via Stripe</li>
                    <li>• Escrow protection until event completion</li>
                    <li>• Professional contracts and invoices</li>
                    <li>• 24-hour dispute window after events</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-black">
              <CardHeader className="bg-black text-white">
                <CardTitle className="flex items-center gap-2 font-black">
                  <DollarSign className="w-6 h-6" />
                  For Vendors (Service Providers)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div>
                  <p className="font-bold mb-2">Commission-Based Model</p>
                  <p className="text-gray-700 mb-4">
                    Vendors pay a small service fee only when they successfully book a client through EVNT.
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200 space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold">Platform Fee:</span>
                      <Badge className="bg-black text-white">{platformFee}% per booking</Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      Only charged when you accept and complete a booking
                    </p>
                  </div>

                  <div className="border-t-2 border-gray-200 pt-3">
                    <p className="font-bold mb-2">✓ What Vendors Get:</p>
                    <ul className="space-y-1 text-sm text-gray-600">
                      <li>• Profile page with photos and pricing</li>
                      <li>• Exposure to thousands of event planners</li>
                      <li>• Direct messaging with potential clients</li>
                      <li>• Booking request management dashboard</li>
                      <li>• No upfront costs or monthly fees</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* How Payments Work */}
        <section className="mb-16 md:mb-20">
          <h2 className="text-3xl md:text-4xl font-black text-black mb-8 md:mb-10 text-center">How Payments Work</h2>
          
          <Card className="border-2 border-black">
            <CardContent className="p-6">
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white font-black">
                      1
                    </div>
                    <h3 className="text-xl font-bold">Client Sends Booking Request</h3>
                  </div>
                  <p className="text-gray-600 ml-13">
                    Clients browse your profile and send booking requests with their event details and initial budget.
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white font-black">
                      2
                    </div>
                    <h3 className="text-xl font-bold">Negotiate Final Price</h3>
                  </div>
                  <p className="text-gray-600 ml-13">
                    Review the request and submit your pricing proposal. Include your service fee, any additional charges (travel, equipment, etc.), and service details. Client accepts to proceed to payment.
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white font-black">
                      3
                    </div>
                    <h3 className="text-xl font-bold">Secure Payment via Stripe</h3>
                  </div>
                  <p className="text-gray-600 ml-13">
                    Client pays the agreed price plus {platformFee}% platform fee through Stripe. Funds are held securely in escrow to protect both parties.
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white font-black">
                      4
                    </div>
                    <h3 className="text-xl font-bold">Sign Contract & Deliver Service</h3>
                  </div>
                  <p className="text-gray-600 ml-13">
                    Both parties digitally sign the service agreement. Provide your amazing service on the event date. You can upload your own custom contracts if preferred.
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white font-black">
                      5
                    </div>
                    <h3 className="text-xl font-bold">Get Paid</h3>
                  </div>
                  <p className="text-gray-600 ml-13">
                    After the event, funds are released from escrow to your account within 24-48 hours (minus the {platformFee}% platform fee). Track all your earnings in your vendor dashboard.
                  </p>
                </div>

                <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200 mt-6">
                  <p className="font-bold text-green-900 mb-2">💡 Key Benefits:</p>
                  <ul className="space-y-1 text-sm text-green-800">
                    <li>• <strong>Vendors:</strong> You receive {(100 - platformFee).toFixed(0)}% of agreed price, no payment processing hassles</li>
                    <li>• <strong>Clients:</strong> Escrow protection until service is delivered</li>
                    <li>• <strong>Both:</strong> Professional contracts, invoices, and dispute resolution</li>
                    <li>• <strong>Security:</strong> Stripe-powered payments with fraud protection</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Trust & Safety */}
        <section>
          <Card className="border-2 border-black bg-gray-50">
            <CardContent className="p-8 text-center">
              <Shield className="w-16 h-16 mx-auto mb-4 text-black" />
              <h3 className="text-2xl font-black mb-3">Trust & Safety</h3>
              <p className="text-gray-700 max-w-2xl mx-auto mb-4">
                All vendors are verified before joining the platform. We encourage honest reviews and transparent communication to build trust in our community.
              </p>
              <p className="text-sm text-gray-600">
                Have questions? Contact us at <a href="mailto:info@joinevnt.com" className="font-bold underline">info@joinevnt.com</a>
              </p>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}