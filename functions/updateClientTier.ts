import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { client_email } = await req.json();

    if (!client_email) {
      return Response.json({ error: 'client_email is required' }, { status: 400 });
    }

    // Get all completed bookings for this client
    const completedBookings = await base44.asServiceRole.entities.Booking.filter({ 
      client_email,
      status: 'completed'
    });

    // Calculate stats
    const totalBookings = completedBookings.length;
    const totalSpent = completedBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);

    // Calculate bookings this year
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const bookingsThisYear = completedBookings.filter(b => 
      new Date(b.updated_date) >= startOfYear
    ).length;

    // Determine tier level and discount
    let tierLevel = 'starter';
    let discount = 0;

    if (totalBookings >= 10) {
      tierLevel = 'vip';
      discount = 2; // 2% discount on platform fees
    } else if (totalBookings >= 3) {
      tierLevel = 'regular';
      discount = 1; // 1% discount on platform fees
    }

    // Check if tier record exists
    const existingTiers = await base44.asServiceRole.entities.ClientTier.filter({ client_email });

    const tierData = {
      client_email,
      tier_level: tierLevel,
      total_bookings: totalBookings,
      total_spent: totalSpent,
      bookings_this_year: bookingsThisYear,
      last_tier_update: new Date().toISOString(),
      discount_percent: discount
    };

    if (existingTiers.length > 0) {
      await base44.asServiceRole.entities.ClientTier.update(existingTiers[0].id, tierData);
    } else {
      await base44.asServiceRole.entities.ClientTier.create(tierData);
    }

    return Response.json({ 
      success: true, 
      tier: tierData 
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});