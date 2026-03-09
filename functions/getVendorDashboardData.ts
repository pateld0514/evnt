import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Determine vendor_id — from user attribute or body param
    const body = await req.json().catch(() => ({}));
    const vendorId = body.vendor_id || user.vendor_id;

    if (!vendorId) {
      return Response.json({ error: 'No vendor_id found' }, { status: 400 });
    }

    // Security: only allow admin, or the vendor if their vendor_id matches OR they own/created the vendor
    if (user.role !== 'admin' && user.vendor_id !== vendorId) {
      // Also allow if they created the vendor or their email matches contact_email
      const vendorCheck = await base44.asServiceRole.entities.Vendor.list('-created_date', 200);
      const match = vendorCheck.find(v => v.id === vendorId && (v.created_by === user.email || v.contact_email === user.email));
      if (!match) {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Fetch all data using service role to bypass RLS
    const [bookings, views, swipes, vendorResults] = await Promise.all([
      base44.asServiceRole.entities.Booking.filter({ vendor_id: vendorId }, '-created_date'),
      base44.asServiceRole.entities.VendorView.filter({ vendor_id: vendorId }),
      base44.asServiceRole.entities.UserSwipe.filter({ vendor_id: vendorId }),
      base44.asServiceRole.entities.Vendor.list('-created_date', 200),
    ]);

    const vendor = vendorResults.find(v => v.id === vendorId) || null;

    return Response.json({ bookings, views, swipes, vendor });
  } catch (error) {
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
});