import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Admin-only check
    if (user?.email !== "pateld0514@gmail.com") {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Fetch ALL vendors using service role
    const vendors = await base44.asServiceRole.entities.Vendor.list('-created_date', 1000);

    console.log(`[Admin] Fetched ${vendors.length} vendors`);

    return Response.json(vendors);

  } catch (error) {
    console.error('Get vendors error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});