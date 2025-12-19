import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Play, Square, Loader2, MousePointer2 } from "lucide-react";
import { toast } from "sonner";

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Visual click indicator
const ClickIndicator = ({ x, y, label }) => (
  <div
    style={{
      position: 'fixed',
      left: `${x}px`,
      top: `${y}px`,
      zIndex: 9999,
      pointerEvents: 'none',
    }}
  >
    <div className="flex flex-col items-center animate-pulse">
      <div className="w-16 h-16 bg-red-500 rounded-full opacity-50 absolute"></div>
      <MousePointer2 className="w-10 h-10 text-red-600 fill-red-600 relative z-10" />
      {label && (
        <div className="mt-16 bg-black text-white px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap shadow-2xl">
          {label}
        </div>
      )}
    </div>
  </div>
);

export default function AutoDemo() {
  const navigate = useNavigate();
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState("");
  const [stopRequested, setStopRequested] = useState(false);
  const [clickIndicator, setClickIndicator] = useState(null);

  const showClick = async (label, duration = 2000) => {
    setClickIndicator({ x: window.innerWidth / 2, y: window.innerHeight / 2, label });
    await wait(duration);
    setClickIndicator(null);
  };

  const runDemo = async () => {
    setIsRunning(true);
    setStopRequested(false);
    
    try {
      // ========== COMPLETE WALKTHROUGH ==========
      
      // PART 1: HOME PAGE & SWIPE
      setCurrentStep("Demo Starting - Viewing Home Page");
      navigate(createPageUrl("Home"));
      await showClick("Exploring the home page");
      await wait(4000);
      if (stopRequested) return;

      // Navigate to Swipe
      setCurrentStep("Browsing Vendors - Swipe Feature");
      navigate(createPageUrl("Swipe"));
      await showClick("Opening swipe to browse vendors");
      await wait(3000);
      if (stopRequested) return;

      // Show Filters
      setCurrentStep("Opening Filter Options");
      await showClick("Click to see all available filters", 2500);
      await wait(2500);
      if (stopRequested) return;

      // Filter by Category
      setCurrentStep("Filtering by Category - Selecting DJ");
      await showClick("Selecting category: DJ", 2000);
      await wait(2000);
      if (stopRequested) return;

      // Filter by Price Range
      setCurrentStep("Filtering by Price Range - Selecting $$$");
      await showClick("Selecting price range: $$$", 2000);
      await wait(2000);
      if (stopRequested) return;

      // Filter by Location
      setCurrentStep("Filtering by Location - Typing 'Washington, DC'");
      await showClick("Typing location: Washington, DC", 2000);
      await wait(2000);
      if (stopRequested) return;

      // Swipe Right
      setCurrentStep("Found a Great Vendor - Swiping Right to Save!");
      await showClick("❤️ Swiping right to add to favorites", 2500);
      const { data: testVendors } = await base44.entities.Vendor.filter({ category: "dj", approval_status: "approved", profile_complete: true });
      if (testVendors && testVendors.length > 0) {
        const vendor = testVendors[0];
        await base44.entities.UserSwipe.create({
          vendor_id: vendor.id,
          direction: "right",
          event_type: "wedding"
        });
        
        await base44.entities.SavedVendor.create({
          vendor_id: vendor.id,
          vendor_name: vendor.business_name,
          vendor_category: vendor.category,
          event_type: "wedding"
        });
      }
      await wait(3000);
      if (stopRequested) return;

      // PART 2: SAVED VENDORS
      setCurrentStep("Viewing Saved Vendors");
      navigate(createPageUrl("Saved"));
      await showClick("Checking out our saved favorites");
      await wait(4000);
      if (stopRequested) return;

      // View Details
      setCurrentStep("Opening Vendor Details");
      await showClick("Click to see full vendor profile", 2000);
      await wait(3000);
      if (stopRequested) return;

      // PART 3: BOOKINGS - CREATE
      setCurrentStep("Creating a Booking Request");
      await showClick("Booking this vendor for our event!");
      
      const user = await base44.auth.me();
      const vendors = await base44.entities.Vendor.filter({ approval_status: "approved", profile_complete: true });
      if (vendors && vendors.length > 0) {
        const selectedVendor = vendors[0];
        
        setCurrentStep("Filling Out Booking Form");
        await showClick("Event Type: Wedding", 1500);
        await wait(1500);
        await showClick("Event Date: September 15, 2025", 1500);
        await wait(1500);
        await showClick("Guest Count: 150", 1500);
        await wait(1500);
        await showClick("Budget: $3,500", 1500);
        await wait(1500);
        await showClick("Location: The Grand Ballroom, DC", 1500);
        await wait(1500);
        await showClick("Special Notes: We love 80s and modern music!", 2000);
        await wait(2000);
        
        const booking = await base44.entities.Booking.create({
          vendor_id: selectedVendor.id,
          vendor_name: selectedVendor.business_name,
          client_email: user.email,
          client_name: user.full_name,
          event_type: "Wedding",
          event_date: "2025-09-15",
          guest_count: 150,
          budget: 3500,
          location: "The Grand Ballroom, Washington DC",
          notes: "Need a DJ who can play a great mix of 80s classics and current hits. Reading the crowd is important!",
          status: "pending"
        });
        
        setCurrentStep("Booking Request Submitted!");
        await showClick("✓ Request sent to vendor");
        await wait(2000);
        if (stopRequested) return;

        // Navigate to Bookings Page
        setCurrentStep("Viewing All Bookings");
        navigate(createPageUrl("Bookings"));
        await showClick("Checking our booking requests");
        await wait(4000);
        if (stopRequested) return;

        // Filter by Status
        setCurrentStep("Filtering Bookings by Status");
        await showClick("Viewing Pending Bookings", 2000);
        await wait(2000);
        await showClick("Viewing Accepted Bookings", 2000);
        await wait(2000);
        await showClick("Viewing Completed Bookings", 2000);
        await wait(2000);
        if (stopRequested) return;

        // View Booking Details
        setCurrentStep("Opening Booking Details");
        await showClick("Viewing detailed booking information");
        await wait(3000);
        if (stopRequested) return;

        // Show Invoice
        setCurrentStep("Viewing Invoice Document");
        await showClick("📄 Opening invoice");
        await wait(3000);
        if (stopRequested) return;

        // Show Contract
        setCurrentStep("Viewing Service Agreement");
        await showClick("📑 Opening service contract");
        await wait(3000);
        if (stopRequested) return;

        // VENDOR ACCEPTS
        setCurrentStep("Vendor Reviews and Accepts Booking!");
        await base44.entities.Booking.update(booking.id, {
          status: "accepted",
          vendor_response: "We're excited to DJ your wedding! Can't wait to make it an unforgettable night. Let's schedule a call to discuss your music preferences!"
        });
        await showClick("✓ Vendor accepted the booking!");
        await wait(3000);
        if (stopRequested) return;

        // PART 4: MESSAGES
        setCurrentStep("Opening Messages to Chat with Vendor");
        navigate(createPageUrl("Messages"));
        await showClick("Time to message the vendor");
        await wait(3000);
        if (stopRequested) return;

        // Send Message
        setCurrentStep("Typing Message to Vendor");
        const conversationId = `${user.email}-${selectedVendor.id}`;
        await showClick("Typing: Hi! Thanks for accepting...", 2000);
        await wait(2000);
        
        await base44.entities.Message.create({
          conversation_id: conversationId,
          sender_email: user.email,
          sender_name: user.full_name,
          recipient_email: selectedVendor.contact_email,
          vendor_id: selectedVendor.id,
          vendor_name: selectedVendor.business_name,
          message: "Hi! Thanks for accepting our booking! When can we schedule a call to discuss the playlist? We have some special songs we'd love included!",
          read: false
        });
        
        setCurrentStep("Message Sent!");
        await showClick("✓ Message delivered");
        await wait(2000);
        if (stopRequested) return;

        // Vendor Replies
        setCurrentStep("Vendor Responds!");
        await wait(1500);
        await base44.entities.Message.create({
          conversation_id: conversationId,
          sender_email: selectedVendor.contact_email,
          sender_name: selectedVendor.business_name,
          recipient_email: user.email,
          vendor_id: selectedVendor.id,
          vendor_name: selectedVendor.business_name,
          message: "Absolutely! I'm available tomorrow at 2pm or Friday at 10am. Which works better for you? Can't wait to hear about your must-play songs!",
          read: false
        });
        await showClick("💬 New message received from vendor");
        await wait(3000);
        if (stopRequested) return;

        // Show Multiple Conversations
        setCurrentStep("Viewing Multiple Conversations");
        await showClick("See all your vendor conversations", 2000);
        await wait(3000);
        if (stopRequested) return;

        // PART 5: EVENT VENDORS PAGE
        setCurrentStep("Browsing Vendors by Event Category");
        navigate(createPageUrl("EventVendors") + "?event=wedding");
        await showClick("Finding all wedding vendors");
        await wait(4000);
        if (stopRequested) return;

        // PART 6: COMPLETE EVENT & REVIEW
        setCurrentStep("Event Day - Booking Completed!");
        await base44.entities.Booking.update(booking.id, {
          status: "completed"
        });
        navigate(createPageUrl("Bookings"));
        await showClick("🎉 Event was amazing!");
        await wait(3000);
        if (stopRequested) return;

        // Leave Review
        setCurrentStep("Leaving a 5-Star Review");
        await showClick("Opening review form", 1500);
        await wait(1500);
        await showClick("★★★★★ Rating: 5 stars!", 2000);
        await wait(2000);
        await showClick("Typing: Amazing DJ! Best night ever!", 2500);
        await wait(2500);
        
        await base44.entities.Review.create({
          vendor_id: selectedVendor.id,
          vendor_name: selectedVendor.business_name,
          client_email: user.email,
          client_name: user.full_name,
          booking_id: booking.id,
          rating: 5,
          description: "Absolutely incredible DJ! The music selection was perfect, the energy was amazing, and all our guests had a blast on the dance floor. Super professional and exceeded all expectations. We couldn't have asked for a better DJ for our wedding!"
        });
        await showClick("✓ Review submitted!");
        await wait(3000);
        if (stopRequested) return;

        // PART 7: VENDOR DASHBOARD
        setCurrentStep("Viewing Vendor Dashboard & Analytics");
        navigate(createPageUrl("VendorDashboard"));
        await showClick("Vendor's perspective - earnings & bookings");
        await wait(4000);
        if (stopRequested) return;

        // Show Different Tabs
        setCurrentStep("Vendor Dashboard - Sales & Revenue");
        await showClick("Viewing revenue analytics", 2000);
        await wait(3000);
        if (stopRequested) return;

        setCurrentStep("Vendor Dashboard - AI Business Insights");
        await showClick("AI-powered growth recommendations", 2000);
        await wait(3000);
        if (stopRequested) return;

        // PART 8: PROFILE PAGE
        setCurrentStep("Viewing User Profile");
        navigate(createPageUrl("Profile"));
        await showClick("Account settings & info");
        await wait(3000);
        if (stopRequested) return;

        // PART 9: ABOUT PAGE
        setCurrentStep("About EVNT - How It Works");
        navigate(createPageUrl("About"));
        await showClick("Learn about the platform");
        await wait(4000);
        if (stopRequested) return;
      }

      // FINALE
      setCurrentStep("✅ Demo Complete! All Features Shown!");
      navigate(createPageUrl("AdminDashboard"));
      await showClick("🎬 That's a wrap! Thanks for watching!", 3000);
      await wait(3000);

      toast.success("Demo completed successfully!");
      setCurrentStep("");
      
    } catch (error) {
      console.error("Demo error:", error);
      toast.error("Demo error: " + error.message);
      setCurrentStep("");
    } finally {
      setIsRunning(false);
      setStopRequested(false);
      setClickIndicator(null);
    }
  };

  const stopDemo = () => {
    setStopRequested(true);
    setCurrentStep("Stopping demo...");
    toast.info("Demo will stop after current step");
  };

  return (
    <>
      {clickIndicator && (
        <ClickIndicator 
          x={clickIndicator.x} 
          y={clickIndicator.y} 
          label={clickIndicator.label}
        />
      )}
      
      <Card className="border-2 border-purple-600 bg-gradient-to-br from-purple-50 to-pink-50 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-2xl font-black text-purple-900">Automated Feature Demo</h3>
            <p className="text-sm text-purple-700 mt-1">
              Complete walkthrough showing every feature with visual indicators
            </p>
          </div>
          {!isRunning ? (
            <Button
              onClick={runDemo}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold h-12 px-6"
            >
              <Play className="w-5 h-5 mr-2" />
              Start Demo
            </Button>
          ) : (
            <Button
              onClick={stopDemo}
              className="bg-red-600 hover:bg-red-700 text-white font-bold h-12 px-6"
            >
              <Square className="w-5 h-5 mr-2" />
              Stop Demo
            </Button>
          )}
        </div>

        {isRunning && (
          <div className="bg-white border-2 border-purple-300 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
              <div className="flex-1">
                <p className="font-bold text-purple-900">{currentStep}</p>
                <p className="text-xs text-purple-600 mt-1">Screen recording in progress... Watch for visual indicators!</p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 bg-white border-2 border-purple-300 rounded-lg p-4">
          <h4 className="font-bold text-purple-900 mb-2">Complete Feature Tour:</h4>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-purple-700">
            <div>
              <p className="font-bold mb-2">🏠 Browsing & Discovery:</p>
              <ul className="space-y-1 ml-4">
                <li>• Home page exploration</li>
                <li>• Swipe to browse vendors</li>
                <li>• Filter by category, price, location</li>
                <li>• Save favorites</li>
                <li>• View vendor details</li>
                <li>• Browse by event type</li>
              </ul>
            </div>
            <div>
              <p className="font-bold mb-2">📋 Booking & Management:</p>
              <ul className="space-y-1 ml-4">
                <li>• Create booking request</li>
                <li>• Fill detailed form</li>
                <li>• View all bookings</li>
                <li>• Filter by status</li>
                <li>• View booking details</li>
                <li>• Invoice & contract docs</li>
                <li>• Vendor acceptance</li>
                <li>• Complete booking</li>
              </ul>
            </div>
            <div>
              <p className="font-bold mb-2">💬 Communication & More:</p>
              <ul className="space-y-1 ml-4">
                <li>• Message vendors</li>
                <li>• Multiple conversations</li>
                <li>• Real-time replies</li>
                <li>• Leave reviews</li>
                <li>• Vendor dashboard</li>
                <li>• Sales analytics</li>
                <li>• AI insights</li>
                <li>• User profile</li>
              </ul>
            </div>
          </div>
          <p className="text-xs text-purple-600 mt-3 italic font-bold">
            Duration: ~3 minutes | All features demonstrated | Visual click indicators show actions | Perfect for screen recording!
          </p>
        </div>
      </Card>
    </>
  );
}