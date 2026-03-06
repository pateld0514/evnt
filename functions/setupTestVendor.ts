import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get the current logged-in user
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'User not authenticated' }, { status: 401 });
    }
    
    // Update current user with vendor info - points to Demo Vendor - Spotlight Studios
    await base44.auth.updateMe({
      user_type: 'vendor',
      vendor_id: '69ab4d57efd7f8b8d0af9876',
      onboarding_complete: true,
      approval_status: 'approved',
      phone: '(301) 555-0199',
      location: 'Washington, DC',
      state: 'DC'
    });

    return Response.json({ 
      success: true,
      message: 'Test vendor account setup complete. Refresh the page.',
      vendor_id: '69ab4d57efd7f8b8d0af9876'
    });

  } catch (error) {
    return Response.json({ 
      error: error.message || 'Failed to setup test vendor' 
    }, { status: 500 });
  }
});