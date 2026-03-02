import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';
import { requireAdmin } from './lib/auth.js';
import { sendPlatformEmail } from './lib/emailTemplate.js';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Authenticate first
    const user = await base44.auth.me();
    const isAdmin = user?.role === 'admin';
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const payload = await req.json();
    
    const booking_id = payload.booking_id || payload.data?.id;
    const payment_status = payload.data?.payment_status;
    const booking_status = payload.data?.status;
    
    // Check if this is a booking completion trigger (from automation)
    const isAutomationTrigger = payload.event?.type === 'update';
    
    if (isAutomationTrigger) {
      const wasJustCompleted = booking_status === 'completed' && payload.old_data?.status !== 'completed';
      const paymentInEscrow = payment_status === 'escrow';
      
      if (!wasJustCompleted || !paymentInEscrow) {
        return Response.json({ success: true, message: 'Not a payout trigger event' });
      }
    } else {
      // Direct call - require admin auth using centralized auth
      requireAdmin(user);
      if (!payload.booking_id) {
        return Response.json({ error: 'booking_id required' }, { status: 400 });
      }
    }

    // Get booking details
    const bookings = await base44.asServiceRole.entities.Booking.filter({ id: booking_id });
    if (bookings.length === 0) {
      return Response.json({ error: 'Booking not found' }, { status: 404 });
    }
    
    const booking = bookings[0];
    
    // Check if payout already processed
    const existingPayouts = await base44.asServiceRole.entities.VendorPayout.filter({ 
      booking_id: booking.id 
    });
    
    if (existingPayouts.length > 0) {
      return Response.json({ success: true, message: 'Payout already processed' });
    }

    // Verify payment is in escrow
    if (booking.payment_status !== 'escrow') {
      return Response.json({ error: 'Payment not in escrow state' }, { status: 400 });
    }

    // Get vendor's Stripe account
    const vendors = await base44.asServiceRole.entities.Vendor.filter({ id: booking.vendor_id });
    if (vendors.length === 0 || !vendors[0].stripe_account_id) {
      return Response.json({ error: 'Vendor Stripe account not found' }, { status: 404 });
    }
    
    const vendor = vendors[0];
    
    if (!vendor.stripe_account_verified) {
      return Response.json({ error: 'Vendor Stripe account not verified' }, { status: 400 });
    }

    // Calculate payout amounts with validation
    // Use base_event_amount (the agreed/discounted price client actually pays)
    const grossAmount = booking.base_event_amount || booking.agreed_price || booking.total_amount_charged || 0;
    const platformFee = booking.platform_fee_amount || 0;
    const netAmount = booking.vendor_payout || (grossAmount - platformFee);
    
    if (netAmount <= 0) {
      return Response.json({ error: 'Invalid payout amount: net amount must be greater than 0' }, { status: 400 });
    }

    // Create payout record as pending
    const payoutRecord = await base44.asServiceRole.entities.VendorPayout.create({
      vendor_id: booking.vendor_id,
      booking_id: booking.id,
      gross_amount: grossAmount,
      platform_fee: platformFee,
      net_amount: netAmount,
      status: 'processing'
    });

    try {
      // CAPTURE THE PAYMENT INTENT (release from escrow) with idempotency
      const idempotencyKey = `payout-${booking.id}-${booking.payment_intent_id}`;
      const paymentIntent = await stripe.paymentIntents.capture(
        booking.payment_intent_id,
        { idempotency_key: idempotencyKey }
      );

      if (paymentIntent.status !== 'succeeded') {
        throw new Error('Payment capture failed');
      }

      // CREATE ACTUAL STRIPE TRANSFER TO VENDOR ACCOUNT
      const transfer = await stripe.transfers.create({
        amount: Math.round(netAmount * 100), // Convert to cents
        currency: 'usd',
        destination: vendor.stripe_account_id,
        transfer_group: `payout-${booking.id}`,
        metadata: {
          booking_id: booking.id,
          client_email: booking.client_email,
          event_type: booking.event_type
        }
      });

      // Update payout record with success
      await base44.asServiceRole.entities.VendorPayout.update(payoutRecord.id, {
        stripe_transfer_id: transfer.id,
        status: 'completed',
        payout_date: new Date().toISOString()
      });

      // Update booking payment status
      await base44.asServiceRole.entities.Booking.update(booking.id, {
        payment_status: 'paid'
      });

      // Get vendor's user email for reliable delivery (not contact_email)
      const vendorUsers = await base44.asServiceRole.entities.User.filter({ vendor_id: vendor.id });
      const vendorEmail = vendorUsers.length > 0 ? vendorUsers[0].email : vendor.contact_email;

      // Send notification to vendor using centralized email template
      await sendPlatformEmail(base44, {
        to: vendorEmail,
        subject: '💰 Payment Released - Payout Processed',
        content: `
          <div class="content">
            <h2>Payment Released!</h2>
            <p>The payment for your completed booking has been released from escrow.</p>
            <p><strong>Booking:</strong> ${booking.event_type} with ${booking.client_name}</p>
            <p><strong>Amount:</strong> $${netAmount.toFixed(2)}</p>
            <p>The funds will be transferred to your bank account within 1-3 business days.</p>
            <p>View details at: ${req.headers.get('origin')}/VendorDashboard</p>
          </div>
        `,
      });

      return Response.json({
        success: true,
        message: 'Payout processed successfully',
        payout_id: payoutRecord.id,
        payment_intent_id: paymentIntent.id,
        amount: netAmount
      });

    } catch (stripeError) {
      // Update payout record with failure
      await base44.asServiceRole.entities.VendorPayout.update(payoutRecord.id, {
        status: 'failed',
        failure_reason: stripeError.message
      });

      return Response.json({ 
        error: 'Payment capture failed', 
        details: stripeError.message 
      }, { status: 500 });
    }

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});