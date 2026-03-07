import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Only admins can run cleanup
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    console.log('Starting cleanup for orphaned data...');

    const internalSecret = Deno.env.get('INTERNAL_SECRET');
    if (!internalSecret) {
      return Response.json({ error: 'INTERNAL_SECRET not configured' }, { status: 500 });
    }

    // Find all orphaned messages (no sender or recipient found in User entity)
    const allMessages = await base44.asServiceRole.entities.Message.list();
    const allUsers = await base44.asServiceRole.entities.User.list();
    const userEmails = new Set(allUsers.map(u => u.email));

    let orphanedMessagesDeleted = 0;
    for (const msg of allMessages) {
      if (!userEmails.has(msg.sender_email) || !userEmails.has(msg.recipient_email)) {
        await base44.asServiceRole.entities.Message.delete(msg.id);
        orphanedMessagesDeleted++;
      }
    }

    // Find and delete orphaned swipes (user no longer exists)
    const allSwipes = await base44.asServiceRole.entities.UserSwipe.list();
    let orphanedSwipesDeleted = 0;
    for (const swipe of allSwipes) {
      if (!userEmails.has(swipe.created_by)) {
        await base44.asServiceRole.entities.UserSwipe.delete(swipe.id);
        orphanedSwipesDeleted++;
      }
    }

    // Find and delete orphaned bookings (client or vendor no longer exists)
    const allBookings = await base44.asServiceRole.entities.Booking.list();
    const allVendors = await base44.asServiceRole.entities.Vendor.list();
    const vendorIds = new Set(allVendors.map(v => v.id));

    let orphanedBookingsDeleted = 0;
    for (const booking of allBookings) {
      if (!userEmails.has(booking.client_email) || !vendorIds.has(booking.vendor_id)) {
        await base44.asServiceRole.entities.Booking.delete(booking.id);
        orphanedBookingsDeleted++;
      }
    }

    // Find and delete orphaned reviews (client or vendor no longer exists)
    const allReviews = await base44.asServiceRole.entities.Review.list();
    let orphanedReviewsDeleted = 0;
    for (const review of allReviews) {
      if (!userEmails.has(review.client_email) || !vendorIds.has(review.vendor_id)) {
        await base44.asServiceRole.entities.Review.delete(review.id);
        orphanedReviewsDeleted++;
      }
    }

    console.log(`Cleanup complete: 
      - Orphaned messages deleted: ${orphanedMessagesDeleted}
      - Orphaned swipes deleted: ${orphanedSwipesDeleted}
      - Orphaned bookings deleted: ${orphanedBookingsDeleted}
      - Orphaned reviews deleted: ${orphanedReviewsDeleted}`);

    return Response.json({
      success: true,
      cleanup_summary: {
        orphaned_messages: orphanedMessagesDeleted,
        orphaned_swipes: orphanedSwipesDeleted,
        orphaned_bookings: orphanedBookingsDeleted,
        orphaned_reviews: orphanedReviewsDeleted,
        total_cleaned: orphanedMessagesDeleted + orphanedSwipesDeleted + orphanedBookingsDeleted + orphanedReviewsDeleted
      }
    });

  } catch (error) {
    console.error('Error running cleanup:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});