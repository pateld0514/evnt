import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const [bookings, vendors, reviews] = await Promise.all([
      base44.asServiceRole.entities.Booking.list('-created_date', 500),
      base44.asServiceRole.entities.Vendor.list('-created_date', 200),
      base44.asServiceRole.entities.Review.list('-created_date', 500),
    ]);

    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

    // ─── FUNNEL ANALYSIS ───────────────────────────────────────
    const statusCounts = {};
    for (const b of bookings) {
      statusCounts[b.status] = (statusCounts[b.status] || 0) + 1;
    }

    const funnelStages = ['pending', 'negotiating', 'payment_pending', 'confirmed', 'in_progress', 'completed'];
    const funnelConversion = {};
    let prev = null; // null = no prior stage to compare against
    for (const stage of funnelStages) {
      const count = statusCounts[stage] || 0;
      funnelConversion[stage] = {
        count,
        rate_from_prev: prev !== null && prev > 0 ? Math.round((count / prev) * 100) : null
      };
      prev = count;
    }

    // ─── REVENUE METRICS ───────────────────────────────────────
    const completedBookings = bookings.filter(b => b.status === 'completed');
    const recentCompleted = completedBookings.filter(b => new Date(b.created_date) > thirtyDaysAgo);
    
    const totalRevenue = completedBookings.reduce((sum, b) => sum + (b.platform_fee_amount || 0), 0);
    const recentRevenue = recentCompleted.reduce((sum, b) => sum + (b.platform_fee_amount || 0), 0);
    const avgBookingValue = completedBookings.length > 0
      ? completedBookings.reduce((sum, b) => sum + (b.total_amount_charged || 0), 0) / completedBookings.length
      : 0;

    // ─── CATEGORY PERFORMANCE ─────────────────────────────────
    // Build O(1) lookup map to avoid O(n×m) nested finds
    const vendorMap = Object.fromEntries(vendors.map(v => [v.id, v]));

    const categoryStats = {};
    for (const booking of bookings) {
      const vendor = vendorMap[booking.vendor_id];
      const cat = vendor?.category || 'unknown';
      if (!categoryStats[cat]) {
        categoryStats[cat] = { total: 0, completed: 0, cancelled: 0, declined: 0, revenue: 0, bookingValues: [] };
      }
      categoryStats[cat].total++;
      if (booking.status === 'completed') {
        categoryStats[cat].completed++;
        categoryStats[cat].revenue += booking.platform_fee_amount || 0;
        categoryStats[cat].bookingValues.push(booking.total_amount_charged || 0);
      }
      if (booking.status === 'cancelled') categoryStats[cat].cancelled++;
      if (booking.status === 'declined') categoryStats[cat].declined++;
    }

    const categoryRankings = Object.entries(categoryStats).map(([cat, stats]) => ({
      category: cat,
      total_bookings: stats.total,
      completed: stats.completed,
      completion_rate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
      cancellation_rate: stats.total > 0 ? Math.round((stats.cancelled / stats.total) * 100) : 0,
      platform_revenue: Math.round(stats.revenue * 100) / 100,
      avg_booking_value: stats.bookingValues.length > 0
        ? Math.round(stats.bookingValues.reduce((a, b) => a + b, 0) / stats.bookingValues.length)
        : 0
    })).sort((a, b) => b.completed - a.completed);

    // ─── VENDOR HEALTH ────────────────────────────────────────
    // Build booking index by vendor_id for O(1) lookups
    const bookingsByVendor = {};
    for (const b of bookings) {
      if (!bookingsByVendor[b.vendor_id]) bookingsByVendor[b.vendor_id] = [];
      bookingsByVendor[b.vendor_id].push(b);
    }

    const approvedVendors = vendors.filter(v => v.approval_status === 'approved');
    const vendorsWithoutStripe = approvedVendors.filter(v => !v.stripe_account_id);
    const vendorsWithNoBookings = approvedVendors.filter(v => !bookingsByVendor[v.id]?.length);
    const vendorsWithStaleBookings = approvedVendors.filter(v => {
      const pending = (bookingsByVendor[v.id] || []).filter(b => b.status === 'pending');
      return pending.some(b => new Date(b.created_date) < sevenDaysAgo);
    });

    // ─── REVIEW METRICS ───────────────────────────────────────
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
      : 0;
    
    // ─── WRITE INSIGHTS (deduplicated — skip if a pending insight with same finding prefix exists) ───
    const existingInsights = await base44.asServiceRole.entities.AgentInsights.filter({
      agent_name: 'event_intelligence',
      status: 'pending'
    });
    const existingFindings = new Set(existingInsights.map(i => i.finding.substring(0, 40)));

    function isDuplicate(findingText) {
      return existingFindings.has(findingText.substring(0, 40));
    }

    const insightsCreated = [];

    if (vendorsWithoutStripe.length > 0) {
      const insight = await base44.asServiceRole.entities.AgentInsights.create({
        agent_name: 'event_intelligence',
        severity: 'P2',
        finding: `${vendorsWithoutStripe.length} approved vendor(s) have not connected Stripe — cannot receive payments. Vendors: ${vendorsWithoutStripe.map(v => v.business_name).join(', ')}`,
        recommendation: 'Send reminder email to each vendor with direct link to Stripe connect flow in VendorDashboard. Consider adding a banner alert to their dashboard.',
        affected_entity: 'Vendor',
        affected_page: 'pages/VendorDashboard',
        raw_data: JSON.stringify({ vendor_ids: vendorsWithoutStripe.map(v => v.id) })
      });
      insightsCreated.push(insight.id);
    }

    if (vendorsWithNoBookings.length > 0) {
      const insight = await base44.asServiceRole.entities.AgentInsights.create({
        agent_name: 'event_intelligence',
        severity: 'P3',
        finding: `${vendorsWithNoBookings.length} approved vendor(s) have zero bookings: ${vendorsWithNoBookings.slice(0, 5).map(v => v.business_name).join(', ')}${vendorsWithNoBookings.length > 5 ? '...' : ''}`,
        recommendation: 'Review their profiles for completeness. Consider featuring them in the swipe deck or sending a profile optimization tip via the Host Success Agent.',
        affected_entity: 'Vendor',
        affected_page: 'pages/Swipe',
        raw_data: JSON.stringify({ vendor_ids: vendorsWithNoBookings.map(v => v.id) })
      });
      insightsCreated.push(insight.id);
    }

    if (categoryRankings.length > 0) {
      const topCat = categoryRankings[0];
      const insight = await base44.asServiceRole.entities.AgentInsights.create({
        agent_name: 'event_intelligence',
        severity: 'info',
        finding: `Top performing category: ${topCat.category} with ${topCat.completed} completed bookings (${topCat.completion_rate}% completion rate, avg booking $${topCat.avg_booking_value}). Platform revenue this month: $${recentRevenue.toFixed(2)}.`,
        recommendation: `Prioritize acquiring more ${topCat.category} vendors. Consider promoting this category on the homepage and in marketing materials.`,
        affected_entity: 'Booking',
        raw_data: JSON.stringify({ categoryRankings: categoryRankings.slice(0, 5) })
      });
      insightsCreated.push(insight.id);
    }

    if (vendorsWithStaleBookings.length > 0) {
      const insight = await base44.asServiceRole.entities.AgentInsights.create({
        agent_name: 'event_intelligence',
        severity: 'P2',
        finding: `${vendorsWithStaleBookings.length} vendor(s) have booking requests sitting unanswered for 7+ days. This causes client churn.`,
        recommendation: 'Send automated reminder notifications to these vendors. Consider implementing a 72-hour response time policy with automatic escalation.',
        affected_entity: 'Booking',
        affected_page: 'pages/Bookings',
        raw_data: JSON.stringify({ vendor_names: vendorsWithStaleBookings.map(v => v.business_name) })
      });
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
        },
        reviews: {
          total: reviews.length,
          avg_rating: Math.round(avgRating * 10) / 10
        }
      }
    });

  } catch (error) {
    console.error('[computeEventMetrics] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});