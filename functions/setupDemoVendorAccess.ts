import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Allow demo users and admins to set this up
    if (!user || (user.role !== "admin" && !user.demo_mode)) {
      return Response.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Find the test vendor
    const vendors = await base44.asServiceRole.entities.Vendor.filter({
      is_test_vendor: true
    });

    if (vendors.length === 0) {
      return Response.json({ error: 'Test vendor not found. Run setupTestVendorData first.' }, { status: 404 });
    }

    const testVendor = vendors[0];

    // Update current user to link to this vendor
    await base44.auth.updateMe({
      vendor_id: testVendor.id,
      demo_mode: 'vendor',
      demo_user_type: 'vendor',
      demo_onboarding_complete: true,
      user_type: 'vendor'
    });

    // Also update the test vendor to include demo account contact email
    await base44.asServiceRole.entities.Vendor.update(testVendor.id, {
      contact_email: user.email,
      approval_status: 'approved',
      profile_complete: true,
      is_test_vendor: true
    });

    return Response.json({
      success: true,
      vendorId: testVendor.id,
      message: 'Demo vendor access configured'
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});