import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Find or create the test vendor
    let vendor = null;
    
    // Try to find by ID first
    try {
      vendor = await base44.asServiceRole.entities.Vendor.get('69ab4d57efd7f8b8d0af9876');
    } catch (e) {
      // ID might be different, search by email
      const vendors = await base44.asServiceRole.entities.Vendor.filter({
        created_by: 'evnttestvendor@gmail.com'
      });
      if (vendors.length > 0) {
        vendor = vendors[0];
      }
    }

    if (!vendor) {
      // Create test vendor if doesn't exist with special metadata
      vendor = await base44.asServiceRole.entities.Vendor.create({
        business_name: 'EVNT Test Vendor',
        category: 'Event Planning',
        description: 'Professional event planning and coordination services',
        contact_email: 'evnttestvendor@gmail.com',
        location: 'Washington, DC',
        approval_status: 'approved',
        profile_complete: true,
        is_test_vendor: true,
        starting_price: 1500,
        price_range: '$$',
        specialties: ['Wedding', 'Corporate', 'Birthday', 'Dinner']
      });
    }

    const vendorId = vendor.id;

    // Create portfolio items
    const portfolioItems = [
      {
        vendor_id: vendorId,
        type: 'image',
        url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800',
        title: 'Elegant Wedding Reception',
        description: 'Beautiful reception setup with 150 guests',
        event_type: 'wedding',
        display_order: 1
      },
      {
        vendor_id: vendorId,
        type: 'image',
        url: 'https://images.unsplash.com/photo-1516248431912-27bccb20ae38?w=800',
        title: 'Birthday Celebration',
        description: 'Colorful birthday party for 75 people',
        event_type: 'birthday',
        display_order: 2
      },
      {
        vendor_id: vendorId,
        type: 'image',
        url: 'https://images.unsplash.com/photo-1519167758481-83f19106c86f?w=800',
        title: 'Corporate Gala',
        description: 'Sophisticated corporate event with 200+ attendees',
        event_type: 'corporate',
        display_order: 3
      },
      {
        vendor_id: vendorId,
        type: 'image',
        url: 'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=800',
        title: 'Intimate Dinner Party',
        description: 'Elegant dinner setup for 30 guests',
        event_type: 'dinner',
        display_order: 4
      }
    ];

    const createdPortfolio = await base44.asServiceRole.entities.PortfolioItem.bulkCreate(portfolioItems);

    // Create reviews
    const reviews = [
      {
        vendor_id: vendorId,
        vendor_name: vendor.business_name,
        client_email: 'client1@example.com',
        client_name: 'Sarah Johnson',
        rating: 5,
        description: 'Absolutely incredible! The entire team was professional and creative. They exceeded all our expectations for our wedding reception.'
      },
      {
        vendor_id: vendorId,
        vendor_name: vendor.business_name,
        client_email: 'client2@example.com',
        client_name: 'Michael Chen',
        rating: 5,
        description: 'Outstanding service from start to finish. They handled our corporate event with impeccable attention to detail.'
      },
      {
        vendor_id: vendorId,
        vendor_name: vendor.business_name,
        client_email: 'client3@example.com',
        client_name: 'Emma Williams',
        rating: 4,
        description: 'Great experience overall! Very responsive and flexible with our requests. Minor timing hiccup but handled gracefully.'
      },
      {
        vendor_id: vendorId,
        vendor_name: vendor.business_name,
        client_email: 'client4@example.com',
        client_name: 'David Martinez',
        rating: 5,
        description: 'Best decision we made for our birthday party! The energy and creativity made it unforgettable.'
      }
    ];

    const createdReviews = await base44.asServiceRole.entities.Review.bulkCreate(reviews);

    // Create completed bookings
    const bookings = [
      {
        event_id: null,
        vendor_id: vendorId,
        vendor_name: vendor.business_name,
        client_email: 'sarah.j@example.com',
        client_name: 'Sarah Johnson',
        client_phone: '555-0101',
        client_state: 'NY',
        event_type: 'wedding',
        event_date: '2025-06-15',
        guest_count: 150,
        budget: 5000,
        location: 'New York, NY',
        notes: 'Wedding reception with live band',
        status: 'completed',
        vendor_response: 'Thank you for the wonderful opportunity!',
        base_event_amount: 5000,
        agreed_price: 5000,
        platform_fee_percent: 10,
        platform_fee_amount: 500,
        sales_tax_rate: 0.08875,
        sales_tax_amount: 444,
        stripe_fee_amount: 153,
        vendor_payout: 3903,
        total_amount_charged: 5944,
        currency: 'USD',
        payment_status: 'paid',
        contract_signed_client: true,
        contract_signed_vendor: true,
        service_description: 'Full event planning and coordination'
      },
      {
        event_id: null,
        vendor_id: vendorId,
        vendor_name: vendor.business_name,
        client_email: 'michael.c@example.com',
        client_name: 'Michael Chen',
        client_phone: '555-0102',
        client_state: 'CA',
        event_type: 'corporate',
        event_date: '2025-05-20',
        guest_count: 200,
        budget: 8000,
        location: 'San Francisco, CA',
        notes: 'Corporate gala event',
        status: 'completed',
        vendor_response: 'Professional event, well executed',
        base_event_amount: 8000,
        agreed_price: 8000,
        platform_fee_percent: 10,
        platform_fee_amount: 800,
        sales_tax_rate: 0.0825,
        sales_tax_amount: 660,
        stripe_fee_amount: 246,
        vendor_payout: 6154,
        total_amount_charged: 9460,
        currency: 'USD',
        payment_status: 'paid',
        contract_signed_client: true,
        contract_signed_vendor: true,
        service_description: 'Corporate event planning'
      },
      {
        event_id: null,
        vendor_id: vendorId,
        vendor_name: vendor.business_name,
        client_email: 'emma.w@example.com',
        client_name: 'Emma Williams',
        client_phone: '555-0103',
        client_state: 'TX',
        event_type: 'birthday',
        event_date: '2025-04-10',
        guest_count: 75,
        budget: 2000,
        location: 'Austin, TX',
        notes: 'Birthday celebration',
        status: 'completed',
        vendor_response: 'Fantastic team to work with!',
        base_event_amount: 2000,
        agreed_price: 2000,
        platform_fee_percent: 10,
        platform_fee_amount: 200,
        sales_tax_rate: 0.0825,
        sales_tax_amount: 165,
        stripe_fee_amount: 62,
        vendor_payout: 1573,
        total_amount_charged: 2365,
        currency: 'USD',
        payment_status: 'paid',
        contract_signed_client: true,
        contract_signed_vendor: true,
        service_description: 'Birthday party coordination'
      },
      {
        event_id: null,
        vendor_id: vendorId,
        vendor_name: vendor.business_name,
        client_email: 'david.m@example.com',
        client_name: 'David Martinez',
        client_phone: '555-0104',
        client_state: 'FL',
        event_type: 'wedding',
        event_date: '2025-03-22',
        guest_count: 120,
        budget: 4500,
        location: 'Miami, FL',
        notes: 'Beach wedding reception',
        status: 'completed',
        vendor_response: 'Beautiful event, so much fun!',
        base_event_amount: 4500,
        agreed_price: 4500,
        platform_fee_percent: 10,
        platform_fee_amount: 450,
        sales_tax_rate: 0.06,
        sales_tax_amount: 270,
        stripe_fee_amount: 139,
        vendor_payout: 3641,
        total_amount_charged: 5220,
        currency: 'USD',
        payment_status: 'paid',
        contract_signed_client: true,
        contract_signed_vendor: true,
        service_description: 'Beach wedding planning'
      }
    ];

    const createdBookings = await base44.asServiceRole.entities.Booking.bulkCreate(bookings);

    // Create VendorTier record with analytics
    const totalRevenue = bookings.reduce((sum, b) => sum + b.base_event_amount, 0);
    const tierData = {
      vendor_id: vendorId,
      tier_level: 'gold',
      completed_bookings: createdBookings.length,
      average_rating: 4.75,
      bookings_this_month: 1,
      total_revenue: totalRevenue,
      fee_discount_percent: 5
    };

    await base44.asServiceRole.entities.VendorTier.create(tierData);

    // Create vendor payouts
    const payouts = createdBookings.map((booking, idx) => ({
      vendor_id: vendorId,
      booking_id: booking.id,
      gross_amount: booking.base_event_amount,
      platform_fee: booking.platform_fee_amount,
      net_amount: booking.vendor_payout,
      status: 'completed',
      payout_date: new Date().toISOString()
    }));

    const createdPayouts = await base44.asServiceRole.entities.VendorPayout.bulkCreate(payouts);

    return Response.json({
      success: true,
      vendorId,
      portfolioItems: createdPortfolio.length,
      reviews: createdReviews.length,
      bookings: createdBookings.length,
      payouts: createdPayouts.length,
      totalRevenue,
      message: 'Test vendor data populated successfully'
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});