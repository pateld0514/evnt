import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const STATE_TAX_RATES = {
  "AL": 0.0946,
  "AK": 0.0182,
  "AZ": 0.0852,
  "AR": 0.0946,
  "CA": 0.0899,
  "CO": 0.0789,
  "CT": 0.0635,
  "DE": 0,
  "FL": 0.0698,
  "GA": 0.0749,
  "HI": 0.0450,
  "ID": 0.0603,
  "IL": 0.0896,
  "IN": 0.0700,
  "IA": 0.0694,
  "KS": 0.0869,
  "KY": 0.0600,
  "LA": 0.1011,
  "ME": 0.0550,
  "MD": 0.0600,
  "MA": 0.0625,
  "MI": 0.0600,
  "MN": 0.0814,
  "MS": 0.0706,
  "MO": 0.0844,
  "MT": 0,
  "NE": 0.0698,
  "NV": 0.0824,
  "NH": 0,
  "NJ": 0.0660,
  "NM": 0.0767,
  "NY": 0.0854,
  "NC": 0.0700,
  "ND": 0.0709,
  "OH": 0.0729,
  "OK": 0.0906,
  "OR": 0,
  "PA": 0.0634,
  "RI": 0.0700,
  "SC": 0.0749,
  "SD": 0.0611,
  "TN": 0.0961,
  "TX": 0.0820,
  "UT": 0.0742,
  "VT": 0.0639,
  "VA": 0.0577,
  "WA": 0.0951,
  "WV": 0.0659,
  "WI": 0.0572,
  "WY": 0.0556,
  "DC": 0.0600
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