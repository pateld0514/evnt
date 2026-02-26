import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get the current logged-in user
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'User not authenticated' }, { status: 401 });
    }
    
    // Update current user with vendor info
    await base44.auth.updateMe({
      user_type: 'vendor',
      vendor_id: '699fa36c19956dc189f27101',
      onboarding_complete: true,
      approval_status: 'approved'
    });

    return Response.json({ 
      success: true,
      message: 'Test vendor account setup complete. Refresh the page.'
    });

  } catch (error) {
    return Response.json({ 
      error: error.message || 'Failed to setup test vendor' 
    }, { status: 500 });
  }
});