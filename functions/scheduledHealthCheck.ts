import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// Scheduled automation — runs daily
// Checks for platform anomalies and notifies admin if issues are found
// No user auth required — called by scheduler with no token

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const adminEmail = Deno.env.get('ADMIN_EMAIL') || 'admin@joinevnt.com';
    const report = {
      timestamp: new Date().toISOString(),
      issues: [],
      stats: {}
    };

    // 1. Check for bookings stuck in payment_pending > 48 hours
    const allBookings = await base44.asServiceRole.entities.Booking.list('-created_date', 200);
    const now = new Date();
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const stuckPayments = allBookings.filter(b =>
      b.status === 'payment_pending' &&
      new Date(b.updated_date) < fortyEightHoursAgo
    );
    if (stuckPayments.length > 0) {
      report.issues.push({
        severity: 'warning',
        type: 'stuck_payments',
        count: stuckPayments.length,
        message: `${stuckPayments.length} booking(s) stuck in payment_pending for >48 hours`,
        ids: stuckPayments.map(b => b.id)
      });
    }

    // 2. Check for pending bookings > 7 days (vendor never responded)
    const stalePending = allBookings.filter(b =>
      b.status === 'pending' &&
      new Date(b.created_date) < sevenDaysAgo
    );
    if (stalePending.length > 0) {
      report.issues.push({
        severity: 'warning',
        type: 'stale_pending',
        count: stalePending.length,
        message: `${stalePending.length} booking(s) pending with no vendor response for >7 days`
      });
    }

    // 3. Check for vendors pending admin approval > 3 days
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const allVendors = await base44.asServiceRole.entities.Vendor.list('-created_date', 100);
    const pendingVendors = allVendors.filter(v =>
      v.approval_status === 'pending' &&
      new Date(v.created_date) < threeDaysAgo
    );
    if (pendingVendors.length > 0) {
      report.issues.push({
        severity: 'info',
        type: 'pending_vendor_approvals',
        count: pendingVendors.length,
        message: `${pendingVendors.length} vendor(s) waiting for approval for >3 days`
      });
    }

    // 4. Platform stats summary
    const completedBookings = allBookings.filter(b => b.status === 'completed');
    const confirmedBookings = allBookings.filter(b => b.status === 'confirmed');
    const totalRevenue = completedBookings.reduce((sum, b) => sum + (b.agreed_price || 0), 0);

    report.stats = {
      total_bookings: allBookings.length,
      completed: completedBookings.length,
      confirmed: confirmedBookings.length,
      pending: allBookings.filter(b => b.status === 'pending').length,
      cancelled: allBookings.filter(b => b.status === 'cancelled').length,
      total_revenue: totalRevenue,
      total_vendors: allVendors.length,
      approved_vendors: allVendors.filter(v => v.approval_status === 'approved').length
    };

    // 5. Send alert email if there are issues
    if (report.issues.length > 0) {
      const issueList = report.issues.map(i =>
        `<li style="margin-bottom:8px;"><strong>[${i.severity.toUpperCase()}]</strong> ${i.message}</li>`
      ).join('');

      const emailBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { margin: 0; padding: 0; font-family: Arial, sans-serif; background: #f3f4f6; }
    .container { max-width: 600px; margin: 0 auto; background: #fff; }
    .header { background: #000; padding: 30px; text-align: center; }
    .logo { font-size: 32px; font-weight: 900; color: #fff; }
    .content { padding: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><div class="logo">EVNT — Daily Health Check</div></div>
    <div class="content">
      <h2 style="color:#000;">⚠️ Platform Issues Detected</h2>
      <p>The daily health check found ${report.issues.length} issue(s) requiring attention:</p>
      <ul>${issueList}</ul>
      
      <h3>Platform Stats (Today)</h3>
      <ul>
        <li>Total Bookings: ${report.stats.total_bookings}</li>
        <li>Completed: ${report.stats.completed}</li>
        <li>Confirmed: ${report.stats.confirmed}</li>
        <li>Pending: ${report.stats.pending}</li>
        <li>Total Revenue: $${Number(report.stats.total_revenue).toLocaleString()}</li>
        <li>Active Vendors: ${report.stats.approved_vendors} / ${report.stats.total_vendors}</li>
      </ul>

      <p style="color:#6b7280; font-size:12px;">Generated: ${report.timestamp}</p>
    </div>
  </div>
</body>
</html>`;

      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: adminEmail,
          from_name: 'EVNT Health Monitor',
          subject: `⚠️ EVNT Daily Health Check — ${report.issues.length} Issue(s) Found`,
          body: emailBody
        });
      } catch (emailErr) {
        console.warn('[scheduledHealthCheck] Admin alert email failed:', emailErr.message);
      }
    }

    console.log(`[scheduledHealthCheck] Complete. Issues: ${report.issues.length}, Bookings: ${report.stats.total_bookings}`);

    return Response.json({ success: true, report });

  } catch (error) {
    console.error('[scheduledHealthCheck] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});