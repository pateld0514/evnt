import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Loader2, CheckCircle, Store, User, UserX, Copy, ExternalLink, Star, Calendar, MessageSquare, Heart } from "lucide-react";
import { toast } from "sonner";

const accounts = [
  {
    id: "blank",
    label: "Blank Account",
    email: "demo.blank@evnt-test.com",
    description: "A fresh account with no role selected. Shows the onboarding and registration flow.",
    icon: UserX,
    color: "bg-gray-100 text-gray-800 border-gray-300",
    headerColor: "bg-gray-800",
    features: ["Sees the Onboarding page", "Can register as Client or Vendor", "Shows registration forms in full"],
    setupFn: null,
    redirect: "Onboarding",
  },
  {
    id: "vendor",
    label: "Demo Vendor",
    email: "demo.vendor@evnt-test.com",
    description: "Spotlight Studios — a fully populated photographer vendor with bookings, messages, portfolio, reviews, and payout history.",
    icon: Store,
    color: "bg-purple-100 text-purple-800 border-purple-300",
    headerColor: "bg-purple-700",
    features: [
      "Vendor Dashboard with revenue stats",
      "4 bookings (confirmed, negotiating, payment_pending, completed)",
      "Active client messages & unread notifications",
      "Portfolio with 4 photos",
      "Gold tier status with 24 completed bookings",
      "3 client reviews",
      "Payout history",
      "Stripe account connected",
    ],
    setupFn: "setupTestVendor",
    redirect: "VendorDashboard",
  },
  {
    id: "client",
    label: "Demo Client",
    email: "demo.client@evnt-test.com",
    description: "Jamie Rivera — a fully populated client with 3 events, 4 bookings across multiple vendors, saved favorites, messages, and notifications.",
    icon: User,
    color: "bg-blue-100 text-blue-800 border-blue-300",
    headerColor: "bg-blue-700",
    features: [
      "3 Events (Wedding, Birthday, Family Reunion)",
      "4 Bookings in different statuses",
      "Active message thread with Spotlight Studios",
      "3 Saved vendors",
      "Unread notifications",
      "Client tier: Regular (5% discount)",
      "Completed booking with review left",
    ],
    setupFn: "setupTestClient",
    redirect: "EventDashboard",
  },
];

export default function DemoAccountsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(null);
  const [done, setDone] = useState(null);

  const handleSetup = async (account) => {
    if (!account.setupFn) {
      toast.info("This is the blank account — just log in and you'll see the onboarding flow.");
      return;
    }
    setLoading(account.id);
    try {
      const response = await base44.functions.invoke(account.setupFn, {});
      if (response.data?.success) {
        setDone(account.id);
        toast.success(`${account.label} setup complete! Redirecting...`);
        setTimeout(() => navigate(createPageUrl(account.redirect)), 1500);
      } else {
        toast.error(response.data?.error || "Setup failed");
      }
    } catch (error) {
      toast.error("Setup failed: " + (error.message || "Unknown error"));
    } finally {
      setLoading(null);
    }
  };

  const copyEmail = (email) => {
    navigator.clipboard.writeText(email);
    toast.success("Email copied!");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-full text-sm font-bold mb-4">
            <Star className="w-4 h-4" /> Demo Accounts
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-black mb-3">
            Test Account Setup
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Three pre-configured demo accounts to showcase every part of the EVNT platform. Log in as the account email, then click "Activate This Account" to set up the role.
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-black text-white rounded-2xl p-6 mb-8 border-2 border-black">
          <h2 className="text-lg font-black mb-3">How to use these accounts</h2>
          <ol className="space-y-2 text-gray-300">
            <li className="flex gap-3"><span className="text-white font-bold">1.</span> Log out of your current session via the Profile page</li>
            <li className="flex gap-3"><span className="text-white font-bold">2.</span> Log in using one of the demo account emails below (invite them first if not yet invited)</li>
            <li className="flex gap-3"><span className="text-white font-bold">3.</span> Navigate back to this page (<code className="bg-gray-700 px-1 rounded">/DemoAccounts</code>) while logged in as the demo user</li>
            <li className="flex gap-3"><span className="text-white font-bold">4.</span> Click "Activate This Account" to apply the role and profile data</li>
            <li className="flex gap-3"><span className="text-white font-bold">5.</span> You'll be automatically redirected to the correct dashboard</li>
          </ol>
        </div>

        {/* Account Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {accounts.map((account) => {
            const Icon = account.icon;
            const isLoading = loading === account.id;
            const isDone = done === account.id;

            return (
              <Card key={account.id} className="border-2 border-black overflow-hidden flex flex-col">
                <CardHeader className={`${account.headerColor} text-white`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="font-black text-lg">{account.label}</CardTitle>
                        <Badge className={`mt-1 text-xs font-bold border ${account.color}`}>
                          {account.id === "blank" ? "No Role" : account.id === "vendor" ? "Vendor" : "Client"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-5 flex flex-col flex-1">
                  {/* Email */}
                  <div className="flex items-center gap-2 bg-gray-50 border-2 border-gray-200 rounded-lg px-3 py-2 mb-4">
                    <code className="text-xs font-mono text-gray-700 flex-1 truncate">{account.email}</code>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 flex-shrink-0"
                      onClick={() => copyEmail(account.email)}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 mb-4">{account.description}</p>

                  {/* Features */}
                  <div className="flex-1 mb-5">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">What's populated</p>
                    <ul className="space-y-1.5">
                      {account.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action */}
                  {account.setupFn ? (
                    <Button
                      onClick={() => handleSetup(account)}
                      disabled={isLoading || isDone}
                      className="w-full font-bold bg-black text-white hover:bg-gray-800 h-11"
                    >
                      {isDone ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Activated! Redirecting...
                        </>
                      ) : isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Setting up...
                        </>
                      ) : (
                        <>
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Activate This Account
                        </>
                      )}
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <Button
                        onClick={() => navigate(createPageUrl("Onboarding"))}
                        variant="outline"
                        className="w-full font-bold border-2 border-gray-800 h-11"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Onboarding Flow
                      </Button>
                      <p className="text-xs text-center text-gray-500">Log in with this email to see fresh signup</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Nav */}
        <div className="mt-10 bg-white border-2 border-black rounded-2xl p-6">
          <h2 className="text-xl font-black mb-4">Quick Navigation</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Vendor Dashboard", page: "VendorDashboard", icon: Store },
              { label: "Client Bookings", page: "Bookings", icon: Calendar },
              { label: "Event Dashboard", page: "EventDashboard", icon: Calendar },
              { label: "Messages", page: "Messages", icon: MessageSquare },
              { label: "Saved Vendors", page: "Saved", icon: Heart },
              { label: "Browse Vendors", page: "Swipe", icon: Star },
              { label: "Admin Dashboard", page: "AdminDashboard", icon: Store },
              { label: "Onboarding", page: "Onboarding", icon: User },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.page}
                  variant="outline"
                  className="border-2 border-gray-300 hover:border-black hover:bg-black hover:text-white font-bold h-auto py-3 flex-col gap-1"
                  onClick={() => navigate(createPageUrl(item.page))}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-xs">{item.label}</span>
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}