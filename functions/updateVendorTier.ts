import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { vendor_id } = await req.json();

    if (!vendor_id) {
      return Response.json({ error: 'vendor_id is required' }, { status: 400 });
    }

    // Get all completed bookings for this vendor
    const completedBookings = await base44.asServiceRole.entities.Booking.filter({ 
      vendor_id,
      status: 'completed'
    });

    // Get all reviews for this vendor
    const reviews = await base44.asServiceRole.entities.Review.filter({ vendor_id });

    // Calculate stats
    const completedCount = completedBookings.length;
    const totalRevenue = completedBookings.reduce((sum, b) => sum + (b.vendor_payout || 0), 0);
    const averageRating = reviews.length > 0 
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
      : 0;

    // Calculate bookings this month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const bookingsThisMonth = completedBookings.filter(b => 
      new Date(b.updated_date) >= startOfMonth
    ).length;

    // Determine tier level
    let tierLevel = 'bronze';
    let feeDiscount = 0;

    if (completedCount >= 16) {
      tierLevel = 'gold';
      feeDiscount = 1.5; // 1.5% discount on fees
    } else if (completedCount >= 6) {
      tierLevel = 'silver';
      feeDiscount = 0.5; // 0.5% discount on fees
    }

    // Additional discount for volume (5+ bookings this month)
    if (bookingsThisMonth >= 5) {
      feeDiscount += 1; // Additional 1% discount
    }

    // Check if tier record exists
    const existingTiers = await base44.asServiceRole.entities.VendorTier.filter({ vendor_id });

    const tierData = {
      vendor_id,
      tier_level: tierLevel,
      completed_bookings: completedCount,
      average_rating: parseFloat(averageRating.toFixed(2)),
      bookings_this_month: bookingsThisMonth,
      total_revenue: totalRevenue,
      last_tier_update: new Date().toISOString(),
      fee_discount_percent: feeDiscount
    };

    if (existingTiers.length > 0) {
      await base44.asServiceRole.entities.VendorTier.update(existingTiers[0].id, tierData);
    } else {
      await base44.asServiceRole.entities.VendorTier.create(tierData);
    }

    return Response.json({ 
      success: true, 
      tier: tierData 
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});