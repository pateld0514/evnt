import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bookingId, reason } = await req.json();

    if (!bookingId) {
      return Response.json({ error: 'Booking ID required' }, { status: 400 });
    }

    // Get booking details
    const bookings = await base44.asServiceRole.entities.Booking.filter({ id: bookingId });
    const booking = bookings[0];

    if (!booking) {
      return Response.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Check authorization (client can cancel their own bookings, admin can cancel any)
    const isAdmin = user.email === 'pateld0514@gmail.com' || user.role === 'admin';
    const isClient = booking.client_email === user.email;
    
    if (!isAdmin && !isClient) {
      return Response.json({ error: 'Unauthorized to cancel this booking' }, { status: 403 });
    }

    // Can only cancel if payment not captured yet
    if (booking.payment_status === 'paid') {
      return Response.json({ 
        error: 'Cannot cancel - payment already captured. Please request a refund instead.' 
      }, { status: 400 });
    }

    let cancellationResult = { cancelled: false };

    // If payment intent exists and is in escrow, cancel it
    if (booking.payment_intent_id && booking.payment_status === 'escrow') {
      try {
        const paymentIntent = await stripe.paymentIntents.cancel(booking.payment_intent_id);
        cancellationResult = { cancelled: true, paymentIntentId: paymentIntent.id };
      } catch (stripeError) {
        console.error('Error canceling payment intent:', stripeError);
        // Continue anyway - we'll still mark booking as cancelled
      }
    }

    // Update booking status
    await base44.asServiceRole.entities.Booking.update(bookingId, {
      status: 'cancelled',
      payment_status: 'cancelled',
      cancellation_reason: reason || 'Cancelled by user',
      cancelled_date: new Date().toISOString(),
    });

    // Notify both parties
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: booking.client_email,
      subject: '❌ Booking Cancelled',
      body: `
        <h2>Booking Cancelled</h2>
        <p>Your booking with ${booking.vendor_name} has been cancelled.</p>
        <p><strong>Event:</strong> ${booking.event_type}</p>
        <p><strong>Date:</strong> ${booking.event_date}</p>
        ${booking.payment_status === 'escrow' ? '<p>Any authorized payment has been released back to your card.</p>' : ''}
        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
        <br>
        <p>Best regards,<br>The EVNT Team</p>
      `,
    });

    // Notify vendor
    const vendors = await base44.asServiceRole.entities.Vendor.filter({ id: booking.vendor_id });
    if (vendors.length > 0) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: vendors[0].contact_email,
        subject: '❌ Booking Cancelled',
        body: `
          <h2>Booking Cancelled</h2>
          <p>The booking with ${booking.client_name} has been cancelled.</p>
          <p><strong>Event:</strong> ${booking.event_type}</p>
          <p><strong>Date:</strong> ${booking.event_date}</p>
          ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
          <br>
          <p>Best regards,<br>The EVNT Team</p>
        `,
      });
    }

    return Response.json({ 
      success: true, 
      message: 'Booking cancelled successfully',
      ...cancellationResult
    });

  } catch (error) {
    console.error('Cancel booking error:', error);
    return Response.json({ 
      error: error.message || 'Failed to cancel booking' 
    }, { status: 500 });
  }
});