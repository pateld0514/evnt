import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gift, Copy, Share2, Check, Mail, MessageSquare } from "lucide-react";
import { toast } from "sonner";

export default function ReferralCard({ userEmail, userType }) {
  const [copied, setCopied] = useState(false);
  
  // Generate referral code from email (simple hash)
  const referralCode = btoa(userEmail).replace(/[^a-zA-Z0-9]/g, '').substring(0, 10).toUpperCase();
  const referralLink = `${window.location.origin}/Onboarding?ref=${referralCode}`;
  
  const isVendor = userType === "vendor";
  
  const referralMessage = isVendor
    ? `Hey! I'm using EVNT to grow my event business and thought you might like it too. Join as a vendor and when you complete your first booking, we both get 1 booking with 0% commission! ${referralLink}`
    : `Hey! I found this amazing platform for planning events - EVNT makes it super easy to find and book vendors. Join with my link and we both get $25 credit! ${referralLink}`;
  
  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success("Referral link copied!");
    setTimeout(() => setCopied(false), 2000);
  };
  
  const handleCopyMessage = () => {
    navigator.clipboard.writeText(referralMessage);
    toast.success("Message copied!");
  };
  
  const handleShareEmail = () => {
    const subject = isVendor ? "Join EVNT - Grow Your Event Business" : "Check out EVNT - Easy Event Planning";
    const body = encodeURIComponent(referralMessage);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };
  
  const handleShareSMS = () => {
    const body = encodeURIComponent(referralMessage);
    window.location.href = `sms:?body=${body}`;
  };

  return (
    <Card className="border-4 border-black shadow-lg">
      <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <CardTitle className="flex items-center gap-3 text-2xl md:text-3xl font-black">
          <Gift className="w-7 h-7" />
          {isVendor ? "Refer & Earn Commission-Free Booking" : "Refer & Earn $25"}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Explanation */}
        <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
          <p className="text-sm text-gray-700 font-medium">
            {isVendor 
              ? "Invite other vendors to join EVNT. When they complete their first booking, you both get 1 booking with 0% commission!"
              : "Share EVNT with friends planning events. When they complete their first booking, you both earn $25 credit!"}
          </p>
        </div>

        {/* Referral Code */}
        <div>
          <label className="text-base font-black text-gray-900 block mb-2">Your Referral Code</label>
          <div className="flex gap-2">
            <div className="flex-1 bg-gray-100 border-2 border-gray-300 rounded-lg px-4 py-4 font-mono font-black text-xl text-center tracking-wider">
              {referralCode}
            </div>
          </div>
        </div>

        {/* Referral Link */}
        <div>
          <label className="text-base font-black text-gray-900 block mb-2">Your Referral Link</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={referralLink}
              readOnly
              className="flex-1 bg-gray-100 border-2 border-gray-300 rounded-lg px-4 py-3 text-sm font-medium"
            />
            <Button
              onClick={handleCopy}
              className="bg-black hover:bg-gray-800 font-bold h-12"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Share Message */}
        <div>
          <label className="text-base font-black text-gray-900 block mb-2">Share This Message</label>
          <div className="bg-white border-2 border-gray-300 rounded-lg p-4 text-base text-gray-700 mb-3 leading-relaxed">
            "{referralMessage}"
          </div>
          <Button
            onClick={handleCopyMessage}
            variant="outline"
            className="w-full border-2 border-black font-bold h-12"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy Message
          </Button>
        </div>

        {/* Quick Share Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={handleShareEmail}
            variant="outline"
            className="border-2 border-black hover:bg-gray-100 font-bold h-12"
          >
            <Mail className="w-5 h-5 mr-2" />
            Share via Email
          </Button>
          <Button
            onClick={handleShareSMS}
            variant="outline"
            className="border-2 border-black hover:bg-gray-100 font-bold h-12"
          >
            <MessageSquare className="w-5 h-5 mr-2" />
            Share via SMS
          </Button>
        </div>

        {/* Stats */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-5 border-2 border-gray-300">
          <div className="flex items-center justify-between mb-3">
            <span className="text-base font-black text-gray-900">How It Works</span>
            <Badge className="bg-green-500 text-white font-bold px-3 py-1">Easy!</Badge>
          </div>
          <ol className="space-y-3 text-base text-gray-700">
            <li className="flex items-start gap-3">
              <span className="font-black text-black text-lg">1.</span>
              <span className="font-medium">Share your referral link with friends or colleagues</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="font-black text-black text-lg">2.</span>
              <span className="font-medium">They sign up and complete their first booking</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="font-black text-black text-lg">3.</span>
              <span className="font-medium">
                {isVendor 
                  ? "You both get 1 booking with 0% commission!"
                  : "You both receive $25 credit automatically!"}
              </span>
            </li>
          </ol>
        </div>

        <p className="text-sm text-gray-600 text-center font-medium">
          {isVendor 
            ? "🚀 More referrals = more commission-free bookings!"
            : "💰 Share as many times as you want - unlimited earning potential!"}
        </p>
      </CardContent>
    </Card>
  );
}