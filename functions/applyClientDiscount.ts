import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    
    const { client_email, base_amount } = payload;
    
    if (!client_email || !base_amount) {
      return Response.json({ 
        error: 'client_email and base_amount are required' 
      }, { status: 400 });
    }

    // Get client tier
    const clientTiers = await base44.asServiceRole.entities.ClientTier.filter({ 
      client_email 
    });

    let discountPercent = 0;
    let tierLevel = 'starter';
    
    if (clientTiers.length > 0) {
      const tier = clientTiers[0];
      discountPercent = tier.discount_percent || 0;
      tierLevel = tier.tier_level;
    }

    // Calculate discount
    const discountAmount = (base_amount * discountPercent) / 100;
    const finalAmount = base_amount - discountAmount;

    return Response.json({ 
      success: true,
      tier_level: tierLevel,
      discount_percent: discountPercent,
      discount_amount: parseFloat(discountAmount.toFixed(2)),
      original_amount: base_amount,
      final_amount: parseFloat(finalAmount.toFixed(2))
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});