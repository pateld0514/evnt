import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized - no user' }, { status: 401 });
    }

    const result = {
      user_email: user.email,
      user_role: user.role,
      user_type: user.user_type,
      vendor_id: user.vendor_id,
      approval_status: user.approval_status,
    };

    // Test vendor lookup by contact_email
    const vendorsByEmail = await base44.entities.Vendor.filter({ contact_email: user.email });
    result.vendors_by_contact_email = vendorsByEmail.map(v => ({ id: v.id, name: v.business_name }));

    // Test vendor lookup by vendor_id from user profile
    if (user.vendor_id) {
      try {
        const vendorById = await base44.entities.Vendor.get(user.vendor_id);
        result.vendor_by_id = vendorById ? { id: vendorById.id, name: vendorById.business_name } : null;
      } catch(e) {
        result.vendor_by_id_error = e.message;
      }
    }

    // Test bookings access via user.vendor_id
    if (user.vendor_id) {
      const bookings = await base44.entities.Booking.filter({ vendor_id: user.vendor_id });
      result.bookings_count = bookings.length;
      result.booking_statuses = bookings.map(b => b.status);
    } else if (vendorsByEmail.length > 0) {
      const bookings = await base44.entities.Booking.filter({ vendor_id: vendorsByEmail[0].id });
      result.bookings_count = bookings.length;
      result.booking_statuses = bookings.map(b => b.status);
    }

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});