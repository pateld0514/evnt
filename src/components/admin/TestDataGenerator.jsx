import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Database, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function TestDataGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [testResults, setTestResults] = useState([]);

  const addTestResult = (test, success, error = null) => {
    setTestResults(prev => [...prev, { test, success, error, timestamp: new Date() }]);
  };

  const generateTestData = async () => {
    setIsGenerating(true);
    setTestResults([]);

    try {
      // ===== TEST 1: Create Multiple Vendors =====
      addTestResult("Creating 5 diverse vendors", true);
      
      const vendors = await Promise.all([
        base44.entities.Vendor.create({
          business_name: "Stellar Sounds DJ",
          category: "dj",
          description: "Professional DJ service specializing in weddings and corporate events. 15+ years experience with top-tier sound systems.",
          contact_phone: "(202) 555-0101",
          location: "Washington, DC",
          contact_email: "contact@stellarsounds.com",
          image_url: "https://images.unsplash.com/photo-1571266028243-d220c6c2c0f2?w=800",
          additional_images: ["https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800"],
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
          specialties: ["Wedding", "Corporate Event"],
          website: "www.stellarsounds.com",
          packages: [
            { name: "Basic Package", price: 2500, description: "4 hours DJ service" },
            { name: "Premium Package", price: 4000, description: "6 hours + lighting" }
          ]
        }),
        base44.entities.Vendor.create({
          business_name: "Picture Perfect Photography",
          category: "photographer",
          description: "Award-winning wedding and event photography. Capturing your special moments with artistic flair.",
          contact_phone: "(202) 555-0102",
          location: "Arlington, VA",
          contact_email: "info@pictureperfect.com",
          image_url: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=800",
          additional_images: ["https://images.unsplash.com/photo-1519741497674-611481863552?w=800"],
          price_range: "$$$$",
          starting_price: 3500,
          average_price: 5000,
          pricing_type: "package",
          willing_to_travel: true,
          travel_radius: 75,
          years_in_business: 10,
          insurance_verified: true,
          approval_status: "approved",
          profile_complete: true,
          specialties: ["Wedding", "Birthday", "Corporate Event"],
          website: "www.pictureperfect.com",
          packages: [
            { name: "Standard Package", price: 3500, description: "8 hours coverage" },
            { name: "Deluxe Package", price: 5500, description: "Full day + engagement shoot" }
          ]
        }),
        base44.entities.Vendor.create({
          business_name: "Gourmet Catering Co",
          category: "caterer",
          description: "Exquisite catering services for all occasions. Farm-to-table ingredients, customizable menus.",
          contact_phone: "(202) 555-0103",
          location: "Washington, DC",
          contact_email: "events@gourmetcatering.com",
          image_url: "https://images.unsplash.com/photo-1555244162-803834f70033?w=800",
          additional_images: ["https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800"],
          price_range: "$$$",
          starting_price: 75,
          average_price: 100,
          pricing_type: "per_person",
          per_person_rate: 85,
          willing_to_travel: false,
          years_in_business: 12,
          insurance_verified: true,
          approval_status: "approved",
          profile_complete: true,
          specialties: ["Wedding", "Corporate Event", "Anniversary"],
          website: "www.gourmetcatering.com"
        }),
        base44.entities.Vendor.create({
          business_name: "Balloon Bliss Decorators",
          category: "balloon_decorator",
          description: "Creative balloon decorations and installations for any event. From elegant to whimsical!",
          contact_phone: "(202) 555-0104",
          location: "Bethesda, MD",
          contact_email: "hello@balloonbliss.com",
          image_url: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800",
          additional_images: ["https://images.unsplash.com/photo-1464347601390-25e5d5ba3829?w=800"],
          price_range: "$$",
          starting_price: 500,
          average_price: 1200,
          pricing_type: "package",
          willing_to_travel: true,
          travel_radius: 30,
          years_in_business: 5,
          insurance_verified: true,
          approval_status: "approved",
          profile_complete: true,
          specialties: ["Birthday", "Baby Shower", "Sweet 16"],
          website: "www.balloonbliss.com",
          packages: [
            { name: "Basic Decor", price: 500, description: "Balloon arch + centerpieces" },
            { name: "Full Setup", price: 1500, description: "Complete venue decoration" }
          ]
        }),
        base44.entities.Vendor.create({
          business_name: "Grand Palace Banquet Hall",
          category: "banquet_hall",
          description: "Elegant banquet hall accommodating up to 500 guests. Full service venue with in-house catering options.",
          contact_phone: "(202) 555-0105",
          location: "Washington, DC",
          contact_email: "bookings@grandpalace.com",
          image_url: "https://images.unsplash.com/photo-1519167758481-83f29da8856f?w=800",
          additional_images: ["https://images.unsplash.com/photo-1478147427282-58a87a120781?w=800"],
          price_range: "$$$$",
          starting_price: 5000,
          average_price: 8000,
          pricing_type: "fixed",
          willing_to_travel: false,
          years_in_business: 20,
          insurance_verified: true,
          approval_status: "approved",
          profile_complete: true,
          specialties: ["Wedding", "Corporate Event", "Anniversary"],
          website: "www.grandpalace.com"
        })
      ]);

      // ===== TEST 2: Create Multiple Client Bookings =====
      addTestResult("Creating 8 bookings with different statuses", true);
      
      const user = await base44.auth.me();
      
      const bookings = await Promise.all([
        base44.entities.Booking.create({
          vendor_id: vendors[0].id,
          vendor_name: vendors[0].business_name,
          client_email: user.email,
          client_name: user.full_name,
          event_type: "Wedding",
          event_date: "2025-09-15",
          guest_count: 150,
          budget: 3500,
          location: "The Grand Ballroom, DC",
          notes: "Need DJ for wedding reception, mix of classic and modern music",
          status: "pending"
        }),
        base44.entities.Booking.create({
          vendor_id: vendors[1].id,
          vendor_name: vendors[1].business_name,
          client_email: user.email,
          client_name: user.full_name,
          event_type: "Wedding",
          event_date: "2025-09-15",
          guest_count: 150,
          budget: 4500,
          location: "The Grand Ballroom, DC",
          notes: "Full day photography coverage needed",
          status: "accepted",
          vendor_response: "We'd love to capture your special day! Let's schedule a consultation."
        }),
        base44.entities.Booking.create({
          vendor_id: vendors[2].id,
          vendor_name: vendors[2].business_name,
          client_email: user.email,
          client_name: user.full_name,
          event_type: "Wedding",
          event_date: "2025-09-15",
          guest_count: 150,
          budget: 12000,
          location: "The Grand Ballroom, DC",
          notes: "Need catering for 150 guests, prefer Italian cuisine",
          status: "accepted",
          vendor_response: "Perfect! We'll create a custom Italian menu for your event."
        }),
        base44.entities.Booking.create({
          vendor_id: vendors[0].id,
          vendor_name: vendors[0].business_name,
          client_email: "sarah.johnson@email.com",
          client_name: "Sarah Johnson",
          event_type: "Corporate Event",
          event_date: "2025-07-20",
          guest_count: 200,
          budget: 3000,
          location: "Downtown Conference Center",
          notes: "Corporate gala, need upbeat music",
          status: "completed",
          vendor_response: "Thank you for choosing us!"
        }),
        base44.entities.Booking.create({
          vendor_id: vendors[3].id,
          vendor_name: vendors[3].business_name,
          client_email: user.email,
          client_name: user.full_name,
          event_type: "Birthday",
          event_date: "2025-08-10",
          guest_count: 50,
          budget: 1200,
          location: "Home backyard",
          notes: "Sweet 16 party, need pink and gold theme",
          status: "pending"
        }),
        base44.entities.Booking.create({
          vendor_id: vendors[4].id,
          vendor_name: vendors[4].business_name,
          client_email: "michael.chen@email.com",
          client_name: "Michael Chen",
          event_type: "Wedding",
          event_date: "2025-10-05",
          guest_count: 300,
          budget: 8000,
          location: "Grand Palace Banquet Hall",
          notes: "Need venue for fall wedding",
          status: "accepted",
          vendor_response: "Your date is available! We'll make it magical."
        }),
        base44.entities.Booking.create({
          vendor_id: vendors[1].id,
          vendor_name: vendors[1].business_name,
          client_email: "emily.davis@email.com",
          client_name: "Emily Davis",
          event_type: "Baby Shower",
          event_date: "2025-06-15",
          guest_count: 30,
          budget: 800,
          location: "Private residence",
          notes: "Small intimate baby shower",
          status: "declined",
          vendor_response: "Unfortunately we're fully booked for that date."
        }),
        base44.entities.Booking.create({
          vendor_id: vendors[2].id,
          vendor_name: vendors[2].business_name,
          client_email: "james.wilson@email.com",
          client_name: "James Wilson",
          event_type: "Anniversary",
          event_date: "2025-05-20",
          guest_count: 75,
          budget: 5000,
          location: "Garden venue",
          notes: "50th anniversary celebration",
          status: "completed",
          vendor_response: "It was an honor to cater your special celebration!"
        })
      ]);

      // ===== TEST 3: Create Multiple Message Conversations =====
      addTestResult("Creating 6 separate message conversations", true);
      
      await Promise.all([
        // Conversation 1: User with DJ
        base44.entities.Message.create({
          conversation_id: `${user.email}-${vendors[0].id}`,
          sender_email: user.email,
          sender_name: user.full_name,
          recipient_email: vendors[0].contact_email,
          vendor_id: vendors[0].id,
          vendor_name: vendors[0].business_name,
          message: "Hi! What's your availability for September 15th?",
          read: false
        }),
        base44.entities.Message.create({
          conversation_id: `${user.email}-${vendors[0].id}`,
          sender_email: vendors[0].contact_email,
          sender_name: vendors[0].business_name,
          recipient_email: user.email,
          vendor_id: vendors[0].id,
          vendor_name: vendors[0].business_name,
          message: "Hi! Yes, we're available on September 15th. Would love to discuss your music preferences!",
          read: false
        }),
        base44.entities.Message.create({
          conversation_id: `${user.email}-${vendors[0].id}`,
          sender_email: user.email,
          sender_name: user.full_name,
          recipient_email: vendors[0].contact_email,
          vendor_id: vendors[0].id,
          vendor_name: vendors[0].business_name,
          message: "Great! We love 80s music and current top 40. Can you handle both?",
          read: false
        }),

        // Conversation 2: User with Photographer
        base44.entities.Message.create({
          conversation_id: `${user.email}-${vendors[1].id}`,
          sender_email: user.email,
          sender_name: user.full_name,
          recipient_email: vendors[1].contact_email,
          vendor_id: vendors[1].id,
          vendor_name: vendors[1].business_name,
          message: "Do you offer engagement photo shoots?",
          read: false
        }),
        base44.entities.Message.create({
          conversation_id: `${user.email}-${vendors[1].id}`,
          sender_email: vendors[1].contact_email,
          sender_name: vendors[1].business_name,
          recipient_email: user.email,
          vendor_id: vendors[1].id,
          vendor_name: vendors[1].business_name,
          message: "Absolutely! Our Deluxe Package includes a complimentary engagement session.",
          read: false
        }),

        // Conversation 3: Sarah with DJ
        base44.entities.Message.create({
          conversation_id: `sarah.johnson@email.com-${vendors[0].id}`,
          sender_email: "sarah.johnson@email.com",
          sender_name: "Sarah Johnson",
          recipient_email: vendors[0].contact_email,
          vendor_id: vendors[0].id,
          vendor_name: vendors[0].business_name,
          message: "Thank you for the amazing service at our corporate event!",
          read: true
        }),

        // Conversation 4: User with Caterer
        base44.entities.Message.create({
          conversation_id: `${user.email}-${vendors[2].id}`,
          sender_email: user.email,
          sender_name: user.full_name,
          recipient_email: vendors[2].contact_email,
          vendor_id: vendors[2].id,
          vendor_name: vendors[2].business_name,
          message: "Can you accommodate vegetarian and gluten-free options?",
          read: false
        }),
        base44.entities.Message.create({
          conversation_id: `${user.email}-${vendors[2].id}`,
          sender_email: vendors[2].contact_email,
          sender_name: vendors[2].business_name,
          recipient_email: user.email,
          vendor_id: vendors[2].id,
          vendor_name: vendors[2].business_name,
          message: "Of course! We have extensive options for all dietary restrictions. Let's set up a tasting!",
          read: false
        }),

        // Conversation 5: Michael with Venue
        base44.entities.Message.create({
          conversation_id: `michael.chen@email.com-${vendors[4].id}`,
          sender_email: "michael.chen@email.com",
          sender_name: "Michael Chen",
          recipient_email: vendors[4].contact_email,
          vendor_id: vendors[4].id,
          vendor_name: vendors[4].business_name,
          message: "What's included in the venue rental?",
          read: false
        }),
        base44.entities.Message.create({
          conversation_id: `michael.chen@email.com-${vendors[4].id}`,
          sender_email: vendors[4].contact_email,
          sender_name: vendors[4].business_name,
          recipient_email: "michael.chen@email.com",
          vendor_id: vendors[4].id,
          vendor_name: vendors[4].business_name,
          message: "The rental includes tables, chairs, linens, sound system, and a dedicated event coordinator!",
          read: false
        }),

        // Conversation 6: User with Balloon Decorator
        base44.entities.Message.create({
          conversation_id: `${user.email}-${vendors[3].id}`,
          sender_email: user.email,
          sender_name: user.full_name,
          recipient_email: vendors[3].contact_email,
          vendor_id: vendors[3].id,
          vendor_name: vendors[3].business_name,
          message: "I love your work! Can you do a balloon wall for photos?",
          read: false
        })
      ]);

      // ===== TEST 4: Create Reviews =====
      addTestResult("Creating 5 reviews with different ratings", true);
      
      await Promise.all([
        base44.entities.Review.create({
          vendor_id: vendors[0].id,
          vendor_name: vendors[0].business_name,
          client_email: "sarah.johnson@email.com",
          client_name: "Sarah Johnson",
          booking_id: bookings[3].id,
          rating: 5,
          description: "Stellar Sounds absolutely rocked our corporate event! The DJ read the room perfectly and kept everyone dancing. Highly professional!"
        }),
        base44.entities.Review.create({
          vendor_id: vendors[1].id,
          vendor_name: vendors[1].business_name,
          client_email: user.email,
          client_name: user.full_name,
          booking_id: bookings[1].id,
          rating: 5,
          description: "Amazing photographer! Captured every special moment beautifully. The photos exceeded our expectations!"
        }),
        base44.entities.Review.create({
          vendor_id: vendors[2].id,
          vendor_name: vendors[2].business_name,
          client_email: "james.wilson@email.com",
          client_name: "James Wilson",
          booking_id: bookings[7].id,
          rating: 5,
          description: "Food was incredible! All our guests raved about the catering. Service was impeccable too."
        }),
        base44.entities.Review.create({
          vendor_id: vendors[4].id,
          vendor_name: vendors[4].business_name,
          client_email: "michael.chen@email.com",
          client_name: "Michael Chen",
          booking_id: bookings[5].id,
          rating: 4,
          description: "Beautiful venue with excellent staff. Only minor issue was parking, but overall great experience."
        }),
        base44.entities.Review.create({
          vendor_id: vendors[0].id,
          vendor_name: vendors[0].business_name,
          client_email: user.email,
          client_name: user.full_name,
          booking_id: bookings[0].id,
          rating: 5,
          description: "Best DJ we could have asked for! Great music selection and kept the party going all night!"
        })
      ]);

      // ===== TEST 5: Create Saved Vendors =====
      addTestResult("Creating saved vendors for testing", true);
      
      await Promise.all([
        base44.entities.SavedVendor.create({
          vendor_id: vendors[0].id,
          vendor_name: vendors[0].business_name,
          vendor_category: vendors[0].category,
          event_type: "wedding",
          notes: "Great reviews, within budget"
        }),
        base44.entities.SavedVendor.create({
          vendor_id: vendors[1].id,
          vendor_name: vendors[1].business_name,
          vendor_category: vendors[1].category,
          event_type: "wedding",
          notes: "Love their portfolio"
        }),
        base44.entities.SavedVendor.create({
          vendor_id: vendors[2].id,
          vendor_name: vendors[2].business_name,
          vendor_category: vendors[2].category,
          event_type: "wedding"
        })
      ]);

      // ===== TEST 6: Create User Swipes =====
      addTestResult("Creating swipe history", true);
      
      await Promise.all([
        base44.entities.UserSwipe.create({
          vendor_id: vendors[0].id,
          direction: "right",
          event_type: "wedding"
        }),
        base44.entities.UserSwipe.create({
          vendor_id: vendors[1].id,
          direction: "right",
          event_type: "wedding"
        }),
        base44.entities.UserSwipe.create({
          vendor_id: vendors[2].id,
          direction: "right",
          event_type: "wedding"
        }),
        base44.entities.UserSwipe.create({
          vendor_id: vendors[3].id,
          direction: "left",
          event_type: "birthday"
        })
      ]);

      addTestResult("All test data generated successfully!", true);
      toast.success("Test data created successfully!");

    } catch (error) {
      console.error("Test data generation error:", error);
      addTestResult("Test data generation", false, error.message);
      toast.error("Failed to generate test data: " + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="border-2 border-blue-600 bg-gradient-to-br from-blue-50 to-cyan-50 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-2xl font-black text-blue-900">Test Data Generator</h3>
          <p className="text-sm text-blue-700 mt-1">
            Generate comprehensive test data for all features
          </p>
        </div>
        <Button
          onClick={generateTestData}
          disabled={isGenerating}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 px-6"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Database className="w-5 h-5 mr-2" />
              Generate Test Data
            </>
          )}
        </Button>
      </div>

      {testResults.length > 0 && (
        <div className="bg-white border-2 border-blue-300 rounded-lg p-4">
          <h4 className="font-bold text-blue-900 mb-3">Test Results:</h4>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {testResults.map((result, idx) => (
              <div key={idx} className="flex items-center gap-3 p-2 bg-blue-50 rounded border border-blue-200">
                {result.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p className="font-medium text-blue-900">{result.test}</p>
                  {result.error && (
                    <p className="text-xs text-red-600 mt-1">{result.error}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 bg-white border-2 border-blue-300 rounded-lg p-4">
        <h4 className="font-bold text-blue-900 mb-2">Test Coverage:</h4>
        <ul className="space-y-1 text-sm text-blue-700">
          <li>✓ 5 diverse vendors (DJ, Photographer, Caterer, Decorator, Venue)</li>
          <li>✓ 8 bookings with all statuses (pending, accepted, declined, completed)</li>
          <li>✓ 6 separate message conversations (not combined)</li>
          <li>✓ 5 reviews with varying ratings</li>
          <li>✓ 3 saved vendors</li>
          <li>✓ 4 swipe records (left & right)</li>
          <li>✓ Multiple clients & price ranges for filtering</li>
          <li>✓ Different locations for travel radius testing</li>
        </ul>
      </div>
    </Card>
  );
}