import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    
    // Extract vendor_id from payload or event data
    const vendor_id = payload.vendor_id || payload.data?.vendor_id;
    
    // Only process if booking was just completed
    if (payload.event?.type === 'update' && payload.data?.status === 'completed' && payload.old_data?.status !== 'completed') {
      // Continue with tier update
    } else if (!payload.event) {
      // Direct call, process normally
    } else {
      // Not a completion event, skip
      return Response.json({ success: true, message: 'Not a completion event, skipped' });
    }

    if (!vendor_id) {
      return Response.json({ error: 'vendor_id is required' }, { status: 400 });
    }

    // Get all completed AND PAID bookings for this vendor
    const completedBookings = await base44.asServiceRole.entities.Booking.filter({ 
      vendor_id,
      status: 'completed',
      payment_status: 'paid'
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

    // Determine tier level and fee discount
    // BRONZE: 0-30 bookings = 0% base fee discount
    // SILVER: 31-80 bookings = 1.0% fee discount
    // GOLD: 81+ bookings = 2.5% fee discount
    // VOLUME BONUS: 10+ bookings this month = additional 1.5% (stacks)
    let tierLevel = 'bronze';
    let feeDiscount = 0;

    if (completedCount >= 81) {
      tierLevel = 'gold';
      feeDiscount = 2.5; // 2.5% discount on platform fee
    } else if (completedCount >= 31) {
      tierLevel = 'silver';
      feeDiscount = 1.0; // 1.0% discount on platform fee
    }

    // Additional discount for volume (10+ bookings this month) - stacks with tier discount
    if (bookingsThisMonth >= 10) {
      feeDiscount += 1.5; // Additional 1.5% stacks with tier discount
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

    const oldTier = existingTiers.length > 0 ? existingTiers[0].tier_level : null;
    const tierChanged = oldTier !== tierLevel;

    if (existingTiers.length > 0) {
      await base44.asServiceRole.entities.VendorTier.update(existingTiers[0].id, tierData);
    } else {
      await base44.asServiceRole.entities.VendorTier.create(tierData);
    }

    // Send tier update notification if tier changed
    if (tierChanged && tierLevel !== 'bronze') {
      try {
        await base44.asServiceRole.functions.invoke('sendTierUpdateNotification', {
          user_email: vendor_id, // This will be looked up in the function
          user_type: 'vendor',
          old_tier: oldTier,
          new_tier: tierLevel,
          benefits: [
            `${feeDiscount}% platform fee discount`,
            'Enhanced profile visibility',
            tierLevel === 'gold' ? 'Featured vendor badge' : 'Priority support'
          ]
        });

        // Get vendor email
        const vendors = await base44.asServiceRole.entities.Vendor.filter({ id: vendor_id });
        if (vendors.length > 0) {
          const vendorUsers = await base44.asServiceRole.entities.User.filter({ vendor_id });
          if (vendorUsers.length > 0) {
            await base44.asServiceRole.functions.invoke('sendTierUpdateNotification', {
              user_email: vendorUsers[0].email,
              user_type: 'vendor',
              old_tier: oldTier,
              new_tier: tierLevel,
              benefits: [
                `${feeDiscount}% platform fee discount`,
                'Enhanced profile visibility',
                tierLevel === 'gold' ? 'Featured vendor badge' : 'Priority support'
              ]
            });
          }
        }
      } catch (error) {
        console.error('Failed to send tier notification:', error);
      }
    }

    return Response.json({ 
      success: true, 
      tier: tierData,
      tier_changed: tierChanged
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});