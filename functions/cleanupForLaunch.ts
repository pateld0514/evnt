import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Only admin can run this
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    // Get all users
    const allUsers = await base44.asServiceRole.entities.User.list();
    
    // Delete all non-admin users
    let deletedCount = 0;
    for (const u of allUsers) {
      if (u.role !== 'admin') {
        await base44.asServiceRole.entities.User.delete(u.id);
        deletedCount++;
      }
    }

    // Delete all vendors
    const vendors = await base44.asServiceRole.entities.Vendor.list();
    for (const v of vendors) {
      await base44.asServiceRole.entities.Vendor.delete(v.id);
    }

    // Delete all messages
    const messages = await base44.asServiceRole.entities.Message.list();
    for (const m of messages) {
      await base44.asServiceRole.entities.Message.delete(m.id);
    }

    // Delete all bookings
    const bookings = await base44.asServiceRole.entities.Booking.list();
    for (const b of bookings) {
      await base44.asServiceRole.entities.Booking.delete(b.id);
    }

    // Delete all events
    const events = await base44.asServiceRole.entities.Event.list();
    for (const e of events) {
      await base44.asServiceRole.entities.Event.delete(e.id);
    }

    // Delete all saved vendors
    const saved = await base44.asServiceRole.entities.SavedVendor.list();
    for (const s of saved) {
      await base44.asServiceRole.entities.SavedVendor.delete(s.id);
    }

    // Delete all swipes
    const swipes = await base44.asServiceRole.entities.UserSwipe.list();
    for (const s of swipes) {
      await base44.asServiceRole.entities.UserSwipe.delete(s.id);
    }

    // Delete all reviews
    const reviews = await base44.asServiceRole.entities.Review.list();
    for (const r of reviews) {
      await base44.asServiceRole.entities.Review.delete(r.id);
    }

    // Delete all notifications
    const notifications = await base44.asServiceRole.entities.Notification.list();
    for (const n of notifications) {
      await base44.asServiceRole.entities.Notification.delete(n.id);
    }

    // Delete all vendor views
    const views = await base44.asServiceRole.entities.VendorView.list();
    for (const v of views) {
      await base44.asServiceRole.entities.VendorView.delete(v.id);
    }

    return Response.json({ 
      success: true,
      deleted: {
        users: deletedCount,
        vendors: vendors.length,
        messages: messages.length,
        bookings: bookings.length,
        events: events.length,
        savedVendors: saved.length,
        swipes: swipes.length,
        reviews: reviews.length,
        notifications: notifications.length,
        views: views.length
      }
    });

  } catch (error) {
    console.error('Cleanup error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});