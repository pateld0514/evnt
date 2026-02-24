import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const STATE_TAX_RATES = {
  "MD": 0.06,
  "NM": 0.0951,
  "CA": 0.0725,
  "NY": 0.04,
  "TX": 0.0625,
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Get all bookings
    const bookings = await base44.asServiceRole.entities.Booking.list();
    const updates = [];

    for (const booking of bookings) {
      if (!booking.base_event_amount) continue;

      // Determine state for tax
      let state = booking.client_state;
      if (!state && booking.location) {
        const parts = booking.location.split(',');
        state = parts[parts.length - 1]?.trim();
      }

      const taxRate = STATE_TAX_RATES[state] || 0;
      const baseAmount = booking.base_event_amount || booking.agreed_price || 0;
      
      // Calculate fees
      const platformFeeAmount = baseAmount * (booking.platform_fee_percent || 10) / 100;
      const salesTaxAmount = baseAmount * taxRate;
      
      // Stripe fee: 2.9% + $0.30
      const stripeFee = (baseAmount * 0.029) + 0.30;
      
      // Vendor payout
      const vendorPayout = baseAmount - platformFeeAmount - salesTaxAmount - stripeFee;

      // Update booking with new fields
      const updateData = {
        sales_tax_amount: salesTaxAmount,
        sales_tax_rate: taxRate,
        stripe_fee: stripeFee,
        stripe_fee_amount: stripeFee,
        vendor_payout: vendorPayout,
        client_state: state || 'MD',
      };

      await base44.asServiceRole.entities.Booking.update(booking.id, updateData);
      updates.push({ id: booking.id, ...updateData });
    }

    return Response.json({ 
      success: true, 
      updated: updates.length,
      bookings: updates 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});