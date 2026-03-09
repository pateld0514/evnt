import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Admin-only check
    if (!user || user.role !== "admin") {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const healthReport = {
      timestamp: new Date().toISOString(),
      platform_status: 'operational',
      checks: {},
      recommendations: []
    };

    // 1. Run post-launch validation
    let validationResult;
    try {
      validationResult = await base44.functions.invoke('postLaunchValidation', {});
      healthReport.checks.validation = {
        status: validationResult.data.report.summary.overall_status,
        details: validationResult.data.report.summary
      };
    } catch (error) {
      healthReport.checks.validation = {
        status: 'error',
        error: error.message
      };
    }

    // 2. Run edge case monitor
    let edgeCaseResult;
    try {
      edgeCaseResult = await base44.functions.invoke('edgeCaseMonitor', {});
      healthReport.checks.edge_cases = {
        status: edgeCaseResult.data.summary.overall_health,
        details: edgeCaseResult.data.summary
      };
    } catch (error) {
      healthReport.checks.edge_cases = {
        status: 'error',
        error: error.message
      };
    }

    // 3. Check if migration needed
    const bookings = await base44.asServiceRole.entities.Booking.list();
    const needsMigration = bookings.filter(b => 
      b.stripe_fee === null || 
      b.stripe_fee === undefined || 
      b.sales_tax_rate === null || 
      b.sales_tax_rate === undefined
    );

    healthReport.checks.migration = {
      status: needsMigration.length > 0 ? 'pending' : 'complete',
      legacy_bookings: needsMigration.length,
      recommendation: needsMigration.length > 0 ? 
        'Run backfillStripeFees migration' : 
        'All bookings migrated'
    };

    // 4. Overall platform status
    const hasErrors = (validationResult?.data?.report?.summary?.total_errors || 0) > 0 || 
                     (edgeCaseResult?.data?.summary?.total_critical || 0) > 0;
    const hasWarnings = (validationResult?.data?.report?.summary?.total_warnings || 0) > 0 || 
                       (edgeCaseResult?.data?.summary?.total_warnings || 0) > 0;

    if (hasErrors) {
      healthReport.platform_status = 'degraded';
      healthReport.recommendations.push('CRITICAL: Address errors in validation report immediately');
    } else if (hasWarnings) {
      healthReport.platform_status = 'operational_with_warnings';
      healthReport.recommendations.push('Review warnings and plan remediation');
    }

    if (needsMigration.length > 0) {
      healthReport.recommendations.push(`Migrate ${needsMigration.length} legacy bookings using backfillStripeFees`);
    }

    // 5. Compile all critical items
    const criticalItems = [];
    
    if (validationResult?.data?.report?.errors?.length > 0) {
      criticalItems.push(...validationResult.data.report.errors.map(e => ({
        source: 'validation',
        ...e
      })));
    }

    if (edgeCaseResult?.data?.alerts?.critical?.length > 0) {
      criticalItems.push(...edgeCaseResult.data.alerts.critical.map(a => ({
        source: 'edge_cases',
        ...a
      })));
    }

    healthReport.critical_items = criticalItems;
    healthReport.requires_immediate_action = criticalItems.length > 0;

    return Response.json({
      success: true,
      health_report: healthReport
    });

  } catch (error) {
    console.error('Daily health check error:', error);
    return Response.json({ 
      error: error.message,
      platform_status: 'error'
    }, { status: 500 });
  }
});