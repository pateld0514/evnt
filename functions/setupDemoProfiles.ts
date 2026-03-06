import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// Run this after the demo Gmail accounts have signed up to pre-configure their profiles.
// Also called automatically by inviteDemoAccounts if users already exist.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const demoProfiles = [
      {
        email: 'evnttestvendor@gmail.com',
        data: {
          user_type: 'vendor',
          vendor_id: '69ab4d57efd7f8b8d0af9876',
          onboarding_complete: true,
          approval_status: 'approved',
          phone: '(301) 555-0199',
          location: 'Washington, DC',
          state: 'DC',
        },
      },
      {
        email: 'evnttestclient@gmail.com',
        data: {
          user_type: 'client',
          onboarding_complete: true,
          phone: '(202) 555-0177',
          location: 'Washington, DC',
          state: 'DC',
          event_interests: ['Wedding', 'Birthday', 'Anniversary'],
          budget_range: '10k_25k',
          event_planning_experience: 'some_experience',
          preferred_contact: 'email',
        },
      },
    ];

    const results = [];

    for (const profile of demoProfiles) {
      const users = await base44.asServiceRole.entities.User.filter({ email: profile.email });
      if (users && users.length > 0) {
        await base44.asServiceRole.entities.User.update(users[0].id, profile.data);
        results.push({ email: profile.email, status: 'configured' });
      } else {
        results.push({ email: profile.email, status: 'not found - user has not signed up yet' });
      }
    }

    return Response.json({ success: true, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});