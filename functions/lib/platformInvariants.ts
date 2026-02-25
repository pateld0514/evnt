/**
 * Platform Invariants - These rules MUST NEVER CHANGE
 * Future audits validate against these constants
 * This prevents regression and ensures consistency
 */
export const PLATFORM_RULES = {
  // Authorization
  ADMIN_CHECK: 'role_based_only', // Never use email checks
  
  // Database Fields (standardized)
  TAX_FIELD: 'sales_tax_amount',
  STRIPE_FEE_FIELD: 'stripe_fee_amount',
  TOTAL_FIELD: 'total_amount_charged',
  
  // Payment Safety
  WEBHOOK_IDEMPOTENT: true,
  ESCROW_MODE: 'manual_capture',
  
  // Deprecated Fields (NEVER use these)
  DEPRECATED_FIELDS: [
    'maryland_sales_tax_amount',
    'maryland_sales_tax_rate',
    'total_amount',
    'stripe_fee',
  ],
  
  // Email Compliance
  UNSUBSCRIBE_REQUIRED: true,
  PRIVACY_LINK_REQUIRED: true,
  
  // Minimum Values
  MIN_PLATFORM_FEE_PERCENT: 5,
  MIN_BOOKING_AMOUNT: 10,
};

export function validateInvariants(data) {
  const errors = [];
  
  // Check deprecated fields
  if (data) {
    PLATFORM_RULES.DEPRECATED_FIELDS.forEach(field => {
      if (field in data) {
        errors.push(`Deprecated field used: ${field}`);
      }
    });
  }
  
  if (errors.length > 0) {
    throw new Error(`Invariant violations: ${errors.join(', ')}`);
  }
  
  return true;
}