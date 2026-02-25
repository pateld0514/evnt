import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';
import { requireAdmin } from './lib/auth.js';
import { sendPlatformEmail } from './lib/emailTemplate.js';

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

    // Only admins can issue refunds - using centralized auth
    requireAdmin(user);

    // Can only refund if payment was captured
    if (booking.payment_status !== 'paid' && booking.payment_status !== 'escrow') {
      return Response.json({ 
        error: 'Cannot refund - payment not processed yet' 
      }, { status: 400 });
    }

    // Enforce payment_intent_id requirement (Fix #29)
    if (!booking.payment_intent_id) {
      return Response.json({ error: 'Payment intent ID missing - cannot process refund' }, { status: 400 });
    }

    // Determine refund amount (if not specified, full refund) - Fix #2: use total_amount_charged
    const refundAmount = amount || booking.total_amount_charged || booking.agreed_price;
    
    // Validate refund amount - Fix #16
    if (!refundAmount || refundAmount <= 0) {
      return Response.json({ error: 'Refund amount must be greater than 0' }, { status: 400 });
    }
    
    const refundInCents = Math.round(refundAmount * 100);

    // If payment is still in escrow (not captured), cancel instead
    if (booking.payment_status === 'escrow') {
      await stripe.paymentIntents.cancel(booking.payment_intent_id);

      await base44.asServiceRole.entities.Booking.update(bookingId, {
        status: 'cancelled',
        payment_status: 'cancelled',
        refund_reason: reason || 'Cancelled before capture',
        refund_approved_by: user.email // Fix #33: log admin approval
      });

      // Notify client using centralized email template
      try {
        await sendPlatformEmail(base44, {
          to: booking.client_email,
          subject: '💰 Booking Cancelled - Authorization Released',
          content: `
            <div class="content">
              <h2>Booking Cancelled</h2>
              <p>Your booking with ${booking.vendor_name} has been cancelled.</p>
              <p>The payment authorization of <strong>$${refundAmount.toFixed(2)}</strong> has been released.</p>
              ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
            </div>
          `,
        });
      } catch (emailError) {
        console.error('[refundBooking] Failed to send cancellation email:', emailError);
      }

      return Response.json({ 
        success: true, 
        message: 'Escrow cancelled - funds released',
        amount: refundAmount
      });
    }

    // Process actual refund for captured payments - Fix #25: use 'other' instead of requested_by_customer
    const refund = await stripe.refunds.create({
      payment_intent: booking.payment_intent_id,
      amount: refundInCents,
      reason: reason ? 'other' : 'customer_request',
      metadata: {
        booking_id: bookingId,
        refund_reason: reason || 'Admin refund'
      }
    });

    // Determine if full or partial refund - Fix #2: use total_amount_charged
    const totalPaid = booking.total_amount_charged || booking.agreed_price;
    const isFullRefund = refundAmount >= totalPaid;

    // Update booking - Fix #33: log admin approval
    await base44.asServiceRole.entities.Booking.update(bookingId, {
      payment_status: isFullRefund ? 'refunded' : 'partially_refunded',
      status: isFullRefund ? 'cancelled' : booking.status,
      refund_amount: refundAmount,
      refund_reason: reason || 'Admin refund',
      refund_date: new Date().toISOString(),
      refund_approved_by: user.email
    });

    // If vendor payout already processed, we need to reverse it - Fix #5
    const payouts = await base44.asServiceRole.entities.VendorPayout.filter({ 
      booking_id: bookingId,
      status: 'completed'
    });

    if (payouts.length > 0) {
      try {
        // Invoke reversal function
        const reversalResult = await base44.asServiceRole.functions.invoke('reverseVendorTransfer', {
          payoutId: payouts[0].id,
          stripeTransferId: payouts[0].stripe_transfer_id,
          bookingId: bookingId,
          refundAmount: refundAmount,
          reason: reason || 'Admin refund'
        });
        console.log('[refundBooking] Vendor payout reversed:', { payout_id: payouts[0].id, refund_amount: refundAmount });
      } catch (reversalError) {
        console.error('[refundBooking] Failed to reverse vendor transfer:', reversalError);
        // Log for manual follow-up
        console.warn(`[refundBooking] MANUAL FOLLOW-UP REQUIRED: Refund issued to client ($${refundAmount.toFixed(2)}) but vendor transfer reversal failed. Payout ID: ${payouts[0].id}`);
      }
    }

    // Notify client using centralized email template
    try {
      await sendPlatformEmail(base44, {
        to: booking.client_email,
        subject: '💰 Refund Processed',
        content: `
          <div class="content">
            <h2>Refund Issued</h2>
            <p>A <strong>${isFullRefund ? 'full' : 'partial'}</strong> refund has been processed for your booking with <strong>${booking.vendor_name}</strong>.</p>
            <p><strong>Refund Amount:</strong> $${refundAmount.toFixed(2)}</p>
            ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
            <p>The funds should appear in your account within 5-10 business days.</p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error('[refundBooking] Failed to send client refund email:', emailError);
    }

    // Notify vendor - Fix #21, #27: prefer user email, null check vendor
    const vendors = await base44.asServiceRole.entities.Vendor.filter({ id: booking.vendor_id });
    if (vendors.length > 0) {
      try {
        // Prefer vendor user email over contact_email - Fix #21
        const vendorUsers = await base44.asServiceRole.entities.User.filter({ vendor_id: booking.vendor_id });
        const vendorEmail = vendorUsers.length > 0 ? vendorUsers[0].email : vendors[0].contact_email;
        
        if (vendorEmail) {
          await sendPlatformEmail(base44, {
            to: vendorEmail,
            subject: '❌ Booking Refunded',
            content: `
              <div class="content">
                <h2>Booking Refund Issued</h2>
                <p>A <strong>${isFullRefund ? 'full' : 'partial'}</strong> refund was issued for booking with <strong>${booking.client_name}</strong>.</p>
                <p><strong>Refund Amount:</strong> $${refundAmount.toFixed(2)}</p>
                ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
              </div>
            `,
          });
        }
      } catch (emailError) {
        console.error('[refundBooking] Failed to send vendor refund email:', emailError);
      }
    }

    return Response.json({ 
      success: true, 
      message: `Refund of $${refundAmount.toFixed(2)} processed successfully`,
      refundId: refund.id,
      amount: refundAmount,
      isFullRefund
    });

  } catch (error) {
    // Fix #34: mask PII in logs
    console.error('[refundBooking] Error:', {
      message: error.message,
      booking_id: bookingId,
      admin_email: user?.email?.replace(/@.*/, '@...') // Mask email
    });
    return Response.json({ 
      error: error.message || 'Failed to process refund' 
    }, { status: 500 });
  }
});