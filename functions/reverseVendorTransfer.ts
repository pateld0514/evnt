import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);

    // Admin-only function
    if (!user || user.role !== 'admin') {
      console.error('Unauthorized reverseVendorTransfer attempt', { user_id: user?.id, email: user?.email });
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { payoutId, stripeTransferId, bookingId, refundAmount, reason } = await req.json();

    if (!payoutId || !stripeTransferId || !bookingId || !refundAmount) {
      return Response.json({ 
        error: 'payoutId, stripeTransferId, bookingId, and refundAmount are required' 
      }, { status: 400 });
    }

    // Fetch payout to verify status
    const payouts = await base44.asServiceRole.entities.VendorPayout.filter({ id: payoutId });
    const payout = payouts[0];

    if (!payout) {
      return Response.json({ error: 'Payout not found' }, { status: 404 });
    }

    if (payout.status !== 'completed') {
      return Response.json({ 
        error: `Cannot reverse payout with status '${payout.status}' - only 'completed' payouts can be reversed` 
      }, { status: 400 });
    }

    // Validate refund amount doesn't exceed net amount
    if (refundAmount > payout.net_amount) {
      return Response.json({ 
        error: `Refund amount ($${refundAmount.toFixed(2)}) exceeds vendor payout ($${payout.net_amount.toFixed(2)})` 
      }, { status: 400 });
    }

    // Create reversal transfer in Stripe
    // This reverses the original transfer back to the platform account
    const reversalAmount = Math.round(refundAmount * 100); // Convert to cents

    const reversal = await stripe.transfers.create({
      amount: reversalAmount,
      currency: 'usd',
      destination: stripeTransferId, // Reverse back to original destination
      transfer_group: `reversal_${payoutId}`,
      metadata: {
        payout_id: payoutId,
        booking_id: bookingId,
        refund_amount: refundAmount,
        refund_reason: reason || 'Admin refund'
      }
    });

    // Update payout record to mark as partially reversed (if partial) or create reversal record
    const remainingAmount = payout.net_amount - refundAmount;
    
    if (remainingAmount > 0) {
      // Partial reversal
      await base44.asServiceRole.entities.VendorPayout.update(payoutId, {
        status: 'partially_reversed',
        net_amount: remainingAmount,
        reversal_amount: refundAmount,
        reversal_stripe_id: reversal.id,
        reversal_date: new Date().toISOString(),
        reversal_reason: reason || 'Admin refund'
      });
    } else {
      // Full reversal
      await base44.asServiceRole.entities.VendorPayout.update(payoutId, {
        status: 'reversed',
        reversal_amount: refundAmount,
        reversal_stripe_id: reversal.id,
        reversal_date: new Date().toISOString(),
        reversal_reason: reason || 'Admin refund'
      });
    }

    // Log reversal for audit trail - Fix #34: mask PII
    console.log('[reverseVendorTransfer] Vendor payout reversed:', {
      payout_id: payoutId,
      booking_id: bookingId,
      refund_amount: refundAmount,
      reversal_stripe_id: reversal.id,
      reversal_status: remainingAmount > 0 ? 'partial' : 'full',
      approved_by: user.email?.replace(/@.*/, '@...') // Mask email
    });

    return Response.json({
      success: true,
      message: `Vendor payout ${remainingAmount > 0 ? 'partially' : 'fully'} reversed`,
      reversal_id: reversal.id,
      refund_amount: refundAmount,
      remaining_amount: remainingAmount
    });

  } catch (error) {
    console.error('[reverseVendorTransfer] Error:', {
      message: error?.message || String(error),
      code: error.code || 'unknown',
    });
    return Response.json({ 
      error: error?.message || 'Failed to reverse vendor transfer' 
    }, { status: 500 });
  }
});