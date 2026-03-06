import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Admin-only check
    if (!user || user.role !== "admin") {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Fetch ALL vendors using service role, excluding test vendors
    const allVendors = await base44.asServiceRole.entities.Vendor.list('-created_date', 1000);

    // Get test vendor user IDs to exclude their associated vendor records
    const allUsers = await base44.asServiceRole.entities.User.list('-created_date', 1000);
    const testVendorEmails = new Set(
      allUsers.filter(u => u.user_type === 'test_vendor').map(u => u.email)
    );
    // Also hardcode known test vendor IDs
    const testVendorIds = new Set(['699fa36c19956dc189f27101']);

    const vendors = allVendors.filter(v => !testVendorEmails.has(v.created_by) && !testVendorIds.has(v.id));

    console.log(`[Admin] Fetched ${vendors.length} vendors (excluded test vendors)`);

    return Response.json(vendors);

  } catch (error) {
    console.error('Get vendors error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});