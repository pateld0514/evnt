/**
 * Platform Self-Check
 * Run automated validation against platform invariants
 * Detects regressions before they reach production
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { PLATFORM_RULES } from './lib/platformInvariants.js';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Only admins can run platform checks
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const results = {
      passed: [],
      warnings: [],
      failures: [],
      timestamp: new Date().toISOString(),
    };

    // Check 1: Webhook idempotency entity exists
    try {
      const webhookEvents = await base44.asServiceRole.entities.ProcessedWebhookEvent.list();
      results.passed.push({
        check: 'webhook_idempotency',
        message: `ProcessedWebhookEvent entity exists with ${webhookEvents.length} records`
      });
    } catch (error) {
      results.failures.push({
        check: 'webhook_idempotency',
        message: 'ProcessedWebhookEvent entity not found or inaccessible',
        error: error.message
      });
    }

    // Check 2: No deprecated fields in recent bookings
    try {
      const recentBookings = await base44.asServiceRole.entities.Booking.list('-created_date', 10);
      const deprecatedFieldsFound = [];
      
      recentBookings.forEach(booking => {
        PLATFORM_RULES.DEPRECATED_FIELDS.forEach(field => {
          if (field in booking && booking[field] !== null && booking[field] !== undefined) {
            deprecatedFieldsFound.push({
              booking_id: booking.id,
              field,
              value: booking[field]
            });
          }
        });
      });

      if (deprecatedFieldsFound.length > 0) {
        results.failures.push({
          check: 'deprecated_fields',
          message: `Found ${deprecatedFieldsFound.length} instances of deprecated fields`,
          details: deprecatedFieldsFound
        });
      } else {
        results.passed.push({
          check: 'deprecated_fields',
          message: 'No deprecated fields found in recent bookings'
        });
      }
    } catch (error) {
      results.warnings.push({
        check: 'deprecated_fields',
        message: 'Could not check bookings',
        error: error.message
      });
    }

    // Check 3: Standardized field usage
    try {
      const recentBookings = await base44.asServiceRole.entities.Booking.list('-created_date', 10);
      const missingStandardFields = [];

      recentBookings.forEach(booking => {
        if (booking.status !== 'pending' && booking.status !== 'negotiating') {
          if (!booking.stripe_fee_amount && booking.stripe_fee_amount !== 0) {
            missingStandardFields.push({
              booking_id: booking.id,
              missing_field: 'stripe_fee_amount',
              status: booking.status
            });
          }
          if (!booking.sales_tax_amount && booking.sales_tax_amount !== 0) {
            missingStandardFields.push({
              booking_id: booking.id,
              missing_field: 'sales_tax_amount',
              status: booking.status
            });
          }
        }
      });

      if (missingStandardFields.length > 0) {
        results.warnings.push({
          check: 'standard_fields',
          message: `${missingStandardFields.length} bookings missing standard fields`,
          details: missingStandardFields
        });
      } else {
        results.passed.push({
          check: 'standard_fields',
          message: 'All recent bookings use standardized fields'
        });
      }
    } catch (error) {
      results.warnings.push({
        check: 'standard_fields',
        message: 'Could not validate standard fields',
        error: error.message
      });
    }

    // Check 4: Platform settings exist
    try {
      const platformFee = await base44.asServiceRole.entities.PlatformSettings.filter({
        setting_key: 'platform_fee_percent'
      });

      if (platformFee.length > 0) {
        results.passed.push({
          check: 'platform_settings',
          message: `Platform fee set to ${platformFee[0].setting_value}%`
        });
      } else {
        results.warnings.push({
          check: 'platform_settings',
          message: 'Platform fee setting not found - using default 10%'
        });
      }
    } catch (error) {
      results.failures.push({
        check: 'platform_settings',
        message: 'Could not access platform settings',
        error: error.message
      });
    }

    // Calculate overall health score
    const totalChecks = results.passed.length + results.warnings.length + results.failures.length;
    const healthScore = totalChecks > 0 
      ? Math.round((results.passed.length / totalChecks) * 100) 
      : 0;

    return Response.json({
      health_score: healthScore,
      summary: {
        passed: results.passed.length,
        warnings: results.warnings.length,
        failures: results.failures.length,
      },
      status: results.failures.length === 0 ? 'healthy' : 'degraded',
      ...results
    });

  } catch (error) {
    console.error('Platform self-check failed:', error);
    return Response.json({ 
      error: error.message || 'Self-check failed',
      health_score: 0,
      status: 'error'
    }, { status: 500 });
  }
});