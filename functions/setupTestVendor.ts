import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Update user profile for info@joinevnt.com
    await base44.asServiceRole.auth.updateUser('info@joinevnt.com', {
      user_type: 'vendor',
      vendor_id: '699fa36c19956dc189f27101',
      onboarding_complete: true,
      approval_status: 'approved',
      full_name: 'Marcus Rivera',
      phone: '(305) 842-7721',
      location: 'Miami, FL'
    });

    return Response.json({ 
      success: true,
      message: 'Test vendor account setup complete'
    });

  } catch (error) {
    return Response.json({ 
      error: error.message || 'Failed to setup test vendor' 
    }, { status: 500 });
  }
});