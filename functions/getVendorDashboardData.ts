import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Determine vendor_id — from user attribute or body param
    const body = await req.json().catch(() => ({}));
    const vendorId = body.vendor_id || user.vendor_id;

    if (!vendorId) {
      return Response.json({ error: 'No vendor_id found' }, { status: 400 });
    }

    // Security: only allow the vendor themselves or an admin
    if (user.role !== 'admin' && user.vendor_id !== vendorId) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all data using service role to bypass RLS
    const [bookings, views, swipes] = await Promise.all([
      base44.asServiceRole.entities.Booking.filter({ vendor_id: vendorId }, '-created_date'),
      base44.asServiceRole.entities.VendorView.filter({ vendor_id: vendorId }),
      base44.asServiceRole.entities.UserSwipe.filter({ vendor_id: vendorId }),
    ]);

    return Response.json({ bookings, views, swipes });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});