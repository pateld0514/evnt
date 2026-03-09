import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);

    if (!user || user.role !== "admin") {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const now = Date.now();
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const tenMinutesAgo = new Date(now - 10 * 60 * 1000);

    // Fetch all data in parallel
    const [bookings, vendors] = await Promise.all([
      base44.asServiceRole.entities.Booking.list('-created_date', 200),
      base44.asServiceRole.entities.Vendor.list('-created_date', 200),
    ]);

    // ─── VALIDATION CHECKS ────────────────────────────────────
    const validation = { checks: [], warnings: [], errors: [] };

    // Missing client_state
    const missingState = bookings.filter(b => !b.client_state);
    if (missingState.length > 0) {
      validation.warnings.push({ name: 'Missing client_state', count: missingState.length, severity: 'medium' });
    } else {
      validation.checks.push({ name: 'Client State Validation', status: 'passed' });
    }

    // Legacy bookings needing migration (field is stripe_fee_amount on the entity)
    const legacy = bookings.filter(b => b.stripe_fee_amount == null || b.sales_tax_rate == null);
    if (legacy.length > 0) {
      validation.warnings.push({ name: 'Legacy Bookings Need Migration', count: legacy.length, severity: 'medium', recommendation: 'Run backfillStripeFees' });
    } else {
      validation.checks.push({ name: 'Booking Schema Completeness', status: 'passed' });
    }

    // Recent payment failures
    const recentFailures = bookings.filter(b => b.payment_status === 'failed' && new Date(b.updated_date) > oneDayAgo);
    if (recentFailures.length > 0) {
      validation.warnings.push({ name: 'Recent Payment Failures', count: recentFailures.length, severity: 'high' });
    } else {
      validation.checks.push({ name: 'Payment Success Rate', status: 'passed' });
    }

    // Pending vendors
    const pendingVendors = vendors.filter(v => v.approval_status === 'pending');
    if (pendingVendors.length > 0) {
      validation.warnings.push({ name: 'Pending Vendor Approvals', count: pendingVendors.length, severity: 'low' });
    }

    // Stale negotiations
    const stuckNegotiating = bookings.filter(b => b.status === 'negotiating' && new Date(b.updated_date) < sevenDaysAgo);
    if (stuckNegotiating.length > 0) {
      validation.warnings.push({ name: 'Stale Negotiations', count: stuckNegotiating.length, severity: 'low' });
    }

    const validationSummary = {
      total_checks: validation.checks.length,
      total_warnings: validation.warnings.length,
      total_errors: validation.errors.length,
      total_bookings: bookings.length,
      total_vendors: vendors.length,
      overall_status: validation.errors.length > 0 ? 'critical' :
        validation.warnings.filter(w => w.severity === 'high').length > 0 ? 'warning' : 'healthy'
    };

    // ─── EDGE CASE CHECKS ─────────────────────────────────────
    const edgeAlerts = { critical: [], warnings: [], info: [] };

    // Null client_state with amount
    const nullStateActive = bookings.filter(b => !b.client_state && b.total_amount_charged > 0 && b.status !== 'cancelled');
    if (nullStateActive.length > 0) {
      edgeAlerts.warnings.push({ type: 'null_client_state', count: nullStateActive.length, message: 'Active bookings with null client_state' });
    }

    // Abandoned checkouts
    const abandoned = bookings.filter(b => b.status === 'payment_pending' && new Date(b.updated_date) < oneDayAgo);
    if (abandoned.length > 0) {
      edgeAlerts.info.push({ type: 'abandoned_checkouts', count: abandoned.length, message: 'Bookings stuck in payment_pending 24h+' });
    }

    // Mismatched totals
    const mismatched = bookings.filter(b => b.agreed_price && b.total_amount_charged && Math.abs(b.agreed_price - b.total_amount_charged) > 1);
    if (mismatched.length > 0) {
      edgeAlerts.critical.push({ type: 'mismatched_totals', count: mismatched.length, message: 'agreed_price != total_amount_charged' });
    }

    // Vendors without Stripe
    const noStripe = vendors.filter(v => v.approval_status === 'approved' && !v.stripe_account_id);
    if (noStripe.length > 0) {
      edgeAlerts.warnings.push({ type: 'vendors_without_stripe', count: noStripe.length, message: 'Approved vendors without Stripe' });
    }

    // Stuck payment processing
    const stuckProcessing = bookings.filter(b => b.payment_status === 'processing' && new Date(b.updated_date) < tenMinutesAgo);
    if (stuckProcessing.length > 0) {
      edgeAlerts.critical.push({ type: 'stuck_payment_processing', count: stuckProcessing.length, message: 'Payments stuck in processing 10min+' });
    }

    const edgeSummary = {
      total_critical: edgeAlerts.critical.length,
      total_warnings: edgeAlerts.warnings.length,
      total_info: edgeAlerts.info.length,
      overall_health: edgeAlerts.critical.length > 0 ? 'critical' : edgeAlerts.warnings.length > 0 ? 'warning' : 'healthy'
    };

    // ─── COMPILE REPORT ───────────────────────────────────────
    const hasErrors = validationSummary.total_errors > 0 || edgeSummary.total_critical > 0;
    const hasWarnings = validationSummary.total_warnings > 0 || edgeSummary.total_warnings > 0;

    const criticalItems = [
      ...edgeAlerts.critical.map(a => ({ source: 'edge_cases', ...a }))
    ];

    const recommendations = [];
    if (hasErrors) recommendations.push('CRITICAL: Address errors immediately');
    if (hasWarnings) recommendations.push('Review warnings and plan remediation');
    if (legacy.length > 0) recommendations.push(`Migrate ${legacy.length} legacy bookings using backfillStripeFees`);

    return Response.json({
      success: true,
      health_report: {
        timestamp: new Date().toISOString(),
        platform_status: hasErrors ? 'degraded' : hasWarnings ? 'operational_with_warnings' : 'operational',
        checks: {
          validation: { status: validationSummary.overall_status, details: validationSummary },
          edge_cases: { status: edgeSummary.overall_health, details: edgeSummary },
          migration: {
            status: legacy.length > 0 ? 'pending' : 'complete',
            legacy_bookings: legacy.length,
            recommendation: legacy.length > 0 ? 'Run backfillStripeFees' : 'All bookings migrated'
          }
        },
        recommendations,
        critical_items: criticalItems,
        requires_immediate_action: criticalItems.length > 0,
        raw: {
          validation_warnings: validation.warnings,
          edge_alerts: edgeAlerts
        }
      }
    });

  } catch (error) {
    console.error('Daily health check error:', error);
    return Response.json({ error: error.message, platform_status: 'error' }, { status: 500 });
  }
});