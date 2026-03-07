import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import { validateTransition } from './lib/bookingStateMachine.js';

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
    // CRITICAL: Admin check uses ONLY role-based authorization
    const isAdmin = user.role === 'admin';
    const isClient = booking.client_email === user.email;
    const isVendor = user.vendor_id && booking.vendor_id === user.vendor_id;

    if (!isAdmin && !isClient && !isVendor) {
      return Response.json({ 
        error: 'Forbidden: Cannot modify this booking' 
      }, { status: 403 });
    }

    // CRITICAL: Check for stale data (optimistic locking)
    // If expectedUpdatedDate provided in updates, verify it matches current booking
    if (updates.expectedUpdatedDate && booking.updated_date !== updates.expectedUpdatedDate) {
      console.error(`[updateBooking] STALE DATA DETECTED:`, {
        booking_id: bookingId,
        expected: updates.expectedUpdatedDate,
        actual: booking.updated_date
      });
      return Response.json({ 
        error: 'Booking was modified by another user. Please refresh and try again.' 
      }, { status: 409 });
    }

    // Remove expectedUpdatedDate from actual updates (it's for validation only)
    const { expectedUpdatedDate, ...safeUpdates } = updates;

    // CRITICAL: Validate state transitions if status is being changed
    if (safeUpdates.status && safeUpdates.status !== booking.status) {
      try {
        validateTransition(booking.status, safeUpdates.status);
      } catch (error) {
        console.error(`[updateBooking] Invalid state transition:`, {
          booking_id: bookingId,
          current: booking.status,
          requested: safeUpdates.status,
          error: error.message
        });
        return Response.json({ 
          error: error.message 
        }, { status: 400 });
      }
    }

    // Update the booking
    await base44.asServiceRole.entities.Booking.update(bookingId, safeUpdates);

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