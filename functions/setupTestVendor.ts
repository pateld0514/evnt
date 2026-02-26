import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get the user first
    const users = await base44.asServiceRole.entities.User.filter({ email: 'info@joinevnt.com' });
    
    if (users.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }
    
    const userId = users[0].id;
    
    // Update user with vendor info
    await base44.asServiceRole.entities.User.update(userId, {
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
      message: 'Test vendor account setup complete. Refresh the page.'
    });

  } catch (error) {
    return Response.json({ 
      error: error.message || 'Failed to setup test vendor' 
    }, { status: 500 });
  }
});