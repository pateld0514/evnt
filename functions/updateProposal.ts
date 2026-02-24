import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bookingId, proposalData } = await req.json();

    if (!bookingId || !proposalData) {
      return Response.json({ 
        error: 'bookingId and proposalData are required' 
      }, { status: 400 });
    }

    // Fetch booking to verify ownership
    const bookings = await base44.asServiceRole.entities.Booking.filter({ id: bookingId });
    const booking = bookings[0];

    if (!booking) {
      return Response.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Verify authorization
    const isVendor = user.vendor_id && booking.vendor_id === user.vendor_id;
    const isClient = booking.client_email === user.email;
    const isAdmin = user.email === "pateld0514@gmail.com" || user.role === "admin";

    if (!isVendor && !isClient && !isAdmin) {
      return Response.json({ 
        error: 'Forbidden: Cannot modify this booking' 
      }, { status: 403 });
    }

    // Recalculate and validate on server side
    const calculationResponse = await base44.asServiceRole.functions.invoke('calculateProposal', {
      bookingId,
      agreedPrice: proposalData.agreedPrice,
      additionalFees: proposalData.additionalFees || [],
      serviceDescription: proposalData.serviceDescription,
      clientState: proposalData.clientState || booking.client_state
    });

    if (!calculationResponse.data?.success) {
      return Response.json({ 
        error: 'Failed to validate proposal calculations' 
      }, { status: 500 });
    }

    const calc = calculationResponse.data.calculation;

    // Update booking with validated data
    const updateData = {
      base_event_amount: calc.base_event_amount,
      agreed_price: calc.agreed_price,
      service_description: calc.service_description,
      additional_fees: calc.additional_fees,
      platform_fee_percent: calc.platform_fee_percent,
      platform_fee_amount: calc.platform_fee_amount,
      sales_tax_amount: calc.sales_tax_amount,
      sales_tax_rate: calc.sales_tax_rate,
      client_state: calc.state_abbreviation,
      stripe_fee_amount: calc.stripe_fee,
      vendor_payout: calc.vendor_payout,
      total_amount_charged: calc.total_amount_charged,
      currency: 'USD',
      status: proposalData.newStatus || booking.status
    };

    await base44.asServiceRole.entities.Booking.update(bookingId, updateData);

    return Response.json({
      success: true,
      message: 'Proposal updated and validated',
      calculation: calc
    });

  } catch (error) {
    console.error('Update proposal error:', error);
    return Response.json({ 
      error: error.message || 'Failed to update proposal' 
    }, { status: 500 });
  }
});