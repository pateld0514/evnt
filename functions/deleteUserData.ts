import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    const { userEmail } = await req.json();
    
    if (!userEmail) {
      return Response.json({ error: 'User email required' }, { status: 400 });
    }

    // Delete all user-related data using service role
    const deletedItems = {
      messages: 0,
      bookings: 0,
      reviews: 0,
      savedVendors: 0,
      swipes: 0,
      views: 0,
      notifications: 0,
      events: 0,
      vendor: 0
    };

    // Delete messages sent by or received by this user
    const messages = await base44.asServiceRole.entities.Message.list();
    const userMessages = messages.filter(m => 
      m.sender_email === userEmail || m.recipient_email === userEmail
    );
    for (const msg of userMessages) {
      await base44.asServiceRole.entities.Message.delete(msg.id);
      deletedItems.messages++;
    }

    // Delete bookings created by this user
    const bookings = await base44.asServiceRole.entities.Booking.filter({ 
      client_email: userEmail 
    });
    for (const booking of bookings) {
      await base44.asServiceRole.entities.Booking.delete(booking.id);
      deletedItems.bookings++;
    }

    // Delete reviews by this user
    const reviews = await base44.asServiceRole.entities.Review.filter({ 
      client_email: userEmail 
    });
    for (const review of reviews) {
      await base44.asServiceRole.entities.Review.delete(review.id);
      deletedItems.reviews++;
    }

    // Delete saved vendors
    const savedVendors = await base44.asServiceRole.entities.SavedVendor.filter({ 
      created_by: userEmail 
    });
    for (const saved of savedVendors) {
      await base44.asServiceRole.entities.SavedVendor.delete(saved.id);
      deletedItems.savedVendors++;
    }

    // Delete user swipes
    const swipes = await base44.asServiceRole.entities.UserSwipe.filter({ 
      created_by: userEmail 
    });
    for (const swipe of swipes) {
      await base44.asServiceRole.entities.UserSwipe.delete(swipe.id);
      deletedItems.swipes++;
    }

    // Delete vendor views
    const views = await base44.asServiceRole.entities.VendorView.filter({ 
      viewer_email: userEmail 
    });
    for (const view of views) {
      await base44.asServiceRole.entities.VendorView.delete(view.id);
      deletedItems.views++;
    }

    // Delete notifications
    const notifications = await base44.asServiceRole.entities.Notification.filter({ 
      recipient_email: userEmail 
    });
    for (const notif of notifications) {
      await base44.asServiceRole.entities.Notification.delete(notif.id);
      deletedItems.notifications++;
    }

    // Delete events created by this user
    const events = await base44.asServiceRole.entities.Event.filter({ 
      created_by: userEmail 
    });
    for (const event of events) {
      await base44.asServiceRole.entities.Event.delete(event.id);
      deletedItems.events++;
    }

    // If user is a vendor, delete their vendor profile
    const vendors = await base44.asServiceRole.entities.Vendor.filter({ 
      contact_email: userEmail 
    });
    for (const vendor of vendors) {
      await base44.asServiceRole.entities.Vendor.delete(vendor.id);
      deletedItems.vendor++;
    }

    return Response.json({ 
      success: true,
      message: 'All user data deleted successfully',
      deletedItems
    });

  } catch (error) {
    console.error('Delete user data error:', error);
    return Response.json({ 
      error: error.message || 'Failed to delete user data' 
    }, { status: 500 });
  }
});