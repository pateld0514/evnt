import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || (user.email !== "pateld0514@gmail.com" && user.role !== "admin")) {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { dryRun = false } = await req.json().catch(() => ({ dryRun: false }));

    const stateTaxRates = {
      'AL': 0.04, 'AK': 0.00, 'AZ': 0.056, 'AR': 0.065, 'CA': 0.0725,
      'CO': 0.029, 'CT': 0.0635, 'DE': 0.00, 'FL': 0.06, 'GA': 0.04,
      'HI': 0.04, 'ID': 0.06, 'IL': 0.0625, 'IN': 0.07, 'IA': 0.06,
      'KS': 0.065, 'KY': 0.06, 'LA': 0.0445, 'ME': 0.055, 'MD': 0.06,
      'MA': 0.0625, 'MI': 0.06, 'MN': 0.06875, 'MS': 0.07, 'MO': 0.04225,
      'MT': 0.00, 'NE': 0.055, 'NV': 0.0685, 'NH': 0.00, 'NJ': 0.06625,
      'NM': 0.05125, 'NY': 0.04, 'NC': 0.0475, 'ND': 0.05, 'OH': 0.0575,
      'OK': 0.045, 'OR': 0.00, 'PA': 0.06, 'RI': 0.07, 'SC': 0.06,
      'SD': 0.045, 'TN': 0.07, 'TX': 0.0625, 'UT': 0.0485, 'VT': 0.06,
      'VA': 0.053, 'WA': 0.065, 'WV': 0.06, 'WI': 0.05, 'WY': 0.04,
      'DC': 0.06
    };

    const bookings = await base44.asServiceRole.entities.Booking.list();
    
    const needsMigration = bookings.filter(b => 
      b.stripe_fee === null || 
      b.stripe_fee === undefined || 
      b.sales_tax_rate === null || 
      b.sales_tax_rate === undefined ||
      (b.agreed_price && !b.stripe_fee)
    );

    const migrationResults = {
      total_checked: bookings.length,
      needs_migration: needsMigration.length,
      migrated: 0,
      skipped: 0,
      errors: [],
      dry_run: dryRun
    };

    for (const booking of needsMigration) {
      try {
        const updateData = {};

        if ((booking.stripe_fee === null || booking.stripe_fee === undefined) && booking.total_amount_charged) {
          const stripeFee = (booking.total_amount_charged * 0.029) + 0.30;
          updateData.stripe_fee = Math.round(stripeFee * 100) / 100;
        }

        if ((booking.sales_tax_rate === null || booking.sales_tax_rate === undefined) && booking.client_state) {
          updateData.sales_tax_rate = stateTaxRates[booking.client_state] || 0;
        }

        if ((!booking.sales_tax_amount && !booking.maryland_sales_tax_amount) && booking.agreed_price && updateData.sales_tax_rate) {
          updateData.sales_tax_amount = Math.round(booking.agreed_price * updateData.sales_tax_rate * 100) / 100;
        }

        if (Object.keys(updateData).length > 0) {
          if (!dryRun) {
            await base44.asServiceRole.entities.Booking.update(booking.id, updateData);
            migrationResults.migrated++;
          } else {
            migrationResults.migrated++;
          }
        } else {
          migrationResults.skipped++;
        }
      } catch (error) {
        migrationResults.errors.push({
          booking_id: booking.id,
          error: error.message
        });
      }
    }

    return Response.json({
      success: true,
      message: dryRun ? 'Dry run completed - no changes made' : 'Migration completed',
      results: migrationResults
    });

  } catch (error) {
    console.error('Backfill stripe fees error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});