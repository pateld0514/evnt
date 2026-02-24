import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// One-time migration to backfill stripe_fee for legacy bookings
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Admin only
    if (!user || (user.email !== "pateld0514@gmail.com" && user.role !== "admin")) {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Fetch all bookings
    const allBookings = await base44.asServiceRole.entities.Booking.list();
    
    let updatedCount = 0;
    let skippedCount = 0;

    for (const booking of allBookings) {
      // Skip if stripe_fee already set
      if (booking.stripe_fee || booking.stripe_fee_amount) {
        skippedCount++;
        continue;
      }

      // Calculate Stripe fee: 2.9% + $0.30
      const totalCharged = booking.total_amount_charged || booking.total_amount || booking.agreed_price || 0;
      const stripeFee = (totalCharged * 0.029) + 0.30;

      // Update booking
      await base44.asServiceRole.entities.Booking.update(booking.id, {
        stripe_fee: parseFloat(stripeFee.toFixed(2)),
        stripe_fee_amount: parseFloat(stripeFee.toFixed(2))
      });

      updatedCount++;
    }

    return Response.json({
      success: true,
      message: 'Stripe fees backfilled successfully',
      total_bookings: allBookings.length,
      updated: updatedCount,
      skipped: skippedCount
    });

  } catch (error) {
    console.error('Backfill error:', error);
    return Response.json({ 
      error: error.message || 'Failed to backfill stripe fees' 
    }, { status: 500 });
  }
});