import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // CRITICAL: Admin-only check
    if (!user || (user.email !== "pateld0514@gmail.com" && user.role !== "admin")) {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { vendorId, userId, reason } = await req.json();

    if (!vendorId || !userId || !reason) {
      return Response.json({ 
        error: 'vendorId, userId, and reason are required' 
      }, { status: 400 });
    }

    // Update vendor rejection status
    await base44.asServiceRole.entities.Vendor.update(vendorId, { 
      approval_status: "rejected",
      rejection_reason: reason
    });

    // Update user rejection status
    await base44.asServiceRole.entities.User.update(userId, { 
      approval_status: "rejected" 
    });

    // Fetch vendor and user details for notification
    const vendors = await base44.asServiceRole.entities.Vendor.filter({ id: vendorId });
    const users = await base44.asServiceRole.entities.User.filter({ id: userId });

    if (vendors.length > 0 && users.length > 0) {
      const vendor = vendors[0];
      const vendorUser = users[0];

      // Send rejection notification
      await base44.asServiceRole.functions.invoke('notifyVendorApproval', {
        vendor_email: vendorUser.email || vendor.contact_email,
        vendor_name: vendorUser.full_name || vendor.business_name,
        status: 'rejected',
        rejection_reason: reason
      });
    }

    return Response.json({ 
      success: true,
      message: 'Vendor rejected successfully' 
    });

  } catch (error) {
    console.error('Reject vendor error:', error);
    return Response.json({ 
      error: error.message || 'Failed to reject vendor' 
    }, { status: 500 });
  }
});