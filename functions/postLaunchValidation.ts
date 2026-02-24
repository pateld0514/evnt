import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Admin-only check
    if (!user || (user.email !== "pateld0514@gmail.com" && user.role !== "admin")) {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const report = {
      timestamp: new Date().toISOString(),
      checks: [],
      warnings: [],
      errors: [],
      summary: {}
    };

    // 1. Check approveVendor deployment
    try {
      const testResult = await base44.asServiceRole.functions.invoke('approveVendor', {
        vendorId: 'test',
        userId: 'test'
      });
      report.checks.push({
        name: 'approveVendor Deployment',
        status: 'deployed',
        message: 'Function is accessible'
      });
    } catch (error) {
      if (error.message.includes('404')) {
        report.errors.push({
          name: 'approveVendor Deployment',
          status: 'not_deployed',
          message: 'Function not deployed - requires manual redeploy',
          severity: 'high'
        });
      } else {
        report.checks.push({
          name: 'approveVendor Deployment',
          status: 'deployed',
          message: 'Function exists (validation error expected for test data)'
        });
      }
    }

    // 2. Check for bookings with missing client_state
    const bookings = await base44.asServiceRole.entities.Booking.list();
    const missingStateBookings = bookings.filter(b => !b.client_state);
    
    if (missingStateBookings.length > 0) {
      report.warnings.push({
        name: 'Missing client_state',
        count: missingStateBookings.length,
        message: `${missingStateBookings.length} bookings missing client_state - may have 0% tax`,
        severity: 'medium',
        booking_ids: missingStateBookings.map(b => b.id)
      });
    } else {
      report.checks.push({
        name: 'Client State Validation',
        status: 'passed',
        message: 'All bookings have client_state defined'
      });
    }

    // 3. Check for legacy bookings missing stripe_fee or sales_tax_rate
    const legacyBookings = bookings.filter(b => 
      b.stripe_fee === null || 
      b.stripe_fee === undefined || 
      b.sales_tax_rate === null || 
      b.sales_tax_rate === undefined
    );

    if (legacyBookings.length > 0) {
      report.warnings.push({
        name: 'Legacy Bookings Need Migration',
        count: legacyBookings.length,
        message: `${legacyBookings.length} bookings missing stripe_fee or sales_tax_rate`,
        severity: 'medium',
        recommendation: 'Run backfillStripeFees migration',
        booking_ids: legacyBookings.map(b => b.id)
      });
    } else {
      report.checks.push({
        name: 'Booking Schema Completeness',
        status: 'passed',
        message: 'All bookings have stripe_fee and sales_tax_rate'
      });
    }

    // 4. Check for recent payment failures
    const recentFailures = bookings.filter(b => 
      b.payment_status === 'failed' && 
      new Date(b.updated_date) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    );

    if (recentFailures.length > 0) {
      report.warnings.push({
        name: 'Recent Payment Failures',
        count: recentFailures.length,
        message: `${recentFailures.length} payments failed in last 24 hours`,
        severity: 'high',
        booking_ids: recentFailures.map(b => b.id)
      });
    } else {
      report.checks.push({
        name: 'Payment Success Rate',
        status: 'passed',
        message: 'No payment failures in last 24 hours'
      });
    }

    // 5. Check for pending vendor approvals
    const vendors = await base44.asServiceRole.entities.Vendor.list();
    const pendingVendors = vendors.filter(v => v.approval_status === 'pending');

    if (pendingVendors.length > 0) {
      report.warnings.push({
        name: 'Pending Vendor Approvals',
        count: pendingVendors.length,
        message: `${pendingVendors.length} vendors awaiting admin approval`,
        severity: 'low',
        vendor_ids: pendingVendors.map(v => v.id)
      });
    }

    // 6. Check for bookings stuck in negotiating status
    const stuckBookings = bookings.filter(b => 
      b.status === 'negotiating' && 
      new Date(b.updated_date) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );

    if (stuckBookings.length > 0) {
      report.warnings.push({
        name: 'Stale Negotiations',
        count: stuckBookings.length,
        message: `${stuckBookings.length} bookings stuck in negotiating for 7+ days`,
        severity: 'low',
        booking_ids: stuckBookings.map(b => b.id)
      });
    }

    // 7. Summary
    report.summary = {
      total_checks: report.checks.length,
      total_warnings: report.warnings.length,
      total_errors: report.errors.length,
      total_bookings: bookings.length,
      total_vendors: vendors.length,
      pending_vendors: pendingVendors.length,
      legacy_bookings_needing_migration: legacyBookings.length,
      bookings_missing_state: missingStateBookings.length,
      recent_payment_failures: recentFailures.length,
      overall_status: report.errors.length > 0 ? 'critical' : 
                     report.warnings.filter(w => w.severity === 'high').length > 0 ? 'warning' : 'healthy'
    };

    return Response.json({
      success: true,
      report
    });

  } catch (error) {
    console.error('Post-launch validation error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});