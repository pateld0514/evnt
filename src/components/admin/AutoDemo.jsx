import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Play, Square, Loader2, MousePointer2 } from "lucide-react";
import { toast } from "sonner";

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Enhanced click indicator with ripple effect
const ClickIndicator = ({ x, y, label }) => (
  <div
    style={{
      position: 'fixed',
      left: `${x}px`,
      top: `${y}px`,
      zIndex: 10000,
      pointerEvents: 'none',
      transform: 'translate(-50%, -50%)'
    }}
  >
    <div className="relative flex flex-col items-center">
      <div className="absolute w-24 h-24 bg-red-500 rounded-full opacity-20 animate-ping"></div>
      <div className="absolute w-16 h-16 bg-red-500 rounded-full opacity-40 animate-ping" style={{ animationDelay: '0.2s' }}></div>
      <MousePointer2 className="w-14 h-14 text-red-600 fill-red-600 drop-shadow-2xl relative z-10" />
      {label && (
        <div className="mt-20 bg-gradient-to-r from-red-600 to-pink-600 text-white px-6 py-3 rounded-xl text-lg font-black whitespace-nowrap shadow-2xl border-4 border-white">
          {label}
        </div>
      )}
    </div>
  </div>
);

// Typing indicator
const TypingIndicator = ({ text }) => (
  <div
    style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 10000,
      pointerEvents: 'none',
    }}
  >
    <div className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow-2xl border-4 border-white">
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
        <span className="font-bold">Typing: {text}</span>
      </div>
    </div>
  </div>
);

export default function AutoDemo() {
  const navigate = useNavigate();
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState("");
  const [stopRequested, setStopRequested] = useState(false);
  const [clickIndicator, setClickIndicator] = useState(null);
  const [typingText, setTypingText] = useState("");

  const showClick = async (x, y, label, duration = 2500) => {
    setClickIndicator({ x, y, label });
    await wait(duration);
    setClickIndicator(null);
    await wait(300);
  };

  const simulateTyping = async (text, charDelay = 80) => {
    setTypingText(text);
    await wait(text.length * charDelay);
    setTypingText("");
    await wait(300);
  };

  const clickElement = async (selector, label) => {
    try {
      const element = document.querySelector(selector);
      if (element) {
        const rect = element.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        await showClick(x, y, label);
        element.click();
      }
    } catch (error) {
      console.error('Click error:', error);
    }
  };

  const runDemo = async () => {
    setIsRunning(true);
    setStopRequested(false);
    
    // Track all created data for cleanup
    let createdData = {
      vendors: [],
      bookings: [],
      messages: [],
      reviews: [],
      saved: [],
      swipes: []
    };
    
    try {
      // ========================================
      // PHASE 1: VENDOR REGISTRATION & SETUP
      // ========================================
      
      setCurrentStep("🎬 PHASE 1: VENDOR REGISTRATION");
      await wait(2000);
      
      // Create test vendor data first
      setCurrentStep("Creating vendor profile data...");
      const vendorData = {
        business_name: "Elite Event DJs",
        category: "dj",
        description: "Premium DJ services for weddings, corporate events, and parties. 15 years of experience with state-of-the-art sound equipment and professional lighting systems.",
        contact_phone: "(555) 987-6543",
        location: "Washington, DC",
        contact_email: "vendor@elitedjs.demo",
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
          { name: "Basic Package", price: 2500, description: "4 hours DJ service with sound system" },
          { name: "Premium Package", price: 4000, description: "6 hours + lighting effects + MC services" }
        ]
      };
      
      const vendor = await base44.entities.Vendor.create(vendorData);
      createdData.vendors.push(vendor.id);
      
      // Create additional vendors for variety
      const photographer = await base44.entities.Vendor.create({
        business_name: "Picture Perfect Photography",
        category: "photographer",
        description: "Award-winning wedding and event photography. We capture your special moments with artistic flair and attention to detail.",
        contact_phone: "(555) 111-2222",
        location: "Arlington, VA",
        contact_email: "contact@pictureperfect.demo",
        image_url: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=800",
        additional_images: ["https://images.unsplash.com/photo-1519741497674-611481863552?w=800"],
        price_range: "$$$$",
        starting_price: 3500,
        average_price: 5000,
        pricing_type: "package",
        approval_status: "approved",
        profile_complete: true,
        specialties: ["Wedding", "Birthday"],
        years_in_business: 10,
        willing_to_travel: true,
        travel_radius: 75
      });
      createdData.vendors.push(photographer.id);
      
      const caterer = await base44.entities.Vendor.create({
        business_name: "Gourmet Catering Co",
        category: "caterer",
        description: "Exquisite catering for all occasions with farm-to-table ingredients and customizable menus.",
        contact_phone: "(555) 333-4444",
        location: "Washington, DC",
        contact_email: "events@gourmetcatering.demo",
        image_url: "https://images.unsplash.com/photo-1555244162-803834f70033?w=800",
        price_range: "$$$",
        starting_price: 75,
        per_person_rate: 85,
        pricing_type: "per_person",
        approval_status: "approved",
        profile_complete: true,
        specialties: ["Wedding", "Corporate Event"],
        years_in_business: 12
      });
      createdData.vendors.push(caterer.id);
      
      await wait(1000);
      if (stopRequested) return;

      // ========================================
      // PHASE 2: CLIENT EXPERIENCE - HOME PAGE
      // ========================================
      
      setCurrentStep("🏠 PHASE 2: CLIENT - Exploring Home Page");
      navigate(createPageUrl("Home"));
      await wait(3000);
      await showClick(window.innerWidth / 2, 200, "🏠 EVNT Home Page");
      await wait(2000);
      
      setCurrentStep("CLIENT: Scrolling through event types");
      await showClick(window.innerWidth / 2, 400, "📋 Browse Event Categories");
      await wait(2000);
      
      setCurrentStep("CLIENT: Viewing 'How It Works' section");
      await showClick(window.innerWidth / 2, 600, "ℹ️ Learn How EVNT Works");
      await wait(3000);
      if (stopRequested) return;

      // ========================================
      // PHASE 3: CLIENT - SWIPE TO DISCOVER
      // ========================================
      
      setCurrentStep("📱 PHASE 3: CLIENT - Opening Swipe Feature");
      navigate(createPageUrl("Swipe"));
      await wait(3000);
      await showClick(window.innerWidth / 2, 150, "📱 Swipe to Discover Vendors");
      await wait(2000);
      
      // Show the filters button
      setCurrentStep("CLIENT: Opening filter options");
      await showClick(window.innerWidth / 2, 250, "🔍 Click: Open Filters", 2000);
      await wait(1500);
      
      // Simulate opening filters (the sheet/dialog)
      setCurrentStep("CLIENT: Filter panel opened");
      await showClick(window.innerWidth - 300, 300, "📋 Filter Options Panel", 2000);
      await wait(2000);
      
      // Category filter
      setCurrentStep("CLIENT: Selecting category filter");
      await showClick(window.innerWidth - 300, 400, "Click: Category Dropdown", 1800);
      await wait(1200);
      await simulateTyping("DJ", 100);
      await showClick(window.innerWidth - 300, 480, "Select: DJ Category", 1800);
      await wait(1500);
      
      // Price range filter  
      setCurrentStep("CLIENT: Selecting price range");
      await showClick(window.innerWidth - 300, 550, "Click: Price Range", 1800);
      await wait(1200);
      await showClick(window.innerWidth - 300, 620, "Select: $$$ Premium", 1800);
      await wait(1500);
      
      // Location filter
      setCurrentStep("CLIENT: Typing location");
      await showClick(window.innerWidth - 300, 720, "Click: Location Field", 1500);
      await wait(800);
      await simulateTyping("Washington, DC", 100);
      await wait(1500);
      
      // Close filters
      setCurrentStep("CLIENT: Applying filters");
      await showClick(window.innerWidth - 100, 150, "✓ Apply Filters", 2000);
      await wait(2000);
      if (stopRequested) return;

      // View vendor card
      setCurrentStep("CLIENT: Viewing vendor profile card");
      await showClick(window.innerWidth / 2, 450, "👀 Viewing: Elite Event DJs", 2500);
      await wait(2500);
      
      // Swipe right
      setCurrentStep("CLIENT: ❤️ SWIPING RIGHT to save vendor!");
      await showClick(window.innerWidth / 2 + 200, window.innerHeight - 250, "❤️ SWIPE RIGHT!", 3000);
      
      const swipe = await base44.entities.UserSwipe.create({
        vendor_id: vendor.id,
        direction: "right",
        event_type: "wedding"
      });
      createdData.swipes.push(swipe.id);
      
      const saved = await base44.entities.SavedVendor.create({
        vendor_id: vendor.id,
        vendor_name: vendor.business_name,
        vendor_category: vendor.category,
        event_type: "wedding"
      });
      createdData.saved.push(saved.id);
      
      await wait(2000);
      if (stopRequested) return;

      // ========================================
      // PHASE 4: CLIENT - SAVED VENDORS
      // ========================================
      
      setCurrentStep("💖 PHASE 4: CLIENT - Viewing Saved Favorites");
      navigate(createPageUrl("Saved"));
      await wait(3000);
      await showClick(window.innerWidth / 2, 200, "💖 My Saved Vendors");
      await wait(2000);
      
      setCurrentStep("CLIENT: Viewing saved vendor card");
      await showClick(400, 450, "📋 Elite Event DJs Card", 2000);
      await wait(2000);
      
      setCurrentStep("CLIENT: Clicking 'View Details'");
      await showClick(350, 600, "👁️ Click: View Details", 2500);
      await wait(2000);
      
      // Details dialog opens
      setCurrentStep("CLIENT: Vendor details dialog opened");
      await showClick(window.innerWidth / 2, 300, "📄 Full Vendor Profile", 2500);
      await wait(2000);
      
      setCurrentStep("CLIENT: Viewing vendor photos");
      await showClick(window.innerWidth / 2, 400, "📸 Professional Photos", 2000);
      await wait(2000);
      
      setCurrentStep("CLIENT: Reading description & specialties");
      await showClick(window.innerWidth / 2, 550, "📝 Services & Experience", 2000);
      await wait(2000);
      
      setCurrentStep("CLIENT: Viewing pricing packages");
      await showClick(window.innerWidth / 2, 650, "💰 Pricing Packages", 2000);
      await wait(2500);
      if (stopRequested) return;

      // ========================================
      // PHASE 5: CLIENT - CREATE BOOKING
      // ========================================
      
      setCurrentStep("📅 PHASE 5: CLIENT - Clicking 'Book Now'");
      await showClick(window.innerWidth / 2, 750, "📅 Click: Book Now", 2500);
      await wait(2000);
      
      // Booking form opens
      setCurrentStep("CLIENT: Booking form opened");
      await showClick(window.innerWidth / 2, 250, "📋 Booking Request Form", 2000);
      await wait(2000);
      
      // Fill out booking form step by step
      setCurrentStep("CLIENT: Selecting event type");
      await showClick(400, 350, "Click: Event Type Dropdown", 1800);
      await wait(1000);
      await showClick(400, 420, "Select: Wedding", 1800);
      await wait(1500);
      
      setCurrentStep("CLIENT: Entering event date");
      await showClick(400, 480, "Click: Date Picker", 1800);
      await wait(1000);
      await showClick(500, 550, "Select: September 15, 2025", 2000);
      await wait(1500);
      
      setCurrentStep("CLIENT: Typing guest count");
      await showClick(400, 580, "Click: Guest Count Field", 1500);
      await wait(800);
      await simulateTyping("150", 120);
      await wait(1500);
      
      setCurrentStep("CLIENT: Entering budget");
      await showClick(400, 650, "Click: Budget Field", 1500);
      await wait(800);
      await simulateTyping("$3,500", 120);
      await wait(1500);
      
      setCurrentStep("CLIENT: Typing location");
      await showClick(400, 720, "Click: Location Field", 1500);
      await wait(800);
      await simulateTyping("The Grand Ballroom, Washington DC", 80);
      await wait(2000);
      
      setCurrentStep("CLIENT: Adding special notes");
      await showClick(400, 820, "Click: Notes Field", 1500);
      await wait(800);
      await simulateTyping("Need a DJ who can play a mix of 80s classics and current hits. Reading the crowd is important!", 70);
      await wait(2500);
      
      setCurrentStep("CLIENT: Submitting booking request");
      await showClick(window.innerWidth / 2, 950, "✓ Click: Submit Booking", 2500);
      
      const user = await base44.auth.me();
      const booking = await base44.entities.Booking.create({
        vendor_id: vendor.id,
        vendor_name: vendor.business_name,
        client_email: user.email,
        client_name: user.full_name,
        event_type: "Wedding",
        event_date: "2025-09-15",
        guest_count: 150,
        budget: 3500,
        location: "The Grand Ballroom, Washington DC",
        notes: "Need a DJ who can play a mix of 80s classics and current hits. Reading the crowd is important!",
        status: "pending"
      });
      createdData.bookings.push(booking.id);
      
      await wait(2000);
      await showClick(window.innerWidth / 2, 500, "✅ Booking Request Sent!", 2500);
      await wait(2000);
      if (stopRequested) return;

      // ========================================
      // PHASE 6: CLIENT - BOOKINGS PAGE
      // ========================================
      
      setCurrentStep("📋 PHASE 6: CLIENT - Opening Bookings Page");
      navigate(createPageUrl("Bookings"));
      await wait(3000);
      await showClick(window.innerWidth / 2, 200, "📋 My Bookings");
      await wait(2000);
      
      setCurrentStep("CLIENT: Viewing status filter tabs");
      await showClick(window.innerWidth / 2, 320, "📊 Filter by Status", 2000);
      await wait(1500);
      
      setCurrentStep("CLIENT: Clicking 'Pending' filter");
      await showClick(350, 320, "Click: Pending Tab", 1800);
      await wait(2000);
      
      setCurrentStep("CLIENT: Viewing pending booking");
      await showClick(window.innerWidth / 2, 500, "⏳ Pending Booking Card", 2000);
      await wait(2000);
      
      setCurrentStep("CLIENT: Clicking 'View Details'");
      await showClick(window.innerWidth - 300, 550, "Click: View Details", 2500);
      await wait(2000);
      
      // Booking details dialog opens
      setCurrentStep("CLIENT: Booking details opened");
      await showClick(window.innerWidth / 2, 300, "📄 Full Booking Details", 2500);
      await wait(2000);
      
      setCurrentStep("CLIENT: Reviewing event information");
      await showClick(window.innerWidth / 2, 450, "📅 Event Date & Location", 2000);
      await wait(2000);
      
      setCurrentStep("CLIENT: Viewing budget & notes");
      await showClick(window.innerWidth / 2, 600, "💰 Budget & Special Requests", 2000);
      await wait(2500);
      if (stopRequested) return;

      // ========================================
      // PHASE 7: VENDOR - ACCEPTS BOOKING
      // ========================================
      
      setCurrentStep("🎤 PHASE 7: VENDOR - Reviews Booking Request");
      await showClick(window.innerWidth / 2, 400, "🔔 Vendor Receives Notification", 2500);
      await wait(2000);
      
      setCurrentStep("VENDOR: Opening vendor response field");
      await showClick(400, 700, "Click: Response Field", 1800);
      await wait(1000);
      
      setCurrentStep("VENDOR: Typing response message");
      await simulateTyping("We're excited to DJ your wedding! Let's schedule a call to discuss your playlist.", 70);
      await wait(2000);
      
      setCurrentStep("VENDOR: Clicking 'Accept Booking'");
      await showClick(window.innerWidth / 2 - 150, 850, "✅ Click: Accept Booking", 2500);
      
      await base44.entities.Booking.update(booking.id, {
        status: "accepted",
        vendor_response: "We're excited to DJ your wedding! Let's schedule a call to discuss your playlist and make sure we play all your favorite songs!"
      });
      
      await wait(2000);
      await showClick(window.innerWidth / 2, 500, "✅ BOOKING ACCEPTED!", 3000);
      await wait(2000);
      if (stopRequested) return;

      // ========================================
      // PHASE 8: CLIENT - VIEW DOCUMENTS
      // ========================================
      
      setCurrentStep("📄 PHASE 8: CLIENT - Viewing Documents");
      await showClick(window.innerWidth / 2, 300, "📄 Documents Section", 2000);
      await wait(1500);
      
      setCurrentStep("CLIENT: Clicking 'View Invoice'");
      await showClick(400, 750, "📄 Click: View Invoice", 2500);
      await wait(3000);
      
      setCurrentStep("CLIENT: Invoice displayed");
      await showClick(window.innerWidth / 2, 400, "💵 Invoice Details", 2500);
      await wait(2500);
      
      setCurrentStep("CLIENT: Closing invoice");
      await showClick(window.innerWidth / 2, 200, "✕ Close", 1500);
      await wait(1000);
      
      setCurrentStep("CLIENT: Clicking 'View Contract'");
      await showClick(600, 750, "📑 Click: Service Agreement", 2500);
      await wait(3000);
      
      setCurrentStep("CLIENT: Contract displayed");
      await showClick(window.innerWidth / 2, 400, "📑 Service Agreement", 2500);
      await wait(2500);
      
      setCurrentStep("CLIENT: Closing contract");
      await showClick(window.innerWidth / 2, 200, "✕ Close", 1500);
      await wait(1000);
      
      // Close details dialog
      await showClick(100, 100, "✕ Close Details", 1500);
      await wait(1000);
      if (stopRequested) return;

      // ========================================
      // PHASE 9: CLIENT - MESSAGES
      // ========================================
      
      setCurrentStep("💬 PHASE 9: CLIENT - Opening Messages");
      navigate(createPageUrl("Messages"));
      await wait(3000);
      await showClick(window.innerWidth / 2, 200, "💬 Messages Inbox");
      await wait(2000);
      
      setCurrentStep("CLIENT: Viewing conversation list");
      await showClick(300, 400, "📋 Conversation List", 2000);
      await wait(1500);
      
      setCurrentStep("CLIENT: Clicking on conversation");
      await showClick(300, 500, "👆 Click: Open Chat with Vendor", 2500);
      await wait(2000);
      
      setCurrentStep("CLIENT: Chat window opened");
      await showClick(window.innerWidth - 400, 300, "💬 Active Conversation", 2500);
      await wait(2000);
      
      setCurrentStep("CLIENT: Clicking message input field");
      await showClick(window.innerWidth - 400, window.innerHeight - 200, "Click: Type Message", 1800);
      await wait(1000);
      
      setCurrentStep("CLIENT: Typing message to vendor");
      await simulateTyping("Hi! Thanks for accepting our booking! When can we schedule a call?", 70);
      await wait(2000);
      
      setCurrentStep("CLIENT: Clicking 'Send' button");
      await showClick(window.innerWidth - 150, window.innerHeight - 200, "📤 Click: Send", 2000);
      
      const conversationId = `${user.email}-${vendor.id}`;
      const msg1 = await base44.entities.Message.create({
        conversation_id: conversationId,
        sender_email: user.email,
        sender_name: user.full_name,
        recipient_email: vendor.contact_email,
        vendor_id: vendor.id,
        vendor_name: vendor.business_name,
        message: "Hi! Thanks for accepting our booking! When can we schedule a call to discuss the playlist?",
        read: false
      });
      createdData.messages.push(msg1.id);
      
      await wait(2000);
      await showClick(window.innerWidth - 400, 500, "✓ Message Sent!", 2000);
      await wait(2000);
      if (stopRequested) return;

      // Vendor replies
      setCurrentStep("VENDOR: Typing reply");
      await wait(1500);
      await showClick(window.innerWidth - 400, 600, "💬 Vendor is typing...", 2000);
      await wait(1500);
      
      const msg2 = await base44.entities.Message.create({
        conversation_id: conversationId,
        sender_email: vendor.contact_email,
        sender_name: vendor.business_name,
        recipient_email: user.email,
        vendor_id: vendor.id,
        vendor_name: vendor.business_name,
        message: "Absolutely! I'm available tomorrow at 2pm or Friday at 10am. Which works better for you?",
        read: false
      });
      createdData.messages.push(msg2.id);
      
      setCurrentStep("CLIENT: New message received!");
      await showClick(window.innerWidth - 400, 650, "✉️ New Message Arrived!", 2500);
      await wait(3000);
      if (stopRequested) return;

      // ========================================
      // PHASE 10: VENDOR DASHBOARD
      // ========================================
      
      setCurrentStep("📊 PHASE 10: VENDOR - Opening Dashboard");
      navigate(createPageUrl("VendorDashboard"));
      await wait(3000);
      await showClick(window.innerWidth / 2, 200, "📊 Vendor Business Dashboard");
      await wait(2000);
      
      setCurrentStep("VENDOR: Viewing overview statistics");
      await showClick(300, 400, "📈 Total Bookings", 2000);
      await wait(1500);
      await showClick(600, 400, "💬 Messages Count", 2000);
      await wait(1500);
      await showClick(900, 400, "✅ Completed Events", 2000);
      await wait(2000);
      
      setCurrentStep("VENDOR: Viewing recent bookings");
      await showClick(400, 650, "📋 Recent Bookings List", 2500);
      await wait(2500);
      
      setCurrentStep("VENDOR: Clicking 'Sales & Revenue' tab");
      await showClick(450, 280, "💰 Click: Sales Tab", 2000);
      await wait(3000);
      
      setCurrentStep("VENDOR: Viewing revenue analytics");
      await showClick(300, 450, "💵 Your Revenue: 92%", 2000);
      await wait(1500);
      await showClick(600, 450, "📊 Avg Booking Value", 2000);
      await wait(1500);
      await showClick(900, 450, "📈 Conversion Rate", 2000);
      await wait(2500);
      
      setCurrentStep("VENDOR: Clicking 'AI Insights' tab");
      await showClick(600, 280, "🤖 Click: AI Insights", 2000);
      await wait(3000);
      
      setCurrentStep("VENDOR: Viewing AI recommendations");
      await showClick(window.innerWidth / 2, 400, "🤖 AI-Powered Business Insights", 2500);
      await wait(3000);
      if (stopRequested) return;

      // ========================================
      // PHASE 11: EVENT COMPLETE & REVIEW
      // ========================================
      
      setCurrentStep("🎉 PHASE 11: EVENT DAY - Marking Complete");
      await base44.entities.Booking.update(booking.id, {
        status: "completed"
      });
      
      navigate(createPageUrl("Bookings"));
      await wait(3000);
      await showClick(window.innerWidth / 2, 300, "🎉 Event Was A Success!");
      await wait(2000);
      
      setCurrentStep("CLIENT: Clicking 'Leave Review' button");
      await showClick(window.innerWidth - 250, 550, "⭐ Click: Leave Review", 2500);
      await wait(2000);
      
      setCurrentStep("CLIENT: Review dialog opened");
      await showClick(window.innerWidth / 2, 300, "⭐ Review Form", 2000);
      await wait(1500);
      
      setCurrentStep("CLIENT: Selecting 5 stars");
      await showClick(window.innerWidth / 2, 400, "Click: ⭐", 300);
      await wait(200);
      await showClick(window.innerWidth / 2 + 40, 400, "Click: ⭐", 300);
      await wait(200);
      await showClick(window.innerWidth / 2 + 80, 400, "Click: ⭐", 300);
      await wait(200);
      await showClick(window.innerWidth / 2 + 120, 400, "Click: ⭐", 300);
      await wait(200);
      await showClick(window.innerWidth / 2 + 160, 400, "Click: ⭐", 300);
      await wait(1000);
      
      setCurrentStep("CLIENT: Rating: ⭐⭐⭐⭐⭐ 5 STARS!");
      await showClick(window.innerWidth / 2, 400, "★★★★★ PERFECT!", 2500);
      await wait(2000);
      
      setCurrentStep("CLIENT: Typing review");
      await showClick(window.innerWidth / 2, 550, "Click: Review Field", 1500);
      await wait(1000);
      await simulateTyping("Amazing DJ! The music was perfect and all our guests had an incredible time dancing!", 70);
      await wait(2500);
      
      setCurrentStep("CLIENT: Submitting review");
      await showClick(window.innerWidth / 2, 700, "✓ Click: Submit Review", 2500);
      
      const review = await base44.entities.Review.create({
        vendor_id: vendor.id,
        vendor_name: vendor.business_name,
        client_email: user.email,
        client_name: user.full_name,
        booking_id: booking.id,
        rating: 5,
        description: "Amazing DJ! The music was perfect and all our guests had an incredible time dancing all night. Super professional and exceeded all our expectations!"
      });
      createdData.reviews.push(review.id);
      
      await wait(2000);
      await showClick(window.innerWidth / 2, 500, "✅ Review Submitted!", 2500);
      await wait(2000);
      if (stopRequested) return;

      // ========================================
      // PHASE 12: ADDITIONAL PAGES
      // ========================================
      
      setCurrentStep("👤 Viewing Profile Page");
      navigate(createPageUrl("Profile"));
      await wait(3000);
      await showClick(window.innerWidth / 2, 300, "👤 User Profile & Settings");
      await wait(2500);
      
      setCurrentStep("ℹ️ Viewing About Page");
      navigate(createPageUrl("About"));
      await wait(3000);
      await showClick(window.innerWidth / 2, 300, "ℹ️ About EVNT Platform");
      await wait(2000);
      await showClick(window.innerWidth / 2, 500, "📖 How It Works", 2000);
      await wait(2000);
      await showClick(window.innerWidth / 2, 700, "💳 Pricing & Fees", 2000);
      await wait(3000);
      
      setCurrentStep("🔍 Viewing Event Vendors Page");
      navigate(createPageUrl("EventVendors") + "?event=wedding");
      await wait(3000);
      await showClick(window.innerWidth / 2, 250, "💒 Wedding Vendors Gallery");
      await wait(3000);
      if (stopRequested) return;

      // ========================================
      // PHASE 13: CLEANUP
      // ========================================
      
      setCurrentStep("🧹 Cleaning up demo data...");
      navigate(createPageUrl("AdminDashboard"));
      await wait(2000);
      
      // Delete in reverse dependency order
      for (const id of createdData.reviews) {
        await base44.entities.Review.delete(id);
      }
      for (const id of createdData.messages) {
        await base44.entities.Message.delete(id);
      }
      for (const id of createdData.bookings) {
        await base44.entities.Booking.delete(id);
      }
      for (const id of createdData.saved) {
        await base44.entities.SavedVendor.delete(id);
      }
      for (const id of createdData.swipes) {
        await base44.entities.UserSwipe.delete(id);
      }
      for (const id of createdData.vendors) {
        await base44.entities.Vendor.delete(id);
      }
      
      await wait(1500);
      
      setCurrentStep("✅ DEMO COMPLETE - All Data Cleaned!");
      await showClick(window.innerWidth / 2, window.innerHeight / 2, "🎬 THAT'S A WRAP!", 4000);
      
      toast.success("Demo completed successfully! All data cleaned.");
      setCurrentStep("");
      
    } catch (error) {
      console.error("Demo error:", error);
      toast.error("Demo error: " + error.message);
      setCurrentStep("❌ Error: " + error.message);
    } finally {
      setIsRunning(false);
      setStopRequested(false);
      setClickIndicator(null);
      setTypingText("");
    }
  };

  const stopDemo = () => {
    setStopRequested(true);
    toast.info("Stopping demo after current step...");
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
      
      {typingText && <TypingIndicator text={typingText} />}
      
      <Card className="border-2 border-purple-600 bg-gradient-to-br from-purple-50 to-pink-50 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-2xl font-black text-purple-900">🎬 Investor Demo - Complete Walkthrough</h3>
            <p className="text-sm text-purple-700 mt-1">
              Every click, keystroke, screen, and transition shown in detail
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
                <p className="text-xs text-purple-600 mt-1">⏺️ Recording in progress - Every action is shown!</p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 bg-white border-2 border-purple-300 rounded-lg p-4">
          <h4 className="font-bold text-purple-900 mb-3">📋 Complete Demo Flow:</h4>
          <div className="grid md:grid-cols-2 gap-3 text-sm text-purple-700">
            <div className="space-y-1">
              <p className="font-bold">✅ Phase 1-6: Client Journey</p>
              <ul className="ml-4 space-y-0.5">
                <li>• Home page exploration</li>
                <li>• Swipe with all filters shown</li>
                <li>• Save vendors & view details</li>
                <li>• Full booking form (every field)</li>
                <li>• Bookings page & status filters</li>
                <li>• View documents (invoice & contract)</li>
              </ul>
            </div>
            <div className="space-y-1">
              <p className="font-bold">✅ Phase 7-13: Vendor & Completion</p>
              <ul className="ml-4 space-y-0.5">
                <li>• Vendor accepts with response</li>
                <li>• Messages (open chat, type, send)</li>
                <li>• Vendor dashboard & analytics</li>
                <li>• Sales & AI insights tabs</li>
                <li>• Event complete & 5-star review</li>
                <li>• Profile & About pages</li>
                <li>• Auto-cleanup all test data</li>
              </ul>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t-2 border-purple-200">
            <p className="text-xs font-bold text-purple-800">
              🎥 Duration: 4-5 minutes | ⭐ Every click shown | ⌨️ Every keystroke visible | 📱 All screens | 🧹 Auto-cleanup | 
              💼 Investor-ready quality
            </p>
          </div>
        </div>
      </Card>
    </>
  );
}