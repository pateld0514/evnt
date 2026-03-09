import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Admin-only check
    if (!user || user.role !== "admin") {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const alerts = {
      critical: [],
      warnings: [],
      info: [],
      timestamp: new Date().toISOString()
    };

    // 1. Check for bookings with null client_state but non-zero amounts
    const bookings = await base44.asServiceRole.entities.Booking.list();
    const nullStateWithAmount = bookings.filter(b => 
      !b.client_state && 
      b.total_amount_charged > 0 && 
      b.status !== 'cancelled'
    );

    if (nullStateWithAmount.length > 0) {
      alerts.warnings.push({
        type: 'null_client_state',
        severity: 'medium',
        count: nullStateWithAmount.length,
        message: 'Active bookings with null client_state - tax may be 0%',
        recommendation: 'Review and update client_state manually',
        booking_ids: nullStateWithAmount.map(b => b.id)
      });
    }

    // 2. Check for abandoned checkouts (payment_pending > 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const abandonedCheckouts = bookings.filter(b => 
      b.status === 'payment_pending' && 
      new Date(b.updated_date) < oneDayAgo
    );

    if (abandonedCheckouts.length > 0) {
      alerts.info.push({
        type: 'abandoned_checkouts',
        severity: 'low',
        count: abandonedCheckouts.length,
        message: 'Bookings stuck in payment_pending for 24+ hours',
        recommendation: 'Follow up with clients or auto-cancel after 48 hours',
        booking_ids: abandonedCheckouts.map(b => b.id)
      });
    }

    // 3. Check for bookings with mismatched totals
    const mismatchedTotals = bookings.filter(b => {
      if (!b.agreed_price || !b.total_amount_charged) return false;
      
      const expectedTotal = b.agreed_price;
      const actualTotal = b.total_amount_charged;
      const difference = Math.abs(expectedTotal - actualTotal);
      
      return difference > 1; // More than $1 difference
    });

    if (mismatchedTotals.length > 0) {
      alerts.critical.push({
        type: 'mismatched_totals',
        severity: 'high',
        count: mismatchedTotals.length,
        message: 'Bookings with agreed_price != total_amount_charged',
        recommendation: 'Review calculations immediately',
        booking_ids: mismatchedTotals.map(b => ({
          id: b.id,
          agreed_price: b.agreed_price,
          total_charged: b.total_amount_charged
        }))
      });
    }

    // 4. Check for vendors without Stripe accounts attempting to receive payments
    const vendors = await base44.asServiceRole.entities.Vendor.list();
    const vendorsWithoutStripe = vendors.filter(v => 
      v.approval_status === 'approved' && 
      !v.stripe_account_id
    );

    if (vendorsWithoutStripe.length > 0) {
      alerts.warnings.push({
        type: 'vendors_without_stripe',
        severity: 'medium',
        count: vendorsWithoutStripe.length,
        message: 'Approved vendors without Stripe accounts',
        recommendation: 'Prompt vendors to connect Stripe',
        vendor_ids: vendorsWithoutStripe.map(v => v.id)
      });
    }

    // 5. Check for recent booking update conflicts (same booking updated within 5 seconds)
    const recentBookings = bookings.filter(b => 
      new Date(b.updated_date) > new Date(Date.now() - 60 * 60 * 1000)
    );
    
    const updateConflicts = recentBookings.reduce((conflicts, booking) => {
      const similar = recentBookings.filter(b => 
        b.id === booking.id && 
        Math.abs(new Date(b.updated_date) - new Date(booking.updated_date)) < 5000
      );
      if (similar.length > 1) conflicts.push(booking.id);
      return conflicts;
    }, []);

    if (updateConflicts.length > 0) {
      alerts.info.push({
        type: 'potential_race_conditions',
        severity: 'low',
        count: updateConflicts.length,
        message: 'Bookings updated multiple times within 5 seconds',
        recommendation: 'Monitor for race conditions',
        booking_ids: [...new Set(updateConflicts)]
      });
    }

    // 6. Check for failed Stripe webhooks (payment_status processing > 10 minutes)
    const stuckProcessing = bookings.filter(b => 
      b.payment_status === 'processing' && 
      new Date(b.updated_date) < new Date(Date.now() - 10 * 60 * 1000)
    );

    if (stuckProcessing.length > 0) {
      alerts.critical.push({
        type: 'stuck_payment_processing',
        severity: 'high',
        count: stuckProcessing.length,
        message: 'Payments stuck in processing for 10+ minutes',
        recommendation: 'Check Stripe webhook delivery logs',
        booking_ids: stuckProcessing.map(b => b.id)
      });
    }

    // 7. Summary
    const summary = {
      total_critical: alerts.critical.length,
      total_warnings: alerts.warnings.length,
      total_info: alerts.info.length,
      requires_immediate_action: alerts.critical.length > 0,
      overall_health: alerts.critical.length > 0 ? 'critical' : 
                      alerts.warnings.length > 0 ? 'warning' : 'healthy'
    };

    return Response.json({
      success: true,
      alerts,
      summary
    });

  } catch (error) {
    console.error('Edge case monitor error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});