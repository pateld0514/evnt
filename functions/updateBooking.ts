import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// Inlined from lib/bookingStateMachine.js — no local imports allowed in Deno Deploy
const VALID_TRANSITIONS = {
  pending: ['negotiating', 'declined', 'cancelled'],
  negotiating: ['payment_pending', 'cancelled', 'declined'],
  payment_pending: ['confirmed', 'cancelled'],
  confirmed: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
  declined: [],
};
function validateTransition(currentStatus, newStatus) {
  if (!VALID_TRANSITIONS[currentStatus]) throw new Error(`Invalid current status: ${currentStatus}`);
  if (!VALID_TRANSITIONS[currentStatus].includes(newStatus)) {
    throw new Error(`Invalid transition from ${currentStatus} to ${newStatus}. Valid: ${VALID_TRANSITIONS[currentStatus].join(', ')}`);
  }
  return true;
}

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

    const bookings = await base44.asServiceRole.entities.Booking.filter({ id: bookingId });
    const booking = bookings[0];

    if (!booking) {
      return Response.json({ error: 'Booking not found' }, { status: 404 });
    }

    const isAdmin = user.role === 'admin';
    const isClient = booking.client_email === user.email;
    const isVendor = user.vendor_id && booking.vendor_id === user.vendor_id;

    if (!isAdmin && !isClient && !isVendor) {
      return Response.json({ error: 'Forbidden: Cannot modify this booking' }, { status: 403 });
    }

    if (updates.expectedUpdatedDate && booking.updated_date !== updates.expectedUpdatedDate) {
      return Response.json({ error: 'Booking was modified by another user. Please refresh and try again.' }, { status: 409 });
    }

    const { expectedUpdatedDate, ...safeUpdates } = updates;

    if (safeUpdates.status && safeUpdates.status !== booking.status) {
      try {
        validateTransition(booking.status, safeUpdates.status);
      } catch (error) {
        return Response.json({ error: error.message }, { status: 400 });
      }
    }

    await base44.asServiceRole.entities.Booking.update(bookingId, safeUpdates);

    return Response.json({ success: true, message: 'Booking updated successfully' });

  } catch (error) {
    console.error('Update booking error:', error);
    return Response.json({ error: error.message || 'Failed to update booking' }, { status: 500 });
  }
});