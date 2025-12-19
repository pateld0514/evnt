import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Play, Square, Loader2, MousePointer2 } from "lucide-react";
import { toast } from "sonner";

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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
    <div className="flex flex-col items-center">
      <div className="w-20 h-20 bg-red-500 rounded-full opacity-30 absolute animate-ping"></div>
      <MousePointer2 className="w-12 h-12 text-red-600 fill-red-600 relative z-10 drop-shadow-2xl" />
      {label && (
        <div className="mt-20 bg-black text-white px-6 py-3 rounded-lg text-base font-bold whitespace-nowrap shadow-2xl border-4 border-red-500">
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

  const showClick = async (x, y, label, duration = 2000) => {
    setClickIndicator({ x, y, label });
    await wait(duration);
    setClickIndicator(null);
    await wait(500);
  };

  const runDemo = async () => {
    setIsRunning(true);
    setStopRequested(false);
    let createdVendorIds = [];
    let createdBookingIds = [];
    let createdMessageIds = [];
    let createdReviewIds = [];
    let createdSavedIds = [];
    let createdSwipeIds = [];
    
    try {
      // ===== STEP 1: CREATE TEST DATA WITH IMAGES =====
      setCurrentStep("Setting up demo data...");
      
      const testVendor = await base44.entities.Vendor.create({
        business_name: "Elite Event DJs",
        category: "dj",
        description: "Premium DJ services for weddings, corporate events, and parties. 15 years of experience with state-of-the-art sound equipment and lighting.",
        contact_phone: "(555) 987-6543",
        location: "Washington, DC",
        contact_email: "contact@elitedjs.com",
        image_url: "https://images.unsplash.com/photo-1571266028243-d220c6c2c0f2?w=800",
        additional_images: [
          "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800",
          "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800"
        ],
        price_range: "$$$",
        starting_price: 2500,
        average_price: 3500,
        pricing_type: "package",
        hourly_rate: 300,
        willing_to_travel: true,
        travel_radius: 50,
        years_in_business: 15,
        insurance_verified: true,
        approval_status: "approved",
        profile_complete: true,
        specialties: ["Wedding", "Corporate Event", "Birthday"],
        website: "www.elitedjs.com",
        packages: [
          { name: "Basic Package", price: 2500, description: "4 hours DJ service" },
          { name: "Premium Package", price: 4000, description: "6 hours + lighting" }
        ]
      });
      createdVendorIds.push(testVendor.id);
      
      const photographerVendor = await base44.entities.Vendor.create({
        business_name: "Picture Perfect Photography",
        category: "photographer",
        description: "Award-winning wedding and event photography capturing your special moments.",
        contact_phone: "(555) 111-2222",
        location: "Arlington, VA",
        contact_email: "info@pictureperfect.com",
        image_url: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=800",
        price_range: "$$$$",
        starting_price: 3500,
        approval_status: "approved",
        profile_complete: true,
        specialties: ["Wedding", "Birthday"],
        years_in_business: 10
      });
      createdVendorIds.push(photographerVendor.id);

      await wait(2000);
      if (stopRequested) return;

      // ===== CLIENT VIEW: HOME PAGE =====
      setCurrentStep("CLIENT VIEW: Exploring Home Page");
      navigate(createPageUrl("Home"));
      await wait(3000);
      await showClick(window.innerWidth / 2, 300, "🏠 Home Page - Browse Events");
      if (stopRequested) return;

      // ===== CLIENT VIEW: SWIPE PAGE =====
      setCurrentStep("CLIENT VIEW: Opening Swipe to Browse Vendors");
      navigate(createPageUrl("Swipe"));
      await wait(3000);
      await showClick(window.innerWidth / 2, 200, "📱 Swipe to Find Vendors");
      if (stopRequested) return;

      // Show Filters Panel
      setCurrentStep("CLIENT VIEW: Opening Filter Options");
      await showClick(window.innerWidth / 2, 250, "🔍 Click Filters", 2000);
      await wait(2000);
      
      setCurrentStep("CLIENT VIEW: Selecting Category Filter");
      await showClick(400, 350, "Select Category: DJ", 2000);
      await wait(2000);
      
      setCurrentStep("CLIENT VIEW: Selecting Price Range");
      await showClick(400, 450, "Select Price: $$$", 2000);
      await wait(2000);
      
      setCurrentStep("CLIENT VIEW: Typing Location");
      await showClick(400, 550, "Type: Washington, DC", 2500);
      await wait(2500);
      
      setCurrentStep("CLIENT VIEW: Closing Filters");
      await showClick(window.innerWidth - 100, 100, "Close Filters");
      await wait(1500);
      if (stopRequested) return;

      // Swipe Right on Vendor
      setCurrentStep("CLIENT VIEW: Swiping Right to Save Vendor ❤️");
      await showClick(window.innerWidth / 2 + 150, window.innerHeight / 2 + 200, "❤️ Swipe Right!");
      
      const swipe1 = await base44.entities.UserSwipe.create({
        vendor_id: testVendor.id,
        direction: "right",
        event_type: "wedding"
      });
      createdSwipeIds.push(swipe1.id);
      
      const saved1 = await base44.entities.SavedVendor.create({
        vendor_id: testVendor.id,
        vendor_name: testVendor.business_name,
        vendor_category: testVendor.category,
        event_type: "wedding"
      });
      createdSavedIds.push(saved1.id);
      await wait(3000);
      if (stopRequested) return;

      // ===== CLIENT VIEW: SAVED VENDORS =====
      setCurrentStep("CLIENT VIEW: Viewing Saved Vendors");
      navigate(createPageUrl("Saved"));
      await wait(3000);
      await showClick(window.innerWidth / 2, 300, "💖 My Favorite Vendors");
      await wait(2000);
      
      setCurrentStep("CLIENT VIEW: Opening Vendor Details");
      await showClick(400, 500, "Click: View Details", 2000);
      await wait(3000);
      
      setCurrentStep("CLIENT VIEW: Viewing Full Vendor Profile");
      await showClick(window.innerWidth / 2, 400, "📋 Vendor Info, Photos, Reviews");
      await wait(3000);
      if (stopRequested) return;

      // ===== CLIENT VIEW: CREATE BOOKING =====
      setCurrentStep("CLIENT VIEW: Opening Booking Form");
      await showClick(window.innerWidth / 2, 600, "Click: Book Now", 2000);
      await wait(2000);
      
      setCurrentStep("CLIENT VIEW: Filling Booking Form - Event Type");
      await showClick(400, 300, "Type: Wedding", 1500);
      await wait(1500);
      
      setCurrentStep("CLIENT VIEW: Filling Booking Form - Date");
      await showClick(400, 380, "Select: September 15, 2025", 1500);
      await wait(1500);
      
      setCurrentStep("CLIENT VIEW: Filling Booking Form - Guest Count");
      await showClick(400, 460, "Type: 150 guests", 1500);
      await wait(1500);
      
      setCurrentStep("CLIENT VIEW: Filling Booking Form - Budget");
      await showClick(400, 540, "Type: $3,500", 1500);
      await wait(1500);
      
      setCurrentStep("CLIENT VIEW: Filling Booking Form - Location");
      await showClick(400, 620, "Type: The Grand Ballroom, DC", 1500);
      await wait(1500);
      
      setCurrentStep("CLIENT VIEW: Filling Booking Form - Notes");
      await showClick(400, 720, "Type: Need mix of 80s and modern music", 2000);
      await wait(2000);
      
      setCurrentStep("CLIENT VIEW: Submitting Booking Request");
      const user = await base44.auth.me();
      const booking = await base44.entities.Booking.create({
        vendor_id: testVendor.id,
        vendor_name: testVendor.business_name,
        client_email: user.email,
        client_name: user.full_name,
        event_type: "Wedding",
        event_date: "2025-09-15",
        guest_count: 150,
        budget: 3500,
        location: "The Grand Ballroom, Washington DC",
        notes: "Need a DJ who can play a mix of 80s classics and current hits!",
        status: "pending"
      });
      createdBookingIds.push(booking.id);
      
      await showClick(window.innerWidth / 2, 750, "✓ Submit Booking Request");
      await wait(2000);
      if (stopRequested) return;

      // ===== CLIENT VIEW: BOOKINGS PAGE =====
      setCurrentStep("CLIENT VIEW: Viewing Bookings Page");
      navigate(createPageUrl("Bookings"));
      await wait(3000);
      await showClick(window.innerWidth / 2, 250, "📅 All My Bookings");
      await wait(2000);
      
      setCurrentStep("CLIENT VIEW: Filtering - Pending Bookings");
      await showClick(300, 350, "Filter: Pending", 1500);
      await wait(2000);
      
      setCurrentStep("CLIENT VIEW: Filtering - Accepted Bookings");
      await showClick(450, 350, "Filter: Accepted", 1500);
      await wait(2000);
      
      setCurrentStep("CLIENT VIEW: Filtering - All Bookings");
      await showClick(200, 350, "Filter: All", 1500);
      await wait(2000);
      
      setCurrentStep("CLIENT VIEW: Opening Booking Details");
      await showClick(window.innerWidth / 2, 500, "Click: View Details");
      await wait(3000);
      if (stopRequested) return;

      // ===== VENDOR ACCEPTS BOOKING =====
      setCurrentStep("VENDOR VIEW: Vendor Reviews Booking Request");
      await base44.entities.Booking.update(booking.id, {
        status: "accepted",
        vendor_response: "We're excited to DJ your wedding! Let's schedule a call to discuss your playlist."
      });
      await showClick(window.innerWidth / 2, 550, "✓ Vendor Accepts Booking!", 2000);
      await wait(3000);
      if (stopRequested) return;

      // ===== CLIENT VIEW: VIEW DOCUMENTS =====
      setCurrentStep("CLIENT VIEW: Viewing Invoice");
      await showClick(400, 650, "Click: View Invoice", 2000);
      await wait(3000);
      
      setCurrentStep("CLIENT VIEW: Viewing Service Agreement");
      await showClick(600, 650, "Click: View Contract", 2000);
      await wait(3000);
      if (stopRequested) return;

      // ===== CLIENT VIEW: MESSAGES =====
      setCurrentStep("CLIENT VIEW: Opening Messages");
      navigate(createPageUrl("Messages"));
      await wait(3000);
      await showClick(window.innerWidth / 2, 250, "💬 Messages with Vendors");
      await wait(2000);
      
      setCurrentStep("CLIENT VIEW: Clicking on Conversation");
      await showClick(300, 400, "Click: Open Chat with Vendor", 2000);
      await wait(2000);
      
      setCurrentStep("CLIENT VIEW: Typing Message");
      await showClick(400, window.innerHeight - 200, "Type: Hi! Thanks for accepting...", 2500);
      await wait(1500);
      
      const conversationId = `${user.email}-${testVendor.id}`;
      const msg1 = await base44.entities.Message.create({
        conversation_id: conversationId,
        sender_email: user.email,
        sender_name: user.full_name,
        recipient_email: testVendor.contact_email,
        vendor_id: testVendor.id,
        vendor_name: testVendor.business_name,
        message: "Hi! Thanks for accepting our booking! When can we schedule a call to discuss the playlist?",
        read: false
      });
      createdMessageIds.push(msg1.id);
      
      setCurrentStep("CLIENT VIEW: Sending Message");
      await showClick(window.innerWidth - 200, window.innerHeight - 200, "Click: Send", 1500);
      await wait(2000);
      
      setCurrentStep("CLIENT VIEW: Vendor Replies");
      const msg2 = await base44.entities.Message.create({
        conversation_id: conversationId,
        sender_email: testVendor.contact_email,
        sender_name: testVendor.business_name,
        recipient_email: user.email,
        vendor_id: testVendor.id,
        vendor_name: testVendor.business_name,
        message: "Absolutely! I'm available tomorrow at 2pm or Friday at 10am. Which works better?",
        read: false
      });
      createdMessageIds.push(msg2.id);
      
      await showClick(400, 500, "💬 New Message Received!");
      await wait(3000);
      if (stopRequested) return;

      // ===== VENDOR DASHBOARD VIEW =====
      setCurrentStep("VENDOR VIEW: Switching to Vendor Dashboard");
      navigate(createPageUrl("VendorDashboard"));
      await wait(4000);
      await showClick(window.innerWidth / 2, 300, "📊 Vendor Dashboard - Business Analytics");
      await wait(2000);
      
      setCurrentStep("VENDOR VIEW: Viewing Bookings & Revenue");
      await showClick(300, 450, "View: Total Bookings & Revenue", 2000);
      await wait(3000);
      
      setCurrentStep("VENDOR VIEW: Sales & Revenue Tab");
      await showClick(450, 250, "Click: Sales & Revenue Tab", 2000);
      await wait(3000);
      
      setCurrentStep("VENDOR VIEW: AI Insights Tab");
      await showClick(600, 250, "Click: AI Insights Tab", 2000);
      await wait(3000);
      if (stopRequested) return;

      // ===== EVENT COMPLETE & REVIEW =====
      setCurrentStep("CLIENT VIEW: Event Completed!");
      await base44.entities.Booking.update(booking.id, {
        status: "completed"
      });
      navigate(createPageUrl("Bookings"));
      await wait(2000);
      await showClick(window.innerWidth / 2, 300, "🎉 Event Was Amazing!");
      await wait(2000);
      
      setCurrentStep("CLIENT VIEW: Leaving 5-Star Review");
      await showClick(window.innerWidth / 2, 500, "Click: Leave Review", 2000);
      await wait(2000);
      
      setCurrentStep("CLIENT VIEW: Rating 5 Stars");
      await showClick(400, 400, "★★★★★ Select 5 Stars", 2000);
      await wait(2000);
      
      setCurrentStep("CLIENT VIEW: Typing Review");
      await showClick(400, 550, "Type: Amazing DJ! Best night ever!", 2500);
      await wait(2000);
      
      const review = await base44.entities.Review.create({
        vendor_id: testVendor.id,
        vendor_name: testVendor.business_name,
        client_email: user.email,
        client_name: user.full_name,
        booking_id: booking.id,
        rating: 5,
        description: "Amazing DJ! The music was perfect and all our guests had a blast!"
      });
      createdReviewIds.push(review.id);
      
      setCurrentStep("CLIENT VIEW: Submitting Review");
      await showClick(window.innerWidth / 2, 650, "✓ Submit Review");
      await wait(2000);
      if (stopRequested) return;

      // ===== PROFILE & ABOUT =====
      setCurrentStep("Viewing Profile Page");
      navigate(createPageUrl("Profile"));
      await wait(3000);
      await showClick(window.innerWidth / 2, 300, "👤 User Profile & Settings");
      await wait(2000);
      
      setCurrentStep("Viewing About Page");
      navigate(createPageUrl("About"));
      await wait(3000);
      await showClick(window.innerWidth / 2, 300, "ℹ️ About EVNT Platform");
      await wait(3000);
      if (stopRequested) return;

      // ===== CLEANUP =====
      setCurrentStep("🧹 Cleaning up demo data...");
      navigate(createPageUrl("AdminDashboard"));
      await wait(1000);
      
      // Delete all created entities
      for (const id of createdReviewIds) {
        await base44.entities.Review.delete(id);
      }
      for (const id of createdMessageIds) {
        await base44.entities.Message.delete(id);
      }
      for (const id of createdBookingIds) {
        await base44.entities.Booking.delete(id);
      }
      for (const id of createdSavedIds) {
        await base44.entities.SavedVendor.delete(id);
      }
      for (const id of createdSwipeIds) {
        await base44.entities.UserSwipe.delete(id);
      }
      for (const id of createdVendorIds) {
        await base44.entities.Vendor.delete(id);
      }
      
      setCurrentStep("✅ Demo Complete - All Data Cleaned!");
      await showClick(window.innerWidth / 2, window.innerHeight / 2, "🎬 Demo Complete!", 3000);
      
      toast.success("Demo completed and cleaned up successfully!");
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
    toast.info("Stopping demo...");
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
            <h3 className="text-2xl font-black text-purple-900">Complete Interactive Demo</h3>
            <p className="text-sm text-purple-700 mt-1">
              Full walkthrough with screen changes, clicks, forms, and auto-cleanup
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
              Stop
            </Button>
          )}
        </div>

        {isRunning && (
          <div className="bg-white border-2 border-purple-300 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
              <div className="flex-1">
                <p className="font-bold text-purple-900">{currentStep}</p>
                <p className="text-xs text-purple-600 mt-1">Recording... Watch for click indicators!</p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 bg-white border-2 border-purple-300 rounded-lg p-4">
          <h4 className="font-bold text-purple-900 mb-2">Complete Demo Flow:</h4>
          <ul className="space-y-1 text-sm text-purple-700">
            <li>✓ Creates vendors with photos</li>
            <li>✓ CLIENT: Home → Swipe → Filters → Save vendors</li>
            <li>✓ CLIENT: View details → Create booking (full form)</li>
            <li>✓ CLIENT: Bookings page → Filter by status</li>
            <li>✓ VENDOR: Accepts booking</li>
            <li>✓ CLIENT: View invoice & contract</li>
            <li>✓ CLIENT: Messages (open chat, type, send)</li>
            <li>✓ VENDOR: Dashboard with analytics</li>
            <li>✓ CLIENT: Complete event & leave review</li>
            <li>✓ Auto-cleanup all demo data</li>
          </ul>
          <p className="text-xs text-purple-600 mt-3 font-bold">
            ~3-4 minutes | All screens shown | Click indicators | Auto cleanup!
          </p>
        </div>
      </Card>
    </>
  );
}