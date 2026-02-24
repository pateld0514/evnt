import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // CRITICAL: Admin-only check
    if (!user || user.role !== "admin") {
      console.error('Unauthorized backfillStripeFees attempt', { user_id: user?.id, email: user?.email });
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const allBookings = await base44.asServiceRole.entities.Booking.list();
    let updatedCount = 0;
    const errors = [];

    for (const booking of allBookings) {
      try {
        // If stripe_fee_amount is missing but stripe_fee exists, migrate it
        if (!booking.stripe_fee_amount && booking.stripe_fee) {
          await base44.asServiceRole.entities.Booking.update(booking.id, {
            stripe_fee_amount: booking.stripe_fee
          });
          updatedCount++;
          console.log(`Migrated stripe_fee to stripe_fee_amount for booking ${booking.id}`);
        }
        // If stripe_fee_amount is missing and payment_status is paid, calculate it
        else if (!booking.stripe_fee_amount && booking.payment_status === 'paid' && booking.base_event_amount) {
          const stripeFee = (booking.base_event_amount * 0.029) + 0.30;
          await base44.asServiceRole.entities.Booking.update(booking.id, {
            stripe_fee_amount: parseFloat(stripeFee.toFixed(2))
          });
          updatedCount++;
          console.log(`Calculated and set stripe_fee_amount for booking ${booking.id}`);
        }
      } catch (error) {
        errors.push({ booking_id: booking.id, error: error.message });
      }
    }

    return Response.json({
      success: true,
      updated_count: updatedCount,
      total_processed: allBookings.length,
      errors: errors,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Backfill error:', error);
    return Response.json({ 
      error: error.message || 'Backfill failed' 
    }, { status: 500 });
  }
});