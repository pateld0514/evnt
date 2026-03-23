import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // CRITICAL: Admin-only check
    if (!user || user.role !== "admin") {
      console.error('Unauthorized validateProduction attempt', { user_id: user?.id, email: user?.email });
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const issues = [];
    const warnings = [];

    // Phase 7: Validate production data consistency
    console.log('Starting production data validation...');

    // 1. Check for legacy fields in bookings
    const allBookings = await base44.asServiceRole.entities.Booking.list();
    
    for (const booking of allBookings) {
      // Check for standardized field names
      if (booking.stripe_fee !== undefined && booking.stripe_fee !== null) {
        warnings.push(`Booking ${booking.id} has deprecated stripe_fee field instead of stripe_fee_amount`);
      }
      
      if (booking.total_amount !== undefined && booking.total_amount !== null) {
        warnings.push(`Booking ${booking.id} has deprecated total_amount field instead of total_amount_charged`);
      }

      // Check for missing standardized fields
      if (booking.stripe_fee_amount === undefined && booking.payment_status === 'paid') {
        issues.push(`Booking ${booking.id} (paid) missing stripe_fee_amount - CRITICAL`);
      }

      if (!booking.total_amount_charged && booking.payment_status !== 'unpaid' && booking.payment_status !== 'failed') {
        issues.push(`Booking ${booking.id} (${booking.payment_status}) missing total_amount_charged - CRITICAL`);
      }

      // Check for tax consistency
      if (booking.sales_tax_amount === undefined && booking.status !== 'pending') {
        warnings.push(`Booking ${booking.id} missing sales_tax_amount`);
      }

      // Check idempotency key for paid bookings
      if (booking.payment_status === 'paid' && !booking.idempotency_key) {
        warnings.push(`Booking ${booking.id} (paid) missing idempotency_key - should have been set during capture`);
      }

      // Validate fee calculations
      if (booking.platform_fee_amount && booking.platform_fee_percent && booking.base_event_amount) {
        const expectedFee = (booking.base_event_amount * booking.platform_fee_percent) / 100;
        const diff = Math.abs(expectedFee - booking.platform_fee_amount);
        if (diff > 0.01) {
          issues.push(`Booking ${booking.id} platform fee calculation mismatch: expected $${expectedFee.toFixed(2)}, got $${booking.platform_fee_amount.toFixed(2)}`);
        }
      }

      // Validate vendor payout calculation
      if (booking.vendor_payout && booking.base_event_amount && booking.platform_fee_amount) {
        const expectedPayout = booking.base_event_amount - booking.platform_fee_amount - (booking.sales_tax_amount || 0) - (booking.stripe_fee_amount || 0);
        const diff = Math.abs(expectedPayout - booking.vendor_payout);
        if (diff > 0.01) {
          warnings.push(`Booking ${booking.id} vendor payout calculation mismatch: expected $${expectedPayout.toFixed(2)}, got $${booking.vendor_payout.toFixed(2)}`);
        }
      }
    }

    // 2. Validate vendor Stripe accounts
    const allVendors = await base44.asServiceRole.entities.Vendor.list();
    
    for (const vendor of allVendors) {
      if (vendor.approval_status === 'approved' && !vendor.stripe_account_id) {
        issues.push(`Vendor ${vendor.id} (${vendor.business_name}) approved but missing Stripe account - CRITICAL`);
      }

      if (vendor.stripe_account_id && !vendor.stripe_account_verified) {
        warnings.push(`Vendor ${vendor.id} has Stripe account but not verified`);
      }
    }

    // 3. Check for orphaned payout records
    const allPayouts = await base44.asServiceRole.entities.VendorPayout.list();
    
    for (const payout of allPayouts) {
      const relatedBookings = allBookings.filter(b => b.id === payout.booking_id);
      if (relatedBookings.length === 0) {
        issues.push(`VendorPayout ${payout.id} orphaned - no matching booking`);
      } else {
        const booking = relatedBookings[0];
        if (payout.status === 'completed' && booking.payment_status !== 'paid') {
          issues.push(`VendorPayout ${payout.id} completed but booking not paid - data inconsistency`);
        }
      }
    }

    // 4. Check platform fee settings
    const feeSettings = await base44.asServiceRole.entities.PlatformSettings.filter({ 
      setting_key: 'platform_fee_percent' 
    });
    
    if (feeSettings.length === 0) {
      issues.push('Platform fee percentage not configured - CRITICAL');
    } else {
      const feePercent = parseFloat(feeSettings[0].setting_value);
      if (feePercent < 5 || feePercent > 50) {
        warnings.push(`Platform fee percentage ${feePercent}% seems unusual - verify it's correct`);
      }
    }

    return Response.json({
      success: true,
      validation_timestamp: new Date().toISOString(),
      total_bookings: allBookings.length,
      total_vendors: allVendors.length,
      total_payouts: allPayouts.length,
      issues: issues,
      issue_count: issues.length,
      warnings: warnings,
      warning_count: warnings.length,
      status: issues.length === 0 ? 'PASS' : 'FAIL'
    });

  } catch (error) {
    console.error('Validation error:', error);
    return Response.json({ 
      error: error.message || 'Validation failed',
      stack: error.stack 
    }, { status: 500 });
  }
});