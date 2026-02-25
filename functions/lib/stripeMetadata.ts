/**
 * Centralized Stripe Metadata Builder
 * Prevents metadata overflow and ensures consistency
 * Stripe limit: 50KB total, 500 chars per value
 */

export function buildStripeMetadata(booking, options = {}) {
  const metadata = {
    // Core identifiers
    booking_id: booking.id,
    vendor_id: booking.vendor_id,
    client_email: booking.client_email,
    
    // Event details (truncated to prevent overflow)
    event_type: truncate(booking.event_type, 100),
    event_date: booking.event_date,
    event_location: truncate(booking.location || '', 200),
    
    // Financial data (strings for precision)
    base_event_amount: booking.base_event_amount?.toString() || '0',
    platform_fee_amount: booking.platform_fee_amount?.toString() || '0',
    platform_fee_percent: booking.platform_fee_percent?.toString() || '0',
    sales_tax_amount: booking.sales_tax_amount?.toString() || '0',
    stripe_fee_amount: booking.stripe_fee_amount?.toString() || '0',
    total_amount_charged: booking.total_amount_charged?.toString() || '0',
    vendor_payout: booking.vendor_payout?.toString() || '0',
    
    // Additional context
    ...(options.requestId && { request_id: options.requestId }),
  };
  
  // Validate size
  const metadataSize = JSON.stringify(metadata).length;
  if (metadataSize > 50000) {
    console.warn(`Metadata size exceeds safe limit: ${metadataSize} bytes`);
  }
  
  return metadata;
}

function truncate(str, maxLength) {
  if (!str || str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}