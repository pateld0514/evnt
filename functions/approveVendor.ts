import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // CRITICAL: Admin-only check
    if (!user || user.role !== "admin") {
      console.error('Unauthorized approveVendor attempt', { user_id: user?.id, email: user?.email });
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { vendorId, userId } = await req.json();

    if (!vendorId || !userId) {
      return Response.json({ 
        error: 'vendorId and userId are required' 
      }, { status: 400 });
    }

    // Update vendor approval status
    await base44.asServiceRole.entities.Vendor.update(vendorId, { 
      approval_status: "approved" 
    });

    // Update user approval status
    await base44.asServiceRole.entities.User.update(userId, { 
      approval_status: "approved" 
    });

    // Fetch vendor and user details for notification
    const vendors = await base44.asServiceRole.entities.Vendor.filter({ id: vendorId });
    const users = await base44.asServiceRole.entities.User.filter({ id: userId });

    if (vendors.length > 0 && users.length > 0) {
      const vendor = vendors[0];
      const vendorUser = users[0];

      // Send approval notification
      await base44.asServiceRole.functions.invoke('notifyVendorApproval', {
        vendor_email: vendorUser.email || vendor.contact_email,
        vendor_name: vendorUser.full_name || vendor.business_name,
        status: 'approved'
      });
    }

    return Response.json({ 
      success: true,
      message: 'Vendor approved successfully' 
    });

  } catch (error) {
    console.error('Approve vendor error:', error);
    return Response.json({ 
      error: error.message || 'Failed to approve vendor' 
    }, { status: 500 });
  }
});