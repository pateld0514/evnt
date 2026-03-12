import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, CreditCard, DollarSign, Shield, Heart, Zap, MessageSquare, Star, Users, CheckCircle } from "lucide-react";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

export default function AboutPage() {
  const [platformFee, setPlatformFee] = useState(10);

  useEffect(() => {
    const loadPlatformFee = async () => {
      try {
        const settings = await base44.entities.PlatformSettings.filter({ setting_key: "platform_fee_percent" }, '-created_date', 1);
        if (settings && settings.length > 0) setPlatformFee(parseFloat(settings[0].setting_value));
      } catch {}
    };
    loadPlatformFee();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="bg-black text-white py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-6 md:px-8 text-center">
          <div className="inline-flex items-center gap-2 mb-6">
            <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center">
              <span className="text-4xl font-black text-black">E</span>
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-black mb-6">EVNT</h1>
          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto font-medium leading-relaxed">
            The first swipe-based marketplace designed to simplify event planning.<br className="hidden md:block" />
            Discover vendors, connect instantly, and book with confidence — all in one platform.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <Link to={createPageUrl("Onboarding")} className="inline-block bg-white text-black px-8 py-3 rounded-lg font-black text-lg hover:bg-gray-200 transition-colors">
              Get Started
            </Link>
            <Link to={createPageUrl("Rewards")} className="inline-block border-2 border-white text-white px-8 py-3 rounded-lg font-bold text-lg hover:bg-white hover:text-black transition-colors">
              🏆 Rewards
            </Link>
          </div>
          <div className="mt-10 flex flex-wrap justify-center gap-6 text-gray-400 text-sm font-medium">
            <span className="flex items-center gap-1.5"><Star className="w-4 h-4 text-yellow-400 fill-yellow-400" /> Trusted by growing event communities</span>
            <span className="flex items-center gap-1.5"><Users className="w-4 h-4" /> New vendors joining weekly</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 md:px-8 py-12 md:py-16">

        {/* How It Works */}
        <section className="mb-16 md:mb-20">
          <h2 className="text-4xl md:text-5xl font-black text-black mb-10 text-center">How EVNT Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { n: 1, title: "Browse & Swipe", desc: "Swipe through curated vendors — DJs, photographers, caterers, and more. Right to save, left to pass. Filter by event type to find the perfect match." },
              { n: 2, title: "Connect & Book", desc: "Message vendors directly, negotiate pricing, and send a booking request. Vendors respond with a custom pricing proposal for your event." },
              { n: 3, title: "Pay & Plan", desc: "Accept a proposal, pay securely through Stripe, and manage everything — bookings, contracts, invoices, and your full event dashboard — in one place." },
            ].map(({ n, title, desc }) => (
              <Card key={n} className="border-4 border-black shadow-lg">
                <CardHeader>
                  <div className="w-16 h-16 bg-black rounded-xl flex items-center justify-center mb-4">
                    <span className="text-3xl font-black text-white">{n}</span>
                  </div>
                  <CardTitle className="font-black text-xl md:text-2xl">{title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-base md:text-lg leading-relaxed">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Who It's For */}
        <section className="mb-16 md:mb-20">
          <h2 className="text-4xl md:text-5xl font-black text-black mb-10 text-center">Who EVNT Is For</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-4 border-black shadow-lg">
              <CardHeader className="bg-black text-white">
                <CardTitle className="font-black text-2xl flex items-center gap-3">
                  <Heart className="w-7 h-7" /> Event Planners & Clients
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <p className="text-gray-600 mb-4 text-base leading-relaxed">Planning any kind of event? EVNT helps you find the right vendors fast.</p>
                <ul className="space-y-2 text-gray-700 text-base">
                  {["Weddings", "Birthday parties", "Corporate events", "Celebrations of any size"].map(item => (
                    <li key={item} className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-black flex-shrink-0" />{item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card className="border-4 border-black shadow-lg">
              <CardHeader className="bg-black text-white">
                <CardTitle className="font-black text-2xl flex items-center gap-3">
                  <DollarSign className="w-7 h-7" /> Vendors & Creators
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <p className="text-gray-600 mb-4 text-base leading-relaxed">Grow your business with access to thousands of clients actively planning events.</p>
                <ul className="space-y-2 text-gray-700 text-base">
                  {["DJs & Musicians", "Photographers & Videographers", "Caterers & Chefs", "Decorators & Planners", "Event professionals of all kinds"].map(item => (
                    <li key={item} className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-black flex-shrink-0" />{item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Why EVNT Is Different */}
        <section className="mb-16 md:mb-20">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-10 border-4 border-black shadow-lg">
            <h2 className="text-3xl md:text-4xl font-black mb-8 flex items-center gap-3 justify-center">
              <Sparkles className="w-8 h-8" /> Why EVNT Is Different
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                { icon: Heart, title: "Stop Spending Hours Searching", desc: "Swipe-based discovery makes finding the perfect vendor fun, fast, and frictionless." },
                { icon: Zap, title: "Everything in One Place", desc: "From discovery to payment — browse, message, book, sign contracts, and manage your full event dashboard without leaving the app." },
                { icon: MessageSquare, title: "Talk Directly With Vendors", desc: "No middleman. Message vendors instantly, negotiate pricing, and get a custom proposal for your event." },
                { icon: Shield, title: "Secure Escrow Payments", desc: "Client payments are held in escrow until the event is completed — protecting both sides of every booking." },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-start gap-4">
                  <Icon className="w-6 h-6 text-black mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-black text-lg mb-1">{title}</p>
                    <p className="text-base text-gray-600">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Secure Payments */}
        <section className="mb-16 md:mb-20">
          <h2 className="text-4xl md:text-5xl font-black text-black mb-10 text-center">Secure Payments & Protection</h2>
          <Card className="border-4 border-black shadow-lg">
            <CardContent className="p-8 md:p-10">
              <p className="text-gray-700 text-lg leading-relaxed mb-6">
                EVNT handles payments securely through Stripe, protecting both clients and vendors from start to finish.
              </p>
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                {[
                  "Payments held securely until service completion",
                  "Digital contracts included with every booking",
                  "Transparent pricing before you commit",
                  "Dispute protection after events",
                ].map(item => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-black mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 font-medium">{item}</span>
                  </div>
                ))}
              </div>
              <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-5">
                <p className="font-black text-gray-900 mb-1">For Vendors</p>
                <p className="text-gray-600">EVNT charges a {platformFee}% platform fee deducted after successful service completion. No subscriptions or upfront costs. Applicable sales taxes are processed automatically based on event location.</p>
                <p className="text-sm text-gray-500 mt-2">
                  <Link to={createPageUrl("Terms")} className="underline font-semibold text-black">See full payment details in Terms of Service →</Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Vendor Benefits */}
        <section className="mb-16 md:mb-20">
          <h2 className="text-4xl md:text-5xl font-black text-black mb-10 text-center">Vendor Benefits</h2>
          <Card className="border-4 border-black shadow-lg">
            <CardHeader className="bg-black text-white">
              <CardTitle className="font-black text-2xl flex items-center gap-3">
                <CreditCard className="w-7 h-7" /> Grow Your Business on EVNT
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-4">
              <p className="text-gray-700 text-lg leading-relaxed">Join thousands of event professionals already using EVNT to fill their calendars.</p>
              <div className="grid md:grid-cols-2 gap-3">
                {[
                  "Profile with photos, pricing & packages",
                  "Exposure to clients actively planning events",
                  "Direct messaging with potential clients",
                  "Full booking & revenue dashboard",
                  "No upfront costs or monthly fees — just 10% on completed bookings",
                  "Vendor tiers: Bronze, Silver & Gold with fee discounts",
                  "Referral rewards for bringing in new vendors or clients",
                  "Stripe Connect for fast, secure payouts",
                ].map(item => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-black flex-shrink-0" />
                    <span className="text-gray-700 font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Mission */}
        <section className="mb-16 md:mb-20">
          <Card className="border-4 border-black shadow-lg">
            <CardContent className="p-10 md:p-12 text-center">
              <h2 className="text-3xl md:text-4xl font-black mb-6">Our Mission</h2>
              <p className="text-gray-700 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
                EVNT was built to remove the stress from event planning by bringing vendors and clients together in one seamless experience. We believe booking services should be as easy as discovering them.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Trust & Safety */}
        <section className="mb-16 md:mb-20">
          <Card className="border-4 border-black bg-gradient-to-br from-gray-50 to-gray-100 shadow-lg">
            <CardContent className="p-10 md:p-12 text-center">
              <Shield className="w-16 h-16 mx-auto mb-6 text-black" />
              <h3 className="text-3xl md:text-4xl font-black mb-4">Trust & Safety</h3>
              <p className="text-gray-700 text-lg md:text-xl max-w-2xl mx-auto mb-4 leading-relaxed">
                All vendors are verified before joining the platform. We encourage honest reviews and transparent communication to build trust in our community.
              </p>
              <p className="text-base text-gray-600 font-medium">
                Questions? Contact us at <a href="mailto:info@joinevnt.com" className="font-black underline hover:text-black">info@joinevnt.com</a> or text <a href="tel:6094423524" className="font-black underline hover:text-black">609-442-3524</a>
              </p>
            </CardContent>
          </Card>
        </section>

        {/* CTA */}
        <section>
          <div className="bg-black text-white rounded-2xl p-10 md:p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-black mb-4">Start planning smarter today.</h2>
            <p className="text-gray-400 text-lg mb-8">Join EVNT and discover a better way to plan your next event.</p>
            <Link to={createPageUrl("Onboarding")} className="inline-block bg-white text-black px-10 py-4 rounded-lg font-black text-xl hover:bg-gray-200 transition-colors">
              Get Started Free
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
}