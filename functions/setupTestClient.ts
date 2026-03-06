import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'User not authenticated' }, { status: 401 });
    }
    
    // Set up current user as the demo client - Jamie Rivera
    await base44.auth.updateMe({
      user_type: 'client',
      onboarding_complete: true,
      phone: '(202) 555-0177',
      location: 'Washington, DC',
      state: 'DC',
      event_interests: ['Wedding', 'Birthday', 'Anniversary'],
      budget_range: '10k_25k',
      event_planning_experience: 'some_experience',
      preferred_contact: 'email'
    });

    return Response.json({ 
      success: true,
      message: 'Test client account setup complete. Refresh the page.'
    });

  } catch (error) {
    return Response.json({ 
      error: error.message || 'Failed to setup test client' 
    }, { status: 500 });
  }
});