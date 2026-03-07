import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get or create vendor for evnttestvendor@gmail.com
    let vendor = null;
    const vendorByEmail = await base44.entities.Vendor.filter({ contact_email: 'evnttestvendor@gmail.com' });
    
    if (vendorByEmail.length > 0) {
      vendor = vendorByEmail[0];
      // Update vendor to ensure it's properly linked
      await base44.entities.Vendor.update(vendor.id, {
        approval_status: 'approved',
        profile_complete: true
      });
    } else {
      // Create vendor if doesn't exist
      vendor = await base44.entities.Vendor.create({
        business_name: 'Elite Wedding Events',
        category: 'wedding_planner',
        description: 'Premium wedding planning services with 15+ years of experience',
        contact_email: 'evnttestvendor@gmail.com',
        contact_phone: '(301) 555-0142',
        location: 'Washington, DC',
        price_range: '$$$$',
        image_url: 'https://images.unsplash.com/photo-1519167271174-1c5e1c69feae?w=800&h=600&fit=crop',
        website: 'https://eliteweddings.com',
        instagram: '@eliteweddingdc',
        approval_status: 'approved',
        starting_price: 5000,
        average_price: 15000,
        pricing_type: 'package',
        years_in_business: 15,
        willing_to_travel: true,
        travel_radius: 100,
        profile_complete: true
      });
    }

    // Create fake bookings
    const bookingData = [
      {
        event_id: '',
        vendor_id: vendor.id,
        vendor_name: vendor.business_name,
        client_email: 'sarah.johnson@email.com',
        client_name: 'Sarah Johnson',
        client_phone: '(202) 555-0123',
        client_state: 'DC',
        event_type: 'wedding',
        event_date: '2026-06-15',
        guest_count: 120,
        location: 'Washington, DC',
        notes: 'Garden wedding with outdoor ceremony and indoor reception',
        status: 'confirmed',
        agreed_price: 18500,
        platform_fee_amount: 1850,
        platform_fee_percent: 10,
        sales_tax_rate: 0.06,
        sales_tax_amount: 1110,
        stripe_fee_amount: 545,
        vendor_payout: 15095,
        total_amount_charged: 18500,
        payment_status: 'paid',
        contract_signed_client: true,
        contract_signed_vendor: true,
        contract_signed_date: '2026-03-01T10:30:00Z'
      },
      {
        event_id: '',
        vendor_id: vendor.id,
        vendor_name: vendor.business_name,
        client_email: 'michael.chen@email.com',
        client_name: 'Michael Chen',
        client_phone: '(202) 555-0134',
        client_state: 'VA',
        event_type: 'wedding',
        event_date: '2026-07-22',
        guest_count: 95,
        location: 'Arlington, VA',
        notes: 'Elegant evening wedding with cultural ceremonies',
        status: 'confirmed',
        agreed_price: 16500,
        platform_fee_amount: 1650,
        platform_fee_percent: 10,
        sales_tax_rate: 0.0525,
        sales_tax_amount: 866,
        stripe_fee_amount: 493,
        vendor_payout: 13491,
        total_amount_charged: 16500,
        payment_status: 'paid',
        contract_signed_client: true,
        contract_signed_vendor: true,
        contract_signed_date: '2026-03-05T14:15:00Z'
      },
      {
        event_id: '',
        vendor_id: vendor.id,
        vendor_name: vendor.business_name,
        client_email: 'amanda.williams@email.com',
        client_name: 'Amanda Williams',
        client_phone: '(202) 555-0145',
        client_state: 'MD',
        event_type: 'wedding',
        event_date: '2026-05-30',
        guest_count: 150,
        location: 'Baltimore, MD',
        notes: 'Large formal wedding with multiple events',
        status: 'completed',
        agreed_price: 22000,
        platform_fee_amount: 2200,
        platform_fee_percent: 10,
        sales_tax_rate: 0.06,
        sales_tax_amount: 1320,
        stripe_fee_amount: 658,
        vendor_payout: 17822,
        total_amount_charged: 22000,
        payment_status: 'paid',
        contract_signed_client: true,
        contract_signed_vendor: true,
        contract_signed_date: '2026-02-15T11:00:00Z'
      },
      {
        event_id: '',
        vendor_id: vendor.id,
        vendor_name: vendor.business_name,
        client_email: 'james.cooper@email.com',
        client_name: 'James Cooper',
        client_phone: '(703) 555-0156',
        client_state: 'VA',
        event_type: 'wedding',
        event_date: '2026-08-14',
        guest_count: 80,
        location: 'Alexandria, VA',
        notes: 'Intimate wedding with focus on details',
        status: 'pending',
        agreed_price: 12500,
        platform_fee_amount: 1250,
        platform_fee_percent: 10,
        sales_tax_rate: 0.0525,
        sales_tax_amount: 656,
        stripe_fee_amount: 373,
        vendor_payout: 10221,
        total_amount_charged: 12500,
        payment_status: 'unpaid'
      },
      {
        event_id: '',
        vendor_id: vendor.id,
        vendor_name: vendor.business_name,
        client_email: 'lisa.martinez@email.com',
        client_name: 'Lisa Martinez',
        client_phone: '(202) 555-0167',
        client_state: 'DC',
        event_type: 'wedding',
        event_date: '2026-09-05',
        guest_count: 110,
        location: 'Washington, DC',
        notes: 'Modern wedding with tech integration',
        status: 'negotiating',
        agreed_price: 14000,
        platform_fee_percent: 10,
        sales_tax_rate: 0.06
      }
    ];

    // Delete existing bookings for this vendor
    const existingBookings = await base44.entities.Booking.filter({ vendor_id: vendor.id });
    for (const b of existingBookings) {
      await base44.entities.Booking.delete(b.id);
    }

    // Create new bookings
    const bookings = await base44.entities.Booking.bulkCreate(bookingData);

    // Create portfolio items with professional images
    const portfolioData = [
      {
        vendor_id: vendor.id,
        type: 'image',
        url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=600&fit=crop',
        title: 'Elegant Garden Ceremony',
        description: 'Beautiful outdoor wedding ceremony with floral arch and string lights',
        event_type: 'wedding',
        display_order: 1
      },
      {
        vendor_id: vendor.id,
        type: 'image',
        url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&h=600&fit=crop',
        title: 'Reception Décor',
        description: 'Stunning ballroom setup with elegant centerpieces and ambient lighting',
        event_type: 'wedding',
        display_order: 2
      },
      {
        vendor_id: vendor.id,
        type: 'image',
        url: 'https://images.unsplash.com/photo-1552068751-5d506b592491?w=800&h=600&fit=crop',
        title: 'Head Table Setup',
        description: 'Custom designed head table with personalized elements',
        event_type: 'wedding',
        display_order: 3
      },
      {
        vendor_id: vendor.id,
        type: 'image',
        url: 'https://images.unsplash.com/photo-1464207687429-7505649dae38?w=800&h=600&fit=crop',
        title: 'Cocktail Hour',
        description: 'Sophisticated cocktail reception with signature drinks',
        event_type: 'wedding',
        display_order: 4
      },
      {
        vendor_id: vendor.id,
        type: 'image',
        url: 'https://images.unsplash.com/photo-1519167271174-1c5e1c69feae?w=800&h=600&fit=crop',
        title: 'Bride & Groom Moment',
        description: 'Captured moments with the happy couple',
        event_type: 'wedding',
        display_order: 5
      }
    ];

    // Delete existing portfolio
    const existingPortfolio = await base44.entities.PortfolioItem.filter({ vendor_id: vendor.id });
    for (const p of existingPortfolio) {
      await base44.entities.PortfolioItem.delete(p.id);
    }

    // Create new portfolio items
    await base44.entities.PortfolioItem.bulkCreate(portfolioData);

    // Create reviews
    const reviewData = [
      {
        vendor_id: vendor.id,
        vendor_name: vendor.business_name,
        client_email: 'sarah.johnson@email.com',
        client_name: 'Sarah Johnson',
        booking_id: bookings[0]?.id || 'booking-1',
        rating: 5,
        description: 'Absolutely amazing! Elite Wedding Events made our day perfect. Every detail was executed flawlessly. Sarah was responsive, creative, and professional throughout the entire planning process.'
      },
      {
        vendor_id: vendor.id,
        vendor_name: vendor.business_name,
        client_email: 'michael.chen@email.com',
        client_name: 'Michael Chen',
        booking_id: bookings[1]?.id || 'booking-2',
        rating: 5,
        description: 'Highly recommend! The team understood our vision for a culturally blended wedding and executed it beautifully. Attention to detail was exceptional.'
      },
      {
        vendor_id: vendor.id,
        vendor_name: vendor.business_name,
        client_email: 'amanda.williams@email.com',
        client_name: 'Amanda Williams',
        booking_id: bookings[2]?.id || 'booking-3',
        rating: 5,
        description: 'Our 150-person wedding was coordinated perfectly. The team handled logistics seamlessly and made sure every guest had an unforgettable experience.'
      },
      {
        vendor_id: vendor.id,
        vendor_name: vendor.business_name,
        client_email: 'david.lee@email.com',
        client_name: 'David Lee',
        rating: 4,
        description: 'Great experience overall. Professional team, creative ideas, and excellent execution. Minor timing issue but handled gracefully.'
      }
    ];

    // Delete existing reviews
    const existingReviews = await base44.entities.Review.filter({ vendor_id: vendor.id });
    for (const r of existingReviews) {
      await base44.entities.Review.delete(r.id);
    }

    // Create new reviews
    await base44.entities.Review.bulkCreate(reviewData);

    // Create vendor tier data
    const tierData = {
      vendor_id: vendor.id,
      tier_level: 'gold',
      completed_bookings: 3,
      average_rating: 4.75,
      bookings_this_month: 2,
      total_revenue: 56500,
      fee_discount_percent: 15
    };

    // Delete existing tier
    const existingTier = await base44.entities.VendorTier.filter({ vendor_id: vendor.id });
    if (existingTier.length > 0) {
      await base44.entities.VendorTier.delete(existingTier[0].id);
    }

    // Create new tier
    await base44.entities.VendorTier.create(tierData);

    return Response.json({ 
      success: true,
      vendor: vendor.id,
      bookings: bookings.length,
      portfolio: portfolioData.length,
      reviews: reviewData.length,
      message: 'Vendor demo data created successfully'
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});