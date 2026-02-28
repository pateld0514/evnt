import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Admin-only check
    if (user?.email !== "pateld0514@gmail.com") {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Fetch ALL users using service role, excluding test vendors
    const allUsers = await base44.asServiceRole.entities.User.list('-created_date', 1000);
    const users = allUsers.filter(u => u.user_type !== 'test_vendor');

    console.log(`[Admin] Fetched ${users.length} users (excluded test vendors)`);

    return Response.json(users);

  } catch (error) {
    console.error('Get users error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});