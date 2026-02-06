import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get the deleted user info from the payload
    const { event, data } = await req.json();
    
    if (event.type !== 'delete') {
      return Response.json({ error: 'Invalid event type' }, { status: 400 });
    }

    const userEmail = data?.email;
    const userId = event.entity_id;
    
    if (!userEmail) {
      return Response.json({ error: 'User email not found' }, { status: 400 });
    }

    console.log(`Cleaning up data for deleted user: ${userEmail}`);

    // Delete all user-related data using service role
    const deletionPromises = [];

    // Delete vendor profile if exists
    const vendors = await base44.asServiceRole.entities.Vendor.filter({ created_by: userEmail });
    if (vendors.length > 0) {
      const vendorIds = vendors.map(v => v.id);
      
      // Delete vendor-related data
      for (const vendorId of vendorIds) {
        deletionPromises.push(
          base44.asServiceRole.entities.Booking.filter({ vendor_id: vendorId }).then(bookings => {
            return Promise.all(bookings.map(b => base44.asServiceRole.entities.Booking.delete(b.id)));
          }),
          base44.asServiceRole.entities.Review.filter({ vendor_id: vendorId }).then(reviews => {
            return Promise.all(reviews.map(r => base44.asServiceRole.entities.Review.delete(r.id)));
          }),
          base44.asServiceRole.entities.PortfolioItem.filter({ vendor_id: vendorId }).then(items => {
            return Promise.all(items.map(i => base44.asServiceRole.entities.PortfolioItem.delete(i.id)));
          }),
          base44.asServiceRole.entities.VendorTier.filter({ vendor_id: vendorId }).then(tiers => {
            return Promise.all(tiers.map(t => base44.asServiceRole.entities.VendorTier.delete(t.id)));
          }),
          base44.asServiceRole.entities.VendorPayout.filter({ vendor_id: vendorId }).then(payouts => {
            return Promise.all(payouts.map(p => base44.asServiceRole.entities.VendorPayout.delete(p.id)));
          }),
          base44.asServiceRole.entities.Vendor.delete(vendorId)
        );
      }
    }

    // Delete client-related data
    deletionPromises.push(
      base44.asServiceRole.entities.Event.filter({ created_by: userEmail }).then(events => {
        return Promise.all(events.map(e => base44.asServiceRole.entities.Event.delete(e.id)));
      }),
      base44.asServiceRole.entities.Booking.filter({ client_email: userEmail }).then(bookings => {
        return Promise.all(bookings.map(b => base44.asServiceRole.entities.Booking.delete(b.id)));
      }),
      base44.asServiceRole.entities.SavedVendor.filter({ created_by: userEmail }).then(saved => {
        return Promise.all(saved.map(s => base44.asServiceRole.entities.SavedVendor.delete(s.id)));
      }),
      base44.asServiceRole.entities.UserSwipe.filter({ created_by: userEmail }).then(swipes => {
        return Promise.all(swipes.map(s => base44.asServiceRole.entities.UserSwipe.delete(s.id)));
      }),
      base44.asServiceRole.entities.Message.filter({ sender_email: userEmail }).then(msgs => {
        return Promise.all(msgs.map(m => base44.asServiceRole.entities.Message.delete(m.id)));
      }),
      base44.asServiceRole.entities.Message.filter({ recipient_email: userEmail }).then(msgs => {
        return Promise.all(msgs.map(m => base44.asServiceRole.entities.Message.delete(m.id)));
      }),
      base44.asServiceRole.entities.Review.filter({ client_email: userEmail }).then(reviews => {
        return Promise.all(reviews.map(r => base44.asServiceRole.entities.Review.delete(r.id)));
      }),
      base44.asServiceRole.entities.ClientTier.filter({ client_email: userEmail }).then(tiers => {
        return Promise.all(tiers.map(t => base44.asServiceRole.entities.ClientTier.delete(t.id)));
      }),
      base44.asServiceRole.entities.ReferralReward.filter({ referrer_email: userEmail }).then(rewards => {
        return Promise.all(rewards.map(r => base44.asServiceRole.entities.ReferralReward.delete(r.id)));
      }),
      base44.asServiceRole.entities.ReferralReward.filter({ referred_email: userEmail }).then(rewards => {
        return Promise.all(rewards.map(r => base44.asServiceRole.entities.ReferralReward.delete(r.id)));
      }),
      base44.asServiceRole.entities.Notification.filter({ recipient_email: userEmail }).then(notifs => {
        return Promise.all(notifs.map(n => base44.asServiceRole.entities.Notification.delete(n.id)));
      }),
      base44.asServiceRole.entities.VendorView.filter({ viewer_email: userEmail }).then(views => {
        return Promise.all(views.map(v => base44.asServiceRole.entities.VendorView.delete(v.id)));
      })
    );

    await Promise.all(deletionPromises);

    console.log(`Successfully cleaned up all data for user: ${userEmail}`);

    return Response.json({ 
      success: true, 
      message: `All data deleted for user ${userEmail}` 
    });

  } catch (error) {
    console.error('Error cleaning up deleted user:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});