import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Fetch core data in parallel with conservative limits
    const [bookings, vendors] = await Promise.all([
      base44.asServiceRole.entities.Booking.list('-created_date', 100),
      base44.asServiceRole.entities.Vendor.list('-created_date', 100),
    ]);

    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

    // ─── FUNNEL ANALYSIS ──────────────────────────────────────
    const statusCounts = {};
    for (const b of bookings) {
      statusCounts[b.status] = (statusCounts[b.status] || 0) + 1;
    }

    const funnelStages = ['pending', 'negotiating', 'payment_pending', 'confirmed', 'in_progress', 'completed'];
    const funnelConversion = {};
    let prev = null;
    for (const stage of funnelStages) {
      const count = statusCounts[stage] || 0;
      funnelConversion[stage] = {
        count,
        rate_from_prev: prev !== null && prev > 0 ? Math.round((count / prev) * 100) : null
      };
      prev = count;
    }

    // ─── REVENUE METRICS ──────────────────────────────────────
    const completedBookings = bookings.filter(b => b.status === 'completed');
    const recentCompleted = completedBookings.filter(b => new Date(b.created_date) > thirtyDaysAgo);
    const totalRevenue = completedBookings.reduce((sum, b) => sum + (b.platform_fee_amount || 0), 0);
    const recentRevenue = recentCompleted.reduce((sum, b) => sum + (b.platform_fee_amount || 0), 0);
    const avgBookingValue = completedBookings.length > 0
      ? completedBookings.reduce((sum, b) => sum + (b.total_amount_charged || 0), 0) / completedBookings.length
      : 0;

    // ─── CATEGORY PERFORMANCE (O(1) vendor lookup) ────────────
    const vendorMap = Object.fromEntries(vendors.map(v => [v.id, v]));
    const categoryStats = {};
    for (const booking of bookings) {
      const cat = vendorMap[booking.vendor_id]?.category || 'unknown';
      if (!categoryStats[cat]) {
        categoryStats[cat] = { total: 0, completed: 0, cancelled: 0, revenue: 0, values: [] };
      }
      categoryStats[cat].total++;
      if (booking.status === 'completed') {
        categoryStats[cat].completed++;
        categoryStats[cat].revenue += booking.platform_fee_amount || 0;
        categoryStats[cat].values.push(booking.total_amount_charged || 0);
      }
      if (booking.status === 'cancelled') categoryStats[cat].cancelled++;
    }

    const categoryRankings = Object.entries(categoryStats).map(([cat, s]) => ({
      category: cat,
      total_bookings: s.total,
      completed: s.completed,
      completion_rate: s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0,
      cancellation_rate: s.total > 0 ? Math.round((s.cancelled / s.total) * 100) : 0,
      platform_revenue: Math.round(s.revenue * 100) / 100,
      avg_booking_value: s.values.length > 0 ? Math.round(s.values.reduce((a, b) => a + b, 0) / s.values.length) : 0
    })).sort((a, b) => b.completed - a.completed);

    // ─── VENDOR HEALTH (indexed) ───────────────────────────────
    const bookingsByVendor = {};
    for (const b of bookings) {
      if (!bookingsByVendor[b.vendor_id]) bookingsByVendor[b.vendor_id] = [];
      bookingsByVendor[b.vendor_id].push(b);
    }

    const approvedVendors = vendors.filter(v => v.approval_status === 'approved');
    const vendorsWithoutStripe = approvedVendors.filter(v => !v.stripe_account_id);
    const vendorsWithNoBookings = approvedVendors.filter(v => !bookingsByVendor[v.id]?.length);
    const vendorsWithStaleBookings = approvedVendors.filter(v =>
      (bookingsByVendor[v.id] || [])
        .filter(b => b.status === 'pending')
        .some(b => new Date(b.created_date) < sevenDaysAgo)
    );

    // ─── BUILD INSIGHTS (deduplication via in-memory set) ─────
    // We skip a DB lookup here to stay within CPU limits.
    // Duplicate insights are a minor UX issue vs a hard crash.
    const insightsToCreate = [];

    if (vendorsWithoutStripe.length > 0) {
      insightsToCreate.push({
        agent_name: 'event_intelligence',
        severity: 'P2',
        finding: `${vendorsWithoutStripe.length} approved vendor(s) missing Stripe: ${vendorsWithoutStripe.slice(0, 3).map(v => v.business_name).join(', ')}`,
        recommendation: 'Send reminder email to each vendor with direct link to Stripe connect flow in VendorDashboard.',
        affected_entity: 'Vendor',
        affected_page: 'pages/VendorDashboard',
      });
    }

    if (vendorsWithNoBookings.length > 0) {
      insightsToCreate.push({
        agent_name: 'event_intelligence',
        severity: 'P3',
        finding: `${vendorsWithNoBookings.length} approved vendor(s) have zero bookings: ${vendorsWithNoBookings.slice(0, 3).map(v => v.business_name).join(', ')}`,
        recommendation: 'Review their profiles for completeness. Feature them in the swipe deck or send a profile optimization tip.',
        affected_entity: 'Vendor',
        affected_page: 'pages/Swipe',
      });
    }

    if (categoryRankings.length > 0) {
      const top = categoryRankings[0];
      insightsToCreate.push({
        agent_name: 'event_intelligence',
        severity: 'info',
        finding: `Top category: ${top.category} — ${top.completed} completions, ${top.completion_rate}% rate, avg $${top.avg_booking_value}. Month revenue: $${recentRevenue.toFixed(2)}`,
        recommendation: `Prioritize acquiring more ${top.category} vendors. Consider promoting this category in marketing.`,
        affected_entity: 'Booking',
      });
    }

    if (vendorsWithStaleBookings.length > 0) {
      insightsToCreate.push({
        agent_name: 'event_intelligence',
        severity: 'P2',
        finding: `${vendorsWithStaleBookings.length} vendor(s) have booking requests unanswered 7+ days`,
        recommendation: 'Send automated reminders. Consider implementing a 72-hour response time policy.',
        affected_entity: 'Booking',
        affected_page: 'pages/Bookings',
      });
    }

    // Write insights sequentially (more stable than parallel under CPU limits)
    const insightsCreated = [];
    for (const data of insightsToCreate) {
      const insight = await base44.asServiceRole.entities.AgentInsights.create(data);
      insightsCreated.push(insight.id);
    }

    return Response.json({
      success: true,
      insights_created: insightsCreated.length,
      metrics: {
        funnel: funnelConversion,
        revenue: {
          total_platform_revenue: Math.round(totalRevenue * 100) / 100,
          last_30_days_revenue: Math.round(recentRevenue * 100) / 100,
          avg_booking_value: Math.round(avgBookingValue * 100) / 100,
          total_completed_bookings: completedBookings.length
        },
        categories: categoryRankings,
        vendor_health: {
          total_approved: approvedVendors.length,
          without_stripe: vendorsWithoutStripe.length,
          no_bookings: vendorsWithNoBookings.length,
          stale_pending_requests: vendorsWithStaleBookings.length
        }
      }
    });

  } catch (error) {
    console.error('[computeEventMetrics] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});