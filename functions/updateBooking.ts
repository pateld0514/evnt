import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// Inlined from lib/bookingStateMachine.js — no local imports allowed in Deno Deploy
const VALID_TRANSITIONS = {
  pending: ['negotiating', 'declined', 'cancelled'],
  negotiating: ['payment_pending', 'cancelled', 'declined'],
  payment_pending: ['confirmed', 'cancelled'],
  confirmed: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
  declined: [],
};
function validateTransition(currentStatus, newStatus) {
  if (!VALID_TRANSITIONS[currentStatus]) throw new Error(`Invalid current status: ${currentStatus}`);
  if (!VALID_TRANSITIONS[currentStatus].includes(newStatus)) {
    throw new Error(`Invalid transition from ${currentStatus} to ${newStatus}. Valid: ${VALID_TRANSITIONS[currentStatus].join(', ')}`);
  }
  return true;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bookingId, updates } = await req.json();

    if (!bookingId || !updates) {
      return Response.json({ error: 'Booking ID and updates required' }, { status: 400 });
    }

    let bookings;
    try {
      bookings = await base44.asServiceRole.entities.Booking.filter({ id: bookingId });
    } catch (e) {
      return Response.json({ error: 'Booking not found' }, { status: 404 });
    }
    const booking = bookings[0];

    if (!booking) {
      return Response.json({ error: 'Booking not found' }, { status: 404 });
    }

    const isAdmin = user.role === 'admin';
    const isClient = booking.client_email === user.email;

    // SECURITY: Cross-validate vendor ownership via Vendor entity's created_by,
    // not user.vendor_id, to prevent IDOR via profile tampering.
    let isVendor = false;
    if (!isAdmin && !isClient) {
      const vendorRecords = await base44.asServiceRole.entities.Vendor.filter({ id: booking.vendor_id });
      isVendor = vendorRecords[0]?.created_by === user.email;
    }

    if (!isAdmin && !isClient && !isVendor) {
      return Response.json({ error: 'Forbidden: Cannot modify this booking' }, { status: 403 });
    }

    if (updates.expectedUpdatedDate && booking.updated_date !== updates.expectedUpdatedDate) {
      return Response.json({ error: 'Booking was modified by another user. Please refresh and try again.' }, { status: 409 });
    }

    // SECURITY: Strip concurrency token and build a role-scoped field allowlist.
    // This prevents clients/vendors from writing financial fields, payment IDs, or
    // status transitions not allowed for their role (privilege escalation via arbitrary writes).
    const { expectedUpdatedDate, ...rawUpdates } = updates;

    // Fields that only admins can write
    const ADMIN_ONLY_FIELDS = [
      'payment_status', 'payment_intent_id', 'stripe_session_id',
      'base_event_amount', 'agreed_price', 'platform_fee_percent', 'platform_fee_amount',
      'sales_tax_rate', 'sales_tax_amount', 'stripe_fee_amount', 'vendor_payout',
      'total_amount_charged', 'refund_amount', 'refund_reason', 'refund_date',
      'idempotency_key', 'invoice_number', 'cancellation_reason', 'cancelled_date',
    ];

    // Fields that vendors are allowed to write on their own bookings
    const VENDOR_ALLOWED_FIELDS = [
      'status', 'vendor_response', 'service_description',
      'vendor_custom_contract_url', 'vendor_custom_invoice_url',
      'contract_signed_vendor',
    ];

    // Fields that clients are allowed to write on their own bookings
    const CLIENT_ALLOWED_FIELDS = [
      'status', 'notes', 'contract_signed_client',
    ];

    let safeUpdates;
    if (isAdmin) {
      // Admins get unrestricted writes (minus the concurrency token)
      safeUpdates = rawUpdates;
    } else if (isVendor) {
      safeUpdates = Object.fromEntries(
        Object.entries(rawUpdates).filter(([k]) => VENDOR_ALLOWED_FIELDS.includes(k))
      );
    } else {
      // Client
      safeUpdates = Object.fromEntries(
        Object.entries(rawUpdates).filter(([k]) => CLIENT_ALLOWED_FIELDS.includes(k))
      );
    }

    // Extra guard: non-admins can NEVER write admin-only fields regardless of role
    if (!isAdmin) {
      for (const field of ADMIN_ONLY_FIELDS) {
        if (field in safeUpdates) {
          console.error(`[updateBooking] SECURITY: ${user.email} attempted to write admin-only field "${field}" — blocked`);
          delete safeUpdates[field];
        }
      }
    }

    if (Object.keys(safeUpdates).length === 0) {
      return Response.json({ error: 'No permitted fields to update' }, { status: 400 });
    }

    if (safeUpdates.status && safeUpdates.status !== booking.status) {
      try {
        validateTransition(booking.status, safeUpdates.status);
      } catch (error) {
        return Response.json({ error: error.message }, { status: 400 });
      }
    }

    await base44.asServiceRole.entities.Booking.update(bookingId, safeUpdates);

    return Response.json({ success: true, message: 'Booking updated successfully' });

  } catch (error) {
    console.error('Update booking error:', error);
    return Response.json({ error: error.message || 'Failed to update booking' }, { status: 500 });
  }
});