import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const fortyEightHoursAgo = new Date(now - 48 * 60 * 60 * 1000);

    // Fetch vendors + bookings in parallel
    const [vendors, bookings, portfolioItems] = await Promise.all([
      base44.asServiceRole.entities.Vendor.list('-created_date', 150),
      base44.asServiceRole.entities.Booking.list('-created_date', 150),
      base44.asServiceRole.entities.PortfolioItem.list('-created_date', 200),
    ]);

    const approvedVendors = vendors.filter(v => v.approval_status === 'approved' && !v.is_test_vendor);

    // Build indexes
    const bookingsByVendor = {};
    for (const b of bookings) {
      if (!bookingsByVendor[b.vendor_id]) bookingsByVendor[b.vendor_id] = [];
      bookingsByVendor[b.vendor_id].push(b);
    }

    const portfolioByVendor = {};
    for (const p of portfolioItems) {
      if (!portfolioByVendor[p.vendor_id]) portfolioByVendor[p.vendor_id] = [];
      portfolioByVendor[p.vendor_id].push(p);
    }

    const insightsToCreate = [];

    for (const vendor of approvedVendors) {
      const vendorBookings = bookingsByVendor[vendor.id] || [];
      const vendorPortfolio = portfolioByVendor[vendor.id] || [];
      const name = vendor.business_name;

      // --- Profile Completeness Issues ---
      const issues = [];

      if (!vendor.image_url) {
        issues.push({
          severity: 'P2',
          finding: `${name}: missing profile photo — critical for swipe deck click-through rate`,
          recommendation: `Ask ${name} to upload a high-quality profile image via VendorDashboard → Edit Profile. Profile photos increase booking inquiries by ~40%.`,
        });
      }

      if (!vendor.description || vendor.description.length < 80) {
        const len = vendor.description?.length || 0;
        issues.push({
          severity: 'P3',
          finding: `${name}: description is only ${len} characters — too short to build client trust`,
          recommendation: `Prompt ${name} to expand their description to 150+ characters covering: event types served, years of experience, what makes them unique, and what clients can expect.`,
        });
      }

      if (!vendor.specialties || vendor.specialties.length === 0) {
        issues.push({
          severity: 'P3',
          finding: `${name}: no specialties listed — hurts category matching in swipe deck`,
          recommendation: `${name} should add at least 2-3 specialties (e.g. 'wedding', 'corporate', 'birthday') in their profile to improve discovery.`,
        });
      }

      if (!vendor.starting_price) {
        issues.push({
          severity: 'P3',
          finding: `${name}: no starting price set — clients skip vendors with unclear pricing`,
          recommendation: `${name} should set a starting_price in their profile. Even a ballpark figure ("starting from $500") reduces bounce rate significantly.`,
        });
      }

      if (vendorPortfolio.length === 0) {
        issues.push({
          severity: 'P3',
          finding: `${name}: zero portfolio items — reduces booking confidence for clients`,
          recommendation: `Encourage ${name} to upload at least 3-5 portfolio photos via VendorDashboard. Portfolio presence is the #1 factor clients cite before booking.`,
        });
      }

      if (!vendor.stripe_account_id) {
        issues.push({
          severity: 'P2',
          finding: `${name}: Stripe payout account not connected — cannot receive payments`,
          recommendation: `Send ${name} a direct link to connect their Stripe account in VendorDashboard. Bookings will be stuck at 'payment_pending' until this is resolved.`,
        });
      }

      // --- Booking Pipeline Issues ---
      const recentBookings = vendorBookings.filter(b => new Date(b.created_date) > thirtyDaysAgo);
      if (recentBookings.length === 0 && vendorBookings.length === 0) {
        issues.push({
          severity: 'P3',
          finding: `${name}: 0 booking inquiries since joining — may need visibility boost`,
          recommendation: `Feature ${name} in the swipe deck priority list, check their category has traffic, and verify their profile is fully complete to appear in searches.`,
        });
      }

      const stalePending = vendorBookings.filter(b =>
        b.status === 'pending' && new Date(b.created_date) < fortyEightHoursAgo
      );
      if (stalePending.length > 0) {
        issues.push({
          severity: 'P2',
          finding: `${name}: ${stalePending.length} booking request(s) unanswered for 48+ hours — client at risk of churning`,
          recommendation: `Reach out to ${name} immediately. Booking IDs: ${stalePending.map(b => b.id.substring(0, 8)).join(', ')}. Consider enabling auto-reminder notifications for unresolved requests.`,
        });
      }

      const cancelledBookings = vendorBookings.filter(b => b.status === 'cancelled' || b.status === 'declined');
      const completedBookings = vendorBookings.filter(b => b.status === 'completed');
      if (vendorBookings.length >= 5 && cancelledBookings.length / vendorBookings.length > 0.4) {
        issues.push({
          severity: 'P2',
          finding: `${name}: ${Math.round(cancelledBookings.length / vendorBookings.length * 100)}% cancellation/decline rate — above 40% threshold`,
          recommendation: `Review ${name}'s booking history for patterns. High cancellation may indicate pricing mismatch, slow response times, or availability issues. Consider a vendor success check-in.`,
        });
      }

      // Only write top issues per vendor (max 2) to avoid flooding
      const prioritized = issues.sort((a, b) => {
        const order = { P1: 0, P2: 1, P3: 2, info: 3 };
        return (order[a.severity] ?? 4) - (order[b.severity] ?? 4);
      }).slice(0, 2);

      for (const issue of prioritized) {
        insightsToCreate.push({
          agent_name: 'host_success',
          severity: issue.severity,
          finding: issue.finding,
          recommendation: issue.recommendation,
          affected_entity: 'Vendor',
          affected_page: 'pages/VendorDashboard',
        });
      }
    }

    // Write insights in parallel for speed
    const createdInsights = await Promise.all(
      insightsToCreate.map(data => base44.asServiceRole.entities.AgentInsights.create(data))
    );
    const created = createdInsights.map(i => i.id);

    const summary = {
      vendors_audited: approvedVendors.length,
      insights_created: created.length,
      missing_photos: approvedVendors.filter(v => !v.image_url).length,
      missing_stripe: approvedVendors.filter(v => !v.stripe_account_id).length,
      no_portfolio: approvedVendors.filter(v => (portfolioByVendor[v.id] || []).length === 0).length,
      stale_pending: approvedVendors.filter(v =>
        (bookingsByVendor[v.id] || []).some(b => b.status === 'pending' && new Date(b.created_date) < fortyEightHoursAgo)
      ).length,
    };

    return Response.json({ success: true, ...summary });

  } catch (error) {
    console.error('[runHostSuccessAnalysis] Error:', error?.message || String(error));
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
});