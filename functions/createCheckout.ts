import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      console.error('User not authenticated');
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('User authenticated:', user.email);
    const { bookingId } = await req.json();
    console.log('Creating checkout for booking:', bookingId);
    
    if (!bookingId) {
      return Response.json({ error: 'Booking ID required' }, { status: 400 });
    }

    // Fetch booking details
    const bookings = await base44.asServiceRole.entities.Booking.filter({ id: bookingId });
    const booking = bookings[0];
    console.log('Booking found:', booking);

    if (!booking) {
      console.error('Booking not found:', bookingId);
      return Response.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Verify user is the client
    if (booking.client_email !== user.email) {
      console.error('User not authorized:', user.email, 'vs', booking.client_email);
      return Response.json({ error: 'Unauthorized to pay for this booking' }, { status: 403 });
    }

    // Verify booking status
    if (booking.status !== 'payment_pending') {
      console.error('Invalid booking status:', booking.status);
      return Response.json({ 
        error: `Booking is not ready for payment. Current status: ${booking.status}` 
      }, { status: 400 });
    }

    // Get vendor's Stripe account ID
    const vendors = await base44.asServiceRole.entities.Vendor.filter({ id: booking.vendor_id });
    console.log('Vendor lookup for:', booking.vendor_id, 'Found:', vendors.length);
    
    if (vendors.length === 0) {
      console.error('Vendor not found:', booking.vendor_id);
      return Response.json({ error: 'Vendor not found' }, { status: 404 });
    }
    
    const vendor = vendors[0];
    console.log('Vendor Stripe status:', {
      has_account: !!vendor.stripe_account_id,
      verified: vendor.stripe_account_verified
    });
    
    if (!vendor.stripe_account_id) {
      console.error('Vendor missing Stripe account ID');
      return Response.json({ 
        error: 'This vendor has not connected their Stripe account yet. Please contact them to complete payment setup.',
        vendor_not_connected: true
      }, { status: 400 });
    }
    
    // Check actual Stripe account status
    let stripeAccount;
    try {
      stripeAccount = await stripe.accounts.retrieve(vendor.stripe_account_id);
      console.log('Stripe account status:', {
        charges_enabled: stripeAccount.charges_enabled,
        payouts_enabled: stripeAccount.payouts_enabled,
        details_submitted: stripeAccount.details_submitted
      });
    } catch (stripeError) {
      console.error('Failed to retrieve Stripe account:', stripeError);
      return Response.json({ 
        error: 'Unable to verify vendor payment setup. Please contact support.',
        stripe_error: true
      }, { status: 400 });
    }
    
    if (!stripeAccount.charges_enabled || !stripeAccount.details_submitted) {
      console.error('Vendor Stripe account not ready for charges');
      // Update vendor record to reflect actual status
      await base44.asServiceRole.entities.Vendor.update(booking.vendor_id, {
        stripe_account_verified: false
      });
      
      return Response.json({ 
        error: 'This vendor needs to complete their Stripe account setup before accepting payments. They will be notified.',
        vendor_setup_incomplete: true
      }, { status: 400 });
    }
    
    // Update vendor verification status if it's now ready
    if (!vendor.stripe_account_verified && stripeAccount.charges_enabled) {
      await base44.asServiceRole.entities.Vendor.update(booking.vendor_id, {
        stripe_account_verified: true
      });
    }

    // Calculate amounts in cents
    const totalAmount = Math.round((booking.total_amount || booking.agreed_price) * 100);
    const platformFeeAmount = Math.round(booking.platform_fee_amount * 100);
    console.log('Payment amounts (cents):', { totalAmount, platformFeeAmount });

    // Get origin for success/cancel URLs
    const referer = req.headers.get('referer') || req.headers.get('origin') || '';
    const baseUrl = referer ? new URL(referer).origin : 'https://evnt.app';
    console.log('Using base URL for redirects:', baseUrl);

    // Create Checkout Session - let Stripe create the PaymentIntent automatically
    console.log('Creating Stripe Checkout Session with escrow...');
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${booking.vendor_name} - ${booking.event_type}`,
              description: booking.service_description || `Event services for ${booking.event_date}`,
            },
            unit_amount: totalAmount,
          },
          quantity: 1,
        }
      ],
      payment_intent_data: {
        capture_method: 'manual', // ESCROW: Holds funds until manual capture
        application_fee_amount: platformFeeAmount,
        transfer_data: {
          destination: vendor.stripe_account_id,
        },
        metadata: {
          booking_id: bookingId,
          client_email: booking.client_email,
          vendor_id: booking.vendor_id,
          event_type: booking.event_type,
          event_date: booking.event_date,
        },
      },
      success_url: `${baseUrl}/Bookings?payment=success&booking=${bookingId}`,
      cancel_url: `${baseUrl}/Bookings?payment=cancelled&booking=${bookingId}`,
      client_reference_id: bookingId,
      metadata: {
        booking_id: bookingId,
      },
    });
    console.log('Checkout Session created:', session.id, 'URL:', session.url);

    console.log('Returning checkout URL for redirect');
    return Response.json({ 
      url: session.url
    });

  } catch (error) {
    console.error('Stripe checkout error:', error);
    console.error('Error stack:', error.stack);
    return Response.json({ 
      error: error.message || 'Failed to create checkout session',
      details: error.type || 'unknown_error'
    }, { status: 500 });
  }
});