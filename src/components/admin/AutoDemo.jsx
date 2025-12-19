import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Play, Square, Loader2, MousePointer2 } from "lucide-react";
import { toast } from "sonner";

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Visual click indicator component
const ClickIndicator = ({ x, y, label }) => (
  <div
    style={{
      position: 'fixed',
      left: `${x}px`,
      top: `${y}px`,
      zIndex: 9999,
      pointerEvents: 'none',
    }}
    className="animate-ping"
  >
    <div className="flex flex-col items-center">
      <MousePointer2 className="w-8 h-8 text-red-600 fill-red-600" />
      {label && (
        <div className="mt-2 bg-black text-white px-3 py-1 rounded-full text-sm font-bold whitespace-nowrap">
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

  const showClick = async (selector, label, duration = 1500) => {
    try {
      const element = document.querySelector(selector);
      if (element) {
        const rect = element.getBoundingClientRect();
        setClickIndicator({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
          label
        });
        await wait(duration);
        setClickIndicator(null);
      }
    } catch (error) {
      console.error("Click indicator error:", error);
    }
  };

  const typeText = async (selector, text, delayBetweenChars = 100) => {
    const element = document.querySelector(selector);
    if (!element) return;

    for (let i = 0; i < text.length; i++) {
      if (stopRequested) return;
      element.value = text.substring(0, i + 1);
      element.dispatchEvent(new Event('input', { bubbles: true }));
      await wait(delayBetweenChars);
    }
    await wait(500);
  };

  const runDemo = async () => {
    setIsRunning(true);
    setStopRequested(false);
    
    try {
      // ========== VENDOR REGISTRATION FLOW ==========
      
      // Step 1: Start from About page
      setCurrentStep("Step 1: Starting on About page...");
      navigate(createPageUrl("About"));
      await wait(3000);
      if (stopRequested) return;

      // Step 2: Navigate to Onboarding
      setCurrentStep("Step 2: User signs up and sees onboarding...");
      navigate(createPageUrl("Onboarding"));
      await wait(3000);
      if (stopRequested) return;

      // Step 3: Click vendor card
      setCurrentStep("Step 3: Choosing 'I'm a Vendor'...");
      await showClick("button:contains('Continue as Vendor')", "Clicking to register as vendor");
      await wait(1000);
      navigate(createPageUrl("VendorRegistration"));
      await wait(2000);
      if (stopRequested) return;

      // Step 4: Fill vendor registration form
      setCurrentStep("Step 4: Filling vendor registration form...");
      await wait(1000);
      
      await typeText('input[placeholder="Your Business Name"]', "Elite Event DJs");
      await wait(800);
      
      setCurrentStep("Step 4: Selecting category...");
      await showClick('button[role="combobox"]', "Selecting DJ category");
      await wait(500);
      
      setCurrentStep("Step 4: Typing business description...");
      await typeText('textarea[placeholder*="Describe your services"]', "Premium DJ services for weddings, corporate events, and parties. 15 years of experience with state-of-the-art sound equipment and lighting. We create unforgettable experiences!");
      await wait(1000);
      
      await typeText('input[type="tel"]', "(555) 987-6543");
      await wait(800);
      
      await typeText('input[type="email"]', "contact@elitedjs.com");
      await wait(800);
      
      await typeText('input[placeholder*="Search your city"]', "Washington, DC");
      await wait(1000);
      
      await typeText('input[placeholder="5"]', "15");
      await wait(800);
      
      await typeText('input[placeholder="2500"]', "3500");
      await wait(1000);
      if (stopRequested) return;

      // Step 5: Upload ID (simulate)
      setCurrentStep("Step 5: Uploading ID verification...");
      const testVendorData = {
        business_name: "Elite Event DJs",
        category: "dj",
        description: "Premium DJ services for weddings, corporate events, and parties. 15 years of experience with state-of-the-art sound equipment and lighting.",
        contact_phone: "(555) 987-6543",
        location: "Washington, DC",
        contact_email: "contact@elitedjs.com",
        id_verification_url: "https://example.com/id.jpg",
        willing_to_travel: true,
        travel_radius: 75,
        years_in_business: 15,
        average_price: 3500,
        insurance_verified: true,
        approval_status: "pending",
        profile_complete: false
      };
      
      await wait(2000);
      if (stopRequested) return;

      // Step 6: Create vendor record
      setCurrentStep("Step 6: Submitting vendor registration...");
      const vendor = await base44.entities.Vendor.create(testVendorData);
      await showClick('button[type="submit"]', "Submitting registration");
      await wait(2000);
      if (stopRequested) return;

      // Step 7: Navigate to pending page
      setCurrentStep("Step 7: Registration submitted - waiting for approval...");
      navigate(createPageUrl("VendorPending"));
      await wait(4000);
      if (stopRequested) return;

      // Step 8: Admin approves vendor
      setCurrentStep("Step 8: Admin reviews and approves vendor...");
      await base44.entities.Vendor.update(vendor.id, { 
        approval_status: "approved",
        profile_complete: false
      });
      await wait(3000);
      if (stopRequested) return;

      // Step 9: Navigate to vendor profile setup
      setCurrentStep("Step 9: Vendor completes their profile...");
      navigate(createPageUrl("VendorProfileSetup"));
      await wait(3000);
      if (stopRequested) return;

      // Step 10: Fill profile setup
      setCurrentStep("Step 10: Uploading vendor photos and setting pricing...");
      await wait(1500);
      
      // Upload main image
      const imageUrl = "https://images.unsplash.com/photo-1571266028243-d220c6c2c0f2?w=800";
      await wait(2000);
      
      // Set pricing
      await showClick('button[role="combobox"]', "Setting price range");
      await wait(1000);
      
      await typeText('input[placeholder*="1500"]', "2500");
      await wait(1000);
      
      await typeText('input[placeholder*="https://"]', "www.elitedjs.com");
      await wait(1500);
      if (stopRequested) return;

      // Step 11: Complete profile
      setCurrentStep("Step 11: Completing vendor profile...");
      await base44.entities.Vendor.update(vendor.id, {
        image_url: imageUrl,
        additional_images: [
          "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800",
          "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800"
        ],
        price_range: "$$",
        starting_price: 2500,
        pricing_type: "package",
        website: "www.elitedjs.com",
        packages: [
          { name: "Basic Package", price: 2500, description: "4 hours of DJ services" },
          { name: "Premium Package", price: 4000, description: "6 hours + lighting" }
        ],
        profile_complete: true,
        specialties: ["Wedding", "Corporate Event", "Birthday"]
      });
      await showClick('button:contains("Complete Profile")', "Saving profile");
      await wait(2000);
      if (stopRequested) return;

      // Step 12: Navigate to vendor dashboard
      setCurrentStep("Step 12: Viewing vendor dashboard...");
      navigate(createPageUrl("VendorDashboard"));
      await wait(4000);
      if (stopRequested) return;

      // ========== CLIENT EXPERIENCE FLOW ==========

      // Step 13: Switch to client view
      setCurrentStep("Step 13: Now experiencing the app as a client...");
      navigate(createPageUrl("Home"));
      await wait(3000);
      if (stopRequested) return;

      // Step 14: Browse home page
      setCurrentStep("Step 14: Client views the home page...");
      await showClick('div:contains("Wedding")', "Looking for wedding vendors");
      await wait(2000);
      if (stopRequested) return;

      // Step 15: Navigate to swipe
      setCurrentStep("Step 15: Starting to browse vendors...");
      navigate(createPageUrl("Swipe"));
      await wait(3000);
      if (stopRequested) return;

      // Step 16: Show filters
      setCurrentStep("Step 16: Using filters to refine search...");
      await showClick('button:contains("Filters")', "Opening filter options");
      await wait(2000);
      if (stopRequested) return;

      // Step 17: Swipe right on vendor
      setCurrentStep("Step 17: Client loves the vendor - swiping right!...");
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
      await showClick('button[class*="rounded-full"]', "Swiping right to save");
      await wait(2000);
      if (stopRequested) return;

      // Step 18: Navigate to saved
      setCurrentStep("Step 18: Viewing saved vendors...");
      navigate(createPageUrl("Saved"));
      await wait(3000);
      if (stopRequested) return;

      // Step 19: View vendor details
      setCurrentStep("Step 19: Opening vendor details...");
      await showClick('button:contains("View Details")', "Viewing full vendor profile");
      await wait(3000);
      if (stopRequested) return;

      // Step 20: Navigate to bookings to book
      setCurrentStep("Step 20: Client creates a booking request...");
      const user = await base44.auth.me();
      
      const booking = await base44.entities.Booking.create({
        vendor_id: vendor.id,
        vendor_name: vendor.business_name,
        client_email: user.email,
        client_name: user.full_name,
        event_type: "Wedding",
        event_date: "2025-08-20",
        guest_count: 200,
        budget: 4000,
        location: "The Grand Ballroom, Washington DC",
        notes: "Looking for a DJ for our wedding reception. We love 80s music and current hits. Need someone who can read the crowd!",
        status: "pending"
      });
      await wait(2000);
      if (stopRequested) return;

      // Step 21: Navigate to bookings page
      setCurrentStep("Step 21: Client views their bookings...");
      navigate(createPageUrl("Bookings"));
      await wait(3000);
      if (stopRequested) return;

      // Step 22: Vendor accepts booking
      setCurrentStep("Step 22: Vendor reviews and accepts the booking...");
      await base44.entities.Booking.update(booking.id, {
        status: "accepted",
        vendor_response: "We'd be honored to DJ your wedding! Can't wait to help make your special day unforgettable. Let's schedule a call to discuss your music preferences!"
      });
      await wait(2000);
      if (stopRequested) return;

      // Step 23: View booking details
      setCurrentStep("Step 23: Viewing booking details and documents...");
      await showClick('button:contains("View Details")', "Opening booking details");
      await wait(2000);
      if (stopRequested) return;

      // Step 24: Show invoice
      setCurrentStep("Step 24: Generating and viewing invoice...");
      await showClick('button:contains("Print Invoice")', "Viewing invoice");
      await wait(3000);
      if (stopRequested) return;

      // Step 25: Show service agreement
      setCurrentStep("Step 25: Viewing service agreement...");
      await showClick('button:contains("Print Service Agreement")', "Viewing contract");
      await wait(3000);
      if (stopRequested) return;

      // Step 26: Navigate to messages
      setCurrentStep("Step 26: Opening messages to chat with vendor...");
      navigate(createPageUrl("Messages"));
      await wait(3000);
      if (stopRequested) return;

      // Step 27: Send message
      setCurrentStep("Step 27: Client sends a message to vendor...");
      const conversationId = `${user.email}-${vendor.id}`;
      
      await wait(1000);
      await typeText('input[placeholder="Type a message..."]', "Hi! Thanks for accepting our booking. When can we schedule a call to discuss the playlist?", 80);
      await wait(1000);
      
      await base44.entities.Message.create({
        conversation_id: conversationId,
        sender_email: user.email,
        sender_name: user.full_name,
        recipient_email: vendor.contact_email,
        vendor_id: vendor.id,
        vendor_name: vendor.business_name,
        message: "Hi! Thanks for accepting our booking. When can we schedule a call to discuss the playlist?",
        read: false
      });
      
      await showClick('button:contains("Send")', "Sending message");
      await wait(2000);
      if (stopRequested) return;

      // Step 28: Vendor replies
      setCurrentStep("Step 28: Vendor responds to the message...");
      await wait(2000);
      
      await base44.entities.Message.create({
        conversation_id: conversationId,
        sender_email: vendor.contact_email,
        sender_name: vendor.business_name,
        recipient_email: user.email,
        vendor_id: vendor.id,
        vendor_name: vendor.business_name,
        message: "Great to hear from you! I'm available tomorrow at 2pm or Friday at 10am. Which works better for you?",
        read: false
      });
      await wait(3000);
      if (stopRequested) return;

      // Step 29: Navigate to event vendors page
      setCurrentStep("Step 29: Browsing vendors by event type...");
      navigate(createPageUrl("EventVendors") + "?event=wedding");
      await wait(4000);
      if (stopRequested) return;

      // Step 30: Navigate back to home
      setCurrentStep("Step 30: Viewing all event categories...");
      navigate(createPageUrl("Home"));
      await wait(3000);
      if (stopRequested) return;

      // Step 31: Complete the booking
      setCurrentStep("Step 31: Event completed - booking marked as complete...");
      await base44.entities.Booking.update(booking.id, {
        status: "completed"
      });
      navigate(createPageUrl("Bookings"));
      await wait(3000);
      if (stopRequested) return;

      // Step 32: Leave a review
      setCurrentStep("Step 32: Client leaves a 5-star review...");
      await wait(1500);
      await showClick('button:contains("Leave Review")', "Opening review form");
      await wait(1000);
      
      await base44.entities.Review.create({
        vendor_id: vendor.id,
        vendor_name: vendor.business_name,
        client_email: user.email,
        client_name: user.full_name,
        booking_id: booking.id,
        rating: 5,
        description: "Elite Event DJs absolutely rocked our wedding! The music selection was perfect, the energy was amazing, and all our guests had a blast on the dance floor. Highly professional and exceeded all our expectations. We couldn't have asked for a better DJ!"
      });
      await wait(3000);
      if (stopRequested) return;

      // Step 33: View vendor dashboard
      setCurrentStep("Step 33: Viewing vendor dashboard with analytics...");
      navigate(createPageUrl("VendorDashboard"));
      await wait(4000);
      if (stopRequested) return;

      // Step 34: View profile
      setCurrentStep("Step 34: Viewing user profile...");
      navigate(createPageUrl("Profile"));
      await wait(3000);
      if (stopRequested) return;

      // Final step
      setCurrentStep("Demo complete! Returning to Admin Dashboard...");
      navigate(createPageUrl("AdminDashboard"));
      await wait(2000);

      toast.success("Demo completed successfully!");
      setCurrentStep("");
      
    } catch (error) {
      console.error("Demo error:", error);
      toast.error("Demo encountered an error: " + error.message);
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
            <h3 className="text-2xl font-black text-purple-900">Automated Demo Tour</h3>
            <p className="text-sm text-purple-700 mt-1">
              Complete walkthrough: Vendor registration → Client browsing → Booking → Messaging → Review
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
                <p className="text-xs text-purple-600 mt-1">Recording in progress... Visual click indicators will show where actions happen</p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 bg-white border-2 border-purple-300 rounded-lg p-4">
          <h4 className="font-bold text-purple-900 mb-2">Complete Demo Flow:</h4>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-purple-700">
            <div>
              <p className="font-bold mb-2">🎤 Vendor Journey:</p>
              <ul className="space-y-1 ml-4">
                <li>• Sign up and registration</li>
                <li>• Fill detailed vendor form</li>
                <li>• Upload ID verification</li>
                <li>• Admin approval process</li>
                <li>• Complete profile with photos</li>
                <li>• Set pricing and packages</li>
                <li>• View dashboard and analytics</li>
              </ul>
            </div>
            <div>
              <p className="font-bold mb-2">👰 Client Journey:</p>
              <ul className="space-y-1 ml-4">
                <li>• Browse home and event types</li>
                <li>• Swipe through vendors</li>
                <li>• Use filters to narrow search</li>
                <li>• Save favorite vendors</li>
                <li>• Create booking request</li>
                <li>• View invoice & contract</li>
                <li>• Message vendor directly</li>
                <li>• Leave review after event</li>
              </ul>
            </div>
          </div>
          <p className="text-xs text-purple-600 mt-3 italic">
            Total duration: ~2-3 minutes. Start your screen recording before clicking "Start Demo". 
            All typing and clicks are shown with visual indicators!
          </p>
        </div>
      </Card>
    </>
  );
}