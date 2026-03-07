import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // H-1 FIX: Server-side admin auth check — cannot be bypassed by stale cache
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Fetch all bookings with no limit (service role bypasses RLS)
    const allBookings = await base44.asServiceRole.entities.Booking.list('-created_date');

    return Response.json(allBookings);

  } catch (error) {
    console.error('[getAllBookingsForAdmin] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});