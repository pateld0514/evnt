import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// This function creates all sample data for the 3 test accounts.
// Must be run as admin. Safe to run multiple times (cleans up old data first).

const VENDOR_EMAIL = 'evnttestvendor@gmail.com';
const CLIENT_EMAIL = 'evnttestclient@gmail.com';
const VENDOR_ID = '69ab4d57efd7f8b8d0af9876'; // Spotlight Studios vendor record

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const db = base44.asServiceRole;

    // ---- Step 1: Ensure vendor user profile is correct ----
    const vendorUsers = await db.entities.User.filter({ email: VENDOR_EMAIL });
    if (vendorUsers.length > 0) {
      await db.entities.User.update(vendorUsers[0].id, {
        user_type: 'vendor',
        vendor_id: VENDOR_ID,
        onboarding_complete: true,
        approval_status: 'approved',
        phone: '(301) 555-0199',
        location: 'Washington, DC',
        state: 'DC',
      });
    }

    // ---- Step 2: Ensure client user profile is correct ----
    const clientUsers = await db.entities.User.filter({ email: CLIENT_EMAIL });
    if (clientUsers.length > 0) {
      await db.entities.User.update(clientUsers[0].id, {
        user_type: 'client',
        onboarding_complete: true,
        phone: '(202) 555-0177',
        location: 'Washington, DC',
        state: 'DC',
        event_interests: ['Wedding', 'Birthday', 'Anniversary'],
        budget_range: '10k_25k',
        event_planning_experience: 'some_experience',
        preferred_contact: 'email',
      });
    }

    // ---- Step 3: Clean up any previous test data for these emails ----
    const oldBookings = await db.entities.Booking.filter({ client_email: CLIENT_EMAIL });
    for (const b of oldBookings) await db.entities.Booking.delete(b.id);

    const oldEvents = await db.entities.Event.filter({ created_by: CLIENT_EMAIL });
    for (const e of oldEvents) await db.entities.Event.delete(e.id);

    const oldMsgs1 = await db.entities.Message.filter({ sender_email: CLIENT_EMAIL });
    for (const m of oldMsgs1) await db.entities.Message.delete(m.id);
    const oldMsgs2 = await db.entities.Message.filter({ sender_email: VENDOR_EMAIL });
    for (const m of oldMsgs2) await db.entities.Message.delete(m.id);
    const oldMsgs3 = await db.entities.Message.filter({ recipient_email: CLIENT_EMAIL });
    for (const m of oldMsgs3) await db.entities.Message.delete(m.id);
    const oldMsgs4 = await db.entities.Message.filter({ recipient_email: VENDOR_EMAIL });
    for (const m of oldMsgs4) await db.entities.Message.delete(m.id);

    const oldSaved = await db.entities.SavedVendor.filter({ created_by: CLIENT_EMAIL });
    for (const s of oldSaved) await db.entities.SavedVendor.delete(s.id);

    const oldReviews = await db.entities.Review.filter({ client_email: CLIENT_EMAIL });
    for (const r of oldReviews) await db.entities.Review.delete(r.id);

    // ---- Step 4: Create Events for client ----
    const weddingEvent = await db.entities.Event.create({
      name: "Jamie & Alex Wedding 2026",
      event_type: "Wedding",
      event_date: "2026-09-12",
      location: "Washington, DC",
      guest_count: 180,
      budget: 25000,
      status: "confirmed",
      notes: "Outdoor ceremony at the National Cathedral gardens, indoor reception at the Willard Hotel. Need photographer, caterer, florist, and DJ.",
      created_by: CLIENT_EMAIL,
    });

    const birthdayEvent = await db.entities.Event.create({
      name: "Mom's 60th Birthday Surprise",
      event_type: "Birthday",
      event_date: "2026-06-20",
      location: "Silver Spring, MD",
      guest_count: 75,
      budget: 5000,
      status: "planning",
      notes: "Surprise party for mom's 60th. Looking for photographer and caterer.",
      created_by: CLIENT_EMAIL,
    });

    // ---- Step 5: Create Bookings ----
    const conversationId = `${VENDOR_ID}__${CLIENT_EMAIL}`;

    const confirmedBooking = await db.entities.Booking.create({
      event_id: weddingEvent.id,
      vendor_id: VENDOR_ID,
      vendor_name: "Demo Vendor - Spotlight Studios",
      client_email: CLIENT_EMAIL,
      client_name: "Test Client - Jamie Rivera",
      client_state: "DC",
      event_type: "Wedding",
      event_date: "2026-09-12",
      guest_count: 180,
      budget: 4000,
      location: "Washington, DC",
      notes: "We want the Elite package with drone footage. Also interested in same-day highlight reel for the reception slideshow.",
      status: "confirmed",
      vendor_response: "Congratulations! We'd be honored to capture your wedding. I've reviewed the details and September 12th is available. The Elite package covers everything you need including drone footage and same-day reel.",
      base_event_amount: 4000,
      agreed_price: 4000,
      platform_fee_percent: 10,
      platform_fee_amount: 400,
      sales_tax_rate: 0.06,
      sales_tax_amount: 240,
      stripe_fee_amount: 116.30,
      vendor_payout: 3244,
      total_amount_charged: 4000,
      currency: "USD",
      payment_status: "escrow",
      invoice_number: "INV-2026-0042",
      service_description: "Elite photography package: Full day coverage, 2 photographers + videographer, drone footage, same-day highlight reel, luxury album.",
      contract_signed_client: true,
      contract_signed_vendor: true,
      additional_fees: [],
      created_by: CLIENT_EMAIL,
    });

    const pendingBooking = await db.entities.Booking.create({
      event_id: birthdayEvent.id,
      vendor_id: VENDOR_ID,
      vendor_name: "Demo Vendor - Spotlight Studios",
      client_email: CLIENT_EMAIL,
      client_name: "Test Client - Jamie Rivera",
      client_state: "MD",
      event_type: "Birthday",
      event_date: "2026-06-20",
      guest_count: 75,
      budget: 2000,
      location: "Silver Spring, MD",
      notes: "Need 4 hours of coverage for my mom's surprise 60th birthday party. Family portraits + candid event photos.",
      status: "negotiating",
      vendor_response: "Happy to help! For a 4-hour birthday shoot we'd recommend the Essential package. I can do $1,500 which includes 200+ edited photos.",
      base_event_amount: 1500,
      agreed_price: 1500,
      platform_fee_percent: 10,
      platform_fee_amount: 150,
      sales_tax_rate: 0.06,
      sales_tax_amount: 90,
      stripe_fee_amount: 43.80,
      vendor_payout: 1216,
      total_amount_charged: 1500,
      currency: "USD",
      payment_status: "unpaid",
      invoice_number: "INV-2026-0045",
      service_description: "Essential package: 4-hour coverage, 1 photographer, 200+ edited photos, online gallery.",
      contract_signed_client: false,
      contract_signed_vendor: false,
      additional_fees: [],
      created_by: CLIENT_EMAIL,
    });

    // A third booking - pending/new request from another client to the vendor
    const incomingBooking = await db.entities.Booking.create({
      vendor_id: VENDOR_ID,
      vendor_name: "Demo Vendor - Spotlight Studios",
      client_email: "alexthompson@email.com",
      client_name: "Alex Thompson",
      client_state: "VA",
      event_type: "Corporate Event",
      event_date: "2026-07-15",
      guest_count: 200,
      budget: 3000,
      location: "Arlington, VA",
      notes: "Annual company awards banquet. Need full event coverage, headshots station, and highlight video.",
      status: "pending",
      base_event_amount: 2500,
      platform_fee_percent: 10,
      platform_fee_amount: 250,
      sales_tax_rate: 0.053,
      sales_tax_amount: 132.50,
      stripe_fee_amount: 72.80,
      vendor_payout: 2045,
      total_amount_charged: 2500,
      currency: "USD",
      payment_status: "unpaid",
      contract_signed_client: false,
      contract_signed_vendor: false,
      additional_fees: [],
      created_by: "alexthompson@email.com",
    });

    // ---- Step 6: Create Messages ----
    // Conversation between test client and test vendor
    const messages = [
      {
        conversation_id: conversationId,
        sender_email: CLIENT_EMAIL,
        sender_name: "Jamie Rivera",
        recipient_email: VENDOR_EMAIL,
        vendor_id: VENDOR_ID,
        vendor_name: "Demo Vendor - Spotlight Studios",
        message: "Hi! I came across Spotlight Studios and I'm absolutely in love with your work. We're planning our wedding for September 12th in DC. Do you have availability and can you tell me more about your Elite package?",
        read: true,
        created_by: CLIENT_EMAIL,
      },
      {
        conversation_id: conversationId,
        sender_email: VENDOR_EMAIL,
        sender_name: "Spotlight Studios",
        recipient_email: CLIENT_EMAIL,
        vendor_id: VENDOR_ID,
        vendor_name: "Demo Vendor - Spotlight Studios",
        message: "Congratulations on your upcoming wedding! September 12th is available and we would be honored to capture your special day. Our Elite package includes full day coverage with 2 photographers + a videographer, drone footage, and same-day highlight reel. Perfect for a 180-guest wedding! Want to set up a quick call to go over details?",
        read: true,
        created_by: VENDOR_EMAIL,
      },
      {
        conversation_id: conversationId,
        sender_email: CLIENT_EMAIL,
        sender_name: "Jamie Rivera",
        recipient_email: VENDOR_EMAIL,
        vendor_id: VENDOR_ID,
        vendor_name: "Demo Vendor - Spotlight Studios",
        message: "That sounds perfect! We definitely want the same-day highlight reel - the idea of showing it at the reception is so special. The $4,000 Elite package works for us. Can we go ahead and book?",
        read: true,
        created_by: CLIENT_EMAIL,
      },
      {
        conversation_id: conversationId,
        sender_email: VENDOR_EMAIL,
        sender_name: "Spotlight Studios",
        recipient_email: CLIENT_EMAIL,
        vendor_id: VENDOR_ID,
        vendor_name: "Demo Vendor - Spotlight Studios",
        message: "Amazing! I've sent over the contract through the booking portal. Once you sign and payment is in escrow we're officially confirmed. So excited for September!",
        read: true,
        created_by: VENDOR_EMAIL,
      },
      {
        conversation_id: conversationId,
        sender_email: CLIENT_EMAIL,
        sender_name: "Jamie Rivera",
        recipient_email: VENDOR_EMAIL,
        vendor_id: VENDOR_ID,
        vendor_name: "Demo Vendor - Spotlight Studios",
        message: "Contract signed! Payment is in escrow now. Can't wait for September. Should we schedule an engagement session soon?",
        read: false,
        created_by: CLIENT_EMAIL,
      },
    ];

    for (const msg of messages) {
      await db.entities.Message.create(msg);
    }

    // ---- Step 7: Save vendor to client's saved list ----
    await db.entities.SavedVendor.create({
      vendor_id: VENDOR_ID,
      vendor_name: "Demo Vendor - Spotlight Studios",
      vendor_category: "photographer",
      event_type: "Wedding",
      notes: "Loved their work! Already booked for wedding.",
      created_by: CLIENT_EMAIL,
    });

    // ---- Step 8: Create a review from past completed event ----
    await db.entities.Review.create({
      vendor_id: VENDOR_ID,
      vendor_name: "Demo Vendor - Spotlight Studios",
      client_email: CLIENT_EMAIL,
      client_name: "Jamie Rivera",
      booking_id: confirmedBooking.id,
      rating: 5,
      description: "Spotlight Studios was absolutely incredible for our engagement shoot! Marcus and his team made us feel completely at ease. The photos came back in under a week and they were stunning. Can't wait for the wedding!",
      created_by: CLIENT_EMAIL,
    });

    // ---- Step 9: Create a notification for vendor (new pending booking) ----
    await db.entities.Notification.create({
      recipient_email: VENDOR_EMAIL,
      type: "booking_status",
      title: "📥 New Booking Request",
      message: "Alex Thompson requested photography for a Corporate Event on July 15, 2026. Review and respond!",
      link: "/Bookings",
      read: false,
      created_by: VENDOR_EMAIL,
    });

    await db.entities.Notification.create({
      recipient_email: CLIENT_EMAIL,
      type: "vendor_response",
      title: "💬 Vendor Responded",
      message: "Spotlight Studios responded to your birthday party photography request. Check the negotiation!",
      link: "/Bookings",
      read: false,
      created_by: CLIENT_EMAIL,
    });

    return Response.json({
      success: true,
      message: 'All demo data created successfully for test accounts',
      details: {
        vendor_user: vendorUsers.length > 0 ? 'configured' : 'NOT FOUND - needs to sign up first',
        client_user: clientUsers.length > 0 ? 'configured' : 'NOT FOUND - needs to sign up first',
        events_created: 2,
        bookings_created: 3,
        messages_created: messages.length,
        saved_vendors: 1,
        reviews: 1,
        notifications: 2,
      }
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});