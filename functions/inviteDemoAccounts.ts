import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const demoAccounts = [
      {
        email: 'evnttestblank@gmail.com',
        role: 'user',
        profileData: null, // no pre-setup, shows onboarding
      },
      {
        email: 'evnttestvendor@gmail.com',
        role: 'user',
        profileData: {
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
        role: 'user',
        profileData: {
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

    for (const account of demoAccounts) {
      // Step 1: Invite user
      try {
        await base44.users.inviteUser(account.email, account.role);
        results.push({ email: account.email, status: 'invited' });
      } catch (e) {
        results.push({ email: account.email, status: 'already exists or failed', error: e.message });
      }

      // Step 2: If there's profile data, find the user and pre-configure them via service role
      if (account.profileData) {
        try {
          // Find the user by email
          const allUsers = await base44.asServiceRole.entities.User.filter({ email: account.email });
          if (allUsers && allUsers.length > 0) {
            const targetUser = allUsers[0];
            await base44.asServiceRole.entities.User.update(targetUser.id, account.profileData);
            results.push({ email: account.email, status: 'profile pre-configured' });
          } else {
            results.push({ email: account.email, status: 'invited but not yet registered - profile will need manual setup' });
          }
        } catch (e) {
          results.push({ email: account.email, status: 'profile setup failed', error: e.message });
        }
      }
    }

    return Response.json({ success: true, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});