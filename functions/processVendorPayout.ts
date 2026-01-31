import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2024-12-18.acacia',
});

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    
    // Only process when booking payment is successful and booking is completed
    const booking_id = payload.booking_id || payload.data?.id;
    const payment_status = payload.data?.payment_status;
    const booking_status = payload.data?.status;
    
    // Check if this is a booking completion with successful payment
    if (payload.event?.type === 'update') {
      const wasJustCompleted = booking_status === 'completed' && payload.old_data?.status !== 'completed';
      const paymentSuccessful = payment_status === 'paid';
      
      if (!wasJustCompleted || !paymentSuccessful) {
        return Response.json({ success: true, message: 'Not a payout trigger event' });
      }
    } else if (!payload.booking_id) {
      return Response.json({ error: 'booking_id required for direct calls' }, { status: 400 });
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

    // Get vendor's Stripe account
    const vendors = await base44.asServiceRole.entities.Vendor.filter({ id: booking.vendor_id });
    if (vendors.length === 0 || !vendors[0].stripe_account_id) {
      return Response.json({ error: 'Vendor Stripe account not found' }, { status: 404 });
    }
    
    const vendor = vendors[0];
    
    if (!vendor.stripe_account_verified) {
      return Response.json({ error: 'Vendor Stripe account not verified' }, { status: 400 });
    }

    // Calculate payout amounts
    const grossAmount = booking.agreed_price || 0;
    const platformFee = booking.platform_fee_amount || 0;
    const netAmount = booking.vendor_payout || (grossAmount - platformFee);
    
    // Convert to cents for Stripe
    const amountInCents = Math.round(netAmount * 100);
    
    if (amountInCents <= 0) {
      return Response.json({ error: 'Invalid payout amount' }, { status: 400 });
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
      // Create Stripe transfer to vendor's connected account
      const transfer = await stripe.transfers.create({
        amount: amountInCents,
        currency: 'usd',
        destination: vendor.stripe_account_id,
        description: `Payout for booking ${booking.id} - ${booking.event_type}`,
        metadata: {
          booking_id: booking.id,
          vendor_id: booking.vendor_id,
          payout_id: payoutRecord.id
        }
      });

      // Update payout record with success
      await base44.asServiceRole.entities.VendorPayout.update(payoutRecord.id, {
        stripe_transfer_id: transfer.id,
        status: 'completed',
        payout_date: new Date().toISOString()
      });

      // Get vendor user for notification
      const vendorUsers = await base44.asServiceRole.entities.User.filter({ 
        vendor_id: booking.vendor_id 
      });

      if (vendorUsers.length > 0) {
        // Send notification to vendor
        await base44.asServiceRole.entities.Notification.create({
          recipient_email: vendorUsers[0].email,
          type: 'payment_released',
          title: 'Payout Processed Successfully',
          message: `$${netAmount.toFixed(2)} has been transferred to your bank account for booking ${booking.id}. It may take 1-3 business days to appear.`,
          link: `/VendorDashboard`,
          read: false
        });
      }

      return Response.json({
        success: true,
        message: 'Payout processed successfully',
        payout_id: payoutRecord.id,
        transfer_id: transfer.id,
        amount: netAmount
      });

    } catch (stripeError) {
      // Update payout record with failure
      await base44.asServiceRole.entities.VendorPayout.update(payoutRecord.id, {
        status: 'failed',
        failure_reason: stripeError.message
      });

      // Notify vendor of failure
      const vendorUsers = await base44.asServiceRole.entities.User.filter({ 
        vendor_id: booking.vendor_id 
      });
      
      if (vendorUsers.length > 0) {
        await base44.asServiceRole.entities.Notification.create({
          recipient_email: vendorUsers[0].email,
          type: 'payment_received',
          title: 'Payout Processing Issue',
          message: `There was an issue processing your payout for booking ${booking.id}. Our team has been notified and will resolve this shortly.`,
          read: false
        });
      }

      return Response.json({ 
        error: 'Stripe transfer failed', 
        details: stripeError.message 
      }, { status: 500 });
    }

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});