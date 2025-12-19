import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Play, Square, Loader2 } from "lucide-react";
import { toast } from "sonner";

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export default function AutoDemo() {
  const navigate = useNavigate();
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState("");
  const [stopRequested, setStopRequested] = useState(false);

  const runDemo = async () => {
    setIsRunning(true);
    setStopRequested(false);
    
    try {
      // Step 1: Create test vendor
      setCurrentStep("Creating test vendor...");
      await wait(2000);
      
      const testVendor = await base44.entities.Vendor.create({
        business_name: "Demo DJ Services",
        category: "dj",
        description: "Professional DJ service for all types of events. We bring the energy and keep your guests dancing all night long!",
        contact_phone: "(555) 123-4567",
        location: "Washington, DC",
        contact_email: "demo@djservices.com",
        image_url: "https://images.unsplash.com/photo-1571266028243-d220c6c2c0f2?w=800",
        price_range: "$$",
        starting_price: 1500,
        average_price: 2500,
        pricing_type: "hourly",
        hourly_rate: 250,
        willing_to_travel: true,
        travel_radius: 50,
        years_in_business: 8,
        insurance_verified: true,
        approval_status: "approved",
        profile_complete: true,
        specialties: ["Wedding", "Birthday", "Corporate Event"]
      });

      if (stopRequested) return;
      await wait(2000);

      // Step 2: Navigate to Home (Client View)
      setCurrentStep("Navigating to Home page...");
      navigate(createPageUrl("Home"));
      await wait(3000);

      if (stopRequested) return;

      // Step 3: Navigate to Swipe
      setCurrentStep("Browsing vendors on Swipe page...");
      navigate(createPageUrl("Swipe"));
      await wait(4000);

      if (stopRequested) return;

      // Step 4: Save the vendor (simulate swipe right)
      setCurrentStep("Swiping right to save vendor...");
      await base44.entities.UserSwipe.create({
        vendor_id: testVendor.id,
        direction: "right",
        event_type: "wedding"
      });
      
      await base44.entities.SavedVendor.create({
        vendor_id: testVendor.id,
        vendor_name: testVendor.business_name,
        vendor_category: testVendor.category,
        event_type: "wedding"
      });
      await wait(2000);

      if (stopRequested) return;

      // Step 5: Navigate to Saved
      setCurrentStep("Viewing saved vendors...");
      navigate(createPageUrl("Saved"));
      await wait(4000);

      if (stopRequested) return;

      // Step 6: Create a booking
      setCurrentStep("Creating a booking...");
      const user = await base44.auth.me();
      
      const testBooking = await base44.entities.Booking.create({
        vendor_id: testVendor.id,
        vendor_name: testVendor.business_name,
        client_email: user.email,
        client_name: user.full_name,
        event_type: "Wedding",
        event_date: "2025-06-15",
        guest_count: 150,
        budget: 2500,
        location: "Washington, DC",
        notes: "Looking for a DJ for our wedding reception. Need someone who can play a mix of classic hits and current music.",
        status: "pending"
      });
      await wait(2000);

      if (stopRequested) return;

      // Step 7: Navigate to Bookings
      setCurrentStep("Viewing bookings page...");
      navigate(createPageUrl("Bookings"));
      await wait(4000);

      if (stopRequested) return;

      // Step 8: Accept the booking (vendor perspective)
      setCurrentStep("Accepting booking as vendor...");
      await base44.entities.Booking.update(testBooking.id, {
        status: "accepted",
        vendor_response: "Thank you for choosing us! We're excited to make your wedding unforgettable!"
      });
      await wait(3000);

      if (stopRequested) return;

      // Step 9: Navigate to Messages
      setCurrentStep("Opening messages...");
      navigate(createPageUrl("Messages"));
      await wait(3000);

      if (stopRequested) return;

      // Step 10: Create a conversation
      setCurrentStep("Sending message to vendor...");
      const conversationId = `${user.email}-${testVendor.id}`;
      
      await base44.entities.Message.create({
        conversation_id: conversationId,
        sender_email: user.email,
        sender_name: user.full_name,
        recipient_email: testVendor.contact_email,
        vendor_id: testVendor.id,
        vendor_name: testVendor.business_name,
        message: "Hi! I just booked you for our wedding. Can we schedule a call to discuss the music playlist?",
        read: false
      });
      await wait(2000);

      if (stopRequested) return;

      // Step 11: Reply from vendor
      setCurrentStep("Receiving vendor reply...");
      await wait(1000);
      
      await base44.entities.Message.create({
        conversation_id: conversationId,
        sender_email: testVendor.contact_email,
        sender_name: testVendor.business_name,
        recipient_email: user.email,
        vendor_id: testVendor.id,
        vendor_name: testVendor.business_name,
        message: "Absolutely! I'd love to discuss your preferences. Are you available this week for a quick call?",
        read: false
      });
      await wait(3000);

      if (stopRequested) return;

      // Step 12: Navigate to Event Vendors page
      setCurrentStep("Browsing event vendors by category...");
      navigate(createPageUrl("EventVendors") + "?event=wedding");
      await wait(4000);

      if (stopRequested) return;

      // Step 13: Navigate to Vendor Dashboard
      setCurrentStep("Viewing vendor dashboard...");
      navigate(createPageUrl("VendorDashboard"));
      await wait(4000);

      if (stopRequested) return;

      // Step 14: Complete the booking
      setCurrentStep("Completing the booking...");
      await base44.entities.Booking.update(testBooking.id, {
        status: "completed"
      });
      await wait(2000);

      if (stopRequested) return;

      // Step 15: Leave a review
      setCurrentStep("Client leaving a review...");
      await base44.entities.Review.create({
        vendor_id: testVendor.id,
        vendor_name: testVendor.business_name,
        client_email: user.email,
        client_name: user.full_name,
        booking_id: testBooking.id,
        rating: 5,
        description: "Amazing DJ! Everyone at our wedding had a blast. Very professional and played exactly what we wanted. Highly recommend!"
      });
      await wait(2000);

      if (stopRequested) return;

      // Step 16: Navigate back to Admin Dashboard
      setCurrentStep("Returning to Admin Dashboard...");
      navigate(createPageUrl("AdminDashboard"));
      await wait(3000);

      if (stopRequested) return;

      // Step 17: Navigate to Profile
      setCurrentStep("Viewing profile page...");
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
    }
  };

  const stopDemo = () => {
    setStopRequested(true);
    setCurrentStep("Stopping demo...");
    toast.info("Demo will stop after current step");
  };

  return (
    <Card className="border-2 border-purple-600 bg-gradient-to-br from-purple-50 to-pink-50 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-2xl font-black text-purple-900">Automated Demo Tour</h3>
          <p className="text-sm text-purple-700 mt-1">
            Watch an automated walkthrough of all features with test data
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
            <div>
              <p className="font-bold text-purple-900">{currentStep}</p>
              <p className="text-xs text-purple-600 mt-1">Recording in progress...</p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 bg-white border-2 border-purple-300 rounded-lg p-4">
        <h4 className="font-bold text-purple-900 mb-2">Demo Flow:</h4>
        <ul className="space-y-1 text-sm text-purple-700">
          <li>• Creates test vendor with complete profile</li>
          <li>• Navigates through Home, Swipe, and browsing features</li>
          <li>• Saves vendor to favorites</li>
          <li>• Creates and accepts a booking</li>
          <li>• Demonstrates messaging between client and vendor</li>
          <li>• Shows vendor dashboard and analytics</li>
          <li>• Completes booking and leaves review</li>
          <li>• Tours all major pages and features</li>
        </ul>
        <p className="text-xs text-purple-600 mt-3 italic">
          Total duration: ~60 seconds. Start your screen recording before clicking "Start Demo"
        </p>
      </div>
    </Card>
  );
}