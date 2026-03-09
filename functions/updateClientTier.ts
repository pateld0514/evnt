import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const payload = await req.json();

    // Validate shared secret — only required for direct/external calls, not entity automation triggers
    const isEntityAutomation = !!payload.event;
    if (!isEntityAutomation && payload._secret !== Deno.env.get('INTERNAL_SECRET')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Handle payload_too_large: fetch booking data directly if entity data was omitted
    let bookingData = payload.data;
    if (!bookingData && payload.payload_too_large && payload.event?.entity_id) {
      try {
        const fetched = await base44.asServiceRole.entities.Booking.filter({ id: payload.event.entity_id });
        bookingData = fetched[0] || null;
      } catch (e) {
        console.warn('[updateClientTier] payload_too_large fetch failed:', e.message);
      }
    }

    // Extract client_email from payload or fetched booking data
    const client_email = payload.client_email || bookingData?.client_email;
    
    // Only process if booking was just completed
    if (payload.event?.type === 'update') {
      // Guard: if old_data is absent, skip to avoid duplicate processing
      if (payload.old_data === null || payload.old_data === undefined) {
        return Response.json({ success: true, message: 'No old_data — cannot determine transition, skipping to avoid duplicates' });
      }
      const justCompleted = bookingData?.status === 'completed' && payload.old_data?.status !== 'completed';
      if (!justCompleted) {
        return Response.json({ success: true, message: 'Not a completion event, skipped' });
      }
    } else if (!payload.event) {
      // Direct call, process normally
    } else {
      return Response.json({ success: true, message: 'Not a completion event, skipped' });
    }

    if (!client_email) {
      return Response.json({ error: 'client_email is required' }, { status: 400 });
    }

    // Get all completed AND PAID bookings for this client
    const completedBookings = await base44.asServiceRole.entities.Booking.filter({ 
      client_email,
      status: 'completed',
      payment_status: 'paid'
    });

    // Calculate stats
    const totalBookings = completedBookings.length;
    const totalSpent = completedBookings.reduce((sum, b) => sum + (b.total_amount_charged || b.total_amount || 0), 0);

    // Calculate bookings this year
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const bookingsThisYear = completedBookings.filter(b => 
      new Date(b.updated_date) >= startOfYear
    ).length;

    // Determine tier level and discount
    // STARTER: 0-15 bookings = 0% discount
    // REGULAR: 16-45 bookings = 1% discount
    // VIP: 46+ bookings = 3% discount
    let tierLevel = 'starter';
    let discount = 0;

    if (totalBookings >= 46) {
      tierLevel = 'vip';
      discount = 3; // 3% discount on total booking price
    } else if (totalBookings >= 16) {
      tierLevel = 'regular';
      discount = 1; // 1% discount on total booking price
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

    const oldTier = existingTiers.length > 0 ? existingTiers[0].tier_level : null;
    const tierChanged = oldTier !== tierLevel;

    if (existingTiers.length > 0) {
      await base44.asServiceRole.entities.ClientTier.update(existingTiers[0].id, tierData);
    } else {
      await base44.asServiceRole.entities.ClientTier.create(tierData);
    }

    // Send tier update notification if tier changed
    if (tierChanged && tierLevel !== 'starter') {
      try {
        await base44.asServiceRole.functions.invoke('sendTierUpdateNotification', {
          user_email: client_email,
          user_type: 'client',
          old_tier: oldTier,
          new_tier: tierLevel,
          _secret: Deno.env.get('INTERNAL_SECRET'),
          benefits: [
            `${discount}% discount on all bookings`,
            'Priority customer support',
            tierLevel === 'vip' ? 'Exclusive VIP perks' : 'Early access to new vendors'
          ]
        });
      } catch (error) {
        console.error('Failed to send tier notification:', error);
      }
    }

    return Response.json({ 
      success: true, 
      tier: tierData,
      tier_changed: tierChanged
    });

  } catch (error) {
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
});