import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);

    // Admin-only check
    if (!user || user.role !== "admin") {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Fetch ALL vendors using service role
    const allVendors = await base44.asServiceRole.entities.Vendor.list('-created_date', 1000);

    // Get test vendor user emails to exclude their associated vendor records
    // Only exclude vendors whose creator is a designated test account (user_type === 'test_vendor')
    const allUsers = await base44.asServiceRole.entities.User.list('-created_date', 1000);
    const testVendorEmails = new Set(
      allUsers.filter(u => u.user_type === 'test_vendor').map(u => u.email)
    );

    const vendors = allVendors.filter(v => !testVendorEmails.has(v.created_by));

    console.log(`[Admin] Fetched ${vendors.length} vendors (excluded test vendors by user_type)`);

    return Response.json(vendors);

  } catch (error) {
    console.error('Get vendors error:', error);
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
});