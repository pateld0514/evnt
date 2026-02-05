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

    const { bookingId, amount, reason } = await req.json();

    if (!bookingId) {
      return Response.json({ error: 'Booking ID required' }, { status: 400 });
    }

    // Get booking details
    const bookings = await base44.asServiceRole.entities.Booking.filter({ id: bookingId });
    const booking = bookings[0];

    if (!booking) {
      return Response.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Only admins can issue refunds
    const isAdmin = user.email === 'pateld0514@gmail.com' || user.role === 'admin';
    
    if (!isAdmin) {
      return Response.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    // Can only refund if payment was captured
    if (booking.payment_status !== 'paid' && booking.payment_status !== 'escrow') {
      return Response.json({ 
        error: 'Cannot refund - payment not processed yet' 
      }, { status: 400 });
    }

    if (!booking.payment_intent_id) {
      return Response.json({ error: 'No payment intent found' }, { status: 400 });
    }

    // Determine refund amount (if not specified, full refund)
    const refundAmount = amount || booking.total_amount || booking.agreed_price;
    const refundInCents = Math.round(refundAmount * 100);

    // If payment is still in escrow (not captured), cancel instead
    if (booking.payment_status === 'escrow') {
      await stripe.paymentIntents.cancel(booking.payment_intent_id);

      await base44.asServiceRole.entities.Booking.update(bookingId, {
        status: 'cancelled',
        payment_status: 'cancelled',
        refund_reason: reason || 'Cancelled before capture',
      });

      // Notify client
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: booking.client_email,
        subject: '💰 Booking Cancelled - Authorization Released',
        body: `
          <h2>Booking Cancelled</h2>
          <p>Your booking with ${booking.vendor_name} has been cancelled.</p>
          <p>The payment authorization of $${refundAmount.toFixed(2)} has been released.</p>
          ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
          <br>
          <p>Best regards,<br>The EVNT Team</p>
        `,
      });

      return Response.json({ 
        success: true, 
        message: 'Escrow cancelled - funds released',
        amount: refundAmount
      });
    }

    // Process actual refund for captured payments
    const refund = await stripe.refunds.create({
      payment_intent: booking.payment_intent_id,
      amount: refundInCents,
      reason: reason || 'requested_by_customer',
      metadata: {
        booking_id: bookingId,
        refund_reason: reason || 'Admin refund'
      }
    });

    // Determine if full or partial refund
    const totalPaid = booking.total_amount || booking.agreed_price;
    const isFullRefund = refundAmount >= totalPaid;

    // Update booking
    await base44.asServiceRole.entities.Booking.update(bookingId, {
      payment_status: isFullRefund ? 'refunded' : 'partially_refunded',
      status: isFullRefund ? 'cancelled' : booking.status,
      refund_amount: refundAmount,
      refund_reason: reason || 'Admin refund',
      refund_date: new Date().toISOString(),
    });

    // If vendor payout already processed, we need to reverse it
    const payouts = await base44.asServiceRole.entities.VendorPayout.filter({ 
      booking_id: bookingId,
      status: 'completed'
    });

    if (payouts.length > 0) {
      // Note: In production, you'd reverse the transfer here
      // This is complex with Stripe Connect - may need to create a reversal
      console.log('Warning: Vendor already paid out - manual reversal may be needed');
    }

    // Notify client
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: booking.client_email,
      subject: '💰 Refund Processed',
      body: `
        <h2>Refund Issued</h2>
        <p>A ${isFullRefund ? 'full' : 'partial'} refund has been processed for your booking with ${booking.vendor_name}.</p>
        <p><strong>Refund Amount:</strong> $${refundAmount.toFixed(2)}</p>
        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
        <p>The funds should appear in your account within 5-10 business days.</p>
        <br>
        <p>Best regards,<br>The EVNT Team</p>
      `,
    });

    // Notify vendor
    const vendors = await base44.asServiceRole.entities.Vendor.filter({ id: booking.vendor_id });
    if (vendors.length > 0) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: vendors[0].contact_email,
        subject: '❌ Booking Refunded',
        body: `
          <h2>Booking Refund Issued</h2>
          <p>A ${isFullRefund ? 'full' : 'partial'} refund was issued for booking with ${booking.client_name}.</p>
          <p><strong>Refund Amount:</strong> $${refundAmount.toFixed(2)}</p>
          ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
          <br>
          <p>Best regards,<br>The EVNT Team</p>
        `,
      });
    }

    return Response.json({ 
      success: true, 
      message: `Refund of $${refundAmount.toFixed(2)} processed successfully`,
      refundId: refund.id,
      amount: refundAmount,
      isFullRefund
    });

  } catch (error) {
    console.error('Refund error:', error);
    return Response.json({ 
      error: error.message || 'Failed to process refund' 
    }, { status: 500 });
  }
});