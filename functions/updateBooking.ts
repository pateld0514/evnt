import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bookingId, updates } = await req.json();

    if (!bookingId || !updates) {
      return Response.json({ error: 'Booking ID and updates required' }, { status: 400 });
    }

    // Get booking to verify ownership
    const bookings = await base44.asServiceRole.entities.Booking.filter({ id: bookingId });
    const booking = bookings[0];

    if (!booking) {
      return Response.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Security: Verify user can modify this booking
    const isAdmin = user.email === 'pateld0514@gmail.com' || user.role === 'admin';
    const isClient = booking.client_email === user.email;
    const isVendor = booking.created_by === user.email || 
                     (user.vendor_id && booking.vendor_id === user.vendor_id);

    if (!isAdmin && !isClient && !isVendor) {
      return Response.json({ 
        error: 'Forbidden: Cannot modify this booking' 
      }, { status: 403 });
    }

    // Update the booking
    await base44.asServiceRole.entities.Booking.update(bookingId, updates);

    return Response.json({ 
      success: true, 
      message: 'Booking updated successfully' 
    });

  } catch (error) {
    console.error('Update booking error:', error);
    return Response.json({ 
      error: error.message || 'Failed to update booking' 
    }, { status: 500 });
  }
});