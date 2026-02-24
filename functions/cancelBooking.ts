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

    // Check authorization (client can cancel their own bookings, admin can cancel any) - Fix #4, #32
    const isAdmin = user?.role === 'admin';
    const isClient = booking.client_email === user.email;
    
    if (!isAdmin && !isClient) {
      console.error('Unauthorized cancelBooking attempt', { user_id: user?.id, email: user?.email, booking_id: bookingId });
      return Response.json({ error: 'Forbidden: Cannot cancel this booking' }, { status: 403 });
    }

    // Can only cancel if payment not captured yet
    if (booking.payment_status === 'paid') {
      return Response.json({ 
        error: 'Cannot cancel - payment already captured. Please request a refund instead.' 
      }, { status: 400 });
    }

    let cancellationResult = { cancelled: false };

    // If payment intent exists and is in escrow, cancel it - Fix #29: enforce payment_intent_id
    if (booking.payment_status === 'escrow') {
      if (!booking.payment_intent_id) {
        return Response.json({ error: 'Payment intent ID missing - cannot cancel escrow payment' }, { status: 400 });
      }
      try {
        const paymentIntent = await stripe.paymentIntents.cancel(booking.payment_intent_id);
        cancellationResult = { cancelled: true, paymentIntentId: paymentIntent.id };
      } catch (stripeError) {
        console.error('[cancelBooking] Error canceling payment intent:', stripeError);
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

    // Notify both parties - Fix #10, #22, #30, #31: proper email templates with error handling
    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        from_name: 'EVNT',
        to: booking.client_email,
        subject: '❌ Booking Cancelled',
        body: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2>Booking Cancelled</h2>
            <p>Your booking with <strong>${booking.vendor_name}</strong> has been cancelled.</p>
            <p><strong>Event:</strong> ${booking.event_type}</p>
            <p><strong>Date:</strong> ${booking.event_date}</p>
            ${booking.payment_status === 'escrow' ? '<p>Any authorized payment has been released back to your card.</p>' : ''}
            ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="font-size: 12px; color: #666;">
              <a href="https://evnt.com/unsubscribe?email=${encodeURIComponent(booking.client_email)}" style="color: #0066cc; text-decoration: none;">Unsubscribe</a> | 
              <a href="https://evnt.com/privacy" style="color: #0066cc; text-decoration: none;">Privacy Policy</a>
            </p>
            <p style="font-size: 12px; color: #999;">EVNT, Inc. | Washington, DC</p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error('[cancelBooking] Failed to send client cancellation email:', emailError);
    }

    // Notify vendor
    const vendors = await base44.asServiceRole.entities.Vendor.filter({ id: booking.vendor_id });
    if (vendors.length > 0) {
      try {
        // Prefer vendor user email over contact_email
        const vendorUsers = await base44.asServiceRole.entities.User.filter({ vendor_id: booking.vendor_id });
        const vendorEmail = vendorUsers.length > 0 ? vendorUsers[0].email : vendors[0].contact_email;
        
        if (vendorEmail) {
          await base44.asServiceRole.integrations.Core.SendEmail({
            from_name: 'EVNT',
            to: vendorEmail,
            subject: '❌ Booking Cancelled',
            body: `
              <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <h2>Booking Cancelled</h2>
                <p>The booking with <strong>${booking.client_name}</strong> has been cancelled.</p>
                <p><strong>Event:</strong> ${booking.event_type}</p>
                <p><strong>Date:</strong> ${booking.event_date}</p>
                ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
                <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                <p style="font-size: 12px; color: #666;">
                  <a href="https://evnt.com/unsubscribe?email=${encodeURIComponent(vendorEmail)}" style="color: #0066cc; text-decoration: none;">Unsubscribe</a> | 
                  <a href="https://evnt.com/privacy" style="color: #0066cc; text-decoration: none;">Privacy Policy</a>
                </p>
                <p style="font-size: 12px; color: #999;">EVNT, Inc. | Washington, DC</p>
              </div>
            `,
          });
        }
      } catch (emailError) {
        console.error('[cancelBooking] Failed to send vendor cancellation email:', emailError);
      }
    }

    return Response.json({ 
      success: true, 
      message: 'Booking cancelled successfully',
      ...cancellationResult
    });

  } catch (error) {
    console.error('[cancelBooking] Error:', {
      message: error.message,
      booking_id: bookingId,
      user_email: user?.email?.replace(/@.*/, '@...') // Fix #34: mask PII
    });
    return Response.json({ 
      error: error.message || 'Failed to cancel booking' 
    }, { status: 500 });
  }
});