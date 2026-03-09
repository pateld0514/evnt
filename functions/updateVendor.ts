import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { vendorId, updates } = await req.json();

    if (!vendorId || !updates) {
      return Response.json({ error: 'Vendor ID and updates required' }, { status: 400 });
    }

    // Get vendor to verify ownership
    const vendors = await base44.asServiceRole.entities.Vendor.filter({ id: vendorId });
    const vendor = vendors[0];

    if (!vendor) {
      return Response.json({ error: 'Vendor not found' }, { status: 404 });
    }

    // Security: Verify user can modify this vendor
    const isAdmin = user.role === 'admin';
    const isOwner = vendor.created_by === user.email;

    if (!isAdmin && !isOwner) {
      return Response.json({ 
        error: 'Forbidden: Cannot modify this vendor profile' 
      }, { status: 403 });
    }

    // Prevent users from modifying admin-only fields
    const adminOnlyFields = ['approval_status', 'rejection_reason', 'stripe_account_verified'];
    if (!isAdmin) {
      for (const field of adminOnlyFields) {
        if (updates.hasOwnProperty(field)) {
          return Response.json({ 
            error: `Forbidden: Cannot modify field '${field}'` 
          }, { status: 403 });
        }
      }
    }

    // Update the vendor
    await base44.asServiceRole.entities.Vendor.update(vendorId, updates);

    return Response.json({ 
      success: true, 
      message: 'Vendor updated successfully' 
    });

  } catch (error) {
    console.error('Update vendor error:', error);
    return Response.json({ 
      error: error?.message || 'Failed to update vendor' 
    }, { status: 500 });
  }
});